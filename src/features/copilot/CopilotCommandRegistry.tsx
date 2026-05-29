import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

/**
 * A command is the actual UI-driving implementation behind a Copilot action
 * (e.g. open a dialog, fill a form and submit it, apply a filter, navigate).
 * Components register commands by id; the config in `copilotActions.config.ts`
 * maps Copilot actions to these command ids.
 */
export type CopilotCommandHandler = (
  args: Record<string, unknown>,
) => Promise<string | void> | string | void;

interface CopilotCommandRegistryValue {
  register: (id: string, handler: CopilotCommandHandler) => () => void;
  run: (id: string, args: Record<string, unknown>, page?: string) => Promise<string>;
}

const CopilotCommandRegistryContext = createContext<CopilotCommandRegistryValue | null>(null);

const NAVIGATE_COMMAND_ID = 'app.navigate';

const waitForRegistration = (
  has: (id: string) => boolean,
  id: string,
  timeoutMs = 3000,
): Promise<boolean> =>
  new Promise((resolve) => {
    if (has(id)) {
      resolve(true);
      return;
    }
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (has(id)) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startedAt > timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 50);
  });

export const CopilotCommandRegistryProvider = ({ children }: { children: ReactNode }) => {
  const handlers = useRef(new Map<string, CopilotCommandHandler>());

  const register = useCallback((id: string, handler: CopilotCommandHandler) => {
    handlers.current.set(id, handler);
    return () => {
      if (handlers.current.get(id) === handler) {
        handlers.current.delete(id);
      }
    };
  }, []);

  const run = useCallback(async (id: string, args: Record<string, unknown>, page?: string) => {
    const has = (commandId: string) => handlers.current.has(commandId);

    // The target command lives on a page that isn't mounted yet — navigate there first.
    if (!has(id) && page) {
      const navigate = handlers.current.get(NAVIGATE_COMMAND_ID);
      if (navigate) {
        await navigate({ path: page });
        await waitForRegistration(has, id);
      }
    }

    const handler = handlers.current.get(id);
    if (!handler) {
      return `The "${id}" action isn't available right now.`;
    }
    const result = await handler(args);
    return typeof result === 'string' ? result : 'Done.';
  }, []);

  const value = useMemo<CopilotCommandRegistryValue>(() => ({ register, run }), [register, run]);

  return (
    <CopilotCommandRegistryContext.Provider value={value}>
      {children}
    </CopilotCommandRegistryContext.Provider>
  );
};

export const useCopilotCommandRegistry = () => {
  const ctx = useContext(CopilotCommandRegistryContext);
  if (!ctx) {
    throw new Error('useCopilotCommandRegistry must be used within a CopilotCommandRegistryProvider');
  }
  return ctx;
};

/**
 * Register a UI-driving command from a component. The handler always sees the
 * latest closure, and the command is removed when the component unmounts.
 */
export const useCopilotCommand = (id: string, handler: CopilotCommandHandler) => {
  const { register } = useCopilotCommandRegistry();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const stableHandler: CopilotCommandHandler = (args) => handlerRef.current(args);
    return register(id, stableHandler);
  }, [register, id]);
};
