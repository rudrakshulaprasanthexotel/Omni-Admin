import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ExotelThemeProvider } from '@exotel-npm-dev/signal-design-system';
import { store } from './store';
import { router } from './app/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ExotelThemeProvider defaultMode="light">
        <RouterProvider router={router} />
      </ExotelThemeProvider>
    </Provider>
  </StrictMode>,
);
