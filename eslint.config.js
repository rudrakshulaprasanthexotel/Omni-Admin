import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import noHardcodedColors from './eslint-plugins/no-hardcoded-colors.js'

export default defineConfig([
  // `mockServiceWorker.js` is emitted verbatim by `msw init`.
  globalIgnores(['dist', 'src/boilerplate', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'custom-colors': noHardcodedColors,
    },
    rules: {
      'custom-colors/no-hardcoded-colors': 'error',
      'indent': ['error', 2],
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name=/^(useCallback|useMemo)$/]',
          message:
            'useCallback and useMemo are not allowed in this project.',
        },
        {
          selector:
            'CallExpression[callee.object.name="React"][callee.property.name=/^(useCallback|useMemo)$/]',
          message:
            'useCallback and useMemo are not allowed in this project.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: ['useCallback', 'useMemo'],
              message:
                'useCallback and useMemo are not allowed in this project.',
            },
          ],
        },
      ],
    },
  },
  {
    // The `dev:mock` scenario switcher is dev-only scaffolding that sits on top
    // of the app under test. It is styled with its own literal colours on
    // purpose: reaching into the product theme would make the harness change
    // appearance with the thing it is being used to inspect.
    files: ['src/test/**/*.{ts,tsx}'],
    rules: {
      'custom-colors/no-hardcoded-colors': 'off',
    },
  },
])
