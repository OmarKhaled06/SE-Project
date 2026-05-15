# CampusCare API Documentation

Base URL: `http://localhost:4000`
All API routes are prefixed with `/api`. Interactive Swagger UI is served at `/api/docs`.

---

## Conventions

### Authentication

Most endpoints require a JSON Web Token (JWT) issued by `POST /api/auth/login` or `POST /api/auth/register`. Send it in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are HS256-signed and expire after `JWT_EXPIRES_IN` (default: `7d`).

### Roles

A user may hold one or more of the following roles:

| Role      | Description                                                      |
|-----------|------------------------------------------------------------------|
| `MEMBER`  | Default role for new accounts. Can report issues and view their own. |
| `WORKER`  | Receives assigned issues; can update status of issues assigned to them. |
| `MANAGER` | Triages and assigns issues; can close or delete any issue.       |
| `ADMIN`   | Full control, including user management.                          |

Where an endpoint says "Staff", it accepts `WORKER`, `MANAGER`, or `ADMIN`.

### Common Request Headers

| Header          | Value                  | Required          |
|-----------------|------------------------|-------------------|
| `Content-Type`  | `application/json`     | All write endpoints (except photo upload) |
| `Content-Type`  | `multipart/form-data`  | Photo upload only |
| `Authorization` | `Bearer <jwt>`         | All `/api/*` routes except `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` |

### Standard Error Response

```json
{ "error": "Human-readable message" }
```

| Status | Meaning                                                  |
|--------|----------------------------------------------------------|
| 400    | Validation failure (Zod schema rejected the body)        |
| 401    | Missing / invalid / expired token, or wrong credentials  |
| 403    | Authenticated but role insufficient                      |
| 404    | Resource not found                                       |
| 409    | Conflict (e.g. email already registered)                 |
| 429    | Rate limit exceeded (200 requests / minute / IP)         |
| 500    | Unhandled server error                                   |

Validation errors (400) follow Zod's flattened shape:

```json
{
  "error": "Validation failed",
  "issues": [
    { "path": ["email"], "message": "Invalid email" }
  ]
}
```

---

## Health Endpoints

### GET `/health`

Liveness probe. **No authentication required.**

**Response 200**
```json
{ "ok": true }
```

### GET `/db-health`

Verifies database connectivity. **No authentication required.**

**Response 200**
```json
{ "db": "ok" }
```

**Response 500**
```json
{ "db": "error", "message": "connection refused" }
```

---

## Authentication — `/api/auth`

### POST `/api/auth/register`

Create a new account. The user is created with the `MEMBER` role.

- **Auth:** none
- **Roles:** public

**Body**

| Field      | Type   | Required | Constraints                  |
|------------|--------|----------|------------------------------|
| `email`    | string | yes      | valid email, ≤ 255 chars     |
| `password` | string | yes      | 6 – 72 chars                 |
| `fullName` | string | yes      | 2 – 100 chars                |
| `phone`    | string | no       | ≤ 20 chars                   |

**Example request**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "jane@university.edu",
  "password": "s3cret!",
  "fullName": "Jane Doe",
  "phone": "+201234567890"
}
```

**Response 201**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5a3...e0",
    "email": "jane@university.edu",
    "fullName": "Jane Doe",
    "phone": "+201234567890",
    "active": true,
    "roles": ["MEMBER"]
  }
}
```

**Response 409**
```json
{ "error": "Email already registered" }
```

---

### POST `/api/auth/login`

Exchange credentials for a JWT.

- **Auth:** none
- **Roles:** public

**Body**

| Field      | Type   | Required |
|------------|--------|----------|
| `email`    | string | yes      |
| `password` | string | yes      |

**Example request**
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "jane@university.edu", "password": "s3cret!" }
```

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5a3...e0",
    "email": "jane@university.edu",
    "fullName": "Jane Doe",
    "phone": "+201234567890",
    "active": true,
    "roles": ["MEMBER"]
  }
}
```

**Response 401**
```json
{ "error": "Invalid credentials" }
```

---

### POST `/api/auth/logout`

Client-side logout helper — the server is stateless, so the client must discard its token. Always returns 200.

- **Auth:** none
- **Roles:** public

**Response 200**
```json
{ "ok": true }
```

---

### GET `/api/auth/me`

Return the currently authenticated user.

- **Auth:** required
- **Roles:** any authenticated user

