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

Copy `Config.toml.local` to `Config.toml` and fill in DB credentials and role names before running. The full `Config.toml` also requires `ADMIN_ROLE`, transaction service OAuth credentials, and Google Sheets config — see the checked-in local dev `Config.toml` for the complete shape of all required sections.

### Webapp (Legacy CRA)

```bash
cd webapp
yarn install
yarn start         # dev server
yarn build         # production build
yarn test          # run tests (Jest + Testing Library)
yarn test -- --testPathPattern=<file>   # single test file
yarn analyze       # bundle analysis
```

Create `.env` in `webapp/` with: `APP_NAME`, `APP_DOMAIN`, `ASGARDEO_BASE_URL`, `ASGARDEO_CLIENT_ID`, `AUTH_SIGN_IN_REDIRECT_URL`, `AUTH_SIGN_OUT_REDIRECT_URL`, `REACT_APP_BACKEND_BASE_URL`.

ESLint config is inlined in `package.json` (no separate `.eslintrc` file).

### Microapp (Vite)

```bash
cd microapp
npm install
npm run dev        # dev server (port 3000)
npm run build      # production build (tsc -b && vite build)
npm run lint       # eslint
```

Runtime config injected via `window.config`. Required keys: `CLIENT_ID`, `SIGN_IN_REDIRECT_URL`, `SIGN_OUT_REDIRECT_URL`, `ASGARDEO_BASE_URL`, `IS_MICROAPP`, `BACKEND_BASE_URL`.

---

## Architecture

### Backend

- Ballerina 2201.12.7, organized as package `wso2_open_operations/people`
- Five modules:
  - **`authorization`** — `JwtInterceptor` reads the `x-jwt-assertion` header, decodes the JWT, validates group membership, and stores `CustomJwtPayload` in the request context. Roles configured via `Config.toml`: `EMPLOYEE_ROLE` and `ADMIN_ROLE`.
  - **`database`** — MySQL client, all DB queries (`db_queries.bal`), DB functions (`db_functions.bal`), types, enums, and utils.
  - **`gsheet`** — Google Sheets integration for car park booking records.
  - **`transaction`** — Blockchain transaction integration for O2C parking payments.
  - **`qr`** — QR code generation for employees (`qr.bal`, `clients.bal`, `types.bal`).
- Every resource function in `service.bal` extracts `userInfo` from `ctx` and checks role permissions before executing business logic.
- Three privilege levels — `EMPLOYEE_PRIVILEGE`, `LEAD_PRIVILEGE`, and `ADMIN_PRIVILEGE` — are returned to the frontend in `/user-info`.
- Database schema is managed via SQL files in `backend/resources/` (initial creation script + numbered migration files).

### Webapp

**State management:** Redux Toolkit with these slices in `src/slices/`:
- `authSlice` — Asgardeo auth state, roles (`Role.EMPLOYEE | Role.LEAD | Role.ADMIN`), and app mode (`active | maintenance`). The Lead role has permissions between Employee and Admin; exact behavior is driven by backend privilege checks and route guards.
- `userSlice` — logged-in user's employee info fetched from `/user-info`
- `employeeSlice` — employee list, selected employee details
- `employeePersonalInfo` — personal info for selected employee
- `organizationSlice` — org hierarchy data (BUs, teams, sub-teams, etc.). All fetch thunks share a single `state.state` field — any pending thunk sets the entire slice to `loading`.
- `commonSlice` — snackbar/notification queue
- `configSlice` — app config from backend

**Auth flow:** `AuthProvider` (Asgardeo) → `AppAuthProvider` (`src/context/AuthContext.tsx`) → dispatches `loadPrivileges` thunk → roles stored in `authSlice` → `AppHandler` renders routes based on roles. Idle timer triggers auto-logout after 30 minutes.

**API service** (`src/utils/apiService.ts`): Singleton Axios instance with retry-axios (3 retries, 401 triggers token refresh). Uses a per-endpoint `CancelToken` map — any new request to the same URL automatically cancels the previous in-flight request to that URL.

**Routing:** `src/route.ts` defines `RouteObjectWithRole[]` where each route has `allowRoles`. `getActiveRoutesV2()` filters routes by user roles. Views in `src/view/` (employees, me, cases, help, reports).

**Path aliases** (defined in `tsconfig.paths.json`, applied via `config-overrides.js` with react-app-rewired):
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

**UI stack:** MUI v5, Emotion, Tailwind CSS v3, notistack for snackbars, Formik + Yup for forms. Dark/light theme via `src/theme.ts`.

### Microapp

**Purpose:** An embeddable widget that integrates into a host application (via the microapp bridge) rather than operating as a standalone app. It uses `HashRouter` so it can be embedded within another app's URL space.

**Auth:** Does not handle Asgardeo auth directly. Gets the JWT token from the parent React Native host via `src/components/microapp-bridge/` (`window.nativebridge.requestToken()` / `resolveToken()` callback). The `IS_MICROAPP` flag in `window.config` switches between embedded and standalone modes.

