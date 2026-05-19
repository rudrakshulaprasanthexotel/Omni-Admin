# Omni-Admin — Implementation Design Document

> **Version:** 1.2.0
> **Date:** 2026-05-15
> **Status:** Draft

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Application Bootstrap & Entry Point](#4-application-bootstrap--entry-point)
5. [Routing Architecture (Multi-Layout)](#5-routing-architecture)
6. [State Management — Redux Toolkit](#6-state-management--redux-toolkit)
7. [React Contexts](#7-react-contexts)
8. [Custom Hooks](#8-custom-hooks)
9. [Logging — js-logger](#9-logging--js-logger)
10. [Analytics Service](#10-analytics-service)
11. [Type System](#11-type-system)
12. [Styling Architecture](#12-styling-architecture)
13. [Utilities](#13-utilities)
14. [Pages & Features (Per-Layout)](#14-pages--features)
15. [Configuration Management](#15-configuration-management)
16. [API Layer](#16-api-layer)
17. [Error Handling Strategy](#17-error-handling-strategy)
18. [Performance Strategy](#18-performance-strategy)
19. [Testing Strategy](#19-testing-strategy)
20. [Build & Deployment](#20-build--deployment)
21. [Dependency Summary](#21-dependency-summary)

---

## 1. Project Overview

**Omni-Admin** is a React-based administration panel built on top of the modern Vite 8 + React 19 + TypeScript 6 toolchain with the React Compiler enabled. The application serves **multiple user personas** — each with a distinct UI layout, navigation structure, and page set:

- **Admin Layout** — Full-featured administration shell with a collapsible sidebar, system-wide management (users, analytics, audit logs, settings).
- **Supervisor Layout** — Streamlined operational shell with a horizontal top navigation bar, focused on team oversight, queue monitoring, and agent performance.

Additional layouts can be added without modifying existing ones.

### Current Baseline

| Concern        | Current State                              |
| -------------- | ------------------------------------------ |
| Bundler        | Vite 8 with `@vitejs/plugin-react`         |
| Framework      | React 19 with React Compiler (Babel)       |
| Language       | TypeScript 6 (strict, bundler resolution)  |
| Linting        | ESLint 10 flat config + react-hooks plugin |
| Routing        | None (single `App.tsx`)                    |
| State          | Local `useState` only                      |
| Styling        | Plain CSS with CSS custom properties       |
| Package Mgr    | npm                                        |

---

## 2. Tech Stack

### Core

| Layer              | Technology                    | Version     | Purpose                                |
| ------------------ | ----------------------------- | ----------- | -------------------------------------- |
| UI Library         | React                         | ^19.2.6     | Component rendering                    |
| Language           | TypeScript                    | ~6.0.2      | Static type safety                     |
| Bundler            | Vite                          | ^8.0.12     | Dev server, HMR, production builds     |
| Compiler           | React Compiler (Babel plugin) | ^1.0.0      | Automatic memoization                  |

### New Dependencies (to be added)

| Layer              | Technology                            | Purpose                                      |
| ------------------ | ------------------------------------- | -------------------------------------------- |
| UI Components      | `@exotel-npm-dev/singal-design-system`| Pre-built design system (Button, Input, Modal, Table, etc.) |
| State Management   | `@reduxjs/toolkit`                    | Global state, async thunks, slices           |
| React-Redux        | `react-redux`                         | React bindings for Redux                     |
| Routing            | `react-router-dom`                    | Client-side routing, nested layouts          |
| Logging            | `js-logger`                           | Structured logging with configurable levels  |
| Analytics          | Custom service (internal)             | Event tracking, page views, user metrics     |

---

## 3. Directory Structure

```
omni-admin/
├── docs/                               # Documentation
│   ├── IMPLEMENTATION_DESIGN.md        # This document
│   └── ADR/                            # Architecture Decision Records
│       ├── 001-state-management.md
│       └── 002-multi-layout.md
│
├── public/                             # Static assets served as-is
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── main.tsx                        # Application entry point
│   ├── App.tsx                         # Root component (providers + router)
│   │
│   ├── app/                            # Application-level wiring
│   │   ├── router.tsx                  # Root router (merges all layout routes)
│   │   └── routes/                     # Per-layout route definitions
│   │       ├── adminRoutes.tsx         # Admin layout route tree
│   │       ├── supervisorRoutes.tsx    # Supervisor layout route tree
│   │       └── publicRoutes.tsx        # Unauthenticated routes (login, 404)
│   │
│   ├── store/                          # Redux Toolkit — all state in one place
│   │   ├── index.ts                    # Store creation + exports (RootState, AppDispatch)
│   │   ├── hooks.ts                    # Typed hooks (useAppDispatch, useAppSelector)
│   │   ├── auth/                       # Authentication slice
│   │   │   ├── authSlice.ts
│   │   │   ├── authThunks.ts
│   │   │   └── authSelectors.ts
│   │   ├── dashboard/                  # Dashboard data slice
│   │   │   ├── dashboardSlice.ts
│   │   │   └── dashboardSelectors.ts
│   │   └── users/                      # User management slice
│   │       ├── usersSlice.ts
│   │       ├── usersThunks.ts
│   │       └── usersSelectors.ts
│   │
│   ├── configs/                        # Runtime & build-time configuration
│   │   ├── env.ts                      # Environment variable access
│   │   ├── constants.ts                # Application-wide constants
│   │   ├── logger.config.ts            # js-logger setup
│   │   ├── analytics.config.ts         # Analytics provider config
│   │   └── navigation.config.ts        # Per-layout sidebar/nav item definitions
│   │
│   ├── contexts/                       # React Context providers
│   │   ├── ThemeContext.tsx             # Theme management (light/dark/system)
│   │   ├── AuthContext.tsx              # Authentication state & methods
│   │   ├── LayoutContext.tsx            # Active layout identity & config
│   │   └── NotificationContext.tsx      # Toast / alert notification system
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useAuth.ts                  # Auth context consumer
│   │   ├── useTheme.ts                 # Theme context consumer
│   │   ├── useLayout.ts               # Layout context consumer (active layout, nav items)
│   │   ├── useAnalytics.ts             # Analytics event dispatching
│   │   ├── useLogger.ts               # Scoped logging per component/module
│   │   ├── useDebounce.ts              # Debounced value
│   │   ├── useLocalStorage.ts          # Typed localStorage wrapper
│   │   ├── useOnClickOutside.ts        # Click-outside detection
│   │   └── usePagination.ts            # Pagination state machine
│   │
│   ├── types/                          # Shared TypeScript types & interfaces
│   │   ├── index.ts                    # Barrel re-exports
│   │   ├── api.types.ts                # API request/response contracts
│   │   ├── auth.types.ts               # User, Session, Token, Role types
│   │   ├── layout.types.ts             # Layout, NavItem, LayoutConfig types
│   │   ├── dashboard.types.ts           # Dashboard KPIs, chart data types
│   │   ├── analytics.types.ts          # Event, PageView, UserAction types
│   │   ├── router.types.ts             # Route meta, guard types
│   │   └── common.types.ts             # Shared utility types (Nullable, AsyncState, etc.)
│   │
│   ├── styles/                         # Global styles & design tokens
│   │   ├── index.css                   # Global reset & base styles
│   │   ├── variables.css               # CSS custom properties (design tokens)
│   │   ├── typography.css              # Font faces, heading/body scales
│   │   ├── animations.css              # Shared keyframe animations
│   │   └── utilities.css               # Utility classes (spacing, visibility, etc.)
│   │
│   ├── utils/                          # Pure utility functions
│   │   ├── format.ts                   # Date, number, currency formatters
│   │   ├── validation.ts               # Form validation helpers
│   │   ├── storage.ts                  # localStorage/sessionStorage wrappers
│   │   ├── url.ts                      # URL construction, query param helpers
│   │   └── retry.ts                    # Async retry with exponential backoff
│   │
│   ├── services/                       # External integrations & side-effect services
│   │   ├── api/                        # API client layer
│   │   │   ├── client.ts               # Base fetch client with interceptors
│   │   │   ├── endpoints.ts            # Endpoint URL registry
│   │   │   └── types.ts                # API-specific types
│   │   ├── analytics/                  # Analytics service
│   │   │   ├── AnalyticsService.ts     # Core analytics class
│   │   │   ├── providers/              # Pluggable providers (internal, GA, etc.)
│   │   │   └── types.ts                # Analytics types
│   │   └── logger/                     # Logger service
│   │       └── LoggerService.ts        # js-logger initialization & factory
│   │
│   ├── layouts/                        # Layout shells — one per persona
│   │   ├── AdminLayout/                # Full-featured admin shell
│   │   │   ├── AdminLayout.tsx         # Sidebar + Header + Outlet + Footer
│   │   │   ├── AdminLayout.module.css
│   │   │   ├── AdminSidebar.tsx        # Full nav tree, collapsible, multi-section
│   │   │   ├── AdminHeader.tsx         # Search bar, user menu, notifications
│   │   │   └── AdminFooter.tsx
│   │   ├── SupervisorLayout/           # Streamlined supervisor shell
│   │   │   ├── SupervisorLayout.tsx    # Top-nav + Outlet (no sidebar)
│   │   │   ├── SupervisorLayout.module.css
│   │   │   ├── SupervisorTopNav.tsx    # Horizontal nav bar, fewer items
│   │   │   └── SupervisorHeader.tsx    # Minimal header (role badge, logout)
│   │   └── PublicLayout/              # Unauthenticated shell
│   │       ├── PublicLayout.tsx        # Centered content, branding only
│   │       └── PublicLayout.module.css
│   │
│   ├── components/                     # App-specific composed components
│   │   ├── navigation/                 # Shared navigation primitives
│   │   │   ├── NavItem.tsx             # Single nav link (icon + label + badge)
│   │   │   ├── NavGroup.tsx            # Collapsible nav section
│   │   │   └── Breadcrumbs.tsx         # Route-aware breadcrumb trail
│   │   ├── feedback/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── EmptyState.tsx
│   │   └── guards/
│   │       ├── AuthGuard.tsx           # Protected route wrapper
│   │       ├── RoleGuard.tsx           # Role-based access control
│   │       └── LayoutGuard.tsx         # Validates user role matches layout
│   │
│   ├── pages/                          # Route-level page components
│   │   ├── public/                     # Unauthenticated pages
│   │   │   ├── LoginPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── admin/                      # Admin-layout pages
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── UsersPage.tsx
│   │   │   ├── UserDetailPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── SystemSettingsPage.tsx
│   │   │   └── AuditLogPage.tsx
│   │   ├── supervisor/                 # Supervisor-layout pages
│   │   │   ├── SupervisorDashboardPage.tsx
│   │   │   ├── TeamOverviewPage.tsx
│   │   │   ├── QueueMonitorPage.tsx
│   │   │   ├── AgentPerformancePage.tsx
│   │   │   └── SupervisorSettingsPage.tsx
│   │   └── shared/                     # Pages reused across layouts
│   │       ├── ProfilePage.tsx
│   │       └── HelpPage.tsx
│   │
│   └── assets/                         # Imported static assets (images, fonts, etc.)
│       ├── hero.png
│       ├── react.svg
│       └── vite.svg
│
├── index.html                          # Vite HTML entry
├── vite.config.ts                      # Vite configuration
├── tsconfig.json                       # Root TS config (project references)
├── tsconfig.app.json                   # App TS config
├── tsconfig.node.json                  # Tooling TS config
├── eslint.config.js                    # ESLint flat config
└── package.json                        # Dependencies & scripts
```

### Naming Conventions

| Entity               | Convention                | Example                          |
| -------------------- | ------------------------- | -------------------------------- |
| Components           | PascalCase                | `AdminSidebar.tsx`               |
| Hooks                | camelCase with `use`      | `useDebounce.ts`                |
| Redux slices         | camelCase with `Slice`    | `authSlice.ts`                  |
| Types/Interfaces     | PascalCase, `I` for iface | `User`, `IApiResponse`          |
| Utils                | camelCase                 | `formatDate.ts`                 |
| CSS files            | kebab-case or match owner | `variables.css`, `AdminLayout.module.css` |
| Constants            | UPPER_SNAKE_CASE          | `MAX_RETRY_COUNT`               |
| Directories          | kebab-case or camelCase   | `auth/`, `dashboard/`           |

---

## 4. Application Bootstrap & Entry Point

The application boots through a layered provider architecture. Each provider wraps the next, establishing context availability top-down. The **layout is resolved by the router** — the user's role determines which layout shell renders, and each layout brings its own sidebar, header, and navigation configuration.

### Bootstrap Flow

```
index.html
  └─ main.tsx
       └─ <StrictMode>
            └─ <Provider store={store}>              ← Redux
                 └─ <RouterProvider>                 ← React Router (data router)
                      ├─ PublicLayout                ← /login, /404 (no auth required)
                      │    └─ <Outlet />
                      │
                      └─ <AuthGuard>                 ← All authenticated routes
                           └─ <LayoutGuard>          ← Resolves layout from user role
                                └─ <ThemeProvider>
                                     └─ <NotificationProvider>
                                          └─ <AnalyticsProvider>
                                               └─ <LayoutProvider>
                                                    ├─ AdminLayout       ← role: admin
                                                    │    └─ <Outlet />
                                                    └─ SupervisorLayout  ← role: supervisor
                                                         └─ <Outlet />
```

### `main.tsx` (target implementation)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { router } from './app/router';
import { initLogger } from './configs/logger.config';
import { initAnalytics } from './configs/analytics.config';
import './styles/index.css';

initLogger();
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
```

### Initialization Order

1. **Logger** — initialized first so all subsequent init steps can log
2. **Analytics** — initialized second to track app startup metrics
3. **Redux Store** — created synchronously, available to all providers
4. **Router** — `createBrowserRouter` with data router API (React Router v7)
5. **Auth Guard** — redirects unauthenticated users to `/login`
6. **Layout Guard** — reads user role, resolves which layout branch to enter
7. **Context Providers** — nested inside each layout branch (theme, notifications, analytics, layout identity)

---

## 5. Routing Architecture

### Library: `react-router-dom`

Using the **data router** API (`createBrowserRouter`) for loader/action colocation and future-ready data fetching patterns.

### Multi-Layout Routing Model

The router is the **single source of truth** for which layout a user sees. Each layout (Admin, Supervisor, Public) owns a disjoint set of URL prefixes. The user's role determines which layout branch they enter, and `LayoutGuard` prevents cross-layout access.

```
┌──────────────────────────────────────────────────────────────┐
│                     createBrowserRouter                       │
│                                                              │
│  ┌─── Public Routes ───────────────────────────────────────┐ │
│  │  /login          → PublicLayout → LoginPage             │ │
│  │  /*              → PublicLayout → NotFoundPage          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─── Admin Routes (/admin/*) ─────────────────────────────┐ │
│  │  AuthGuard + LayoutGuard(role: admin)                   │ │
│  │  └─ AdminLayout                                         │ │
│  │       ├── /admin              → AdminDashboardPage      │ │
│  │       ├── /admin/users        → UsersPage               │ │
│  │       ├── /admin/users/:id    → UserDetailPage          │ │
│  │       ├── /admin/analytics    → AnalyticsPage           │ │
│  │       ├── /admin/audit-log    → AuditLogPage            │ │
│  │       ├── /admin/settings     → SystemSettingsPage      │ │
│  │       ├── /admin/profile      → ProfilePage (shared)    │ │
│  │       └── /admin/help         → HelpPage (shared)       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─── Supervisor Routes (/supervisor/*) ───────────────────┐ │
│  │  AuthGuard + LayoutGuard(role: supervisor)              │ │
│  │  └─ SupervisorLayout                                    │ │
│  │       ├── /supervisor              → SupervisorDashPage │ │
│  │       ├── /supervisor/team         → TeamOverviewPage   │ │
│  │       ├── /supervisor/queues       → QueueMonitorPage   │ │
│  │       ├── /supervisor/performance  → AgentPerfPage      │ │
│  │       ├── /supervisor/settings     → SupervisorSettings │ │
│  │       ├── /supervisor/profile      → ProfilePage        │ │
│  │       └── /supervisor/help         → HelpPage (shared)  │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Root Router (`src/app/router.tsx`)

The root router merges the separate route definition files:

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './routes/publicRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { supervisorRoutes } from './routes/supervisorRoutes';

export const router = createBrowserRouter([
  ...publicRoutes,
  ...adminRoutes,
  ...supervisorRoutes,
]);
```

### Admin Routes (`src/app/routes/adminRoutes.tsx`)

```tsx
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { LayoutGuard } from '../../components/guards/LayoutGuard';
import { AdminLayout } from '../../layouts/AdminLayout/AdminLayout';

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <LayoutGuard allowedRoles={['admin']}>
          <AdminLayout />
        </LayoutGuard>
      </AuthGuard>
    ),
    children: [
      { index: true, lazy: () => import('../../pages/admin/AdminDashboardPage') },
      { path: 'users', lazy: () => import('../../pages/admin/UsersPage') },
      { path: 'users/:userId', lazy: () => import('../../pages/admin/UserDetailPage') },
      { path: 'analytics', lazy: () => import('../../pages/admin/AnalyticsPage') },
      { path: 'audit-log', lazy: () => import('../../pages/admin/AuditLogPage') },
      { path: 'settings', lazy: () => import('../../pages/admin/SystemSettingsPage') },
      { path: 'profile', lazy: () => import('../../pages/shared/ProfilePage') },
      { path: 'help', lazy: () => import('../../pages/shared/HelpPage') },
    ],
  },
];
```

### Supervisor Routes (`src/app/routes/supervisorRoutes.tsx`)

```tsx
import type { RouteObject } from 'react-router-dom';
import { AuthGuard } from '../../components/guards/AuthGuard';
import { LayoutGuard } from '../../components/guards/LayoutGuard';
import { SupervisorLayout } from '../../layouts/SupervisorLayout/SupervisorLayout';

export const supervisorRoutes: RouteObject[] = [
  {
    path: '/supervisor',
    element: (
      <AuthGuard>
        <LayoutGuard allowedRoles={['supervisor']}>
          <SupervisorLayout />
        </LayoutGuard>
      </AuthGuard>
    ),
    children: [
      { index: true, lazy: () => import('../../pages/supervisor/SupervisorDashboardPage') },
      { path: 'team', lazy: () => import('../../pages/supervisor/TeamOverviewPage') },
      { path: 'queues', lazy: () => import('../../pages/supervisor/QueueMonitorPage') },
      { path: 'performance', lazy: () => import('../../pages/supervisor/AgentPerformancePage') },
      { path: 'settings', lazy: () => import('../../pages/supervisor/SupervisorSettingsPage') },
      { path: 'profile', lazy: () => import('../../pages/shared/ProfilePage') },
      { path: 'help', lazy: () => import('../../pages/shared/HelpPage') },
    ],
  },
];
```

### Public Routes (`src/app/routes/publicRoutes.tsx`)

```tsx
import type { RouteObject } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout/PublicLayout';

export const publicRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', lazy: () => import('../../pages/public/LoginPage') },
      { path: '*', lazy: () => import('../../pages/public/NotFoundPage') },
    ],
  },
];
```

### Post-Login Redirect

After successful authentication, the app redirects to the appropriate layout home based on the user's role:

```tsx
function getDefaultRoute(role: UserRole): string {
  const routeMap: Record<UserRole, string> = {
    admin: '/admin',
    supervisor: '/supervisor',
  };
  return routeMap[role] ?? '/login';
}
```

### Layout Shell Comparison

| Aspect               | AdminLayout                              | SupervisorLayout                        | PublicLayout            |
| -------------------- | ---------------------------------------- | --------------------------------------- | ----------------------- |
| **Chrome**           | Sidebar + Header + Footer                | Top navbar + Header                     | Centered card, branding |
| **Sidebar**          | Full nav tree, collapsible, multi-section| None (horizontal top nav instead)       | None                    |
| **Header**           | Search, notifications, user menu         | Role badge, queue alerts, logout        | App logo only           |
| **Footer**           | Version info, links                      | None                                    | None                    |
| **Navigation style** | Vertical sidebar with icon + label       | Horizontal tabs with icon + label       | None                    |
| **Content area**     | `max-width: 1280px`, left-aligned        | `max-width: 1024px`, centered           | `max-width: 480px`      |

### Guard Components

#### `AuthGuard`
Checks authentication status. Redirects to `/login` if the user has no valid session.

#### `LayoutGuard`
Validates that the authenticated user's role is allowed in the current layout branch. If an admin navigates to `/supervisor/*`, they are redirected to `/admin`. Prevents unauthorized layout access without a 403 page.

```tsx
interface LayoutGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

function LayoutGuard({ allowedRoles, children }: LayoutGuardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || !allowedRoles.includes(user.role)) {
    const fallback = getDefaultRoute(user?.role ?? 'admin');
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
```

### Adding a New Layout

To add a new layout (e.g., `AgentLayout`):

1. Create `src/layouts/AgentLayout/` with shell component
2. Create `src/pages/agent/` with page components
3. Create `src/app/routes/agentRoutes.tsx` with route definitions
4. Add `...agentRoutes` to `router.tsx`
5. Add `'agent'` to the `UserRole` type
6. Add navigation config in `navigation.config.ts`
7. Update `getDefaultRoute()` with the new role

### Key Decisions

- **URL prefix per layout** (`/admin/*`, `/supervisor/*`) — makes the active layout explicit in the URL, enables direct linking, and simplifies guard logic
- **Lazy loading** via `lazy()` for all page components to enable automatic code splitting per layout
- **Separate route files** per layout — each layout's routes are isolated, making it easy to add/remove layouts
- **Shared pages** (`pages/shared/`) can be mounted under multiple layout route trees without duplication
- **Nested routes** under each layout shell prevent re-mounts of navigation chrome on route transitions

---

## 6. State Management — Redux Toolkit

### Consolidated Store Directory (`src/store/`)

All Redux Toolkit state management lives in a single `src/store/` directory — store configuration, typed hooks, and every slice together:

```
src/store/
├── index.ts              # Store creation, rootReducer, type exports
├── hooks.ts              # Typed useAppDispatch & useAppSelector
├── auth/
│   ├── authSlice.ts
│   ├── authThunks.ts
│   └── authSelectors.ts
├── dashboard/
│   ├── dashboardSlice.ts
│   └── dashboardSelectors.ts
└── users/
    ├── usersSlice.ts
    ├── usersThunks.ts
    └── usersSelectors.ts
```

### Store Configuration (`src/store/index.ts`)

```tsx
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import dashboardReducer from './dashboard/dashboardSlice';
import usersReducer from './users/usersSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  users: usersReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware(),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks (`src/store/hooks.ts`)

```tsx
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### Slice Design Pattern

Each slice lives in its own sub-folder within `src/store/`:

```
store/<domain>/
├── <domain>Slice.ts       # State shape, reducers, initial state
├── <domain>Thunks.ts      # createAsyncThunk definitions
└── <domain>Selectors.ts   # Memoized selectors (createSelector)
```

### Example: Auth Slice

```tsx
// store/auth/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { login, logout, refreshToken } from './authThunks';
import type { AuthState } from '../../types/auth.types';

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
```

### When to Use Redux vs Context

| Concern                         | Redux Toolkit                | React Context               |
| ------------------------------- | ---------------------------- | --------------------------- |
| Server-fetched domain data      | Yes (slices + thunks)        | No                          |
| Auth session / token            | Yes (authSlice)              | Consumer wrapper only       |
| UI-global state (theme, locale) | No                           | Yes (ThemeContext)           |
| Layout identity & nav state     | No                           | Yes (LayoutContext)          |
| Notifications / toasts          | No                           | Yes (NotificationContext)    |
| Form state                      | No (local component state)   | No                          |

**Principle:** Redux owns _server-state_ and _cross-feature domain data_. Contexts own _UI-concern state_ that doesn't need time-travel debugging or middleware.

---

## 7. React Contexts

### 7.1 ThemeContext

Manages light/dark/system theme preferences.

```tsx
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}
```

- Persists preference to `localStorage`
- Listens to `prefers-color-scheme` media query when set to `system`
- Applies `data-theme` attribute on `<html>` for CSS variable switching

### 7.2 AuthContext

Thin wrapper over Redux auth state, providing convenience methods.

```tsx
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}
```

- Dispatches Redux thunks under the hood
- Provides a simpler API for components that only need auth status
- Exposes `role` for layout guards and conditional UI rendering
- Handles token refresh orchestration
- After login, redirects to the role-appropriate layout home (`/admin`, `/supervisor`, etc.)

### 7.3 LayoutContext

Provides the active layout identity, navigation configuration, and layout-specific settings to all components within a layout branch. Each layout shell (`AdminLayout`, `SupervisorLayout`) wraps its `<Outlet />` with its own `LayoutProvider`.

```tsx
interface LayoutContextValue {
  layoutId: LayoutId;                     // 'admin' | 'supervisor'
  layoutConfig: LayoutConfig;             // Sidebar width, header height, features
  navItems: NavItem[];                    // Navigation items for the active layout
  breadcrumbs: BreadcrumbItem[];          // Current route breadcrumb trail
  sidebarCollapsed: boolean;              // Sidebar state (admin only)
  setSidebarCollapsed: (v: boolean) => void;
}
```

- Each layout shell provides a different `LayoutProvider` value — admin gets the full nav tree, supervisor gets a compact horizontal nav
- Navigation items are defined declaratively in `configs/navigation.config.ts` and filtered by the active layout
- Components like `NavItem`, `NavGroup`, and `Breadcrumbs` consume this context to render layout-appropriate navigation
- Layout-specific feature flags (e.g., admin has sidebar, supervisor has top-nav) are exposed via `layoutConfig`

### 7.4 NotificationContext

Global toast/alert notification system.

```tsx
interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}
```

- Auto-dismiss with configurable duration
- Supports `success`, `error`, `warning`, `info` variants
- Stacks notifications with animation

---

## 8. Custom Hooks

### Core Hooks

| Hook                  | Purpose                                                        | Depends On            |
| --------------------- | -------------------------------------------------------------- | --------------------- |
| `useAuth`             | Consume AuthContext — user, role, login/logout                 | AuthContext            |
| `useTheme`            | Consume ThemeContext                                           | ThemeContext           |
| `useLayout`           | Consume LayoutContext — active layout, nav items, sidebar state | LayoutContext          |
| `useAnalytics`        | Fire analytics events with automatic page + layout context     | AnalyticsService      |
| `useLogger`           | Scoped logger instance per component/module                    | js-logger             |

### Utility Hooks

| Hook                  | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `useDebounce<T>`      | Returns a debounced value after a specified delay              |
| `useLocalStorage<T>`  | Typed read/write to localStorage with SSR safety               |
| `useOnClickOutside`   | Detects clicks outside a ref (for dropdowns, modals)           |
| `usePagination`       | Manages page index, page size, total count, offset calculation |

### Hook Design Principles

1. **Single responsibility** — each hook does one thing
2. **Composition over inheritance** — hooks compose other hooks
3. **Typed generics** — hooks accept type parameters where applicable (`useDebounce<T>`)
4. **No side effects at import time** — effects run inside `useEffect` only
5. **Cleanup** — all subscriptions, listeners, and timers are cleaned up in return functions

### Example: `useLayout`

```tsx
import { useContext } from 'react';
import { LayoutContext } from '../contexts/LayoutContext';

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within a LayoutProvider');
  return ctx;
}

// Usage — component adapts to the active layout
function PageHeader({ title }: { title: string }) {
  const { layoutId, breadcrumbs } = useLayout();
  return (
    <header>
      {layoutId === 'admin' && <Breadcrumbs items={breadcrumbs} />}
      <h1>{title}</h1>
    </header>
  );
}
```

### Example: `useLogger`

```tsx
import { useRef } from 'react';
import Logger from 'js-logger';

export function useLogger(scope: string) {
  const loggerRef = useRef(Logger.get(scope));
  return loggerRef.current;
}

// Usage
function UserDetailPage() {
  const log = useLogger('UserDetailPage');
  log.info('Page mounted');
}
```

---

## 9. Logging — js-logger

### Configuration (`src/configs/logger.config.ts`)

```tsx
import Logger from 'js-logger';

export function initLogger() {
  Logger.useDefaults({
    defaultLevel: import.meta.env.DEV ? Logger.DEBUG : Logger.WARN,
    formatter: (messages, context) => {
      const timestamp = new Date().toISOString();
      const level = context.level.name;
      const scope = context.name || 'App';
      messages.unshift(`[${timestamp}] [${level}] [${scope}]`);
    },
  });
}
```

### Log Levels & Usage Policy

| Level   | When to use                                               | Environment |
| ------- | --------------------------------------------------------- | ----------- |
| `TRACE` | Granular execution flow (loop iterations, state diffs)    | Dev only    |
| `DEBUG` | Development diagnostics (lifecycle events, state changes) | Dev only    |
| `INFO`  | Significant business events (login, data load complete)   | Dev + Prod  |
| `WARN`  | Recoverable issues (retry triggered, fallback used)       | Dev + Prod  |
| `ERROR` | Unrecoverable failures (API 5xx, render crash)            | Dev + Prod  |

### Scoped Loggers

Every module/component gets a named logger via `Logger.get('ScopeName')`. This enables per-module log level overrides:

```tsx
Logger.get('Router').setLevel(Logger.TRACE);
Logger.get('API').setLevel(Logger.DEBUG);
```

### Production Behavior

- Default level: `WARN` (suppresses DEBUG/INFO noise)
- Errors are also forwarded to the analytics service for crash reporting
- No `console.log` calls anywhere in the codebase — all logging goes through `js-logger`

---

## 10. Analytics Service

### Architecture

```
┌──────────────────────────────┐
│        useAnalytics()        │  ← Hook (React integration)
└──────────┬───────────────────┘
           │
┌──────────▼───────────────────┐
│      AnalyticsService        │  ← Singleton service class
│  ┌─────────────────────────┐ │
│  │    Event Queue          │ │  ← Batches events before flush
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │  Provider Interface     │ │  ← Pluggable analytics backends
│  └─────────────────────────┘ │
└──────────┬───────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐
│Internal│  │ Google   │   ← Providers (swap/add without changing app code)
│  API   │  │Analytics │
└────────┘  └──────────┘
```

### Event Types

```tsx
interface AnalyticsEvent {
  name: string;
  category: 'navigation' | 'interaction' | 'system' | 'error';
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
}

interface PageViewEvent {
  path: string;
  title: string;
  referrer?: string;
}
```

### Automatic Tracking

- **Page views** — tracked automatically via router listener (`useLocation` effect)
- **Errors** — tracked automatically via `ErrorBoundary` and logger error handler
- **Performance** — Core Web Vitals collected via `web-vitals` integration

### Manual Tracking

```tsx
const { trackEvent } = useAnalytics();

trackEvent({
  name: 'user_role_changed',
  category: 'interaction',
  properties: { userId: '123', newRole: 'supervisor' },
});
```

### Privacy & Consent

- Analytics are disabled until user consent is obtained
- All events are anonymized (no PII in event properties)
- Users can opt out via settings page
- `Do Not Track` browser header is respected

---

## 11. Type System

### Type Organization Strategy

```
types/
├── index.ts              # Barrel file — re-exports all types
├── common.types.ts       # Generic utility types used everywhere
├── api.types.ts          # API layer contracts
├── auth.types.ts         # Auth domain types (User, Session, Token, Role)
├── layout.types.ts       # Layout, NavItem, LayoutConfig types
├── analytics.types.ts    # Analytics types
└── router.types.ts       # Routing meta types
```

### Layout & Role Types (`layout.types.ts`)

```tsx
type LayoutId = 'admin' | 'supervisor';

type UserRole = 'admin' | 'supervisor';

interface LayoutConfig {
  layoutId: LayoutId;
  label: string;
  homeRoute: string;                       // e.g., '/admin', '/supervisor'
  features: {
    hasSidebar: boolean;
    hasTopNav: boolean;
    hasFooter: boolean;
  };
  contentMaxWidth: string;                 // e.g., '1280px', '1024px'
  sidebarWidth?: string;                   // e.g., '260px' (admin only)
  sidebarCollapsedWidth?: string;          // e.g., '64px'
}

interface NavItem {
  id: string;
  label: string;
  path: string;                            // Relative to layout prefix
  icon: string;                            // Icon name or component key
  badge?: number | string;                 // Notification count, "new", etc.
  children?: NavItem[];                    // Sub-items for collapsible groups
  requiredPermissions?: string[];          // Fine-grained permission check
}

interface BreadcrumbItem {
  label: string;
  path?: string;                           // Omit for current (terminal) item
}

interface LayoutRouteHandle {
  breadcrumb: string | ((params: Record<string, string>) => string);
  title?: string;
}
```

### Auth Types (`auth.types.ts`)

```tsx
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  avatarUrl?: string;
}

interface AuthState {
  user: Nullable<User>;
  token: Nullable<string>;
  status: AsyncStatus;
  error: Nullable<string>;
}

interface LoginCredentials {
  email: string;
  password: string;
}
```

### Core Utility Types (`common.types.ts`)

```tsx
type Nullable<T> = T | null;

type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AsyncState<T> {
  data: Nullable<T>;
  status: AsyncStatus;
  error: Nullable<string>;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

### Type Boundaries

| Boundary    | What types define                              | Where consumed                          |
| ----------- | ---------------------------------------------- | --------------------------------------- |
| API Layer   | Request/response shapes, error formats         | Services, thunks                        |
| Redux State | Slice state shapes, action payloads            | Slices, selectors, components           |
| UI Props    | Component prop interfaces                      | Components, pages                       |
| Context     | Context value interfaces                       | Context providers, consumer hooks       |
| Layout      | LayoutConfig, NavItem, LayoutId, UserRole      | Layouts, guards, navigation, router     |
| Utils       | Function parameter/return types                | Utils, hooks                            |

### Strict Mode Rules

- `strict: true` in `tsconfig.app.json` (to be added)
- No `any` — use `unknown` + type guards instead
- No type assertions (`as`) except at API boundaries with runtime validation
- Discriminated unions preferred over optional fields for variant types

---

## 12. Styling Architecture

### Approach: CSS Modules + CSS Custom Properties

**Chosen strategy:** CSS Modules for component-scoped styles, global CSS custom properties for design tokens.

### Design Token System (`src/styles/variables.css`)

```css
:root {
  /* Color Palette */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-secondary: #8b5cf6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Neutrals */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  --color-border: #e5e7eb;

  /* Spacing Scale (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Typography Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Z-Index Scale */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;

  /* Layout — Admin defaults (overridden per layout via data attribute) */
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 64px;
  --header-height: 64px;
  --topnav-height: 0px;
  --content-max-width: 1280px;
}

/* Layout-specific overrides (applied via data-layout attribute on the shell root) */
[data-layout="admin"] {
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 64px;
  --header-height: 64px;
  --topnav-height: 0px;
  --content-max-width: 1280px;
}

[data-layout="supervisor"] {
  --sidebar-width: 0px;
  --sidebar-collapsed-width: 0px;
  --header-height: 56px;
  --topnav-height: 48px;
  --content-max-width: 1024px;
}
```

### Dark Mode

Dark mode overrides are applied via `[data-theme="dark"]` attribute on `<html>`:

```css
[data-theme="dark"] {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-border: #334155;
  /* ... remaining overrides */
}
```

### UI Components — Singal Design System

All base UI primitives (Button, Input, Modal, Table, Card, Badge, Tooltip, Toast, Spinner, etc.) are provided by `@exotel-npm-dev/singal-design-system`. We do **not** build custom UI atoms.

```tsx
import { Button, Modal, Table } from '@exotel-npm-dev/singal-design-system';

function UsersPage() {
  return (
    <Table data={users} columns={columns} />
  );
}
```

**Conventions:**
- Import components directly from the package — no re-export wrappers unless adding app-specific logic
- Use the design system's built-in theming/token system where possible; extend via CSS custom properties only for layout-specific overrides
- App-specific composed components (e.g., `NavItem`, `Breadcrumbs`, `ErrorBoundary`) live in `src/components/` and may compose Singal DS primitives internally

### Custom Component Styling Convention

For app-specific components (layouts, navigation, guards), use co-located CSS Modules:

```
layouts/AdminLayout/
├── AdminLayout.tsx
└── AdminLayout.module.css    ← Co-located CSS Module
```

```tsx
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  return (
    <div className={styles.shell} data-layout="admin">
      <AdminSidebar />
      <main className={styles.content}><Outlet /></main>
    </div>
  );
}
```

### Style File Responsibilities

| File                              | Scope                                                |
| --------------------------------- | ---------------------------------------------------- |
| `styles/index.css`                | CSS reset, global element defaults                   |
| `styles/variables.css`            | Design tokens + `[data-layout]` overrides per layout |
| `styles/typography.css`           | Font faces, heading/body type scale                  |
| `styles/animations.css`           | Shared `@keyframes` (fade, slide, spin)              |
| `styles/utilities.css`            | Utility classes (`.sr-only`, `.truncate`)            |
| `layouts/*/*.module.css`          | Layout-shell-scoped styles (sidebar, topnav, etc.)   |
| `*.module.css`                    | Component-scoped styles                              |

---

## 13. Utilities

### `src/utils/format.ts`

```tsx
function formatDate(date: Date | string, locale?: string): string;
function formatRelativeTime(date: Date | string): string;
function formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
function formatFileSize(bytes: number): string;
function formatCurrency(amount: number, currency?: string): string;
```

### `src/utils/validation.ts`

```tsx
function isValidEmail(value: string): boolean;
function isValidUrl(value: string): boolean;
function isNonEmpty(value: string): boolean;
function isInRange(value: number, min: number, max: number): boolean;
function createValidator<T>(rules: ValidationRule<T>[]): (data: T) => ValidationResult;
```

### `src/utils/storage.ts`

```tsx
function getItem<T>(key: string, fallback: T): T;
function setItem<T>(key: string, value: T): void;
function removeItem(key: string): void;
function clearAll(): void;
```

### `src/utils/url.ts`

```tsx
function buildUrl(base: string, params: Record<string, string | number>): string;
function parseQueryParams(search: string): Record<string, string>;
function isAbsoluteUrl(url: string): boolean;
```

### `src/utils/retry.ts`

```tsx
async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelay?: number; maxDelay?: number }
): Promise<T>;
```

---

## 14. Pages & Features

### Page Architecture

Each page follows this pattern:

```tsx
// pages/admin/UsersPage.tsx
export function Component() { /* page component */ }
export function loader() { /* data loading */ }
export function ErrorBoundary() { /* page-level error UI */ }
export const handle: LayoutRouteHandle = { breadcrumb: 'Users' };
```

The named `Component` export is required by React Router's `lazy()` convention. The `handle` export provides breadcrumb/title metadata consumed by the layout shell.

### Pages by Layout

#### Public Pages (`pages/public/`)

| Page              | Redux Feature | Key Functionality                          |
| ----------------- | ------------- | ------------------------------------------ |
| `LoginPage`       | `auth`        | Credential form, OAuth, role-based redirect|
| `NotFoundPage`    | — (none)      | 404 with "Go Home" link                   |

#### Admin Pages (`pages/admin/`)

| Page                   | Redux Feature  | Key Functionality                                        |
| ---------------------- | -------------- | -------------------------------------------------------- |
| `AdminDashboardPage`   | `dashboard`    | System KPIs, charts, recent activity, quick actions      |
| `UsersPage`            | `users`        | User table, search, filters, bulk actions, role assignment |
| `UserDetailPage`       | `users`        | User profile, activity log, role & permission management |
| `AnalyticsPage`        | `dashboard`    | System-wide charts, date ranges, export, real-time       |
| `AuditLogPage`         | `dashboard`    | Chronological log of system events, filterable           |
| `SystemSettingsPage`   | — (local)      | Global system config, integrations, API keys             |

#### Supervisor Pages (`pages/supervisor/`)

| Page                         | Redux Feature  | Key Functionality                                      |
| ---------------------------- | -------------- | ------------------------------------------------------ |
| `SupervisorDashboardPage`    | `dashboard`    | Team KPIs, active queues, agent status overview         |
| `TeamOverviewPage`           | `users`        | Agent roster, availability, shift schedule              |
| `QueueMonitorPage`           | `dashboard`    | Live queue depths, SLA status, wait times               |
| `AgentPerformancePage`       | `users`        | Per-agent metrics, scorecards, trend charts             |
| `SupervisorSettingsPage`     | — (local)      | Personal preferences, notification config, display opts |

#### Shared Pages (`pages/shared/`)

| Page            | Redux Feature | Key Functionality                                       |
| --------------- | ------------- | ------------------------------------------------------- |
| `ProfilePage`   | `auth`        | Edit own profile, change password, avatar upload        |
| `HelpPage`      | — (none)      | Documentation links, support contact, FAQ               |

Shared pages are mounted under **both** layout route trees (e.g., `/admin/profile` and `/supervisor/profile` render the same `ProfilePage` component inside their respective layout shells).

### Layout–Feature Matrix

This matrix shows which Redux features are relevant to each layout. Features may be shared but the **pages that consume them differ** by layout.

| Redux Feature  | Admin Layout | Supervisor Layout | Notes                                     |
| -------------- | ------------ | ----------------- | ----------------------------------------- |
| `auth`         | Yes          | Yes               | Login, session, profile (shared)          |
| `dashboard`    | Yes          | Yes               | Different dashboard pages per layout      |
| `users`        | Yes          | Yes               | Admin: full CRUD; Supervisor: read + perf |

### Code Splitting Strategy

- Every page is lazy-loaded via React Router's `lazy` property — **per-layout code splitting** means supervisor bundles never load admin pages and vice versa
- Shared components in `components/` are bundled into the main chunk
- Layout shells are **not** lazy-loaded (they are the entry point for their route tree)
- Large third-party libs (charting, rich text) are dynamically imported within the pages that need them

---

## 15. Configuration Management

### Environment Variables (`src/configs/env.ts`)

```tsx
interface AppEnv {
  MODE: 'development' | 'staging' | 'production';
  API_BASE_URL: string;
  ANALYTICS_KEY: string;
  LOG_LEVEL: string;
  APP_VERSION: string;
}

export const env: AppEnv = {
  MODE: import.meta.env.MODE as AppEnv['MODE'],
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  ANALYTICS_KEY: import.meta.env.VITE_ANALYTICS_KEY ?? '',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL ?? 'warn',
  APP_VERSION: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
};
```

All environment variables are accessed through this single typed module. No direct `import.meta.env` usage in application code.

### `.env` Files

```
.env                  # Default values (committed, no secrets)
.env.local            # Local overrides (gitignored)
.env.development      # Dev-specific
.env.staging          # Staging-specific
.env.production       # Production-specific
```

### Application Constants (`src/configs/constants.ts`)

```tsx
export const APP_NAME = 'Omni Admin';
export const DEFAULT_PAGE_SIZE = 20;
export const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry
export const TOAST_AUTO_DISMISS_MS = 5000;
export const DEBOUNCE_DELAY_MS = 300;
export const API_TIMEOUT_MS = 30_000;
```

---

## 16. API Layer

### Client Architecture (`src/services/api/client.ts`)

```
┌────────────────────┐
│    Component/Hook   │
└────────┬───────────┘
         │ dispatch(thunk)
┌────────▼───────────┐
│   Redux Thunk       │
└────────┬───────────┘
         │ apiClient.get/post/...
┌────────▼───────────┐
│    API Client       │  ← Request/response interceptors
│  ┌───────────────┐  │
│  │ Auth Header   │  │  ← Injects Bearer token
│  │ Error Mapping │  │  ← Normalizes API errors
│  │ Retry Logic   │  │  ← Retries on 5xx/network errors
│  │ Logging       │  │  ← Logs request/response via js-logger
│  └───────────────┘  │
└────────┬───────────┘
         │ fetch()
┌────────▼───────────┐
│   Backend API       │
└────────────────────┘
```

### Key Design Decisions

- **Native `fetch`** as the HTTP client (no axios) — smaller bundle, native AbortController
- **Request interceptors** handle auth token injection and request logging
- **Response interceptors** handle error normalization, token refresh on 401, and response logging
- **Automatic retry** with exponential backoff for 5xx and network errors (max 3 attempts)
- **Timeout** via `AbortController` with configurable duration (default 30s)

### Endpoint Registry (`src/services/api/endpoints.ts`)

```tsx
const BASE = env.API_BASE_URL;

export const endpoints = {
  auth: {
    login: `${BASE}/auth/login`,
    logout: `${BASE}/auth/logout`,
    refresh: `${BASE}/auth/refresh`,
    me: `${BASE}/auth/me`,
  },
  users: {
    list: `${BASE}/users`,
    detail: (id: string) => `${BASE}/users/${id}`,
    create: `${BASE}/users`,
    update: (id: string) => `${BASE}/users/${id}`,
    delete: (id: string) => `${BASE}/users/${id}`,
  },
  analytics: {
    overview: `${BASE}/analytics/overview`,
    events: `${BASE}/analytics/events`,
  },
} as const;
```

---

## 17. Error Handling Strategy

### Error Layers

```
Layer 1: Component Error Boundaries
  ├── Root ErrorBoundary (catches unhandled render errors)
  ├── Page-level ErrorBoundary (per-route, via React Router errorElement)
  └── Feature ErrorBoundary (around critical widgets)

Layer 2: Async Error Handling
  ├── Redux Thunk rejected actions → slice error state → UI display
  ├── API client interceptors → normalized ApiError → thunk rejection
  └── Retry logic → exhaust retries → surface to user

Layer 3: Global Error Capture
  ├── window.onerror → log to logger + analytics
  ├── window.onunhandledrejection → log to logger + analytics
  └── React ErrorBoundary componentDidCatch → log + fallback UI
```

### Error Display Patterns

| Error Type               | UI Treatment                                    |
| ------------------------ | ----------------------------------------------- |
| Page load failure        | Full-page error with retry button               |
| API request failure      | Inline error message with retry                 |
| Form validation          | Field-level error messages                      |
| Auth expired             | Redirect to login with message                  |
| Network offline          | Global banner indicating offline status         |
| Unexpected render crash  | ErrorBoundary fallback with "Go to Dashboard"   |

---

## 18. Performance Strategy

### React Compiler

The React Compiler (`babel-plugin-react-compiler`) is already configured. It provides:
- Automatic memoization of components and hooks
- Eliminates the need for manual `React.memo`, `useMemo`, `useCallback` in most cases
- Reduces re-renders automatically at compile time

### Code Splitting

- **Route-level splitting** via `lazy()` — each page loads on demand
- **Component-level splitting** for heavy widgets (charts, rich text editors)
- **Vendor chunk separation** via Vite's `manualChunks` in `rollupOptions`

### Asset Optimization

- **Images:** Vite handles asset hashing for cache-busting; use `srcset` for responsive images
- **Fonts:** Self-hosted with `font-display: swap` for FOUT prevention
- **SVGs:** Inlined as React components for icons, sprite sheet for large icon sets

### Runtime Performance

- **Virtualized lists** for pages with 100+ rows (users table, audit log)
- **Debounced search inputs** (300ms default via `useDebounce`)
- **Pagination** — server-side pagination for all list endpoints
- **Optimistic updates** for low-latency user feedback on mutations

---

## 19. Testing Strategy

### Testing Pyramid

```
         ╱  E2E Tests  ╲        ← Playwright (critical flows only)
        ╱───────────────╲
       ╱ Integration Tests╲     ← Vitest + Testing Library (feature flows)
      ╱───────────────────╲
     ╱    Unit Tests        ╲   ← Vitest (utils, hooks, reducers, selectors)
    ╱─────────────────────────╲
```

### Tools

| Layer        | Tool                     | Target                              |
| ------------ | ------------------------ | ----------------------------------- |
| Unit         | Vitest                   | Utils, reducers, selectors, hooks   |
| Integration  | Vitest + Testing Library | Component trees, pages with mocks   |
| E2E          | Playwright               | Login flow, CRUD flows, navigation  |

### Test File Collocation

```
store/auth/
├── authSlice.ts
├── authSlice.test.ts        ← Co-located test
├── authThunks.ts
└── authThunks.test.ts
```

---

## 20. Build & Deployment

### Scripts

| Script         | Command                      | Purpose                          |
| -------------- | ---------------------------- | -------------------------------- |
| `dev`          | `vite`                       | Local dev server with HMR        |
| `build`        | `tsc -b && vite build`       | Type-check + production build    |
| `preview`      | `vite preview`               | Preview production build locally |
| `lint`         | `eslint .`                   | Run ESLint checks                |
| `test`         | `vitest`                     | Run unit/integration tests       |
| `test:e2e`     | `playwright test`            | Run end-to-end tests             |
| `type-check`   | `tsc -b --noEmit`            | TypeScript type-checking only    |

### Vite Build Optimization

```tsx
// vite.config.ts (target additions)
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
});
```

### Path Aliases

The `@` alias maps to `src/` for cleaner imports:

```tsx
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
```

Requires corresponding `tsconfig.app.json` paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 21. Dependency Summary

### New Runtime Dependencies

```
@exotel-npm-dev/singal-design-system  # UI component library (Button, Input, Modal, Table, etc.)
@reduxjs/toolkit                      # State management
react-redux                           # React-Redux bindings
react-router-dom                      # Client-side routing
js-logger                             # Structured logging
```

### New Dev Dependencies

```
vitest                    # Test runner
@testing-library/react    # Component testing
@testing-library/jest-dom # DOM matchers
@testing-library/user-event # User interaction simulation
@playwright/test          # E2E testing
```

### Installation Command

```bash
# Runtime
npm install @exotel-npm-dev/singal-design-system @reduxjs/toolkit react-redux react-router-dom js-logger

# Dev
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

---

*This document is a living reference. Update it as architectural decisions evolve.*
