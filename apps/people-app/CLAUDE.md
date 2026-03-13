# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`people-app` is an HR/People Operations application with three distinct sub-projects:

- **`backend/`** — Ballerina HTTP service (port 9090) for employee data management
- **`webapp/`** — Legacy React SPA (Create React App + react-app-rewired) — the primary admin UI
- **`microapp/`** — Modern embeddable React widget (Vite + React 19) for employee self-service features

---

## Commands

### Backend (Ballerina)

```bash
cd backend
bal build          # compile
bal run            # run service (port 9090)
```

Copy `Config.toml.local` to `Config.toml` and fill in DB credentials and role names before running.

### Webapp (Legacy CRA)

```bash
cd webapp
yarn install
yarn start         # dev server
yarn build         # production build
yarn test          # run tests
yarn test -- --testPathPattern=<file>   # single test file
yarn analyze       # bundle analysis
```

Create `.env` in `webapp/` with: `APP_NAME`, `APP_DOMAIN`, `ASGARDEO_BASE_URL`, `ASGARDEO_CLIENT_ID`, `AUTH_SIGN_IN_REDIRECT_URL`, `AUTH_SIGN_OUT_REDIRECT_URL`, `REACT_APP_BACKEND_BASE_URL`.

### Microapp (Vite)

```bash
cd microapp
npm install
npm run dev        # dev server (port 3000)
npm run build      # production build (tsc -b && vite build)
npm run lint       # eslint
```

Runtime config injected via `window.config` (same pattern as webapp).

---

## Architecture

### Backend

- Ballerina 2201.12.7, organized as package `wso2_open_operations/people`
- Two modules:
  - **`authorization`** — `JwtInterceptor` reads the `x-jwt-assertion` header, decodes the JWT, validates group membership, and stores `CustomJwtPayload` in the request context. Roles configured via `Config.toml`: `EMPLOYEE_ROLE`, `LEAD_ROLE`, and `ADMIN_ROLE`.
  - **`database`** — MySQL client, all DB queries (`db_queries.bal`), DB functions (`db_functions.bal`), types, enums, and utils.
- Every resource function in `service.bal` extracts `userInfo` from `ctx` and checks role permissions before executing business logic.
- Three privilege levels — `EMPLOYEE_PRIVILEGE`, `LEAD_PRIVILEGE`, and `ADMIN_PRIVILEGE` — are returned to the frontend in `/user-info`. The numeric IDs for these privileges are defined in the backend and should be treated as opaque by the frontend.

### Webapp

**State management:** Redux Toolkit with these slices in `src/slices/`:
- `authSlice` — Asgardeo auth state, roles (`Role.EMPLOYEE | Role.LEAD | Role.ADMIN`), and app mode (`active | maintenance`). The Lead role has permissions between Employee and Admin; exact behavior is driven by backend privilege checks and route guards.
- `userSlice` — logged-in user's employee info fetched from `/user-info`
- `employeeSlice` — employee list, selected employee details
- `employeePersonalInfo` — personal info for selected employee
- `organizationSlice` — org hierarchy data (BUs, teams, sub-teams, etc.)
- `commonSlice` — snackbar/notification queue
- `configSlice` — app config from backend

**Auth flow:** `AuthProvider` (Asgardeo) → `AppAuthProvider` (`src/context/AuthContext.tsx`) → dispatches `loadPrivileges` thunk → roles stored in `authSlice` → `AppHandler` renders routes based on roles.

**Routing:** `src/route.ts` defines `RouteObjectWithRole[]` where each route has `allowRoles`. `getActiveRoutesV2()` filters routes by user roles. Views in `src/view/` (employees, me, cases, help).

**Path aliases** (defined in `tsconfig.paths.json`):
- `@src/*` → `src/`
- `@app/*` → `src/app/`
- `@component/*` → `src/component/`
- `@config/*` → `src/config/`
- `@context/*` → `src/context/`
- `@layout/*` → `src/layout/`
- `@slices/*` → `src/slices/`
- `@view/*` → `src/view/`
- `@utils/*` → `src/utils/`

**Runtime config:** All env vars are injected via `window.config` (not `process.env` at build time for the deployed app). `src/config/config.ts` reads from `window.config` with fallback to empty strings.

**UI stack:** MUI v5, Emotion, Tailwind CSS v3, notistack for snackbars, Formik + Yup for forms.

### Microapp

**Purpose:** An embeddable widget that integrates into a host application (via the microapp bridge) rather than operating as a standalone app. It uses `HashRouter` so it can be embedded within another app's URL space.

**Auth:** Does not handle Asgardeo auth directly. Gets the JWT token from the parent host via `src/components/microapp-bridge/`. The `IS_MICROAPP` flag in `window.config` switches between embedded and standalone modes.

**Data fetching:** TanStack React Query (no Redux). `QueryClientProvider` wraps the app in `main.tsx`.

**Routing:** HashRouter with two pages — `HomePage` (self-service dashboard) and `VehicleManagementPage`.

**Path alias:** `@/` → `src/` (configured in `vite.config.ts`).

**UI stack:** MUI v7, Tailwind CSS v4, Motion (Framer Motion) for page transitions.

---

## Role-Based Access

The backend enforces two roles configured in `Config.toml`:
- **EMPLOYEE_ROLE** — Can view/edit own employee record and personal info only
- **ADMIN_ROLE** — Full access: view all employees, create/update any employee, access managers list, etc.

Frontend routes use `allowRoles: [Role.ADMIN]` or `[Role.ADMIN, Role.EMPLOYEE]`. Admin-only routes include the employees list, onboarding, and employee edit views.
