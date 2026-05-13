-- Clean up any partial state from failed attempts
DROP TABLE IF EXISTS public."Notification" CASCADE;
DROP TABLE IF EXISTS public."Comment" CASCADE;
DROP TABLE IF EXISTS public."IssuePhoto" CASCADE;
DROP TABLE IF EXISTS public."Issue" CASCADE;
DROP TABLE IF EXISTS public."UserRole" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TYPE IF EXISTS public."Role" CASCADE;
DROP TYPE IF EXISTS public."IssueStatus" CASCADE;
DROP TYPE IF EXISTS public."Priority" CASCADE;
DROP TYPE IF EXISTS public."Category" CASCADE;
DROP TYPE IF EXISTS public."PhotoKind" CASCADE;

-- Create enums
CREATE TYPE "Role" AS ENUM ('MEMBER', 'MANAGER', 'WORKER', 'ADMIN');
CREATE TYPE "IssueStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "Category" AS ENUM ('ELECTRICAL', 'PLUMBING', 'HVAC', 'CLEANING', 'FURNITURE', 'SAFETY', 'IT', 'OTHER');
CREATE TYPE "PhotoKind" AS ENUM ('REPORT', 'COMPLETION');

-- Create tables
CREATE TABLE public."User" (
    id            TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    email         TEXT         NOT NULL,
    "passwordHash" TEXT        NOT NULL,
    "fullName"    TEXT         NOT NULL,
    phone         TEXT,
    active        BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY (id)
);
CREATE UNIQUE INDEX "User_email_key" ON public."User"(email);

CREATE TABLE public."UserRole" (
    id       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    role     "Role" NOT NULL,
    CONSTRAINT "UserRole_pkey" PRIMARY KEY (id),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON public."UserRole"("userId", role);

CREATE TABLE public."Issue" (
    id            TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
    title         TEXT          NOT NULL,
    description   TEXT          NOT NULL,
    category      "Category"    NOT NULL DEFAULT 'OTHER',
    location      TEXT          NOT NULL,
    status        "IssueStatus" NOT NULL DEFAULT 'PENDING',
    priority      "Priority"    NOT NULL DEFAULT 'MEDIUM',
    "reporterId"  TEXT          NOT NULL,
    "assigneeId"  TEXT,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt"  TIMESTAMP(3),
    "closedAt"    TIMESTAMP(3),
    CONSTRAINT "Issue_pkey" PRIMARY KEY (id),
    CONSTRAINT "Issue_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON DELETE CASCADE,
    CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON DELETE CASCADE
);
CREATE INDEX "Issue_reporterId_idx" ON public."Issue"("reporterId");
CREATE INDEX "Issue_assigneeId_idx" ON public."Issue"("assigneeId");
CREATE INDEX "Issue_status_idx" ON public."Issue"(status);

CREATE TABLE public."IssuePhoto" (
    id           TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "issueId"    TEXT         NOT NULL,
    url          TEXT         NOT NULL,
    kind         "PhotoKind"  NOT NULL DEFAULT 'REPORT',
    "uploadedBy" TEXT         NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IssuePhoto_pkey" PRIMARY KEY (id),
    CONSTRAINT "IssuePhoto_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES public."Issue"(id) ON DELETE CASCADE,
    CONSTRAINT "IssuePhoto_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES public."User"(id) ON DELETE CASCADE
);

CREATE TABLE public."Comment" (
    id         TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "issueId"  TEXT         NOT NULL,
    "authorId" TEXT         NOT NULL,
    body       TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY (id),
    CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES public."Issue"(id) ON DELETE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON DELETE CASCADE
);

CREATE TABLE public."Notification" (
    id         TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"   TEXT         NOT NULL,
    title      TEXT         NOT NULL,
    body       TEXT         NOT NULL,
    "issueId"  TEXT,
    read       BOOLEAN      NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY (id),
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE,
    CONSTRAINT "Notification_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES public."Issue"(id) ON DELETE CASCADE
);

-- Auto-update updatedAt for User and Issue
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "User_updatedAt"
  BEFORE UPDATE ON public."User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER "Issue_updatedAt"
  BEFORE UPDATE ON public."Issue"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
