import type { Parameter } from '@copilotkit/shared';

/**
 * Declarative configuration for Copilot actions.
 *
 * Each entry describes an action exposed to the Copilot. The `command` field
 * points to a UI-driving command registered via `useCopilotCommand` (which
 * opens dialogs, fills forms, applies filters, navigates, etc.). The optional
 * `page` is the route that must be active for the command to exist — the
 * registry navigates there automatically before running the command.
 *
 * To add a new capability: add an entry here and register a matching command
 * with `useCopilotCommand(<command id>, handler)` in the relevant component.
 */
export interface CopilotActionConfig {
  name: string;
  description: string;
  parameters: Parameter[];
  command: string;
  page?: string;
}

export const COPILOT_ACTIONS: CopilotActionConfig[] = [
  {
    name: 'navigate',
    description:
      'Navigate the admin app to a page, the same as clicking an item in the left sidebar.',
    command: 'app.navigate',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description:
          'The route to open. One of: /dashboard, /analytics, /users, /queues, /audit, /settings, /help',
        required: true,
      },
    ],
  },
  {
    name: 'addUser',
    description:
      'Add a new user by opening the Add User dialog, filling in the form fields, and submitting it.',
    command: 'users.add',
    page: '/users',
    parameters: [
      { name: 'name', type: 'string', description: "The user's full name", required: true },
      { name: 'email', type: 'string', description: "The user's email address", required: true },
      {
        name: 'role',
        type: 'string',
        description: "The user's role: Administrator, Supervisor, or Agent",
        required: false,
      },
      {
        name: 'status',
        type: 'string',
        description: "The user's status: Active or Inactive",
        required: false,
      },
    ],
  },
  {
    name: 'filterUsers',
    description: 'Filter the Users table by typing a search term into its filter box.',
    command: 'users.filter',
    page: '/users',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Text to filter users by (matches name, email, role). Empty clears the filter.',
        required: true,
      },
    ],
  },
  {
    name: 'filterQueues',
    description: 'Filter the Queues table by typing a search term into its filter box.',
    command: 'queues.filter',
    page: '/queues',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Text to filter queues by. Empty clears the filter.',
        required: true,
      },
    ],
  },
];
