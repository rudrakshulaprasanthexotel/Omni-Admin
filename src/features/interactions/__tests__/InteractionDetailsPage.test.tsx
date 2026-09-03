import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component as InteractionDetailsPage } from '../pages/InteractionDetailsPage';
import { serveScenarios } from '@/test/msw/activeScenario';
import { paramValue, requestCount } from '@/test/msw/requestLog';
import { renderWithProviders } from '@/test/renderWithProviders';
import { preloadedState } from '@/test/testStore';
import { tr } from '@/test/i18n';

/**
 * Layer 3: the states a supervisor can actually see. Deliberately thin — the
 * response matrix is already covered at the thunk layer, so these only assert
 * what a state *looks like*, one test per distinct rendering.
 *
 * The page bootstraps itself from the URL: with no params it loads the
 * assigned processes, selects the first, then the first campaign in it, and
 * only then fetches the list.
 */

async function findRow(name: string) {
  return screen.findByText(name, {}, { timeout: 4000 });
}

describe('InteractionDetailsPage', () => {
  it('IL-200 — renders a row per interaction with the count in the title', async () => {
    renderWithProviders(<InteractionDetailsPage />);

    expect(await findRow('Nita Sharma')).toBeInTheDocument();
    expect(screen.getByText('Arjun Mehta')).toBeInTheDocument();
    // Both agents come from `last_assigned_user_name`.
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    // `total_string: "2"` parses, so the header shows a count.
    expect(screen.getByText('Interaction Details (2)')).toBeInTheDocument();
  });

  it('IL-200 — self-selects the first process and campaign before fetching', async () => {
    renderWithProviders(<InteractionDetailsPage />);

    await findRow('Nita Sharma');

    expect(requestCount('assignedProcesses')).toBeGreaterThanOrEqual(1);
    expect(requestCount('assignedCampaigns')).toBeGreaterThanOrEqual(1);
    // ccId comes from the campaign bean, processId from the assigned process.
    expect(paramValue('interactionList', 'campaign_id')).toBe('42');
  });

  it('IL-200-empty — shows the empty-state copy, not an error', async () => {
    serveScenarios('IL-200-empty');
    renderWithProviders(<InteractionDetailsPage />);

    expect(await screen.findByText(tr('interactionsEmptyState'))).toBeInTheDocument();
    expect(screen.queryByText(tr('interactionsLoadError'))).not.toBeInTheDocument();
  });

  it('IL-403 — the error never reaches the user; they are told nothing matched', async () => {
    serveScenarios('IL-403');
    const { store } = renderWithProviders(<InteractionDetailsPage />);

    // The page computes the right message — the 403 is in the store...
    await waitFor(() =>
      expect(store.getState().interactions.error?.response?.status).toBe(403),
    );
    // ...but the grid captured `emptyStateMessage` at mount and never re-read
    // it, so a permissions failure reads as "your filters matched nothing".
    // Cause isolated in `dataGridEmptyState.test.tsx`.
    expect(await screen.findByText(tr('interactionsEmptyState'))).toBeInTheDocument();
    expect(screen.queryByText(tr('interactionsLoadError'))).not.toBeInTheDocument();
  });

  it('IL-network — a dropped connection is likewise reported as "no matches"', async () => {
    serveScenarios('IL-network');
    const { store } = renderWithProviders(<InteractionDetailsPage />);

    await waitFor(() => expect(store.getState().interactions.error?.code).toBe('ERR_NETWORK'));
    expect(await screen.findByText(tr('interactionsEmptyState'))).toBeInTheDocument();
    expect(screen.queryByText(tr('interactionsLoadError'))).not.toBeInTheDocument();
  });

  it('AC-200-empty — with no campaigns, prompts for a selection instead of erroring', async () => {
    serveScenarios('AC-200-empty');
    renderWithProviders(<InteractionDetailsPage />);

    expect(await screen.findByText(tr('interactionsSelectCampaign'))).toBeInTheDocument();
    // Nothing to scope the query to, so the list is never requested.
    expect(requestCount('interactionList')).toBe(0);
  });

  it('AC-512 — a campaign fetch failure looks identical to having none', async () => {
    serveScenarios('AC-512');
    renderWithProviders(<InteractionDetailsPage />);

    expect(await screen.findByText(tr('interactionsSelectCampaign'))).toBeInTheDocument();
    expect(requestCount('interactionList')).toBe(0);
  });

  it('IL-200-total-many — an unparseable total hides the count badge', async () => {
    serveScenarios('IL-200-total-many');
    renderWithProviders(<InteractionDetailsPage />);

    await findRow('Nita Sharma');
    expect(screen.getByText(tr('interactionsPageTitle'))).toBeInTheDocument();
    expect(screen.queryByText(/Interaction Details \(/)).not.toBeInTheDocument();
  });

  it('honours a deep link to a specific campaign', async () => {
    renderWithProviders(<InteractionDetailsPage />, {
      route: '/interactions?processId=1&campaignId=43',
    });

    await findRow('Nita Sharma');
    expect(paramValue('interactionList', 'campaign_id')).toBe('43');
  });

  it('shows the campaign prompt before any session is available', async () => {
    // No login response, so there is no contactCenterId to scope the query.
    renderWithProviders(<InteractionDetailsPage />, { state: preloadedState() });

    expect(await screen.findByText(tr('interactionsSelectCampaign'))).toBeInTheDocument();
  });
});

describe('InteractionDetailsPage — pagination', () => {
  it('IL-200-next-page — advancing sends the after_cursor from the previous page', async () => {
    serveScenarios('IL-200-next-page');
    const user = userEvent.setup();
    renderWithProviders(<InteractionDetailsPage />);

    await findRow('Nita Sharma');
    expect(requestCount('interactionList')).toBe(1);

    const nextButton = await screen.findByRole('button', { name: /^next$/i });
    await user.click(nextButton);

    await waitFor(() => expect(requestCount('interactionList')).toBe(2));
    expect(paramValue('interactionList', 'after_cursor', 1)).toBe('CURSOR_NEXT');
    // Cursor pagination only ever sends one of the two.
    expect(paramValue('interactionList', 'before_cursor', 1)).toBeUndefined();
  });

  it('IL-200 — the next button is unavailable on the last page', async () => {
    renderWithProviders(<InteractionDetailsPage />);

    await findRow('Nita Sharma');

    // No `next_page_url` in the metadata, so there is no cursor to follow.
    expect(await screen.findByRole('button', { name: /^next$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^previous$/i })).toBeDisabled();
  });
});

describe('InteractionDetailsPage — filters', () => {
  it('CQ-200 / CD-200 / CU-200 — filter sources load for the selected campaign', async () => {
    renderWithProviders(<InteractionDetailsPage />);

    await findRow('Nita Sharma');

    await waitFor(() => {
      expect(requestCount('campaignQueues')).toBeGreaterThanOrEqual(1);
      expect(requestCount('campaignDispositions')).toBeGreaterThanOrEqual(1);
      expect(requestCount('campaignUsers')).toBeGreaterThanOrEqual(1);
    });
  });

  it('CD-403 — a per-campaign disposition denial leaves the grid working', async () => {
    serveScenarios('CD-403');
    renderWithProviders(<InteractionDetailsPage />);

    // The rows still load; only the Disposition filter is silently empty.
    expect(await findRow('Nita Sharma')).toBeInTheDocument();
    expect(screen.queryByText(tr('interactionsLoadError'))).not.toBeInTheDocument();
  });
});

describe('InteractionDetailsPage — row rendering', () => {
  it('IL-200 — maps snake_case wire fields into the displayed columns', async () => {
    renderWithProviders(<InteractionDetailsPage />);

    await findRow('Nita Sharma');
    const grid = screen.getByRole('grid');

    // channel_data.customer_contact becomes the Channel Detail column.
    expect(within(grid).getByText('98XXXXXX53')).toBeInTheDocument();
    // channel_name "voice" maps to the Call channel, "whatsapp" to WhatsApp.
    expect(within(grid).getByText('Call')).toBeInTheDocument();
    expect(within(grid).getByText('WhatsApp')).toBeInTheDocument();
    // last_queue_name and last_disposition come straight through.
    expect(within(grid).getByText('Hindi')).toBeInTheDocument();
    expect(within(grid).getByText('Interested')).toBeInTheDocument();
  });

  it('IL-200-partial — a failed row is dropped without any warning in the UI', async () => {
    serveScenarios('IL-200-partial');
    renderWithProviders(<InteractionDetailsPage />);

    await findRow('Nita Sharma');
    expect(screen.getByText('Meera Iyer')).toBeInTheDocument();
    // Three entries came back and two had data. The header still counts three
    // while only two rows exist, and nothing anywhere says a row was dropped.
    expect(screen.getByText('Interaction Details (3)')).toBeInTheDocument();
    // Header row plus the two mapped data rows.
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.queryByText(tr('interactionsLoadError'))).not.toBeInTheDocument();
  });
});
