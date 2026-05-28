import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

const basePath = import.meta.env.VITE_BASE_URL;

/**
 * resources is an object that contains all the translations for the different languages.
 */
//TODO exotelChanges --changes to configure i18n
/**
 * i18n is initialized with the resources object and the language to use.
 * The keySeparator option is set to false because we do not use keys in form messages.welcome.
 * The interpolation option is set to false because we do not use interpolation in form messages.welcome.
 */
i18n
  .use(Backend)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: "en",
    fallbackLng: "en",
    ns: ["common"], // Declare all namespaces here
    defaultNS: "common",
    fallbackNS: ["common"],
    keySeparator: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    backend: {
      loadPath: `${basePath}/locales/{{lng}}/{{ns}}.json`,
    },
  });

export default i18n;
