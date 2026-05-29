import { useCopilotAction } from '@copilotkit/react-core';
import { COPILOT_ACTIONS, type CopilotActionConfig } from './copilotActions.config';
import { useCopilotCommandRegistry } from './CopilotCommandRegistry';

const RegisteredAction = ({ config }: { config: CopilotActionConfig }) => {
  const { run } = useCopilotCommandRegistry();

  useCopilotAction({
    name: config.name,
    description: config.description,
    parameters: config.parameters,
    handler: async (args) => run(config.command, args as Record<string, unknown>, config.page),
  });

  return null;
};

/**
 * Registers every Copilot action declared in `copilotActions.config.ts`.
 * Each action is rendered as its own child so the `useCopilotAction` hook is
 * called once per entry in a stable order (respecting the rules of hooks).
 */
const CopilotActionsRegistrar = () => (
  <>
    {COPILOT_ACTIONS.map((config) => (
      <RegisteredAction key={config.name} config={config} />
    ))}
  </>
);

export default CopilotActionsRegistrar;
