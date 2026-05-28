import type { RouteObject } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout/PublicLayout';

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', lazy: () => import('../features/auth/pages/LoginPage') },
      { index: true, lazy: () => import('../features/auth/pages/LoginPage') },
    ],
  },
];
