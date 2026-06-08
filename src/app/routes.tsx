import type { RouteObject } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { RoleGuard } from '@/shared/components/guards/RoleGuard';
import { UserType } from '@/features/auth/types';

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', lazy: () => import('../features/auth/pages/LoginPage') },
      { index: true, lazy: () => import('../features/auth/pages/LoginPage') },
    ],
  },
  {
    element: <AuthenticatedLayout />,
    children: [
      { path: '/dashboard', lazy: () => import('../features/dashboard/pages/DashboardPage') },
      { path: '/analytics', lazy: () => import('../features/analytics/pages/AnalyticsPage') },
      { path: '/users', lazy: () => import('../features/users/pages/UsersPage') },
      { path: '/queues', lazy: () => import('../features/queues/pages/QueuesPage') },
      { path: '/audit', lazy: () => import('../features/audit/pages/AuditLogsPage') },
      { path: '/settings', lazy: () => import('../features/settings/pages/SettingsPage') },
      { path: '/process', lazy: () => import('../features/process/pages/ProcessPage') },
      { path: '/help', lazy: () => import('../features/help/pages/HelpPage') },
      {
        element: <RoleGuard allowedRoles={[UserType.SUPERVISOR]} />,
        children: [
          { path: '/monitoring', lazy: () => import('../features/queues/pages/QueueMonitorPage') },
          { path: '/team', lazy: () => import('../features/analytics/pages/AgentPerformancePage') },
        ],
      },
    ],
  },
];
