import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ExotelThemeProvider, ToastProvider } from '@exotel-npm-dev/signal-design-system';
import { store, persistor } from './store';
import { router } from './app/router';
import { theme } from './configs/theme.config';
import { useSyncAuthHeaders } from '@/features/auth/hooks/useSyncAuthHeaders';
import { setupApiClientInterceptors } from './services/apiClient';
import { queryClient } from './services/queryClient';

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
        <QueryClientProvider client={queryClient}>
          <AppProviders>
            <ExotelThemeProvider defaultMode="system" themeOverrides={theme}>
              <ToastProvider offset={100}>
                <RouterProvider router={router} />
              </ToastProvider>
            </ExotelThemeProvider>
          </AppProviders>
          {/* Renders nothing outside development. */}
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
