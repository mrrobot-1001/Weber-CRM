import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';

export const dynamic = 'force-dynamic';

/** GET /api/notifications — fetch the current user's latest 50 notifications */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const result = await query(
      `SELECT id, title, body, type, link, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.userId],
    );

    const unreadCount = result.rows.filter((n) => !n.read).length;
    return jsonResponse(true, 'Notifications retrieved', { notifications: result.rows, unreadCount });
  } catch (err: any) {
    return errorResponse('Error fetching notifications', 500, err);
  }
}

/** POST /api/notifications/read-all — mark every notification as read */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await query('UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE', [user.userId]);
    return jsonResponse(true, 'All notifications marked as read');
  } catch (err: any) {
    return errorResponse('Error marking notifications as read', 500, err);
  }
}
