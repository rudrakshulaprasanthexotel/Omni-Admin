import type { ApiId } from '../scenarios/types';

/**
 * Records every request the handlers intercept. Lets tests assert on wire
 * details that are otherwise invisible from the slice — which cursor was sent,
 * how many times the token was refreshed — without stubbing anything.
 *
 * Browser-safe; the `dev:mock` panel can read it too.
 */
export interface RecordedRequest {
  api: ApiId;
  method: string;
  url: string;
  /** Query params, repeated keys preserved (`campaign_id` arrives as a list). */
  params: Record<string, string[]>;
  /** The scenario that served this request. */
  scenarioId: string;
}

let log: RecordedRequest[] = [];

export function recordRequest(entry: RecordedRequest): void {
  log.push(entry);
}

export function allRequests(): RecordedRequest[] {
  return [...log];
}

export function requestsFor(api: ApiId): RecordedRequest[] {
  return log.filter((entry) => entry.api === api);
}

export function requestCount(api: ApiId): number {
  return requestsFor(api).length;
}

/** Query params of the Nth request to an API (0-indexed, negative counts back). */
export function paramsOf(api: ApiId, index = 0): Record<string, string[]> {
  const entries = requestsFor(api);
  const entry = index < 0 ? entries.at(index) : entries[index];
  return entry?.params ?? {};
}

/** First value of a query param on the Nth request to an API. */
export function paramValue(api: ApiId, name: string, index = 0): string | undefined {
  return paramsOf(api, index)[name]?.[0];
}

export function resetRequestLog(): void {
  log = [];
}
