# Skills & Knowledge Reference — Leave App

Quick reference for common tasks, gotchas, and patterns learned during development.

## Ballerina

### Build & Run
```bash
cd backend
bal build                    # Compile → target/bin/leave_service.jar
bal run                      # Build + run (use from backend/ dir)
```
- `bal run` must be executed from the directory containing `Ballerina.toml`.
- Config is loaded from `Config.toml` in the same directory.

### Common Patterns
- **Enum with string values**: `enum EmployeeLocation { LK = "Sri Lanka", FR = "France" }`
- **Optional fields**: `string? location` — check with `is ()` for null.
- **Match on enum**: `match employee.location { LK => ... FR => ... _ => ... }`
- **Elvis operator**: `empInfo.continuousServiceDate ?: empInfo.startDate`
- **HTTP resource**: `resource function get user\-info(...)` — hyphens need backslash escape.
- **CORS**: Configure in `http:ServiceConfig` annotation with `cors: { allowOrigins: [...] }`.

### Gotchas
- **SSL_REQUIRED vs SSL_PREFERRED**: Local MySQL without SSL needs `SSL_PREFERRED` in `database/client.bal`. Production uses `SSL_REQUIRED`.
- **Unused variables**: Ballerina compiler errors on unused variables — remove or prefix with `_`.
- **Cache declared but unused**: `hrisEmployeeCache` in `employee.bal` is declared but never called — no get/put. Employee data comes fresh from GraphQL each time.

## React / Frontend

### State Timing Issue
`useState(initialValue)` only captures the value at first render. If the value comes from an async source (like Redux state loaded via API), it will be `null` initially.

**Fix**: Add a `useEffect` to update state when the async value arrives:
```tsx
const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>(
  getDefaultLeaveType(userLocation),  // null on first render
);

// Update when location loads
useEffect(() => {
  setSelectedLeaveType(getDefaultLeaveType(userLocation));
}, [userLocation]);
```

### Dynamic Rendering by Location
Use a `Record<string, T[]>` map keyed by `EmployeeLocation` enum values:
```tsx
const LOCATION_LEAVE_TYPES: Record<string, LeaveTypeOption[]> = {
  [EmployeeLocation.LK]: [...],
  [EmployeeLocation.FR]: [...],
  [EmployeeLocation.ES]: [...],
};
// Lookup with fallback
const types = LOCATION_LEAVE_TYPES[location ?? EmployeeLocation.LK];
```

### CSS Grid vs Flex Wrap
For icon grids, prefer CSS Grid over `flexWrap="wrap"`:
```tsx
<Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(4.5rem, 1fr))" gap="0.75rem">
```
- Flex wrap with unconstrained children causes layout overflow.
- Don't set `width={1}` (100%) on grid children — let the grid handle sizing.

## Auth (Asgardeo)

- Frontend sends `Authorization: Bearer <token>`.
- Backend originally expected `x-jwt-assertion` header — added fallback to read `Authorization` header too.
- Client ID must match the Asgardeo SPA application.
- `signInRedirectURL` port must match the dev server port (3000).

## HR Entity Integration

- Location is stored as a **full country name string** in the PEOPLE_HR table (`"France"`, `"Sri Lanka"`, `"Spain"`).
- Not ISO codes — the `CountryCode` enum in HR Entity is only used for the holidays API.
- `TIMEZONE_OFFSET_MAP` in `constants.bal` also uses full country name keys — confirms the format.

## Git Workflow

- **origin**: `chanukaranaba/people-ops-suite` (fork)
- **upstream**: `wso2-open-operations/people-ops-suite` (main repo)
- Feature branches from `main`, PR to upstream.
- Don't commit: `Config.toml`, `config.js`, `webapp/dist/`, `setup_db.sql`, local SSL/auth workarounds.

```bash
git fetch upstream
git stash
git pull upstream main --rebase
git stash pop
# resolve conflicts if any
git checkout -b feat/my-feature
git add <files>
git commit -m "feat(leave-app): description"
git push origin feat/my-feature
```

## MySQL

- Local setup: `leave_app` database, `leave_app_user` / `leave_app_pass`.
- If InnoDB corruption occurs: `brew services stop mysql`, reinitialize data dir, restart.
- Leave tables auto-created by Ballerina DB module on startup.

## Leave Period Rules

| Location | Leave Type | Period |
|----------|-----------|--------|
| France | Congés Payés | Jun 1 – May 31 |
| France | RTT | Jan 1 – Dec 31 |
| France | Sick | Jan 1 – Dec 31 |
| Spain | All types | Jan 1 – Dec 31 |
| Sri Lanka | All types | Jan 1 – Dec 31 |
