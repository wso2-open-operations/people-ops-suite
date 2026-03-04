# Leave App

Employee leave management application for WSO2. Supports location-specific leave types for Sri Lanka, France, and Spain.

## Architecture

- **Backend**: Ballerina (port 9090)
- **Frontend**: React 19 + Vite + MUI 7 + Redux Toolkit (port 3000)
- **Database**: MySQL
- **Auth**: WSO2 Asgardeo (SPA OAuth2 + JWT)
- **HR Data**: Fetched from HR Entity GraphQL service (separate repo: `digiops-hr/entity`)

## Local Development Setup

### Prerequisites

- Ballerina 2201.9.x
- Node.js 18+
- MySQL 8+

### Database

```sql
CREATE DATABASE leave_app;
CREATE USER 'leave_app_user'@'localhost' IDENTIFIED BY 'leave_app_pass';
GRANT ALL PRIVILEGES ON leave_app.* TO 'leave_app_user'@'localhost';
FLUSH PRIVILEGES;
```

### Backend

1. Create `backend/Config.toml` (not committed — contains secrets):

```toml
dbHost = "localhost"
dbUser = "leave_app_user"
dbPassword = "leave_app_pass"
dbName = "leave_app"
dbPort = 3306
emailNotificationsEnabled = false

[oauth2Config]
tokenUrl = "https://api.asgardeo.io/t/wso2/oauth2/token"
clientId = "<your-client-id>"
clientSecret = "<your-client-secret>"

[hrisConfig]
serviceUrl = "<hr-entity-graphql-url>"

[calendarServiceConfig]
serviceUrl = "<google-calendar-service-url>"
```

2. Build and run:

```bash
cd backend
bal build
bal run
```

Backend runs on `http://localhost:9090`.

### Frontend

1. Configure `webapp/public/config.js`:

```js
window.config = {
  apiBaseUrl: "http://localhost:9090",
  clientID: "<asgardeo-spa-client-id>",
  baseUrl: "https://api.asgardeo.io/t/wso2",
  signInRedirectURL: "http://localhost:3000",
  signOutRedirectURL: "http://localhost:3000",
  scope: ["openid", "profile", "email", "groups"],
  resourceServerURLs: ["http://localhost:9090"],
};
```

2. Install and run:

```bash
cd webapp
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Leave Types by Location

| Location | Leave Types |
|----------|------------|
| Sri Lanka (& others) | Casual, Maternity, Paternity, Lieu |
| France | Congés Payés (25d, Jun–May), RTT (9d), Sick, Maternity, Paternity, Lieu |
| Spain | Annual (23d), Casual, Sick, Maternity, Paternity, Lieu |

## Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user-info` | Current user info (includes `location`) |
| GET | `/employees/{email}/leave-entitlement` | Leave balance for a given employee |
| POST | `/leaves` | Submit a leave request |
| GET | `/leaves` | Get leave history |
| GET | `/app-configs` | App configuration |

## Project Structure

```
backend/
  service.bal              # HTTP endpoints
  leave_calculation.bal    # Leave entitlement logic
  enum.bal                 # EmployeeLocation enum
  types.bal                # LeavePolicy, LeaveEntitlement, UserInfo
  utils.bal                # Period boundary helpers
  modules/
    database/              # MySQL queries and types
    employee/              # HR Entity GraphQL client
    authorization/         # JWT auth and RBAC
    email/                 # Email notifications
    calendar_events/       # Google Calendar integration

webapp/src/
  types/types.ts           # Enums (LeaveType, EmployeeLocation), interfaces
  services/leaveService.ts # API call functions
  slices/                  # Redux state (user, leave, auth, config)
  view/
    GeneralLeave/          # Leave submission form
      component/
        LeaveSelection.tsx        # Dynamic leave type icons
        LeaveBalanceSummary.tsx    # Balance panel (France/Spain)
        LeaveDateSelection.tsx    # Date pickers
    LeaveHistory/          # Leave history table
    LeadReport/            # Manager report view
    SabbaticalLeave/       # Sabbatical leave flow
```