**Example request**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "user": {
    "id": "5a3...e0",
    "email": "jane@university.edu",
    "fullName": "Jane Doe",
    "phone": "+201234567890",
    "active": true,
    "roles": ["MEMBER"]
  }
}
```

---

## Issues — `/api/issues`

All issue endpoints require authentication.

### GET `/api/issues`

List issues. The result set is filtered by role:

- `MEMBER` → only issues they reported
- `WORKER` (without manager/admin) → only issues assigned to them
- `MANAGER` / `ADMIN` → all issues

- **Auth:** required
- **Roles:** any authenticated user

**Example request**
```http
GET /api/issues
Authorization: Bearer <token>
```

**Response 200**
```json
{
  "issues": [
    {
      "id": "9c1...4f",
      "title": "Leaking sink in B-201",
      "description": "Water dripping continuously...",
      "category": "PLUMBING",
      "location": "Building B, Room 201",
      "status": "ASSIGNED",
      "priority": "HIGH",
      "reporterId": "5a3...e0",
      "assigneeId": "7f2...11",
      "reporter": { "id": "5a3...e0", "fullName": "Jane Doe", "email": "jane@university.edu" },
      "assignee": { "id": "7f2...11", "fullName": "Worker One",  "email": "worker@uni.edu" },
      "_count": { "comments": 2, "photos": 1 },
      "createdAt": "2026-05-10T08:42:00.000Z",
      "updatedAt": "2026-05-12T11:00:00.000Z",
      "resolvedAt": null,
      "closedAt": null
    }
  ]
}
```

---

### GET `/api/issues/my`

List issues reported by the authenticated user (regardless of role).

- **Auth:** required
- **Roles:** any authenticated user

**Response 200**
```json
{ "issues": [ /* same shape as above, without joined objects */ ] }
```

---

### GET `/api/issues/:id`

Retrieve a single issue, including its photos and comments.

- **Auth:** required
- **Roles:** Staff, OR the issue's reporter

**Path params**

| Name | Type        | Description |
|------|-------------|-------------|
| `id` | string/UUID | Issue ID    |

**Response 200**
```json
{
  "issue": {
    "id": "9c1...4f",
    "title": "Leaking sink in B-201",
    "description": "Water dripping continuously...",
    "category": "PLUMBING",
    "location": "Building B, Room 201",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "reporter": { "id": "5a3...e0", "fullName": "Jane Doe", "email": "jane@university.edu" },
    "assignee": { "id": "7f2...11", "fullName": "Worker One",  "email": "worker@uni.edu" },
    "photos": [
      { "id": "p1", "url": "/uploads/abc.jpg", "kind": "REPORT", "uploadedBy": "5a3...e0", "createdAt": "..." }
    ],
    "comments": [
      {
        "id": "c1",
        "body": "On my way.",
        "author": { "id": "7f2...11", "fullName": "Worker One", "email": "worker@uni.edu" },
        "createdAt": "2026-05-11T10:00:00.000Z"
      }
    ]
  }
}
```

**Response 403**
```json
{ "error": "Forbidden" }
```

**Response 404**
```json
{ "error": "Not found" }
```

---

### POST `/api/issues`

Create a new issue. The authenticated user is recorded as the reporter.

- **Auth:** required
- **Roles:** any authenticated user

**Body**

| Field         | Type   | Required | Constraints                                                                 |
|---------------|--------|----------|-----------------------------------------------------------------------------|
| `title`       | string | yes      | 3 – 120 chars                                                               |
| `description` | string | yes      | 10 – 2000 chars                                                             |
| `location`    | string | yes      | 2 – 200 chars                                                               |
| `category`    | string | yes      | one of `ELECTRICAL`, `PLUMBING`, `HVAC`, `CLEANING`, `FURNITURE`, `SAFETY`, `IT`, `OTHER` |
| `priority`    | string | no       | `LOW` \| `MEDIUM` \| `HIGH` \| `URGENT` (default `MEDIUM`)                  |

**Example request**
```http
POST /api/issues
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Leaking sink in B-201",
  "description": "Water dripping continuously from the cold tap.",
  "location": "Building B, Room 201",
  "category": "PLUMBING",
  "priority": "HIGH"
}
```

**Response 201**
```json
{
  "issue": {
    "id": "9c1...4f",
    "title": "Leaking sink in B-201",
    "status": "PENDING",
    "priority": "HIGH",
    "reporterId": "5a3...e0",
    "assigneeId": null,
    "createdAt": "2026-05-15T09:00:00.000Z"
  }
}
```

---

### PUT `/api/issues/:id/status`

Update an issue's status. Setting `RESOLVED` stamps `resolvedAt`; setting `CLOSED` stamps `closedAt`. The reporter receives a notification.

- **Auth:** required
- **Roles:** Staff (`WORKER`, `MANAGER`, `ADMIN`)

**Body**

| Field    | Type   | Required | Constraints                                                          |
|----------|--------|----------|----------------------------------------------------------------------|
| `status` | string | yes      | `PENDING` \| `ASSIGNED` \| `IN_PROGRESS` \| `RESOLVED` \| `CLOSED`   |

**Example request**
```http
PUT /api/issues/9c1...4f/status
Authorization: Bearer <token>
Content-Type: application/json

