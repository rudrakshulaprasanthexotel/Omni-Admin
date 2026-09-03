import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonJson from '../../public/locales/en/common.json';

/**
 * Test-only i18n instance. Production (`@/services/i18n`) loads translations
 * over HTTP via `i18next-http-backend`, which never resolves under jsdom and
 * leaves every assertion looking at raw keys.
 *
 * The very same file the app serves is imported instead, so assertions read
 * the exact strings users see and follow the copy when it changes — a renamed
 * key fails the build here rather than silently asserting a raw key.
 */
const common = commonJson as Record<string, string>;

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  fallbackNS: ['common'],
  // Matches production: keys are flat, not dotted paths.
  keySeparator: false,
  interpolation: { escapeValue: false },
  resources: { en: { common } },
});

/** The shipped English copy, for tests that need a string by key. */
export const enCommon = common;

/** Resolve a key the same way the components do. */
export function tr(key: string, values?: Record<string, unknown>): string {
  return i18n.t(key, values ?? {}) as string;
}

export default i18n;
