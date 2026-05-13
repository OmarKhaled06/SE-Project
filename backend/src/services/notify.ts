import { db } from '../config/db';
export async function notify(userId: string, title: string, body: string, issueId?: string) {
  await db.notification.create({ data: { userId, title, body, issueId } });
}
