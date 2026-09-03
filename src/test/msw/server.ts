import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Node-side interceptor used by the Vitest suite. Lifecycle is wired in
 * `src/test/setup.ts`; the browser counterpart is `./browser.ts`.
 */
export const server = setupServer(...handlers);
