import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetHoverCardCache } from '@/features/interactions/utils/hoverCardCache';
import { server } from './msw/server';
import { resetScenarioSelection } from './msw/activeScenario';
import { resetRequestLog } from './msw/requestLog';
import './i18n';

/* ---------------------------------------------------------------------------
 * jsdom gaps that the Signal design system and MUI X rely on.
 * ------------------------------------------------------------------------- */

// `ExotelThemeProvider` resolves colour scheme through matchMedia.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

// MUI X DataGrid measures its container. jsdom ships neither observer.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??=
  NoopObserver as unknown as typeof IntersectionObserver;

// The preview panel turns downloaded blobs into object URLs for <AudioPlayer>.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-object-url');
  URL.revokeObjectURL = vi.fn();
}

// The design system's AI suite probes microphone permission on mount. jsdom
// has no `navigator.permissions`, so the unguarded `.query(...)` throws an
// unhandled rejection out of a passive effect on every render.
if (!navigator.permissions) {
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: () =>
        Promise.resolve({
          state: 'granted',
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
    },
  });
}

// The design system bundles Lottie, which grabs a 2D context at import time
// and writes to it. jsdom's `getContext` returns null without the native
// `canvas` package, so importing the DS throws before any test runs. This stub
// accepts any property write and answers every method call; the few getters
// Lottie actually reads are given plausible shapes.
function create2dContextStub(canvas: HTMLCanvasElement) {
  const written: Record<string | symbol, unknown> = {
    canvas,
    measureText: () => ({ width: 0 }),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createPattern: () => null,
  };
  return new Proxy(written, {
    get: (target, prop) => (prop in target ? target[prop] : () => undefined),
    set: (target, prop, value) => {
      target[prop] = value;
      return true;
    },
  });
}

HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement) {
  return create2dContextStub(this);
} as unknown as HTMLCanvasElement['getContext'];
HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';

// Menus and the grid scroll containers call these; jsdom leaves them undefined.
Element.prototype.scrollTo ??= function scrollTo() {};
Element.prototype.scrollIntoView ??= function scrollIntoView() {};
window.HTMLMediaElement.prototype.play ??= () => Promise.resolve();
window.HTMLMediaElement.prototype.pause ??= () => {};
window.HTMLMediaElement.prototype.load ??= () => {};

/* ---------------------------------------------------------------------------
 * Console noise. Filtered narrowly so genuine warnings still surface.
 * ------------------------------------------------------------------------- */

const IGNORED_CONSOLE = [
  // DataGridPro is a paid component; there is no key in the test environment.
  /MUI X: Missing license key/i,
  /MUI X: License key/i,
  // jsdom cannot lay out the grid, so MUI warns about zero-height viewports.
  /useResizeContainer|has either a `width` of zero|MUI X: The parent DOM element/i,
];

const realConsoleError = console.error;
const realConsoleWarn = console.warn;

function filtered(original: (...args: unknown[]) => void) {
  return (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (IGNORED_CONSOLE.some((pattern) => pattern.test(first))) return;
    original(...args);
  };
}

/* ---------------------------------------------------------------------------
 * MSW + per-test isolation.
 * ------------------------------------------------------------------------- */

beforeAll(() => {
  console.error = filtered(realConsoleError);
  console.warn = filtered(realConsoleWarn);
  // `error` rather than `warn`: an unhandled request means an endpoint is
  // missing from `ENDPOINTS`, which would otherwise fail as a confusing
  // network error deep inside a thunk.
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetScenarioSelection();
  resetRequestLog();
  // Module-scoped `Map` in the hover-card cache; would otherwise serve one
  // test's response to the next.
  resetHoverCardCache();
  localStorage.clear();
  vi.useRealTimers();
});

afterAll(() => {
  server.close();
  console.error = realConsoleError;
  console.warn = realConsoleWarn;
});
