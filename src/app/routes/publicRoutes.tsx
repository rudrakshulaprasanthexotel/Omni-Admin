import type { RouteObject } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout/PublicLayout';

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', lazy: () => import('../../pages/public/LoginPage') },
      { path: '*', element: <div>Not Found</div> },
    ],
  },
];
