import { persistReducer } from "redux-persist";
import type { WebStorage } from "redux-persist/lib/types";
import authReducer from "../features/auth/authSlice";

// Custom localStorage adapter. Avoids redux-persist's default storage import,
// which doesn't unwrap correctly under Vite's ESM interop
// (`storage.getItem is not a function`).
const storage: WebStorage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

const authPersistConfig = {
  key: "auth",
  storage,
};

export const rootReducer = {
  auth: persistReducer(authPersistConfig, authReducer),
};
