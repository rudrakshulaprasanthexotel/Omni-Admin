import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { RouterProvider } from 'react-router-dom';
import { ExotelThemeProvider } from '@exotel-npm-dev/signal-design-system';
import { store, persistor } from './store';
import { router } from './app/router';
import { theme } from './configs/theme.config';
import { useSyncAuthHeaders } from '@/features/auth/hooks/useSyncAuthHeaders';

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
            <RouterProvider router={router} />
          </ExotelThemeProvider>
        </AppProviders>
      </PersistGate>
    </Provider>
  );
}

export default App;
