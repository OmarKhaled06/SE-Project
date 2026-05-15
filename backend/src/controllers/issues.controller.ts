import { Response, NextFunction } from 'express';
import { db } from '../config/db';
import { AuthedRequest } from '../middleware/auth';
import { issueSchema, statusSchema, assignSchema, commentSchema, prioritySchema } from '../validators/schemas';
import { notify } from '../services/notify';

const isStaff = (req: AuthedRequest) =>
  req.user!.roles.some((r) => ['MANAGER', 'WORKER', 'ADMIN'].includes(r));
const isManager = (req: AuthedRequest) =>
  req.user!.roles.some((r) => ['MANAGER', 'ADMIN'].includes(r));

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const where: any = {};
    if (!isStaff(req)) where.reporterId = req.user!.id;
    else if (req.user!.roles.includes('WORKER') && !isManager(req)) where.assigneeId = req.user!.id;
    if (typeof req.query.status === 'string') where.status = req.query.status;
    const issues = await db.issue.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { id: true, fullName: true, email: true } },
                 assignee: { select: { id: true, fullName: true, email: true } },
                 photos: true,
                 _count: { select: { comments: true, photos: true } } },
    });
    res.json({ issues });
  } catch (e) { next(e); }
}

export async function listAssigned(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const issues = await db.issue.findMany({
      where: { assigneeId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
        photos: true,
      },
    });
    res.json({ issues });
  } catch (e) { next(e); }
}

export async function listMine(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const issues = await db.issue.findMany({
      where: { reporterId: req.user!.id }, orderBy: { createdAt: 'desc' },
      include: { photos: true, assignee: { select: { id: true, fullName: true, email: true } } },
    });
    res.json({ issues });
  } catch (e) { next(e); }
}

export async function get(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const issue = await db.issue.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
        photos: true,
        comments: { include: { author: { select: { id: true, fullName: true, email: true, roles: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!issue) return res.status(404).json({ error: 'Not found' });
    if (!isStaff(req) && issue.reporterId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
    res.json({ issue });
  } catch (e) { next(e); }
}

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const data = issueSchema.parse(req.body);
    const issue = await db.issue.create({ data: { ...data, reporterId: req.user!.id } });
    res.status(201).json({ issue });
  } catch (e) { next(e); }
}

export async function setStatus(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!isStaff(req)) return res.status(403).json({ error: 'Forbidden' });
    const { status } = statusSchema.parse(req.body);
    const extra: any = {};
    if (status === 'RESOLVED') extra.resolvedAt = new Date();
    if (status === 'CLOSED') extra.closedAt = new Date();
    const issue = await db.issue.update({ where: { id: req.params.id }, data: { status, ...extra } });
    await notify(issue.reporterId, 'Issue updated', `Status: ${status}`, issue.id);
    res.json({ issue });
  } catch (e) { next(e); }
}

export async function setPriority(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!isManager(req)) return res.status(403).json({ error: 'Forbidden' });
    const { priority } = prioritySchema.parse(req.body);
    const issue = await db.issue.update({ where: { id: req.params.id }, data: { priority } });
    res.json({ issue });
  } catch (e) { next(e); }
}

export async function assign(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!isManager(req)) return res.status(403).json({ error: 'Forbidden' });
    const { assigneeId } = assignSchema.parse(req.body);
    const issue = await db.issue.update({
      where: { id: req.params.id },
      data: { assigneeId, status: assigneeId ? 'ASSIGNED' : 'PENDING' },
    });
    if (assigneeId) await notify(assigneeId, 'New assignment', `You were assigned to "${issue.title}"`, issue.id);
    res.json({ issue });
  } catch (e) { next(e); }
}

export async function close(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!isManager(req)) return res.status(403).json({ error: 'Forbidden' });
    const issue = await db.issue.update({ where: { id: req.params.id }, data: { status: 'CLOSED', closedAt: new Date() } });
    await notify(issue.reporterId, 'Issue closed', `"${issue.title}" was closed`, issue.id);
    res.json({ issue });
  } catch (e) { next(e); }
}

export async function comment(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { body } = commentSchema.parse(req.body);
    const created = await db.comment.create({
      data: { issueId: req.params.id, authorId: req.user!.id, body },
      include: { author: { select: { id: true, fullName: true, email: true, roles: true } } },
    });
    res.status(201).json({ comment: created });
  } catch (e) { next(e); }
}

export async function uploadPhoto(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const url = `/uploads/${req.file.filename}`;
    const kind = (req.body.kind === 'COMPLETION' ? 'COMPLETION' : 'REPORT');
    const photo = await db.issuePhoto.create({
      data: { issueId: req.params.id, url, kind, uploadedBy: req.user!.id },
    });
    res.status(201).json({ photo });
  } catch (e) { next(e); }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!isManager(req)) return res.status(403).json({ error: 'Forbidden' });
    await db.issue.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
}
