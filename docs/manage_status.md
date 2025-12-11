# Backend Requirements Update: Status & Reporting Hub

**Target**: Enhance the existing backend to support Incident Reporting, 30-Day Status History, Strict User Attribution, and **Activity Tracking for All Roles**.

---

## 1. New Collection: `IncidentReports`
**Purpose**: Track issues reported by users (public or internal).

### Schema
```json
{
  "_id": "ObjectId",
  "featureId": "ObjectId (Ref: Features)", 
  "reporter": {
      "id": "ObjectId (Nullable - if public)",
      "name": "String (Required)",
      "email": "String (Optional)"
  },
  "impactLevel": "String ('low', 'medium', 'high')",
  "description": "String",
  "status": "String ('pending', 'acknowledged', 'addressed')",
  "createdAt": "Date",
  "resolvedAt": "Date (Nullable)",
  "adminNotes": [
    {
      "authorId": "ObjectId (Ref: Users)",
      "authorName": "String",
      "note": "String",
      "createdAt": "Date"
    }
  ]
}
```

### Endpoints
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/reports` | Any | Create report (extract user from token if auth) |
| GET | `/api/reports` | Manager | List (filter: `?status=pending,acknowledged`) |
| PATCH | `/api/reports/:id/status` | Manager | Update status |
| POST | `/api/reports/:id/notes` | Manager | Add note |
| DELETE | `/api/reports/:id` | Manager | Delete spam |

---

## 2. Enhanced Collection: `Features`
**Purpose**: 30-day history + audit trails.

### Schema Updates
```json
{
  "history": [{ "date": "YYYY-MM-DD", "status": "String" }],
  "lastUpdatedBy": {
    "userId": "ObjectId",
    "userName": "String",
    "updatedAt": "Date"
  }
}
```

### Logic for `PATCH /api/features/:id`
1. Extract user from token → update `lastUpdatedBy`
2. Upsert today's history entry (overwrite if exists, push if new day)
3. Retain max 60 entries

---

## 3. NEW: `ActivityLog` Collection
**Purpose**: Track ALL user activities for auditing and manager review.

### Schema
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (Ref: Users)",
  "userName": "String",
  "userRole": "String ('manager'|'developer'|'leadership')",
  "action": "String (See Action Types below)",
  "targetType": "String ('feature'|'report'|'roadmap'|'user'|'task')",
  "targetId": "ObjectId (Nullable)",
  "targetName": "String (Human-readable, e.g., 'Payment Gateway')",
  "details": "Object (Optional - additional context)",
  "timestamp": "Date"
}
```

### Action Types (Enum)
| Action Code | Description | Example |
|-------------|-------------|---------|
| `FEATURE_STATUS_UPDATE` | Changed feature status | "Payment Gateway → Critical" |
| `REPORT_CREATED` | User submitted a report | - |
| `REPORT_ACKNOWLEDGED` | Manager ack'd a report | - |
| `REPORT_ADDRESSED` | Manager closed a report | - |
| `REPORT_NOTE_ADDED` | Manager added note | - |
| `ROADMAP_PHASE_UPDATE` | Modified roadmap phase | - |
| `ROADMAP_DELIVERABLE_TOGGLE` | Toggled deliverable | - |
| `USER_CREATED` | Manager added new user | - |
| `USER_DELETED` | Manager removed user | - |
| `TASK_STATUS_UPDATE` | Task status changed | - |
| `LOGIN` | User logged in | - |
| `LOGOUT` | User logged out | - |

### Endpoints
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/activities` | Manager | List all (paginate, filter by `?userId=`, `?action=`) |
| GET | `/api/activities/user/:userId` | Manager | Get activities for specific user |
| GET | `/api/activities/me` | Authenticated | User's own activity history |

### Backend Integration Points
**Every state-changing endpoint must log an activity:**
- `PATCH /api/features/:id` → Log `FEATURE_STATUS_UPDATE`
- `POST /api/reports` → Log `REPORT_CREATED`
- `PATCH /api/reports/:id/status` → Log `REPORT_ACKNOWLEDGED` or `REPORT_ADDRESSED`
- `POST /api/reports/:id/notes` → Log `REPORT_NOTE_ADDED`
- `PATCH /api/roadmap/:id` → Log `ROADMAP_PHASE_UPDATE`
- `POST /api/users` → Log `USER_CREATED`
- `DELETE /api/users/:id` → Log `USER_DELETED`
- `POST /auth/login` → Log `LOGIN`
- `POST /auth/logout` → Log `LOGOUT`

---

## 4. User & Auth Logic
- `POST /auth/login` and `GET /auth/me` MUST return `{ id, name, email, role }`
- Backend extracts user from token for all "author" fields (never trust request body)

---

## 5. Sample Data & Requirements

### Features (5 minimum)
| Name | Status | History | lastUpdatedBy |
|------|--------|---------|---------------|
| API Gateway | operational | 30 days all green | Manager A |
| Payment Processor | critical | Mixed (25 op, 3 deg, 2 crit) | Manager B |
| Notification Service | degraded | Recent issue | Manager A |
| Database Cluster | operational | Stable | - |
| Frontend CDN | operational | Stable | - |

### Reports (8 minimum)
- 3 pending (High, Med, Low impact)
- 5 addressed (historical)
- Include at least 2 with admin notes

### Activity Logs (15+ entries)
**Critical for testing the Activity Feed UI:**
```json
[
  { "userId": "mgr1", "userName": "Alice Manager", "userRole": "manager", "action": "LOGIN", "timestamp": "2024-12-11T09:00:00Z" },
  { "userId": "dev1", "userName": "Bob Developer", "userRole": "developer", "action": "LOGIN", "timestamp": "2024-12-11T09:05:00Z" },
  { "userId": "mgr1", "userName": "Alice Manager", "userRole": "manager", "action": "FEATURE_STATUS_UPDATE", "targetType": "feature", "targetName": "Payment Processor", "details": { "oldStatus": "operational", "newStatus": "critical" }, "timestamp": "2024-12-11T10:00:00Z" },
  { "userId": "dev1", "userName": "Bob Developer", "userRole": "developer", "action": "ROADMAP_DELIVERABLE_TOGGLE", "targetType": "roadmap", "targetName": "Sprint 3 - API Integration", "timestamp": "2024-12-11T11:00:00Z" },
  { "userId": "lead1", "userName": "Carol Lead", "userRole": "leadership", "action": "LOGIN", "timestamp": "2024-12-11T11:30:00Z" },
  { "userId": "mgr1", "userName": "Alice Manager", "userRole": "manager", "action": "REPORT_ACKNOWLEDGED", "targetType": "report", "targetName": "Payment failing with 500", "timestamp": "2024-12-11T12:00:00Z" },
  { "userId": "mgr1", "userName": "Alice Manager", "userRole": "manager", "action": "USER_CREATED", "targetType": "user", "targetName": "Dan Developer", "timestamp": "2024-12-11T14:00:00Z" }
]
```