**Data fetching:** TanStack React Query (no Redux). `QueryClientProvider` wraps the app in `main.tsx`.

**Routing:** HashRouter with two pages — `HomePage` (self-service dashboard) and `VehicleManagementPage`.

**Path alias:** `@/` → `src/` (configured in `vite.config.ts`).

**UI stack:** MUI v7, Tailwind CSS v4, Motion (Framer Motion) for page transitions.

---

## Role-Based Access

### Backend privilege levels

The backend issues three privilege levels, returned as an array in the `/user-info` response:

| Constant | Value | How it is granted |
|---|---|---|
| `EMPLOYEE_PRIVILEGE` | 987 | Every authenticated user |
| `LEAD_PRIVILEGE` | 993 | Dynamically: `database:isLead(email)` — no static IAM group |
| `ADMIN_PRIVILEGE` | 999 | IAM group membership (`ADMIN_ROLE` in `Config.toml`) |

`LEAD_ROLE` is **not** configured in `Config.toml`; lead status is resolved at request time from the DB.

For employee-list endpoints the backend checks `leadOnly` and `directReports` in the request payload. The two flags operate independently:

- **`leadOnly = true`** (always set by `MyTeamTable`, never by the admin view): the backend scopes the query to employees who are subordinates of the caller. Within that scoped result, the `directReports` filter further narrows the set:
  - `directReports = true` — return only *direct* reports of the caller.
  - `directReports = false` (default) — return *all* subordinates of the caller (direct and indirect).
- **`leadOnly = false`** (admin path only): no caller-scoping is applied; all employees matching the other filters are returned. A lead user never sends this value.

### Frontend roles (`Role` enum in `authSlice`)

`loadPrivileges` thunk maps the privilege array → `Role[]`:

- `Role.EMPLOYEE` — always added
- `Role.LEAD` — added when the privileges array contains `LEAD_PRIVILEGE` (993)
- `Role.ADMIN` — added when the privileges array contains `ADMIN_PRIVILEGE` (999)

A user may hold more than one role simultaneously (e.g., `[EMPLOYEE, LEAD]` or `[EMPLOYEE, LEAD, ADMIN]`).

### Route access matrix

| Route | `allowRoles` | `excludeRoles` | Visible to |
|---|---|---|---|
| `/` (Me) | `ADMIN, EMPLOYEE` | — | Everyone |
| `/employees` (parent) | `ADMIN` | — | Admins |
| `/employees/view` (All) | `ADMIN` | — | Admins |
| `/employees/onboarding` | `ADMIN` | — | Admins |
| `/employees/my-team` *(nested)* | `LEAD` | — | Admin+Lead (nested under Employees sidebar group) |
| `/employees/my-team` *(top-level)* | `LEAD` | `ADMIN` | Lead-only users (shown as top-level sidebar item) |
| `/employees/:employeeId` | `ADMIN, LEAD` | — | Admins and Leads (not in sidebar) |
| `/employees/:employeeId/edit` | `ADMIN` | — | Admins only (not in sidebar) |
| `/reports/active-employees` | `ADMIN` | — | Admins only |
| `/reports/inactive-employees` | `ADMIN` | — | Admins only |

The dual `/employees/my-team` route entries ensure that lead+admin users see **My Team** nested under the **Employees** group, while lead-only users see it as a standalone top-level entry. The `excludeRoles` guard on the top-level entry prevents duplication for admin+lead users.

---

## Coding Standards & Reuse Guidelines

### Webapp (React)

- **Reuse components first** — check `src/component/` before creating a new one; use existing MUI components as the base.
- **API endpoints** — always add new URLs to `AppConfig.serviceUrls` in `src/config/config.ts`; never hard-code URLs in components or thunks.
- **HTTP calls** — always use `APIService.getInstance()`; never import raw axios or fetch.
- **Redux thunks** — follow the existing `createAsyncThunk` pattern: check `isCancel(error)` first, dispatch `enqueueSnackbarMessage` on error, return `rejectWithValue`.
- **Async state** — use the existing `State` enum (`idle | loading | success | failed`) for every async operation in a slice.
- **Types** — add new interfaces/types in the relevant slice file alongside existing ones; use `field: T | null` (not `field?: T`) for nullable fields.
- **Path aliases** — always use `@slices/`, `@component/`, `@utils/`, `@view/`, etc.; never use relative `../../` imports.
- **Styling** — MUI `sx` prop + `useTheme()` for component styles; Tailwind utility classes for layout.
- **Forms** — reuse Formik + Yup; do not introduce other form libraries.

### Backend (Ballerina)

- **Config** — every new `configurable` value must be added to `Config.toml.local` (with an empty/default placeholder) in the same commit.
- **Module structure** — keep resource functions in `service.bal`; put business logic in the appropriate module.
- **Helpers** — reuse existing `authorization` and `database` module functions before writing new ones.
