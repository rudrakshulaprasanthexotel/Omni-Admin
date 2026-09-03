import { configureStore } from '@reduxjs/toolkit';
import type { Store } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import processReducer from '@/features/process/processSlice';
import interactionsReducer from '@/features/interactions/interactionsSlice';
import rightPanelReducer from '@/layouts/rightPanel/rightPanelSlice';
import {
  apiClient,
  setAuthorizationHeader,
  setSessionId,
  setupApiClientInterceptors,
} from '@/services/apiClient';
import type { AppDispatch, RootState } from '@/store';
import { TEST_JWT, TEST_SESSION_ID, loginResponse } from './fixtures/auth';

/**
 * Plain, non-persisted store. The production root reducer wraps `auth` in
 * `persistReducer`, which would drag localStorage and a REHYDRATE round-trip
 * into every test for no benefit.
 */
const testReducers = {
  auth: authReducer,
  process: processReducer,
  interactions: interactionsReducer,
  rightPanel: rightPanelReducer,
};

export type TestRootState = {
  [K in keyof typeof testReducers]: ReturnType<(typeof testReducers)[K]>;
};

/**
 * A slice's own initial state, obtained by driving its reducer with an unknown
 * action — the slice state interfaces aren't exported, and duplicating them
 * here would rot the moment a field is added.
 */
function initialSliceState<S>(reducer: (state: S | undefined, action: { type: string }) => S): S {
  return reducer(undefined, { type: '@@test/INIT' });
}

export const authState = (
  overrides: Partial<TestRootState['auth']> = {},
): TestRootState['auth'] => ({
  ...initialSliceState(authReducer),
  ...overrides,
});

export const processState = (
  overrides: Partial<TestRootState['process']> = {},
): TestRootState['process'] => ({
  ...initialSliceState(processReducer),
  ...overrides,
});

export const interactionsState = (
  overrides: Partial<TestRootState['interactions']> = {},
): TestRootState['interactions'] => ({
  ...initialSliceState(interactionsReducer),
  ...overrides,
});

export const rightPanelState = (
  overrides: Partial<TestRootState['rightPanel']> = {},
): TestRootState['rightPanel'] => ({
  ...initialSliceState(rightPanelReducer),
  ...overrides,
});

export interface PreloadedStateOptions {
  auth?: Partial<TestRootState['auth']>;
  process?: Partial<TestRootState['process']>;
  interactions?: Partial<TestRootState['interactions']>;
  rightPanel?: Partial<TestRootState['rightPanel']>;
}

/** Full state for all four slices, defaults filled in from each reducer. */
export function preloadedState(options: PreloadedStateOptions = {}): TestRootState {
  return {
    auth: authState(options.auth),
    process: processState(options.process),
    interactions: interactionsState(options.interactions),
    rightPanel: rightPanelState(options.rightPanel),
  };
}

/**
 * A signed-in supervisor. Needed for anything that reaches the network: the
 * 401 interceptor only attempts a refresh when a `sessionId` is present, and
 * the interaction-svc origin comes out of this payload.
 */
export function signedInState(options: PreloadedStateOptions = {}): TestRootState {
  return preloadedState({
    ...options,
    auth: { loginResponse: loginResponse(), ...options.auth },
  });
}

function configureTestStore(initialState: TestRootState) {
  return configureStore({
    reducer: testReducers,
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });
}

/**
 * Same store, but typed with the app's own `AppDispatch`.
 *
 * `RootState['auth']` carries redux-persist's `PersistPartial`; the test
 * reducer's does not. A dispatch inferred from `testReducers` is therefore
 * typed against a state the app's thunks don't accept, and every
 * `dispatch(fetchInteractions(…))` in a test fails to compile while running
 * perfectly. Swapping in `AppDispatch` keeps thunk calls typechecked against
 * production types, and `getState` still reports the non-persisted shape.
 */
export type TestStore = Omit<ReturnType<typeof configureTestStore>, 'dispatch'> & {
  dispatch: AppDispatch;
};

export function createTestStore(initialState: TestRootState = preloadedState()): TestStore {
  return configureTestStore(initialState) as unknown as TestStore;
}

/**
 * Rebinds the shared axios instance to a test store.
 *
 * `setupApiClientInterceptors` pushes onto the interceptor stacks and offers no
 * ejector, so calling it once per test would pile up handlers and fire the
 * refresh logic several times per response. Clearing first keeps exactly one
 * of each, matching the single call the real app makes at module load.
 */
export function installApiClient(store: TestStore): void {
  apiClient.interceptors.request.clear();
  apiClient.interceptors.response.clear();
  setupApiClientInterceptors(store as unknown as Store<RootState>);

  const session = store.getState().auth.loginResponse;
  if (session) {
    setSessionId(session.userSessionInfo.sessionId ?? TEST_SESSION_ID);
    setAuthorizationHeader(
      session.authenticationState.authPolicyVsUserInfo['auth.type.passwd']
        .loginProperties.jwt ?? TEST_JWT,
    );
  }
}

/** Store wired to the axios instance, ready to dispatch thunks. */
export function createConnectedStore(initialState: TestRootState = signedInState()): TestStore {
  const store = createTestStore(initialState);
  installApiClient(store);
  return store;
}
