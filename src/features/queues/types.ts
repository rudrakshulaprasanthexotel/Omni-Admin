export const RoutingStrategy = {
  ROUND_ROBIN: 'Round Robin',
  LEAST_BUSY: 'Least Busy',
  LONGEST_IDLE: 'Longest Idle',
  SKILL_BASED: 'Skill Based',
} as const;

export type RoutingStrategy = (typeof RoutingStrategy)[keyof typeof RoutingStrategy];

export const QueueStatus = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
} as const;

export type QueueStatus = (typeof QueueStatus)[keyof typeof QueueStatus];

export interface Queue {
  id: string;
  name: string;
  description: string;
  strategy: RoutingStrategy;
  agents: number;
  status: QueueStatus;
}

export type QueueFormValues = Omit<Queue, 'id'>;
