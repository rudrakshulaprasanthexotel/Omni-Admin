import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ExotelThemeProvider } from '@exotel-npm-dev/signal-design-system';
import { store } from './store';
import { router } from './app/router';
import { theme } from './configs/theme.config';

function App() {
  return (
    <Provider store={store}>
      <ExotelThemeProvider defaultMode="system" themeOverrides={theme}>
        <RouterProvider router={router} />
      </ExotelThemeProvider>
    </Provider>
  );
}

export default App;
