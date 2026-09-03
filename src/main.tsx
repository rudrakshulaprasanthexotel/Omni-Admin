import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@/services/i18n';

/**
 * `npm run dev:mock` sets `VITE_ENABLE_MSW=true`, which starts the MSW service
 * worker before the first render and mounts the scenario switcher. Both are
 * dynamic imports behind a literal env check, so the mock catalog and the
 * panel are dropped from a normal build rather than shipped dead.
 */
async function startMocks(): Promise<ComponentType | null> {
  if (import.meta.env.VITE_ENABLE_MSW !== 'true') return null;

  const [{ startMockWorker }, panel] = await Promise.all([
    import('./test/msw/browser'),
    import('./test/mock/MockScenarioPanel'),
  ]);

  // Awaited: a request that races worker activation would hit the dev proxy.
  await startMockWorker();
  return panel.default;
}

// Wrapped rather than top-level `await`: the build target does not guarantee
// top-level-await support, and this keeps the normal path fully synchronous.
async function bootstrap() {
  const MockScenarioPanel = await startMocks();

  createRoot(document.getElementById('root')!).render(
    <>
      <App />
      {MockScenarioPanel ? <MockScenarioPanel /> : null}
    </>,
  );
}

void bootstrap();
