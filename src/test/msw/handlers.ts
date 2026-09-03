import { HttpResponse, delay, http } from 'msw';
import type { RequestHandler } from 'msw';
import type { ApiId, ScenarioResponse } from '../scenarios/types';
import { ALL_API_IDS, ENDPOINTS, POST_APIS } from '../scenarios';
import { getActiveScenario } from './activeScenario';
import { recordRequest } from './requestLog';

async function toResponse(response: ScenarioResponse) {
  if (response.delayMs) {
    await delay(response.delayMs);
  }

  if (response.networkError) {
    return HttpResponse.error();
  }

  const status = response.status ?? 200;

  if (response.text !== undefined) {
    return new HttpResponse(response.text, {
      status,
      headers: { 'Content-Type': response.contentType ?? 'text/plain' },
    });
  }

  return HttpResponse.json(response.body ?? null, { status });
}

function collectParams(url: URL): Record<string, string[]> {
  const params: Record<string, string[]> = {};
  url.searchParams.forEach((value, key) => {
    (params[key] ??= []).push(value);
  });
  return params;
}

function handlerFor(api: ApiId): RequestHandler {
  const method = POST_APIS.has(api) ? http.post : http.get;
  return method(ENDPOINTS[api], async ({ request }) => {
    // Resolved per request, not per handler build, so a scenario switch takes
    // effect on the very next call.
    const scenario = getActiveScenario(api);
    recordRequest({
      api,
      method: request.method,
      url: request.url,
      params: collectParams(new URL(request.url)),
      scenarioId: scenario.id,
    });
    return toResponse(scenario.response);
  });
}

/** One handler per documented endpoint, driven by the active scenario. */
export function buildHandlers(): RequestHandler[] {
  return ALL_API_IDS.map(handlerFor);
}

export const handlers = buildHandlers();
