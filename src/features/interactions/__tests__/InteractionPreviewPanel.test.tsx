import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InteractionOutPutBean } from '@/boilerplate/dataEngineApis/models';
import InteractionPreviewPanel from '../components/InteractionPreviewPanel';
import { serveScenarios } from '@/test/msw/activeScenario';
import { requestCount } from '@/test/msw/requestLog';
import { interactionRow } from '@/test/fixtures/interactions';
import { renderWithProviders } from '@/test/renderWithProviders';
import { signedInState } from '@/test/testStore';
import { tr } from '@/test/i18n';

/**
 * The right-hand preview panel. Its two async surfaces — the timeline (#7) and
 * the recording blob — are the only places in the feature with a visible
 * retry, so both the failure copy and the retry actually working are covered.
 */

/** The slice holds raw beans; the panel maps them on render. */
function stateWithRow(overrides: Record<string, unknown> = {}) {
  return signedInState({
    interactions: {
      rows: [interactionRow(overrides) as unknown as InteractionOutPutBean],
    },
  });
}

function renderPanel(
  tab: 'overview' | 'timeline' | 'transcript',
  overrides: Record<string, unknown> = {},
) {
  return renderWithProviders(
    <InteractionPreviewPanel interactionId="int-1" initialTab={tab} />,
    { state: stateWithRow(overrides) },
  );
}

describe('InteractionPreviewPanel — timeline tab', () => {
  it('TL-200 — localises known event names and falls back to the server string otherwise', async () => {
    renderPanel('timeline');

    // `DISPOSED` has shipped copy under `timelineEventDisposedTitle`.
    expect(await screen.findByText(tr('timelineEventDisposedTitle'))).toBeInTheDocument();
    // These two have none, so the mapper's humanised server value is shown as-is
    // — which is why a new backend event name leaks into the UI untranslated.
    expect(screen.getByText('Agent Assigned')).toBeInTheDocument();
    expect(screen.getByText('QUEUED')).toBeInTheDocument();
  });

  it('TL-200-empty — an empty timeline is a message, not an error', async () => {
    serveScenarios('TL-200-empty');
    renderPanel('timeline');

    expect(await screen.findByText(tr('rightPanelTimelineEmpty'))).toBeInTheDocument();
    expect(
      screen.queryByText(tr('rightPanelTimelineLoadError')),
    ).not.toBeInTheDocument();
  });

  it('TL-500-INTERACTION-1006 — shows the retryable error for a not-yet-dumped timeline', async () => {
    // The likeliest error a supervisor hits: opening the panel on a live or
    // just-ended interaction. Benign, but it arrives as a 500.
    serveScenarios('TL-500-INTERACTION-1006');
    renderPanel('timeline');

    expect(await screen.findByText(tr('rightPanelTimelineLoadError'))).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: tr('rightPanelRecordingRetry') }),
    ).toBeInTheDocument();
  });

  it('TL-404-INTERACTION-1007 — corrupt stored JSON offers the same pointless retry', async () => {
    // Retrying can never help here: the interaction exists and its stored
    // timeline will not parse. Identical UI to the 500 above because nothing
    // reads `error_data.error_code`.
    serveScenarios('TL-404-INTERACTION-1007');
    renderPanel('timeline');

    expect(await screen.findByText(tr('rightPanelTimelineLoadError'))).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: tr('rightPanelRecordingRetry') }),
    ).toBeInTheDocument();
  });

  it('retrying after a failure refetches and renders the events', async () => {
    serveScenarios('TL-500-INTERACTION-1006');
    const user = userEvent.setup();
    renderPanel('timeline');

    await screen.findByText(tr('rightPanelTimelineLoadError'));
    expect(requestCount('interactionTimeline')).toBe(1);

    // The dump job lands between the two attempts.
    serveScenarios('TL-200');
    await user.click(screen.getByRole('button', { name: tr('rightPanelRecordingRetry') }));

    expect(await screen.findByText('Agent Assigned')).toBeInTheDocument();
    expect(requestCount('interactionTimeline')).toBe(2);
  });
});

describe('InteractionPreviewPanel — recording', () => {
  it('VL-200 — a downloaded recording becomes an audio player', async () => {
    renderPanel('overview');

    await waitFor(() => expect(requestCount('voiceLogBlob')).toBe(1));
    expect(screen.queryByText(tr('rightPanelRecordingLoadError'))).not.toBeInTheDocument();
  });

  it('VL-404 — a missing recording shows the load error and a retry', async () => {
    serveScenarios('VL-404');
    renderPanel('overview');

    expect(
      await screen.findByText(tr('rightPanelRecordingLoadError')),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: tr('rightPanelRecordingRetry') }),
    ).toBeInTheDocument();
  });

  it('retrying a failed recording refetches it', async () => {
    serveScenarios('VL-404');
    const user = userEvent.setup();
    renderPanel('overview');

    await screen.findByText(tr('rightPanelRecordingLoadError'));
    serveScenarios('VL-200');

    await user.click(screen.getByRole('button', { name: tr('rightPanelRecordingRetry') }));

    await waitFor(() => expect(requestCount('voiceLogBlob')).toBe(2));
    await waitFor(() =>
      expect(screen.queryByText(tr('rightPanelRecordingLoadError'))).not.toBeInTheDocument(),
    );
  });

  it('a non-voice interaction fetches no recording at all', async () => {
    renderPanel('overview', {
      channel_name: 'whatsapp',
      channel_data: { duration: 42, customer_contact: 'arjun@example.com' },
    });

    await waitFor(() => expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument());
    expect(requestCount('voiceLogBlob')).toBe(0);
  });
});

describe('InteractionPreviewPanel — tabs', () => {
  it('locks the transcript tab on voice interactions', async () => {
    renderPanel('overview');

    const transcriptTab = await screen.findByRole('tab', { name: /transcript/i });
    expect(transcriptTab).toBeDisabled();
  });

  it('switching to the timeline tab loads it lazily', async () => {
    const user = userEvent.setup();
    renderPanel('overview');

    await screen.findByRole('tab', { name: /timeline/i });
    expect(requestCount('interactionTimeline')).toBe(0);

    await user.click(screen.getByRole('tab', { name: /timeline/i }));

    expect(await screen.findByText('Agent Assigned')).toBeInTheDocument();
    expect(requestCount('interactionTimeline')).toBe(1);
  });
});
