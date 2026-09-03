import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { serveScenarios } from './activeScenario';

/**
 * The `dev:mock` counterpart to `server.ts`. Same handlers, same scenario
 * catalog — the only difference is the interception mechanism, so what you
 * click through in the browser is what the suite asserts.
 */
export const worker = setupWorker(...handlers);

/**
 * `VITE_BASE_URL` is `/omni-admin` with no trailing slash, so `BASE_URL` has
 * to be normalised before joining or the script resolves to
 * `/omni-adminmockServiceWorker.js` and registration fails on MIME type.
 */
const WORKER_URL = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}mockServiceWorker.js`;

export async function startMockWorker(): Promise<void> {
  await worker.start({
    serviceWorker: {
      // Vite serves `public/` under `base` (`/omni-admin/`), so the script is
      // not at the origin root. Its default scope — the directory it is served
      // from — covers every app route, and scope only limits which *pages* the
      // worker controls, not which URLs a controlled page may request. The
      // root-level `/ameyorestapi` and `/data-engine` calls are intercepted
      // regardless, which is why no `Service-Worker-Allowed` header is needed.
      url: WORKER_URL,
    },
    // Anything the catalog doesn't own — locale JSON, source maps, the app's
    // own assets — must reach the dev server untouched.
    onUnhandledRequest: 'bypass',
    quiet: true,
  });

  applyScenariosFromUrl();
  console.info('[mock] MSW active — open the ⚙ panel (bottom-right) to switch API states.');
}

/**
 * `?mock=IL-403,TL-500-INTERACTION-1006` — comma-separated scenario ids, so a
 * broken state can be shared as a link or pasted into a bug report.
 */
export function applyScenariosFromUrl(search = window.location.search): void {
  const raw = new URLSearchParams(search).get('mock');
  if (!raw) return;

  for (const id of raw.split(',').map((value) => value.trim()).filter(Boolean)) {
    try {
      // One at a time: a typo in one id shouldn't discard the valid ones.
      serveScenarios(id);
    } catch (error) {
      console.warn(`[mock] ${(error as Error).message}`);
    }
  }
}
