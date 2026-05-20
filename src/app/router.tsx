import { createBrowserRouter, Navigate } from 'react-router-dom';
import { publicRoutes } from './routes/publicRoutes';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  ...publicRoutes,
]);
