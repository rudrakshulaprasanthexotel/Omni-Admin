import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { RouterProvider } from 'react-router-dom';
import { ExotelThemeProvider, ToastProvider } from '@exotel-npm-dev/signal-design-system';
import { store, persistor } from './store';
import { router } from './app/router';
import { theme } from './configs/theme.config';
import { useSyncAuthHeaders } from '@/features/auth/hooks/useSyncAuthHeaders';
import { setupApiClientInterceptors } from './services/apiClient';

// Setup interceptors for the API client when the app initializes
setupApiClientInterceptors(store);

function AppProviders({ children }: { children: ReactNode }) {
  useSyncAuthHeaders();
  return <>{children}</>;
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppProviders>
          <ExotelThemeProvider defaultMode="system" themeOverrides={theme}>
            <ToastProvider offset={100}>
              <RouterProvider router={router} />
            </ToastProvider>
          </ExotelThemeProvider>
        </AppProviders>
      </PersistGate>
    </Provider>
  );
}

export default App;
