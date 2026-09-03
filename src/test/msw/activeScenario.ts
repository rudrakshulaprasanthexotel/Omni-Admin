import type { ApiId, Scenario, ScenarioSelection } from '../scenarios/types';
import { DEFAULT_SCENARIOS, getScenario } from '../scenarios';

/**
 * Which scenario each API is currently serving. Handlers read this at request
 * time rather than at build time, so switching a state in the `dev:mock`
 * panel takes effect on the next fetch with no page reload — and a test can
 * flip a state mid-render.
 *
 * Browser-safe: no Node builtins here or anywhere it imports.
 */
let selection: ScenarioSelection = {};

type Listener = (current: ScenarioSelection) => void;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener({ ...selection });
}

export function subscribeToScenarioSelection(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getScenarioSelection(): ScenarioSelection {
  return { ...selection };
}

/** Resolve the scenario serving an API right now, falling back to its default. */
export function getActiveScenario(api: ApiId): Scenario {
  const id = selection[api];
  if (id) {
    const found = getScenario(id);
    if (found) return found;
  }
  return DEFAULT_SCENARIOS[api];
}

/**
 * Point one or more APIs at specific scenarios. Accepts scenario ids and
 * derives the API from the catalog, so callers write `serveScenarios('IL-403')`
 * instead of repeating the API name.
 */
export function serveScenarios(...ids: string[]): void {
  for (const id of ids) {
    const scenario = getScenario(id);
    if (!scenario) {
      throw new Error(`Unknown scenario id: ${id}`);
    }
    selection[scenario.api] = id;
  }
  notify();
}

export function setScenarioSelection(next: ScenarioSelection): void {
  selection = { ...next };
  notify();
}

export function resetScenarioSelection(): void {
  selection = {};
  notify();
}
