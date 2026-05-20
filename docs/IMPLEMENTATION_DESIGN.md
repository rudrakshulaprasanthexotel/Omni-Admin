# Omni-Admin — Implementation Design Document

> **Version:** 2.0.0
> **Date:** 2026-05-20
> **Status:** Draft

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Application Bootstrap & Entry Point](#4-application-bootstrap--entry-point)
5. [Routing Architecture (Unified Routes + Per-Page RoleGuard)](#5-routing-architecture)
6. [State Management — Redux Toolkit](#6-state-management--redux-toolkit)
7. [React Contexts](#7-react-contexts)
8. [Custom Hooks](#8-custom-hooks)
9. [Logging — js-logger](#9-logging--js-logger)
10. [Analytics Service](#10-analytics-service)
11. [Type System](#11-type-system)
12. [Styling Architecture](#12-styling-architecture)
13. [Utilities](#13-utilities)
14. [Pages & Features (Feature-Based)](#14-pages--features)
15. [Configuration Management](#15-configuration-management)
16. [API Layer](#16-api-layer)
17. [Error Handling Strategy](#17-error-handling-strategy)
18. [Performance Strategy](#18-performance-strategy)
19. [Testing Strategy](#19-testing-strategy)
20. [Build & Deployment](#20-build--deployment)
21. [Dependency Summary](#21-dependency-summary)

---

## 1. Project Overview

**Omni-Admin** is a React-based administration panel built on top of the modern Vite 8 + React 19 + TypeScript 6 toolchain with the React Compiler enabled. The application serves **multiple user personas** — each mapped to a reusable UI layout pattern via route configuration:

- **Admin** (uses `SidebarLayout`) — Full-featured administration shell with a collapsible sidebar, system-wide management (users, analytics, audit logs, settings).
- **Supervisor** (uses `TopNavLayout`) — Streamlined operational shell with a horizontal top navigation bar, focused on team oversight, queue monitoring, and agent performance.

Layouts are named by **UI pattern** (sidebar, topnav, public), not by role. New roles can reuse existing layouts without duplication. New layout patterns can be added without modifying existing ones.

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

### Design Principles

The directory structure follows three key architectural decisions:

1. **Layouts are UI shells, not roles** — Layouts are named by their UI pattern (`SidebarLayout`, `TopNavLayout`), not by the role that uses them. The route config maps a role to a layout. If a future "agent" role also needs a sidebar, it simply maps to `SidebarLayout` — zero duplication.

2. **Pages are grouped by feature (domain), not by role** — Features like "dashboard", "users", "queues" are self-contained modules with their own components, pages, hooks, and state. Different roles may see different pages within the same feature, but shared components/hooks live next to them.

3. **`shared/` contains only cross-feature UI primitives** — A file goes in `shared/` only if it's consumed by 3+ features and has no domain knowledge. Feature-specific components stay in their feature folder.

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
│   │
│   ├── app/                            # Application-level wiring
│   │   ├── router.tsx                  # Root router creation
│   │   └── routes.tsx                  # Single unified route definition (all routes)
│   │
│   ├── features/                       # Feature modules — grouped by DOMAIN, not role
│   │   ├── auth/                       # Authentication feature
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── NotFoundPage.tsx
│   │   │   │   └── AccessDeniedPage.tsx
│   │   │   ├── components/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── authSlice.ts           # Feature-colocated Redux slice
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/                  # Dashboard feature
│   │   │   ├── pages/
│   │   │   │   ├── AdminDashboardPage.tsx       # Admin-specific view
│   │   │   │   └── SupervisorDashboardPage.tsx  # Supervisor-specific view
│   │   │   ├── components/
│   │   │   │   ├── KpiCard.tsx
│   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useDashboardMetrics.ts       # Shared data hook
│   │   │   ├── dashboardSlice.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── users/                      # User management feature
│   │   │   ├── pages/
│   │   │   │   ├── UserListPage.tsx            # Admin: full CRUD
│   │   │   │   ├── UserDetailPage.tsx          # Admin: edit user
│   │   │   │   └── TeamOverviewPage.tsx        # Supervisor: read-only + performance
│   │   │   ├── components/
│   │   │   │   ├── UserTable.tsx
│   │   │   │   ├── UserDetailCard.tsx
│   │   │   │   └── UserFilters.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useUsers.ts
│   │   │   ├── usersSlice.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── queues/                     # Queue monitoring feature
│   │   │   ├── pages/
│   │   │   │   └── QueueMonitorPage.tsx        # Supervisor (maybe admin later)
│   │   │   ├── components/
│   │   │   │   ├── QueueStatusCard.tsx
│   │   │   │   └── QueueTable.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useQueueStatus.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── analytics/                  # Analytics feature
│   │   │   ├── pages/
│   │   │   │   ├── AnalyticsPage.tsx           # Admin: system-wide analytics
│   │   │   │   └── AgentPerformancePage.tsx    # Supervisor: per-agent metrics
│   │   │   ├── components/
│   │   │   │   ├── ChartPanel.tsx
│   │   │   │   └── DateRangeSelector.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAnalyticsData.ts         # Shared data hook
│   │   │   └── index.ts
│   │   │
│   │   ├── audit/                      # Audit log feature
│   │   │   ├── pages/
│   │   │   │   └── AuditLogPage.tsx            # Admin only (for now)
│   │   │   └── index.ts
│   │   │
│   │   ├── settings/                   # Settings feature
│   │   │   ├── pages/
│   │   │   │   ├── SystemSettingsPage.tsx       # Admin: global config
│   │   │   │   └── PersonalSettingsPage.tsx     # Both roles: personal prefs
│   │   │   └── index.ts
│   │   │
│   │   ├── profile/                    # Profile feature
│   │   │   ├── pages/
│   │   │   │   └── ProfilePage.tsx             # Both roles
│   │   │   └── index.ts
│   │   │
│   │   └── help/                       # Help feature
│   │       ├── pages/
│   │       │   └── HelpPage.tsx                # Both roles
│   │       └── index.ts
│   │
│   ├── layouts/                        # Layout shells — grouped by UI PATTERN, not role
│   │   ├── SidebarLayout/              # UI pattern: sidebar + header + footer
│   │   │   ├── SidebarLayout.tsx       # Sidebar + Header + Outlet + Footer
│   │   │   ├── SidebarLayout.module.css
│   │   │   ├── Sidebar.tsx             # Full nav tree, collapsible, multi-section
│   │   │   ├── SidebarHeader.tsx       # Search bar, user menu, notifications
│   │   │   └── SidebarFooter.tsx       # Version info, links
│   │   ├── TopNavLayout/              # UI pattern: horizontal nav + header
│   │   │   ├── TopNavLayout.tsx        # Top-nav + Header + Outlet (no sidebar)
│   │   │   ├── TopNavLayout.module.css
│   │   │   ├── TopNav.tsx              # Horizontal nav bar
│   │   │   └── TopNavHeader.tsx        # Minimal header (role badge, logout)
│   │   └── PublicLayout/              # UI pattern: centered card, no chrome
│   │       ├── PublicLayout.tsx        # Centered content, branding only
│   │       └── PublicLayout.module.css
│   │
│   ├── shared/                         # Cross-feature primitives ONLY
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   ├── NavItem.tsx         # Single nav link (icon + label + badge)
│   │   │   │   ├── NavGroup.tsx        # Collapsible nav section
│   │   │   │   └── Breadcrumbs.tsx     # Route-aware breadcrumb trail
│   │   │   ├── feedback/
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── PageSkeleton.tsx
│   │   │   ├── guards/
│   │   │   │   ├── AuthGuard.tsx       # Protected route wrapper
│   │   │   │   └── RoleGuard.tsx       # Role-based access control
│   │   │   └── data-display/
│   │   │       ├── DataTable.tsx        # Generic table wrapper over design system
│   │   │       └── StatCard.tsx         # Generic KPI card
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useOnClickOutside.ts
│   │   │   └── usePagination.ts
│   │   ├── utils/
│   │   │   ├── format.ts               # Date, number, currency formatters
│   │   │   ├── validation.ts           # Form validation helpers
│   │   │   ├── storage.ts              # localStorage/sessionStorage wrappers
│   │   │   └── url.ts                  # URL construction, query param helpers
│   │   └── types/
│   │       └── common.types.ts          # Nullable, AsyncStatus, PaginatedResponse
│   │
│   ├── configs/                        # Runtime & build-time configuration
│   │   ├── env.ts                      # Environment variable access
│   │   ├── constants.ts                # Application-wide constants
│   │   ├── logger.config.ts            # js-logger setup
│   │   ├── analytics.config.ts         # Analytics provider config
│   │   └── navigation.config.ts        # Per-layout sidebar/nav item definitions
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
│   ├── store/                          # Redux store index + truly global slices ONLY
│   │   ├── index.ts                    # Store creation, imports feature slices, type exports
│   │   └── hooks.ts                    # Typed useAppDispatch & useAppSelector
│   │
│   ├── styles/                         # Global styles & design tokens
│   │   ├── index.css                   # Global reset & base styles
│   │   ├── variables.css               # CSS custom properties (design tokens)
│   │   ├── typography.css              # Font faces, heading/body scales
│   │   ├── animations.css              # Shared keyframe animations
│   │   └── utilities.css               # Utility classes (spacing, visibility, etc.)
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

### Key Structural Decisions

#### Why layouts are named by UI pattern

| Old (role-based)     | New (pattern-based)  | Reason                                         |
| -------------------- | -------------------- | ---------------------------------------------- |
| `AdminLayout/`       | `SidebarLayout/`     | The layout **has a sidebar** — that's the UI pattern |
| `SupervisorLayout/`  | `TopNavLayout/`      | The layout **has a top nav** — that's the UI pattern |

If a future "agent" role also needs a sidebar, it maps to `SidebarLayout` — no new layout folder needed.

#### Why pages are grouped by feature

| Concern              | Role-based approach problem                           | Feature-based solution                          |
| -------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| Shared components    | `UserTable` duplicated across `admin/` and `supervisor/` | Lives in `features/users/components/` — one source |
| Shared data hooks    | `useDashboardMetrics` has no natural home              | Lives in `features/dashboard/hooks/`            |
| Moving a page        | If a setting moves from supervisor-only to shared, relocate files | Just add a route — page stays in `features/settings/` |
| Growing `shared/`    | Becomes a dumping ground over time                    | Each feature is self-contained                  |

#### What belongs in `shared/`

**Rule of thumb:** A file goes in `shared/` only if it's consumed by **3+ features** and has **no domain knowledge**.

- `DataTable` used by users, queues, and audit → `shared/components/data-display/`
- `UserTable` used only by the users feature → stays in `features/users/components/`
- `useDebounce` used by many features → `shared/hooks/`
- `useDashboardMetrics` used only by dashboard → stays in `features/dashboard/hooks/`

### Naming Conventions

| Entity               | Convention                | Example                          |
| -------------------- | ------------------------- | -------------------------------- |
| Components           | PascalCase                | `Sidebar.tsx`, `KpiCard.tsx`     |
| Hooks                | camelCase with `use`      | `useDebounce.ts`                |
| Redux slices         | camelCase with `Slice`    | `authSlice.ts`                  |
| Types/Interfaces     | PascalCase, `I` for iface | `User`, `IApiResponse`          |
| Utils                | camelCase                 | `formatDate.ts`                 |
| CSS files            | kebab-case or match owner | `variables.css`, `SidebarLayout.module.css` |
| Constants            | UPPER_SNAKE_CASE          | `MAX_RETRY_COUNT`               |
| Directories          | kebab-case or camelCase   | `auth/`, `dashboard/`, `data-display/` |
| Feature folders      | kebab-case (domain noun)  | `users/`, `queues/`, `analytics/` |

---

## 4. Application Bootstrap & Entry Point

The application boots through a layered provider architecture. Each provider wraps the next, establishing context availability top-down. The **router contains all routes in a single file**. Every authenticated route is individually wrapped with `RoleGuard` to check authorization before rendering.

### Bootstrap Flow

```
index.html
  └─ main.tsx
       └─ <StrictMode>
            └─ <Provider store={store}>              ← Redux
                 └─ <RouterProvider>                 ← React Router (data router)
                      │
                      ├─ PublicLayout                ← /login (no auth required)
                      │    └─ <Outlet />
                      │
                      ├─ <AuthGuard>                 ← All authenticated routes
                      │    └─ SidebarLayout          ← layout shell for sidebar-based pages
                      │         └─ <RoleGuard>       ← per-page role check
                      │              └─ <Outlet />   ← renders page or AccessDenied
                      │
                      └─ <AuthGuard>                 ← All authenticated routes
                           └─ TopNavLayout           ← layout shell for topnav-based pages
                                └─ <RoleGuard>       ← per-page role check
                                     └─ <Outlet />  ← renders page or AccessDenied
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
6. **Layout Shell** — renders the appropriate UI shell (sidebar, topnav, public)
7. **Role Guard** — per-page role check; renders `AccessDeniedPage` if user lacks permission
8. **Context Providers** — nested inside each layout branch (theme, notifications, analytics, layout identity)

---

## 5. Routing Architecture

### Library: `react-router-dom`

Using the **data router** API (`createBrowserRouter`) for loader/action colocation and future-ready data fetching patterns.

### Unified Routing Model

All routes live in a **single routes file** (`src/app/routes.tsx`). There are no separate per-role route files. Every authenticated route is individually wrapped with `RoleGuard` to check authorization before rendering the page. If a user lacks access, they see an "Access Denied" or "Page Not Found" screen — no silent redirects.

```
┌──────────────────────────────────────────────────────────────────┐
│                     createBrowserRouter                            │
│                                                                    │
│  ┌─── Public (no auth) ─────────────────────────────────────────┐ │
│  │  /login          → PublicLayout → LoginPage                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─── Authenticated — SidebarLayout ────────────────────────────┐ │
│  │  AuthGuard → SidebarLayout                                    │ │
│  │       ├── /dashboard            → RoleGuard(['admin'])        │ │
│  │       │                            → AdminDashboardPage       │ │
│  │       ├── /users                → RoleGuard(['admin'])        │ │
│  │       │                            → UserListPage             │ │
│  │       ├── /users/:id            → RoleGuard(['admin'])        │ │
│  │       │                            → UserDetailPage           │ │
│  │       ├── /analytics            → RoleGuard(['admin'])        │ │
│  │       │                            → AnalyticsPage            │ │
│  │       ├── /audit-log            → RoleGuard(['admin'])        │ │
│  │       │                            → AuditLogPage             │ │
│  │       ├── /system-settings      → RoleGuard(['admin'])        │ │
│  │       │                            → SystemSettingsPage       │ │
│  │       ├── /profile              → RoleGuard(['admin','supv']) │ │
│  │       │                            → ProfilePage              │ │
│  │       └── /help                 → RoleGuard(['admin','supv']) │ │
│  │                                    → HelpPage                 │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─── Authenticated — TopNavLayout ─────────────────────────────┐ │
│  │  AuthGuard → TopNavLayout                                     │ │
│  │       ├── /supervisor/dashboard → RoleGuard(['supervisor'])   │ │
│  │       │                            → SupervisorDashboardPage  │ │
│  │       ├── /supervisor/team      → RoleGuard(['supervisor'])   │ │
│  │       │                            → TeamOverviewPage         │ │
│  │       ├── /supervisor/queues    → RoleGuard(['supervisor'])   │ │
│  │       │                            → QueueMonitorPage         │ │
│  │       ├── /supervisor/performance→ RoleGuard(['supervisor'])  │ │
│  │       │                            → AgentPerformancePage     │ │
│  │       └── /supervisor/settings  → RoleGuard(['supervisor'])   │ │
│  │                                    → PersonalSettingsPage     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─── Catch-all ────────────────────────────────────────────────┐ │
│  │  /*              → NotFoundPage                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Root Router (`src/app/router.tsx`)

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';

export const router = createBrowserRouter(routes);
```

### Unified Routes (`src/app/routes.tsx`)

All routes — public, authenticated, and catch-all — defined in a single file:

```tsx
import type { RouteObject } from 'react-router-dom';
import { AuthGuard } from '../shared/components/guards/AuthGuard';
import { RoleGuard } from '../shared/components/guards/RoleGuard';
import { SidebarLayout } from '../layouts/SidebarLayout/SidebarLayout';
import { TopNavLayout } from '../layouts/TopNavLayout/TopNavLayout';
import { PublicLayout } from '../layouts/PublicLayout/PublicLayout';

export const routes: RouteObject[] = [
  // ─── Public (unauthenticated) ───────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', lazy: () => import('../features/auth/pages/LoginPage') },
    ],
  },

  // ─── Authenticated — SidebarLayout ──────────────────────────
  {
    element: (
      <AuthGuard>
        <SidebarLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '/dashboard',
        element: <RoleGuard allowedRoles={['admin']} />,
        children: [
          { index: true, lazy: () => import('../features/dashboard/pages/AdminDashboardPage') },
        ],
      },
      {
        path: '/users',
        element: <RoleGuard allowedRoles={['admin']} />,
        children: [
          { index: true, lazy: () => import('../features/users/pages/UserListPage') },
          { path: ':userId', lazy: () => import('../features/users/pages/UserDetailPage') },
        ],
      },
      {
        path: '/analytics',
        element: <RoleGuard allowedRoles={['admin']} />,
        children: [
          { index: true, lazy: () => import('../features/analytics/pages/AnalyticsPage') },
        ],
      },
      {
        path: '/audit-log',
        element: <RoleGuard allowedRoles={['admin']} />,
        children: [
          { index: true, lazy: () => import('../features/audit/pages/AuditLogPage') },
        ],
      },
      {
        path: '/system-settings',
        element: <RoleGuard allowedRoles={['admin']} />,
        children: [
          { index: true, lazy: () => import('../features/settings/pages/SystemSettingsPage') },
        ],
      },
      {
        path: '/profile',
        element: <RoleGuard allowedRoles={['admin', 'supervisor']} />,
        children: [
          { index: true, lazy: () => import('../features/profile/pages/ProfilePage') },
        ],
      },
      {
        path: '/help',
        element: <RoleGuard allowedRoles={['admin', 'supervisor']} />,
        children: [
          { index: true, lazy: () => import('../features/help/pages/HelpPage') },
        ],
      },
    ],
  },

  // ─── Authenticated — TopNavLayout ───────────────────────────
  {
    path: '/supervisor',
    element: (
      <AuthGuard>
        <TopNavLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: 'dashboard',
        element: <RoleGuard allowedRoles={['supervisor']} />,
        children: [
          { index: true, lazy: () => import('../features/dashboard/pages/SupervisorDashboardPage') },
        ],
      },
      {
        path: 'team',
        element: <RoleGuard allowedRoles={['supervisor']} />,
        children: [
          { index: true, lazy: () => import('../features/users/pages/TeamOverviewPage') },
        ],
      },
      {
        path: 'queues',
        element: <RoleGuard allowedRoles={['supervisor']} />,
        children: [
          { index: true, lazy: () => import('../features/queues/pages/QueueMonitorPage') },
        ],
      },
      {
        path: 'performance',
        element: <RoleGuard allowedRoles={['supervisor']} />,
        children: [
          { index: true, lazy: () => import('../features/analytics/pages/AgentPerformancePage') },
        ],
      },
      {
        path: 'settings',
        element: <RoleGuard allowedRoles={['supervisor']} />,
        children: [
          { index: true, lazy: () => import('../features/settings/pages/PersonalSettingsPage') },
        ],
      },
    ],
  },

  // ─── Catch-all: Not Found ───────────────────────────────────
  {
    path: '*',
    lazy: () => import('../features/auth/pages/NotFoundPage'),
  },
];
```

### Post-Login Redirect

After successful authentication, the app redirects to the appropriate home based on the user's role:

```tsx
function getDefaultRoute(role: UserRole): string {
  const routeMap: Record<UserRole, string> = {
    admin: '/dashboard',
    supervisor: '/supervisor/dashboard',
  };
  return routeMap[role] ?? '/login';
}
```

### Layout Shell Comparison

| Aspect               | SidebarLayout                            | TopNavLayout                            | PublicLayout            |
| -------------------- | ---------------------------------------- | --------------------------------------- | ----------------------- |
| **Chrome**           | Sidebar + Header + Footer                | Top navbar + Header                     | Centered card, branding |
| **Sidebar**          | Full nav tree, collapsible, multi-section| None (horizontal top nav instead)       | None                    |
| **Header**           | Search, notifications, user menu         | Role badge, queue alerts, logout        | App logo only           |
| **Footer**           | Version info, links                      | None                                    | None                    |
| **Navigation style** | Vertical sidebar with icon + label       | Horizontal tabs with icon + label       | None                    |
| **Content area**     | `max-width: 1280px`, left-aligned        | `max-width: 1024px`, centered           | `max-width: 480px`      |
| **Used by roles**    | `admin` (future: `agent`)                | `supervisor`                            | Unauthenticated users   |

### Guard Components

#### `AuthGuard`
Checks authentication status. Redirects to `/login` if the user has no valid session.

#### `RoleGuard`
Wraps **every individual authenticated route**. Checks if the current user's role is in the `allowedRoles` list. If the user is authenticated but lacks the required role, renders an **Access Denied page** (not a redirect). Uses `<Outlet />` to render children when access is granted.

```tsx
interface RoleGuardProps {
  allowedRoles: UserRole[];
}

function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <AccessDeniedPage />;
  }

  return <Outlet />;
}
```

#### `AccessDeniedPage`
Displayed when a user navigates to a route they don't have permission to access. Provides:
- A clear message: "You don't have access to this page"
- A "Go to Home" button that navigates to the user's role-appropriate default route
- Optionally styled to match the current layout shell (since it renders inside the layout)

```tsx
function AccessDeniedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const homeRoute = getDefaultRoute(user?.role ?? 'admin');

  return (
    <div>
      <h1>Access Denied</h1>
      <p>You don't have permission to view this page.</p>
      <Button onClick={() => navigate(homeRoute)}>Go to Home</Button>
    </div>
  );
}
```

#### `NotFoundPage`
Displayed when a user navigates to a URL that doesn't match any defined route (the catch-all `*` route). Provides:
- A clear message: "Page not found"
- A "Go to Home" link

### Authorization Flow

```
User navigates to /audit-log
  │
  ├─ Is user authenticated?
  │    ├─ NO  → Redirect to /login
  │    └─ YES → Continue
  │
  ├─ Does route match a defined path?
  │    ├─ NO  → Render NotFoundPage ("Page not found")
  │    └─ YES → Continue
  │
  └─ Does user's role match allowedRoles for this route?
       ├─ NO  → Render AccessDeniedPage ("You don't have access")
       └─ YES → Render the page component
```

### Adding a New Role

To add a new role (e.g., `agent`) that uses the existing sidebar layout:

1. Add `'agent'` to the `UserRole` type
2. Add new route entries in `routes.tsx` under the appropriate layout section, each wrapped with `RoleGuard`
3. Or expand `allowedRoles` on existing routes (e.g., `['admin', 'agent']` for shared pages)
4. Add navigation config in `navigation.config.ts`
5. Update `getDefaultRoute()` with the new role

**No new layout folder or route file needed** — just add entries to `routes.tsx`.

### Adding a New Layout Pattern

To add a genuinely new UI pattern (e.g., a `DualPaneLayout` with a fixed left pane + scrollable right pane):

1. Create `src/layouts/DualPaneLayout/` with the shell component
2. Add a new layout section in `routes.tsx` using the new layout shell
3. Add route entries under it, each wrapped with `RoleGuard`

### Granting an Existing Page to a New Role

To allow supervisors to also access `/analytics` (currently admin-only):

```tsx
// Before
{ path: '/analytics', element: <RoleGuard allowedRoles={['admin']} /> ... }

// After — just add the role
{ path: '/analytics', element: <RoleGuard allowedRoles={['admin', 'supervisor']} /> ... }
```

No file moves, no route restructuring. If the page needs to appear under the supervisor's layout too, add a parallel route entry under the `TopNavLayout` section.

### Key Decisions

- **Single routes file** — all routes defined in one place for full visibility of the app's URL surface
- **Per-page RoleGuard** — each route individually declares which roles can access it; no blanket role-to-layout-branch mapping
- **Access Denied over redirect** — unauthorized users see a clear "You don't have access" message rather than being silently redirected (avoids confusion)
- **Catch-all Not Found** — any unmatched URL shows "Page not found"
- **Layout shells wrap groups of routes** — determines the UI chrome, independent of authorization
- **Lazy loading** via `lazy()` for all page components to enable automatic code splitting
- **Feature pages** can appear under multiple layout sections without file duplication (same component, different routes)
- **Nested routes** under each layout shell prevent re-mounts of navigation chrome on route transitions

---

## 6. State Management — Redux Toolkit

### Feature-Colocated Slices

Redux slices live **inside their feature folder**, not in a central `store/` directory. The `store/` directory contains only the store configuration (`index.ts`) and typed hooks (`hooks.ts`). It imports and combines feature slices.

```
src/store/                              # Store index + typed hooks ONLY
├── index.ts                            # Store creation, imports feature slices, type exports
└── hooks.ts                            # Typed useAppDispatch & useAppSelector

src/features/auth/
├── authSlice.ts                        # Auth state, reducers, thunks
└── ...

src/features/dashboard/
├── dashboardSlice.ts                   # Dashboard state
└── ...

src/features/users/
├── usersSlice.ts                       # Users state
└── ...
```

### Store Configuration (`src/store/index.ts`)

The store index imports reducers from feature folders:

```tsx
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import usersReducer from '../features/users/usersSlice';

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

Each slice lives **inside its feature folder** alongside components, pages, and hooks:

```
features/<domain>/
├── <domain>Slice.ts       # State shape, reducers, initial state, thunks, selectors
├── pages/                 # Feature pages
├── components/            # Feature components
├── hooks/                 # Feature hooks (may consume the slice)
└── index.ts               # Barrel exports
```

For larger features, thunks and selectors can be split into separate files within the feature folder:

```
features/<domain>/
├── <domain>Slice.ts       # State shape, reducers, initial state
├── <domain>Thunks.ts      # createAsyncThunk definitions
├── <domain>Selectors.ts   # Memoized selectors (createSelector)
└── ...
```

### Example: Auth Slice (`features/auth/authSlice.ts`)

```tsx
import { createSlice } from '@reduxjs/toolkit';
import { login, logout, refreshToken } from './authThunks';
import type { AuthState } from '../../shared/types/common.types';

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

### Why Feature-Colocated Slices?

| Concern                     | Central `store/` directory              | Feature-colocated slices                 |
| --------------------------- | --------------------------------------- | ---------------------------------------- |
| **Discoverability**         | Must navigate away from feature code    | Slice lives next to its consumers        |
| **Encapsulation**           | All features visible globally           | Feature is self-contained                |
| **Adding a feature**        | Touch both `features/` and `store/`     | Only touch `features/` + one import in `store/index.ts` |
| **Removing a feature**      | Delete from two places                  | Delete one folder + one import           |
| **Code ownership**          | Ambiguous ownership of `store/`         | Feature team owns their slice            |

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

Provides the active layout identity, navigation configuration, and layout-specific settings to all components within a layout branch. Each layout shell (`SidebarLayout`, `TopNavLayout`) wraps its `<Outlet />` with its own `LayoutProvider`.

```tsx
interface LayoutContextValue {
  layoutId: LayoutId;                     // 'sidebar' | 'topnav' | 'public'
  layoutConfig: LayoutConfig;             // Sidebar width, header height, features
  navItems: NavItem[];                    // Navigation items for the active layout
  breadcrumbs: BreadcrumbItem[];          // Current route breadcrumb trail
  sidebarCollapsed: boolean;              // Sidebar state (SidebarLayout only)
  setSidebarCollapsed: (v: boolean) => void;
}
```

- Each layout shell provides a different `LayoutProvider` value — `SidebarLayout` gets the full nav tree, `TopNavLayout` gets a compact horizontal nav
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

### Feature Hooks (live in `features/<domain>/hooks/`)

| Hook                    | Location                        | Purpose                                            |
| ----------------------- | ------------------------------- | -------------------------------------------------- |
| `useAuth`               | `features/auth/hooks/`          | Auth context consumer — user, role, login/logout   |
| `useDashboardMetrics`   | `features/dashboard/hooks/`     | Dashboard data fetching (shared by both dashboards)|
| `useUsers`              | `features/users/hooks/`         | User data fetching & mutations                     |
| `useQueueStatus`        | `features/queues/hooks/`        | Live queue status polling                          |
| `useAnalyticsData`      | `features/analytics/hooks/`     | Analytics data fetching (shared by both pages)     |

### Shared Hooks (live in `shared/hooks/`)

| Hook                  | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `useDebounce<T>`      | Returns a debounced value after a specified delay              |
| `useLocalStorage<T>`  | Typed read/write to localStorage with SSR safety               |
| `useOnClickOutside`   | Detects clicks outside a ref (for dropdowns, modals)           |
| `usePagination`       | Manages page index, page size, total count, offset calculation |

### App-Level Hooks (used across many features, but tied to app services)

| Hook                  | Purpose                                                        | Depends On            |
| --------------------- | -------------------------------------------------------------- | --------------------- |
| `useTheme`            | Consume ThemeContext                                           | ThemeContext           |
| `useLayout`           | Consume LayoutContext — active layout, nav items, sidebar state | LayoutContext          |
| `useAnalytics`        | Fire analytics events with automatic page + layout context     | AnalyticsService      |
| `useLogger`           | Scoped logger instance per component/module                    | js-logger             |

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

// Usage — component adapts to the active layout pattern
function PageHeader({ title }: { title: string }) {
  const { layoutId, breadcrumbs } = useLayout();
  return (
    <header>
      {layoutId === 'sidebar' && <Breadcrumbs items={breadcrumbs} />}
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

Shared/cross-cutting types live in `shared/types/`. Feature-specific types live inside their feature folder.

```
shared/types/
├── common.types.ts       # Generic utility types (Nullable, AsyncStatus, PaginatedResponse)
├── api.types.ts          # API layer contracts
├── auth.types.ts         # User, Session, Token, Role types
├── layout.types.ts       # Layout, NavItem, LayoutConfig types
├── analytics.types.ts    # Analytics event types
└── router.types.ts       # Routing meta types

features/dashboard/
├── types.ts              # Dashboard-specific types (KpiData, ChartConfig)
└── ...

features/users/
├── types.ts              # User-feature-specific types (UserFilters, UserFormData)
└── ...
```

### Layout & Role Types (`layout.types.ts`)

```tsx
type LayoutId = 'sidebar' | 'topnav' | 'public';

type UserRole = 'admin' | 'supervisor';

interface LayoutConfig {
  layoutId: LayoutId;
  label: string;
  features: {
    hasSidebar: boolean;
    hasTopNav: boolean;
    hasFooter: boolean;
  };
  contentMaxWidth: string;                 // e.g., '1280px', '1024px'
  sidebarWidth?: string;                   // e.g., '260px' (sidebar layout only)
  sidebarCollapsedWidth?: string;          // e.g., '64px'
}

interface NavItem {
  id: string;
  label: string;
  path: string;                            // Relative to role prefix (e.g., '/admin', '/supervisor')
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
[data-layout="sidebar"] {
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 64px;
  --header-height: 64px;
  --topnav-height: 0px;
  --content-max-width: 1280px;
}

[data-layout="topnav"] {
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
- App-specific composed components (e.g., `NavItem`, `Breadcrumbs`, `ErrorBoundary`) live in `src/shared/components/` and may compose Singal DS primitives internally
- Feature-specific composed components (e.g., `KpiCard`, `UserTable`) live in their feature's `components/` folder

### Custom Component Styling Convention

For app-specific components (layouts, navigation, guards), use co-located CSS Modules:

```
layouts/SidebarLayout/
├── SidebarLayout.tsx
└── SidebarLayout.module.css    ← Co-located CSS Module
```

```tsx
import styles from './SidebarLayout.module.css';

export function SidebarLayout() {
  return (
    <div className={styles.shell} data-layout="sidebar">
      <Sidebar />
      <main className={styles.content}><Outlet /></main>
    </div>
  );
}
```

### Style File Responsibilities

| File                              | Scope                                                          |
| --------------------------------- | -------------------------------------------------------------- |
| `styles/index.css`                | CSS reset, global element defaults                             |
| `styles/variables.css`            | Design tokens + `[data-layout]` overrides per UI pattern       |
| `styles/typography.css`           | Font faces, heading/body type scale                            |
| `styles/animations.css`           | Shared `@keyframes` (fade, slide, spin)                        |
| `styles/utilities.css`            | Utility classes (`.sr-only`, `.truncate`)                      |
| `layouts/*/*.module.css`          | Layout-shell-scoped styles (sidebar, topnav, public)           |
| `features/*/**/*.module.css`      | Feature-component-scoped styles                                |
| `shared/**/*.module.css`          | Shared-component-scoped styles                                 |

---

## 13. Utilities

### `src/shared/utils/format.ts`

```tsx
function formatDate(date: Date | string, locale?: string): string;
function formatRelativeTime(date: Date | string): string;
function formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
function formatFileSize(bytes: number): string;
function formatCurrency(amount: number, currency?: string): string;
```

### `src/shared/utils/validation.ts`

```tsx
function isValidEmail(value: string): boolean;
function isValidUrl(value: string): boolean;
function isNonEmpty(value: string): boolean;
function isInRange(value: number, min: number, max: number): boolean;
function createValidator<T>(rules: ValidationRule<T>[]): (data: T) => ValidationResult;
```

### `src/shared/utils/storage.ts`

```tsx
function getItem<T>(key: string, fallback: T): T;
function setItem<T>(key: string, value: T): void;
function removeItem(key: string): void;
function clearAll(): void;
```

### `src/shared/utils/url.ts`

```tsx
function buildUrl(base: string, params: Record<string, string | number>): string;
function parseQueryParams(search: string): Record<string, string>;
function isAbsoluteUrl(url: string): boolean;
```

### `src/services/api/retry.ts`

```tsx
async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelay?: number; maxDelay?: number }
): Promise<T>;
```

---

## 14. Pages & Features

### Feature Module Architecture

Each feature is a self-contained module with its own pages, components, hooks, and optionally a Redux slice:

```
features/<domain>/
├── pages/                 # Route-level page components
├── components/            # Feature-specific UI components
├── hooks/                 # Feature-specific data/logic hooks
├── <domain>Slice.ts       # Redux slice (if feature has global state)
└── index.ts               # Barrel exports
```

### Page Convention

Each page follows this pattern:

```tsx
// features/users/pages/UserListPage.tsx
export function Component() { /* page component */ }
export function loader() { /* data loading */ }
export function ErrorBoundary() { /* page-level error UI */ }
export const handle: LayoutRouteHandle = { breadcrumb: 'Users' };
```

The named `Component` export is required by React Router's `lazy()` convention. The `handle` export provides breadcrumb/title metadata consumed by the layout shell.

### Features Overview

#### `features/auth/`

| Page                | Key Functionality                                             |
| ------------------- | ------------------------------------------------------------- |
| `LoginPage`         | Credential form, OAuth, role-based redirect                   |
| `NotFoundPage`      | 404 — "Page not found" with "Go to Home" link                 |
| `AccessDeniedPage`  | 403 — "You don't have access to this page" with "Go to Home"  |

Shared assets: `useAuth` hook, `authSlice`, `LoginForm` component.

#### `features/dashboard/`

| Page                         | Mounted At                | Key Functionality                                   |
| ---------------------------- | ------------------------- | --------------------------------------------------- |
| `AdminDashboardPage`         | `/dashboard`              | System KPIs, charts, recent activity, quick actions |
| `SupervisorDashboardPage`    | `/supervisor/dashboard`   | Team KPIs, active queues, agent status overview     |

Shared assets: `KpiCard`, `ActivityFeed`, `QuickActions` components; `useDashboardMetrics` hook; `dashboardSlice`.

#### `features/users/`

| Page                  | Mounted At            | Key Functionality                                         |
| --------------------- | --------------------- | --------------------------------------------------------- |
| `UserListPage`        | `/users`              | User table, search, filters, bulk actions, role assignment|
| `UserDetailPage`      | `/users/:userId`      | User profile, activity log, role & permission management  |
| `TeamOverviewPage`    | `/supervisor/team`    | Agent roster, availability, shift schedule (read-only)    |

Shared assets: `UserTable` (admin uses with edit/delete actions, supervisor uses read-only — same component, different props), `UserDetailCard`, `UserFilters`; `useUsers` hook; `usersSlice`.

#### `features/queues/`

| Page                  | Mounted At              | Key Functionality                         |
| --------------------- | ----------------------- | ----------------------------------------- |
| `QueueMonitorPage`    | `/supervisor/queues`    | Live queue depths, SLA status, wait times |

Shared assets: `QueueStatusCard`, `QueueTable`; `useQueueStatus` hook.

> Adding this page to admin later = just add a route pointing to the same page. No file moves.

#### `features/analytics/`

| Page                       | Mounted At                   | Key Functionality                              |
| -------------------------- | ---------------------------- | ---------------------------------------------- |
| `AnalyticsPage`            | `/analytics`                 | System-wide charts, date ranges, export        |
| `AgentPerformancePage`     | `/supervisor/performance`    | Per-agent metrics, scorecards, trend charts    |

Shared assets: `ChartPanel`, `DateRangeSelector`; `useAnalyticsData` hook.

#### `features/audit/`

| Page              | Mounted At            | Key Functionality                          |
| ----------------- | --------------------- | ------------------------------------------ |
| `AuditLogPage`    | `/audit-log`          | Chronological log of system events, filterable |

#### `features/settings/`

| Page                     | Mounted At                   | Key Functionality                                  |
| ------------------------ | ---------------------------- | -------------------------------------------------- |
| `SystemSettingsPage`     | `/system-settings`           | Global system config, integrations, API keys       |
| `PersonalSettingsPage`   | `/supervisor/settings`       | Personal preferences, notification config          |

#### `features/profile/`

| Page            | Mounted At                  | Key Functionality                                |
| --------------- | --------------------------- | ------------------------------------------------ |
| `ProfilePage`   | `/profile`                  | Edit own profile, change password, avatar upload |

#### `features/help/`

| Page        | Mounted At                | Key Functionality                         |
| ----------- | ------------------------- | ----------------------------------------- |
| `HelpPage`  | `/help`                   | Documentation links, support contact, FAQ |

### Feature–Role Matrix

This matrix shows which features contain pages visible to each role. The `allowedRoles` column shows how authorization is configured per-route in `routes.tsx`.

| Feature        | Page                       | `allowedRoles`              | Layout         |
| -------------- | -------------------------- | --------------------------- | -------------- |
| `auth`         | `LoginPage`                | — (public, no guard)        | PublicLayout   |
| `auth`         | `NotFoundPage`             | — (catch-all, no guard)     | —              |
| `dashboard`    | `AdminDashboardPage`       | `['admin']`                 | SidebarLayout  |
| `dashboard`    | `SupervisorDashboardPage`  | `['supervisor']`            | TopNavLayout   |
| `users`        | `UserListPage`             | `['admin']`                 | SidebarLayout  |
| `users`        | `UserDetailPage`           | `['admin']`                 | SidebarLayout  |
| `users`        | `TeamOverviewPage`         | `['supervisor']`            | TopNavLayout   |
| `queues`       | `QueueMonitorPage`         | `['supervisor']`            | TopNavLayout   |
| `analytics`    | `AnalyticsPage`            | `['admin']`                 | SidebarLayout  |
| `analytics`    | `AgentPerformancePage`     | `['supervisor']`            | TopNavLayout   |
| `audit`        | `AuditLogPage`             | `['admin']`                 | SidebarLayout  |
| `settings`     | `SystemSettingsPage`       | `['admin']`                 | SidebarLayout  |
| `settings`     | `PersonalSettingsPage`     | `['supervisor']`            | TopNavLayout   |
| `profile`      | `ProfilePage`              | `['admin', 'supervisor']`   | SidebarLayout  |
| `help`         | `HelpPage`                 | `['admin', 'supervisor']`   | SidebarLayout  |

### Sharing Components Within a Feature

The key benefit of feature-based grouping: shared components live **next to** the pages that use them.

```tsx
// features/users/pages/UserListPage.tsx (admin view)
import { UserTable } from '../components/UserTable';

export function Component() {
  return <UserTable editable deletable onEdit={handleEdit} />;
}

// features/users/pages/TeamOverviewPage.tsx (supervisor view)
import { UserTable } from '../components/UserTable';

export function Component() {
  return <UserTable editable={false} deletable={false} />;
}
```

Same `UserTable` component, different props — zero code duplication.

### Code Splitting Strategy

- Every page is lazy-loaded via React Router's `lazy` property — **per-role code splitting** means supervisor bundles never load admin-only pages and vice versa
- Shared feature components (e.g., `UserTable`) are bundled with the first page that imports them; subsequent pages share the chunk
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

Tests live next to the code they test, inside the feature folder:

```
features/auth/
├── authSlice.ts
├── authSlice.test.ts        ← Co-located test
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts      ← Co-located test
└── components/
    ├── LoginForm.tsx
    └── LoginForm.test.tsx    ← Co-located test
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
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DataTable } from '@/shared/components/data-display/DataTable';
import { SidebarLayout } from '@/layouts/SidebarLayout/SidebarLayout';
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
