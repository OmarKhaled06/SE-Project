# CampusCare ERD

```
User ──< UserRole              (1 user, many roles)
User ──< Issue (reporter)
User ──< Issue (assignee)      (optional)
Issue ──< IssuePhoto
Issue ──< Comment
Issue ──< Notification
User ──< Notification
```

## Tables

### User
- id (PK), email (UQ), passwordHash, fullName, phone, active, createdAt, updatedAt

### UserRole
- id (PK), userId (FK→User), role (enum: MEMBER|MANAGER|WORKER|ADMIN), UNIQUE(userId, role)

### Issue
- id (PK), title, description, category (enum), location, status (enum),
  priority (enum), reporterId (FK→User), assigneeId (FK→User, nullable),
  createdAt, updatedAt, resolvedAt, closedAt

### IssuePhoto
- id (PK), issueId (FK→Issue), url, kind (REPORT|COMPLETION), uploadedBy (FK→User), createdAt

### Comment
- id (PK), issueId (FK→Issue), authorId (FK→User), body, createdAt

### Notification
- id (PK), userId (FK→User), title, body, issueId (FK→Issue, nullable), read, createdAt

## Enums
- Role: MEMBER, MANAGER, WORKER, ADMIN
- IssueStatus: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
- Priority: LOW, MEDIUM, HIGH, URGENT
- Category: ELECTRICAL, PLUMBING, HVAC, CLEANING, FURNITURE, SAFETY, IT, OTHER
- PhotoKind: REPORT, COMPLETION
