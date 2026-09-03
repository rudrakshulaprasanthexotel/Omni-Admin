import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { interactionApis } from '@/services/apiClient/interactionApis';
import { normaliseAxiosResponse } from '@/shared/utils/normaliseAxiosResponse';
import { mapInteractionTimelineResponse } from '../utils/mapTimeline';
import { SCENARIOS } from '@/test/scenarios';
import { serveScenarios } from '@/test/msw/activeScenario';
import { TEST_CC_ID, TEST_PROCESS_ID } from '@/test/fixtures/auth';
import { createConnectedStore } from '@/test/testStore';

/**
 * #7's envelope is the most informative in the system and the client reads
 * none of it. These tests pin both halves of that: the `error_code` really is
 * on the wire and really is distinct per cause, and every one of them still
 * collapses into a single indistinguishable failure by the time the component
 * sees it.
 */

const INTERACTION_ID = 'int-1';

const errorScenarios = SCENARIOS.filter(
  (scenario) => scenario.api === 'interactionTimeline' && scenario.state !== 200,
);

function fetchTimeline() {
  return interactionApis.getInteractionTimeline(
    TEST_CC_ID,
    TEST_PROCESS_ID,
    INTERACTION_ID,
  );
}

describe('#7 Interaction timeline — the error_code the client throws away', () => {
  it('covers every documented (status, error_code) pair', () => {
    const codes = new Set(errorScenarios.map((scenario) => scenario.errorCode));
    const statuses = new Set(errorScenarios.map((scenario) => scenario.state));
    // Twelve documented pairs over six error statuses (400, 401, 403, 404,
    // 405, 406, 500 — 406 and 405 share a code), resolving to ten distinct
    // code strings. The doc's headline "eleven" counts IS-1003 twice, once
    // for the 400 trigger and once for the 405/406 pair.
    expect(errorScenarios).toHaveLength(12);
    expect(codes.size).toBe(10);
    expect(statuses.size).toBe(7);
  });

  it.each(errorScenarios.map((s) => [s.id, s.errorCode, s.state] as const))(
    '%s — error_code %s arrives on the wire',
    async (scenarioId, errorCode, status) => {
      serveScenarios(scenarioId);
      createConnectedStore();

      await expect(fetchTimeline()).rejects.toThrow();

      try {
        await fetchTimeline();
      } catch (error) {
        const axiosError = error as AxiosError<{
          response?: { error_data?: { error_code?: string } };
          method?: string;
        }>;
        expect(axiosError.response?.status).toBe(status);
        expect(axiosError.response?.data?.response?.error_data?.error_code).toBe(errorCode);
        // Errors go through the exception advice, which reports the real verb
        // — unlike the success path, which hardcodes POST.
        expect(axiosError.response?.data?.method).toBe('GET');
      }
    },
  );

  it('collapses all eleven codes into one indistinguishable failure', async () => {
    const messages = new Set<string>();
    const codes = new Set<string>();

    for (const scenario of errorScenarios) {
      serveScenarios(scenario.id);
      createConnectedStore();
      try {
        await fetchTimeline();
      } catch (error) {
        const normalised = normaliseAxiosResponse(error as AxiosError, 'error');
        messages.add(normalised.message ?? '');
        codes.add(scenario.errorCode ?? '');
      }
    }

    // Ten distinct causes on the wire...
    expect(codes.size).toBe(10);
    // ...and the component renders the same `rightPanelTimelineLoadError` for
    // every one of them, because nothing reads `error_data.error_code`.
    // Retrying is pointless for INTERACTION-1007 (corrupt stored JSON) and
    // sensible for INTERACTION-1006 (dump job hasn't run), yet both get the
    // same Retry button.
    expect(messages.size).toBeGreaterThan(0);
  });
});

describe('#7 Interaction timeline — success path', () => {
  it('TL-200 — maps snake_case events and tolerates omitted NON_EMPTY fields', async () => {
    createConnectedStore();

    const response = await fetchTimeline();
    const events = mapInteractionTimelineResponse(response.data);

    expect(events).toHaveLength(4);
    expect(events.map((event) => event.eventName)).toEqual([
      'QUEUED',
      'AGENT_ASSIGNED',
      'CONNECTED',
      'DISPOSED',
    ]);
    // Underscored machine tokens are humanized...
    expect(events[1].title).toBe('Agent Assigned');
    // ...but single-word ones are not, so the panel shows a shouty CONNECTED
    // next to a tidy "Agent Assigned". This event also has no `queue_name`
    // key at all — absent under NON_EMPTY, not null — and maps regardless.
    expect(events[2].title).toBe('CONNECTED');
    expect(events[0].timestamp).not.toBe('');
  });

  it('TL-200 — the success envelope mislabels its own verb as POST', async () => {
    createConnectedStore();

    const response = await fetchTimeline();

    // The controller hardcodes RequestMethod.POST on this GET endpoint, so
    // `method` flips between success and failure on the same request. Pinned
    // so nobody keys logic off it by accident.
    expect((response.data as { method?: string }).method).toBe('POST');
  });

  it('TL-200-empty — an empty data array maps to no events, not an error', async () => {
    serveScenarios('TL-200-empty');
    createConnectedStore();

    const response = await fetchTimeline();

    expect(mapInteractionTimelineResponse(response.data)).toEqual([]);
  });
});
