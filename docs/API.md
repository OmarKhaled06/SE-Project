# CampusCare REST API

Base URL: `http://localhost:4000`
Auth: `Authorization: Bearer <jwt>` on all `/api/*` except `/api/auth/login` and `/api/auth/register`.

## Auth
- `POST /api/auth/register` { email, password, fullName, phone? } → { token, user }
- `POST /api/auth/login`    { email, password } → { token, user }
- `POST /api/auth/logout`   → { ok }
- `GET  /api/auth/me`       → { user }

## Issues
- `GET  /api/issues`              → role-filtered list
- `GET  /api/issues/my`           → my reported issues
- `GET  /api/issues/:id`          → issue + photos + comments + reporter/assignee
- `POST /api/issues`              { title, description, location, category, priority }
- `PUT  /api/issues/:id/status`   (staff)   { status }
- `PUT  /api/issues/:id/assign`   (manager) { assigneeId | null }
- `PUT  /api/issues/:id/close`    (manager)
- `POST /api/issues/:id/comments` { body }
- `POST /api/issues/:id/photo`    multipart/form-data: photo, kind=REPORT|COMPLETION
- `DELETE /api/issues/:id`        (manager)

## Notifications
- `GET /api/notifications`
- `PUT /api/notifications/read-all`

## Manager
- `GET /api/manager/workers`

## Admin
- `GET  /api/admin/users`
- `PUT  /api/admin/users/:id/status` { active: boolean }
- `PUT  /api/admin/users/:id/role`   { role, on: boolean }

Live Swagger UI: `http://localhost:4000/api/docs`
