import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ExotelThemeProvider } from '@exotel-npm-dev/signal-design-system';
import { router } from './app/router';
import './styles/reset.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExotelThemeProvider defaultMode="light" defaultFont="noto-sans">
      <RouterProvider router={router} />
    </ExotelThemeProvider>
  </StrictMode>,
);
