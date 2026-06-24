# Service Portal Backend

Node.js + Express REST API with MongoDB workflow engine for the Service Portal frontend.

## Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://127.0.0.1:27017`

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

API runs at `http://localhost:5000`

## Default Admin Login

- Email: `karthi@mapims.edu.in`
- Password: `admin@mapims.edu.in`
- Staff ID: `60464`

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Forms | `/api/forms` |
| Form Builder | `/api/form-builder` |
| Workflows | `/api/workflows` |
| HRMS | `/api/hrms` |
| Requests | `/api/requests` |
| Approvals | `/api/approvals` |
| Departments | `/api/departments` |
| Dashboard | `/api/dashboard` |
| Search | `/api/search` |
| Upload | `/api/upload` |
| Notifications | `/api/notifications` |
| Audit Logs | `/api/audit-logs` |

## Architecture

```
React UI → REST API → Workflow Engine → MongoDB → HRMS API
```

Form schemas are stored as JSON files under `/forms` with metadata in MongoDB.
Configuration is mirrored from `/config/*.json`.

## HRMS Integration

Connect directly to your HRMS MySQL database (e.g. `staff_profile_tb` in phpMyAdmin):

```env
HRMS_DB_HOST=localhost
HRMS_DB_PORT=3306
HRMS_DB_USER=your_user
HRMS_DB_PASSWORD=your_password
HRMS_DB_NAME=your_database
HRMS_DB_TABLE=staff_profile_tb
```

The API fetches employee data by `staff_id` via `GET /api/hrms/employee/:employeeId` and autofills forms on the frontend.

Optional REST fallback: set `HRMS_API_URL` and `HRMS_API_KEY` if SQL is not configured.
When neither is configured, mock employee data (EMP001–EMP005) is used.

## Frontend

The Vite dev server proxies `/api` to port 5000. Start both:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
npm run dev
```
