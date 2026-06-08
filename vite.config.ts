import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';

  const devProxies: Record<string, string | ProxyOptions> = {
    '/ameyorestapi': {
      target: env.VITE_API_BASE_URL,
      changeOrigin: true,
      secure: false,
    },
    [env.VITE_CMS_API_BASE_PATH]: {
      target: env.VITE_API_BASE_URL,
      changeOrigin: true,
      secure: false,
    },
  };

  return {
    base: env.VITE_BASE_URL,
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: isDev ? devProxies : {},
    },
  }
})
