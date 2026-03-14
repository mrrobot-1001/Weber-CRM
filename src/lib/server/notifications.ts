import webpush from 'web-push';
import { query } from '@/lib/db/pool';
import logger from '@/lib/db/logger';

// Configure VAPID once when the module loads
const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject    = process.env.VAPID_SUBJECT || 'mailto:admin@weber-crm.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type NotificationType = 'assignment' | 'submission' | 'evaluation' | 'info';

/**
 * Persist a notification row for the given user.
 */
export async function createNotification(
  userId: number,
  title: string,
  body: string,
  type: NotificationType = 'info',
  link?: string,
): Promise<void> {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, body, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, body, type, link ?? null],
    );
  } catch (err) {
    logger.error('Failed to create notification:', err);
  }
}

/**
 * Send a Web Push notification to every active subscription for a user.
 */
export async function sendPushToUser(
  userId: number,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  try {
    const subs = await query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId],
    );

    const payload = JSON.stringify({ title, body, link: link ?? '/' });

    await Promise.allSettled(
      subs.rows.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          )
          .catch(async (err: any) => {
            // 410 Gone = subscription expired; clean it up
            if (err.statusCode === 410) {
              await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]).catch(() => {});
            }
            logger.warn('Web push send failed:', err.message);
          }),
      ),
    );
  } catch (err) {
    logger.error('sendPushToUser error:', err);
  }
}

/**
 * Create a DB notification AND send a browser push notification — fire-and-forget.
 */
export function notifyUser(
  userId: number,
  title: string,
  body: string,
  type: NotificationType = 'info',
  link?: string,
): void {
  Promise.all([
    createNotification(userId, title, body, type, link),
    sendPushToUser(userId, title, body, link),
  ]).catch(() => {}); // never throw — notifications are best-effort
}
