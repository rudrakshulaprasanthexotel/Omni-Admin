import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderHookResult,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import { ExotelThemeProvider, ToastProvider } from '@exotel-npm-dev/signal-design-system';
import { theme } from '@/configs/theme.config';
import {
  createConnectedStore,
  signedInState,
  type TestRootState,
} from './testStore';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Full preloaded state; build it with `signedInState()` / `preloadedState()`. */
  state?: TestRootState;
  /** Router entry, including search params, e.g. `/interactions?campaignId=42`. */
  route?: string;
  /** Reuse an existing store instead of creating one. */
  store?: ReturnType<typeof createConnectedStore>;
}

export interface RenderWithProvidersResult extends RenderResult {
  store: ReturnType<typeof createConnectedStore>;
}

/**
 * Mirrors the provider stack in `App.tsx` minus `PersistGate` and
 * `RouterProvider`:
 *
 * - `defaultMode="light"` rather than `"system"`, so appearance doesn't depend
 *   on a matchMedia stub.
 * - `MemoryRouter`, so `useSearchParams` / `setSearchParams` behave for real —
 *   the page keeps campaign, process, filter and pagination state in the URL.
 * - `ToastProvider`, required by `useToast` in `InteractionRowActions`.
 *
 * i18n needs no provider: `src/test/i18n.ts` registers the default instance
 * through `initReactI18next`, exactly as production does.
 */
function createWrapper(
  store: ReturnType<typeof createConnectedStore>,
  route: string,
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <ExotelThemeProvider defaultMode="light" themeOverrides={theme}>
          <ToastProvider offset={100}>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ToastProvider>
        </ExotelThemeProvider>
      </Provider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  {
    state = signedInState(),
    route = '/interactions',
    store = createConnectedStore(state),
    ...renderOptions
  }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  return {
    store,
    ...render(ui, { wrapper: createWrapper(store, route), ...renderOptions }),
  };
}

/**
 * Same providers, for hooks tested without a host component. The hover-card
 * hooks need the theme (channel colours) and i18n, and their fetch is driven
 * by an `onOpenChange` callback the design system owns — calling it directly
 * is far steadier than simulating a hover over a third-party popover.
 */
export function renderHookWithProviders<Result, Props>(
  hook: (initialProps: Props) => Result,
  {
    state = signedInState(),
    route = '/interactions',
    store = createConnectedStore(state),
    ...hookOptions
  }: RenderWithProvidersOptions & RenderHookOptions<Props> = {},
): RenderHookResult<Result, Props> & {
  store: ReturnType<typeof createConnectedStore>;
} {
  return {
    store,
    ...renderHook(hook, { wrapper: createWrapper(store, route), ...hookOptions }),
  };
}
