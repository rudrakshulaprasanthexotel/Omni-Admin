import { useEffect, useState } from 'react';
import {
  getScenarioSelection,
  resetScenarioSelection,
  setScenarioSelection,
  subscribeToScenarioSelection,
} from '../msw/activeScenario';
import {
  ALL_API_IDS,
  API_META,
  DEFAULT_SCENARIOS,
  scenariosForApi,
  type ApiId,
  type ScenarioSelection,
} from '../scenarios';

/**
 * The `dev:mock` scenario switcher: one dropdown per API, listing every state
 * transcribed from `docs/INTERACTION_DETAILS_API_STATES.md`. Switching takes
 * effect on the next request — handlers resolve the active scenario per call —
 * so a 403 or a corrupt timeline can be produced against the real UI without
 * touching a backend.
 *
 * Deliberately styled with plain inline CSS rather than the design system:
 * this is scaffolding sitting on top of the app under test, and it must not
 * pull the app's own theme, fonts or portal roots into the picture.
 *
 * Rendered only when `VITE_ENABLE_MSW=true`, and imported dynamically from
 * `main.tsx` so it never reaches a production bundle.
 */

/** Doc order first, support endpoints last. */
const ORDERED_APIS: ApiId[] = [...ALL_API_IDS].sort((a, b) => {
  const left = API_META[a].docNumber;
  const right = API_META[b].docNumber;
  if (left === right) return API_META[a].label.localeCompare(API_META[b].label);
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
});

function writeUrl(selection: ScenarioSelection) {
  const ids = Object.values(selection).filter(Boolean) as string[];
  const url = new URL(window.location.href);
  if (ids.length) {
    url.searchParams.set('mock', ids.join(','));
  } else {
    url.searchParams.delete('mock');
  }
  // `replaceState`, not `pushState`: the router owns the history stack, and
  // flipping a scenario is not a navigation.
  window.history.replaceState(window.history.state, '', url.toString());
}

const styles = {
  toggle: {
    position: 'fixed',
    right: 16,
    bottom: 16,
    zIndex: 2147483647,
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid #1f2937',
    background: '#111827',
    color: '#f9fafb',
    font: '600 12px/1.4 ui-sans-serif, system-ui, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,.3)',
  },
  panel: {
    position: 'fixed',
    right: 16,
    bottom: 16,
    zIndex: 2147483647,
    width: 420,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#111827',
    color: '#f9fafb',
    border: '1px solid #374151',
    borderRadius: 10,
    font: '12px/1.5 ui-sans-serif, system-ui, sans-serif',
    boxShadow: '0 12px 32px rgba(0,0,0,.45)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '10px 12px',
    borderBottom: '1px solid #374151',
  },
  body: { overflowY: 'auto', padding: '8px 12px 12px' },
  row: { padding: '8px 0', borderBottom: '1px solid #1f2937' },
  label: {
    display: 'block',
    marginBottom: 4,
    color: '#9ca3af',
    fontWeight: 600,
  },
  select: {
    width: '100%',
    padding: '5px 6px',
    background: '#0b1220',
    color: '#f9fafb',
    border: '1px solid #374151',
    borderRadius: 6,
    font: 'inherit',
  },
  button: {
    padding: '4px 10px',
    background: 'transparent',
    color: '#f9fafb',
    border: '1px solid #4b5563',
    borderRadius: 6,
    font: 'inherit',
    cursor: 'pointer',
  },
  dirty: { color: '#fbbf24' },
} satisfies Record<string, React.CSSProperties>;

export default function MockScenarioPanel() {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<ScenarioSelection>(getScenarioSelection);

  useEffect(() => subscribeToScenarioSelection(setSelection), []);

  const overrideCount = Object.values(selection).filter(Boolean).length;

  function choose(api: ApiId, scenarioId: string) {
    const next: ScenarioSelection = { ...selection };
    if (scenarioId) {
      next[api] = scenarioId;
    } else {
      delete next[api];
    }
    setScenarioSelection(next);
    writeUrl(next);
  }

  if (!open) {
    return (
      <button
        type="button"
        style={styles.toggle}
        onClick={() => setOpen(true)}
        aria-label="Open mock scenario panel"
      >
        ⚙ Mock{overrideCount ? ` · ${overrideCount}` : ''}
      </button>
    );
  }

  return (
    <section style={styles.panel} aria-label="Mock scenario panel">
      <header style={styles.header}>
        <strong>API scenarios</strong>
        <span style={overrideCount ? styles.dirty : undefined}>
          {overrideCount ? `${overrideCount} overridden` : 'all defaults'}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            style={styles.button}
            onClick={() => {
              resetScenarioSelection();
              writeUrl({});
            }}
          >
            Reset
          </button>
          <button type="button" style={styles.button} onClick={() => setOpen(false)}>
            Close
          </button>
        </span>
      </header>

      <div style={styles.body}>
        {ORDERED_APIS.map((api) => {
          const meta = API_META[api];
          const scenarios = scenariosForApi(api);
          const active = selection[api] ?? '';
          return (
            <div key={api} style={styles.row}>
              <label style={styles.label} htmlFor={`mock-${api}`}>
                {meta.docNumber ? `#${meta.docNumber} ` : ''}
                {meta.label} · {meta.backend}
              </label>
              <select
                id={`mock-${api}`}
                style={styles.select}
                value={active}
                onChange={(event) => choose(api, event.target.value)}
              >
                <option value="">
                  Default — {DEFAULT_SCENARIOS[api].id}: {DEFAULT_SCENARIOS[api].title}
                </option>
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.id} — {scenario.title}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </section>
  );
}
