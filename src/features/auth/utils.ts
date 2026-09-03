import { UserType } from './types';

/**
 * Landing route each supported role should be sent to after a successful login
 * or when they hit an unauthorized page. Keep this in sync with the routes
 * declared under `AuthenticatedLayout` in `src/app/routes.tsx`.
 */
const HOME_ROUTE_BY_USER_TYPE: Record<string, string> = {
  [UserType.ADMIN.toLowerCase()]: '/dashboard',
  [UserType.SUPERVISOR.toLowerCase()]: '/interactions',
};

export function getHomeRouteForUser(userType: string | undefined | null): string {
  if (!userType) return '/login';
  return HOME_ROUTE_BY_USER_TYPE[userType.toLowerCase()] ?? '/login';
}
