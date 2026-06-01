export const UserRole = {
  ADMIN: 'Administrator',
  SUPERVISOR: 'Supervisor',
  AGENT: 'Agent',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export type UserFormValues = Omit<User, 'id'>;
