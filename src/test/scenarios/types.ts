/**
 * Shared scenario model. Consumed by BOTH `msw/node` (Vitest) and
 * `msw/browser` (the `dev:mock` scenario switcher), so nothing in this file —
 * or anything it imports — may reference Node builtins.
 */

/** One entry per API documented in `docs/INTERACTION_DETAILS_API_STATES.md`. */
export type ApiId =
  | 'interactionList' // #1  data-engine
  | 'assignedCampaigns' // #2  Ameyo
  | 'assignedProcesses' // #3  Ameyo
  | 'campaignQueues' // #4  CMS
  | 'campaignDispositions' // #5  Ameyo
  | 'campaignUsers' // #6  CMS
  | 'interactionTimeline' // #7  interaction-svc
  | 'contactCenterUsers' // #8  Ameyo
  | 'userCampaigns' // #9  Ameyo
  | 'customerInfo' // #10 Ameyo
  | 'qaDenominator' // #11 data-engine (unwired in UI)
  | 'interactionQaScores' // #12 data-engine (unwired in UI)
  // Out of scope in the doc (opaque server-supplied blob URLs) but needed for
  // the preview-panel tests, which assert the audio/transcript failure UI.
  | 'voiceLogBlob'
  | 'chatTranscriptBlob'
  | 'refreshToken' // auth interceptor support
  | 'logout' // auth interceptor support
  // Not consumed by the page, but the browser mock mode cannot reach
  // `/interactions` without them: `AuthGuard` needs a login payload and
  // `AuthenticatedLayout` pings every 20s.
  | 'login'
  | 'keepAlive';

/**
 * The condition a scenario reproduces. Numbers are HTTP statuses; the two
 * strings are the sub-HTTP states the doc calls out separately (axios timeout
 * and transport/CORS failure), which have no status at all.
 */
export type ScenarioState = number | 'timeout' | 'network';

export interface ScenarioResponse {
  status?: number;
  /** JSON body. Ignored when `text` is set. */
  body?: unknown;
  /**
   * Raw non-JSON body. The uncaught 500s on #3/#5/#8/#9/#10 are servlet
   * container error pages, so the body may be HTML rather than JSON.
   */
  text?: string;
  contentType?: string;
  /** Transport-level failure — no response reaches axios at all. */
  networkError?: boolean;
  /** Response delay in ms. Used to push past the 30s axios timeout. */
  delayMs?: number;
}

export interface Scenario {
  /** Stable, doc-derived id, e.g. `IL-403` or `TL-404-INTERACTION-1007`. */
  id: string;
  api: ApiId;
  state: ScenarioState;
  /**
   * The envelope's machine-readable code when the doc names one:
   * `CONF-1001` (data-engine/CMS), `INTERACTION-1006` (interaction-svc), or
   * a numeric Ameyo `code`.
   */
  errorCode?: string;
  /** Human label, shown in the switcher panel and the generated report. */
  title: string;
  response: ScenarioResponse;
  /** Serves this API when no scenario is explicitly selected. */
  isDefault?: boolean;
}

/** Which scenario is active per API. Missing entry = that API's default. */
export type ScenarioSelection = Partial<Record<ApiId, string>>;

/** Metadata for grouping the coverage report by documented API. */
export interface ApiMeta {
  id: ApiId;
  /** Position in the doc's coverage table; `null` for auth support endpoints. */
  docNumber: number | null;
  label: string;
  backend: 'data-engine' | 'cms' | 'ameyo' | 'interaction-svc';
}
