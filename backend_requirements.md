# Backend API Requirements

**Target Stack:** Python (FastAPI), MongoDB
**Frontend Codebase:** React (TypeScript)

## 1. Overview
The goal is to replace the current client-side mock implementation (`src/services/api.ts` and `src/lib/mockData.ts`) with a real RESTful API. The backend should expose endpoints to manage Tasks, Roadmap Phases, Feature Statuses, and Dashboard analytics.

## 2. Data Models (MongoDB Collections)

### 2.1. Tasks Collection
**Collection Name:** `tasks`

| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Map to `id` in JSON response (string) |
| `name` | String | Yes | |
| `assignee` | String | Yes | |
| `status` | String | Yes | Enum: `'In Progress'`, `'In Review'`, `'Blocked'`, `'Done'` |
| `dueDate` | String/Date | Yes | ISO 8601 Date string preferred |
| `priority` | String | No | Enum: `'High'`, `'Medium'`, `'Low'` |

### 2.2. Roadmap Collection
**Collection Name:** `roadmap_phases`

| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Map to `id` in JSON response (string) |
| `phase` | String | Yes | e.g., "Phase 1" |
| `date` | String | Yes | e.g., "Q3 2024" or specific date |
| `title` | String | Yes | |
| `description` | String | Yes | |
| `status` | String | Yes | Enum: `'completed'`, `'current'`, `'upcoming'` |
| `health` | String | No | Enum: `'on-track'`, `'at-risk'`, `'delayed'` |
| `deliverables` | Array | Yes | List of objects (see below) |

**Deliverable Object Scheme:**
```json
{
  "text": "string",
  "status": "done" | "pending" | "in-progress"
}
```

### 2.3. Features Collection
**Collection Name:** `features`

| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Map to `id` in JSON response (string) |
| `name` | String | Yes | |
| `status` | String | Yes | Enum: `'operational'`, `'degraded'`, `'critical'` |
| `publicNote` | String | Yes | |
| `linkedTicket` | String | No | Nullable |

## 3. API Endpoints

### 3.1. Tasks API
- **GET /tasks**
  - Returns a list of all tasks.
- **PATCH /tasks/{id}**
  - Updates a task (e.g., status change).
  - Body: `Partial<Task>`

### 3.2. Roadmap API
- **GET /roadmap**
  - Returns all roadmap phases.
- **POST /roadmap**
  - Creates a new roadmap phase.
- **PATCH /roadmap/{id}**
  - Updates a phase.
  - Body: `Partial<RoadmapPhase>`
  - *Note:* To implement `toggleDeliverable` from the frontend, the client can utilize this endpoint by sending the updated `deliverables` array.
- **DELETE /roadmap/{id}**
  - Deletes a phase.

### 3.3. Features API
- **GET /features**
  - Returns all features.
- **POST /features**
  - Creates a new feature.
- **PATCH /features/{id}**
  - Updates a feature status or details.
  - Body: `Partial<FeatureStatus>`
- **DELETE /features/{id}**
  - Deletes a feature.

## 4. Dashboard & Analytics API

### 4.1. KPI Stats API
**Collection Name:** `dashboard_stats` (Single document or calculated on fly)

- **GET /dashboard/kpi**
  - Returns the 3 key metrics: Overall Completion, Current Sprint info, and Velocity trends.
  - **Response Structure:** `KPI[]`

### 4.2. Pipeline Items API
**Collection Name:** `pipeline_items`

| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Map to `id` |
| `title` | String | Yes | |
| `type` | String | Yes | Enum: `'Incoming'`, `'Wishlist'` |
| `priority` | String | No | Enum: `'High'`, `'Medium'`, `'Low'` (for Incoming) |
| `estEffort` | String | No | (for Incoming) e.g., "5 Days" |
| `requester`  | String | No | (for Wishlist) |
| `dateAdded` | String | No | (for Wishlist) |

- **GET /pipeline**
  - Returns list of pipeline items.
- **POST /pipeline**
  - Add new item.
- **PATCH /pipeline/{id}**
  - Update item (e.g., move from Wishlist to Incoming).
- **DELETE /pipeline/{id}**

### 4.3. Charts API
**Collection Name:** `chart_data` (or calculated from tasks)

- **GET /dashboard/charts/burnup**
  - Returns `ChartDataPoint[]` for the Burn-up chart.
- **GET /dashboard/charts/velocity**
  - Returns `ChartDataPoint[]` for the Velocity chart.

### 5. Authentication & Authorization (Custom MongoDB + JWT)

### 5.1. Overview
We will replace Clerk with a custom **in-house authentication system** using MongoDB, bcrypt (password hashing), and JWTs (stored in HTTP-only cookies).

### 5.2. Auth Integration
- **Frontend**: Submits Email/Password to `/api/auth/login`.
- **Backend**: 
  - Validates credentials from `users` collection.
  - Issues a generic `auth-token` HTTP-only cookie.
  - Middleware validates this cookie for protected routes.

### 5.3. Role-Based Access Control (RBAC)
- **Roles:** Stored directly on the MongoDB User document.
- **Rules:**
  - **Manager**: Full access (Manage Users, All Data).
  - **Developer**: Can view all, update Tasks/Phases. Cannot manage users.
  - **Leadership**: Read-only access.


### 6.2. User Management API
*Managed entirely within the internal `users` collection.*

- **GET /users**
  - **Access:** Manager Only.
  - **Behavior:** Returns list of all registered users.
  - **Response:** List of user objects:
    ```json
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "manager" | "developer" | "leadership"
    }
    ```

- **POST /users**
  - **Access:** Manager Only.
  - **Body:** 
    ```json
    { 
      "name": "John Doe",
      "email": "john@example.com", 
      "role": "manager", 
      "password": "tempPassword123" 
    }
    ```
  - **Behavior:** Hashes password with `bcrypt` and saves to MongoDB.

- **DELETE /users/{id}**
  - **Access:** Manager Only.
  - **Behavior:** Deletes user from MongoDB.
  - **Constraint:** Cannot delete self.

## 7. Implementation Guidelines (FastAPI)

1.  **Auth Library**: Use `jose` for JWT generation/verification and `bcryptjs` for password hashing.
2.  **Cookies**: Use `next/headers` to set HTTP-only cookies securely.
3.  **Pydantic Models**: Create Pydantic models that validate the enums strictly (e.g., `TaskStatus` enum).
4.  **ODM**: Use **Beanie** or **Motor** for async MongoDB interactions. 
5.  **CORS**: Enable CORS (`CORSMiddleware`) to allow requests from the React frontend (usually `http://localhost:3000`).
6.  **Response Format**: Ensure `_id` from MongoDB is converted to `id` (string) in the JSON response to match the frontend interfaces.
7.  **Calculated vs Stored**: For KPIs and Charts, decide if these should be stored as static documents (easier for MVP) or calculated dynamically from the `tasks` collection (better for real-world usage). For this migration, serving the static structures initially is acceptable.

## 8. Seed Data
Use the data currently in `src/lib/mockData.ts` to seed the initial MongoDB database. This includes:
- Tasks
- Roadmap Phases
- Feature Statuses
- KPI Data
- Pipeline Items
- Burn-up Data
- Velocity Data
