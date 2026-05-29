import type { RouteObject } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

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
      { path: '/dashboard', lazy: () => import('../features/dashboard/pages/AdminDashboardPage') },
    ],
  },
];
