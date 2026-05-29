import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ExotelThemeProvider } from '@exotel-npm-dev/signal-design-system';
import { CopilotKit } from '@copilotkit/react-core';
import { store } from './store';
import { router } from './app/router';
import './index.css';
import { theme } from './configs/theme.config';
import '@/services/i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ExotelThemeProvider defaultMode="system" themeOverrides={theme}>
        <CopilotKit publicApiKey={import.meta.env.VITE_COPILOT_CLOUD_PUBLIC_API_KEY}>
          <RouterProvider router={router} />
        </CopilotKit>
      </ExotelThemeProvider>
    </Provider>
  </StrictMode>,
);