{ "status": "IN_PROGRESS" }
```

**Response 200**
```json
{ "issue": { "id": "9c1...4f", "status": "IN_PROGRESS", "...": "..." } }
```

**Response 403**
```json
{ "error": "Forbidden" }
```

---

### PUT `/api/issues/:id/assign`

Assign an issue to a worker, or clear the assignment by passing `null`. Setting an assignee transitions the status to `ASSIGNED`; clearing it reverts the status to `PENDING`. The new assignee receives a notification.

- **Auth:** required
- **Roles:** `MANAGER`, `ADMIN`

**Body**

| Field        | Type            | Required | Constraints                              |
|--------------|-----------------|----------|------------------------------------------|
| `assigneeId` | string \| null  | yes      | UUID of a user, or `null` to unassign    |

**Example request**
```http
PUT /api/issues/9c1...4f/assign
Authorization: Bearer <token>
Content-Type: application/json

{ "assigneeId": "7f2...11" }
```

**Response 200**
```json
{ "issue": { "id": "9c1...4f", "assigneeId": "7f2...11", "status": "ASSIGNED" } }
```

**Response 403**
```json
{ "error": "Forbidden" }
```

---

### PUT `/api/issues/:id/close`

Force-close an issue. Stamps `closedAt` and notifies the reporter.

- **Auth:** required
- **Roles:** `MANAGER`, `ADMIN`

**Example request**
```http
PUT /api/issues/9c1...4f/close
Authorization: Bearer <token>
```

**Response 200**
```json
{ "issue": { "id": "9c1...4f", "status": "CLOSED", "closedAt": "2026-05-15T10:00:00.000Z" } }
```

---

### POST `/api/issues/:id/comments`

Add a comment to an issue.

- **Auth:** required
- **Roles:** any authenticated user

**Body**

| Field  | Type   | Required | Constraints   |
|--------|--------|----------|---------------|
| `body` | string | yes      | 1 – 1000 chars |

**Example request**
```http
POST /api/issues/9c1...4f/comments
Authorization: Bearer <token>
Content-Type: application/json

{ "body": "Parts ordered, ETA tomorrow." }
```

**Response 201**
```json
{
  "comment": {
    "id": "c8",
    "issueId": "9c1...4f",
    "authorId": "7f2...11",
    "body": "Parts ordered, ETA tomorrow.",
    "createdAt": "2026-05-15T10:10:00.000Z"
  }
}
```

---

### POST `/api/issues/:id/photo`

Upload a photo attached to an issue. **Multipart upload** — do not send JSON.

- **Auth:** required
- **Roles:** any authenticated user

**Form fields**

| Field   | Type     | Required | Notes                                                |
|---------|----------|----------|------------------------------------------------------|
| `photo` | file     | yes      | the image file (field name is literally `photo`)     |
| `kind`  | string   | no       | `REPORT` (default) or `COMPLETION`                   |

**Example request**
```http
POST /api/issues/9c1...4f/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----xyz

------xyz
Content-Disposition: form-data; name="photo"; filename="leak.jpg"
Content-Type: image/jpeg

<binary>
------xyz
Content-Disposition: form-data; name="kind"

