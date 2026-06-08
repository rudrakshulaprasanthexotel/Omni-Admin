import { createBrowserRouter } from 'react-router-dom';
import { rootRouter } from './rootRouter';

export const router = createBrowserRouter(rootRouter, {
  basename: import.meta.env.BASE_URL,
});