REPORT
------xyz--
```

**Response 201**
```json
{
  "photo": {
    "id": "p9",
    "issueId": "9c1...4f",
    "url": "/uploads/1715760000-leak.jpg",
    "kind": "REPORT",
    "uploadedBy": "5a3...e0",
    "createdAt": "2026-05-15T10:20:00.000Z"
  }
}
```

Uploaded files are statically served from `/uploads/<filename>`.

**Response 400**
```json
{ "error": "No file" }
```

---

### DELETE `/api/issues/:id`

Permanently delete an issue (and its cascaded photos/comments/notifications).

- **Auth:** required
- **Roles:** `MANAGER`, `ADMIN`

**Response 200**
```json
{ "ok": true }
```

**Response 403**
```json
{ "error": "Forbidden" }
```

---

## Notifications — `/api/notifications`

### GET `/api/notifications`

List the 100 most recent notifications for the authenticated user, newest first.

- **Auth:** required
- **Roles:** any authenticated user

**Response 200**
```json
{
  "notifications": [
    {
      "id": "n1",
      "userId": "5a3...e0",
      "title": "Issue updated",
      "body": "Status: IN_PROGRESS",
      "issueId": "9c1...4f",
      "read": false,
      "createdAt": "2026-05-15T10:00:00.000Z"
    }
  ]
}
```

---

### PUT `/api/notifications/read-all`

Mark every unread notification for the authenticated user as read.

- **Auth:** required
- **Roles:** any authenticated user

**Response 200**
```json
{ "ok": true }
```

---

## Manager — `/api/manager`

### GET `/api/manager/workers`

List all active workers (used when assigning issues).

- **Auth:** required
- **Roles:** `MANAGER`, `ADMIN`

**Response 200**
```json
{
  "workers": [
    { "id": "7f2...11", "fullName": "Worker One", "email": "worker@uni.edu" },
    { "id": "8a4...22", "fullName": "Worker Two", "email": "worker2@uni.edu" }
  ]
}
```

**Response 403**
```json
{ "error": "Forbidden" }
```

---

## Admin — `/api/admin`

All admin endpoints require the `ADMIN` role.

### GET `/api/admin/users`

List every user with their roles.

- **Auth:** required
- **Roles:** `ADMIN`

**Response 200**
```json
{
  "users": [
    {
      "id": "5a3...e0",
      "email": "jane@university.edu",
      "fullName": "Jane Doe",
      "phone": "+201234567890",
      "active": true,
      "createdAt": "2026-05-01T09:00:00.000Z",
      "updatedAt": "2026-05-01T09:00:00.000Z",
      "roles": [
        { "id": "r1", "userId": "5a3...e0", "role": "MEMBER" }
      ]
    }
  ]
}
```

---

### PUT `/api/admin/users/:id/status`

Activate or deactivate a user. Deactivated users cannot log in or call authenticated endpoints.

- **Auth:** required
- **Roles:** `ADMIN`

**Body**

| Field    | Type    | Required | Description                              |
|----------|---------|----------|------------------------------------------|
| `active` | boolean | yes      | `true` to enable, `false` to disable     |

**Example request**
```http
PUT /api/admin/users/5a3...e0/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "active": false }
```

**Response 200**
```json
{ "user": { "id": "5a3...e0", "active": false, "...": "..." } }
```

---

### PUT `/api/admin/users/:id/role`

Grant or revoke a role for a user. Roles are additive — a user can hold any combination.

- **Auth:** required
- **Roles:** `ADMIN`

**Body**

| Field  | Type    | Required | Description                                                  |
|--------|---------|----------|--------------------------------------------------------------|
| `role` | string  | yes      | one of `MEMBER`, `MANAGER`, `WORKER`, `ADMIN`               |
| `on`   | boolean | yes      | `true` to grant the role, `false` to revoke it              |

**Example request**
```http
PUT /api/admin/users/7f2...11/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "role": "WORKER", "on": true }
```

**Response 200**
```json
{ "ok": true }
```

**Response 403**
```json
{ "error": "Forbidden" }
```

---

## Quick Reference

| Method | Path                                | Auth | Roles                                  |
|--------|-------------------------------------|------|----------------------------------------|
| GET    | `/health`                           | —    | public                                 |
| GET    | `/db-health`                        | —    | public                                 |
| POST   | `/api/auth/register`                | —    | public                                 |
| POST   | `/api/auth/login`                   | —    | public                                 |
| POST   | `/api/auth/logout`                  | —    | public                                 |
| GET    | `/api/auth/me`                      | ✅   | any                                    |
| GET    | `/api/issues`                       | ✅   | any (filtered by role)                 |
| GET    | `/api/issues/my`                    | ✅   | any                                    |
| GET    | `/api/issues/:id`                   | ✅   | Staff or reporter                      |
| POST   | `/api/issues`                       | ✅   | any                                    |
| PUT    | `/api/issues/:id/status`            | ✅   | WORKER, MANAGER, ADMIN                 |
| PUT    | `/api/issues/:id/assign`            | ✅   | MANAGER, ADMIN                         |
| PUT    | `/api/issues/:id/close`             | ✅   | MANAGER, ADMIN                         |
| POST   | `/api/issues/:id/comments`          | ✅   | any                                    |
| POST   | `/api/issues/:id/photo`             | ✅   | any                                    |
| DELETE | `/api/issues/:id`                   | ✅   | MANAGER, ADMIN                         |
| GET    | `/api/notifications`                | ✅   | any                                    |
| PUT    | `/api/notifications/read-all`       | ✅   | any                                    |
| GET    | `/api/manager/workers`              | ✅   | MANAGER, ADMIN                         |
| GET    | `/api/admin/users`                  | ✅   | ADMIN                                  |
| PUT    | `/api/admin/users/:id/status`       | ✅   | ADMIN                                  |
| PUT    | `/api/admin/users/:id/role`         | ✅   | ADMIN                                  |
