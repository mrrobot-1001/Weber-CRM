import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';

export const dynamic = 'force-dynamic';

/** PATCH /api/notifications/[id] — mark a single notification as read */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const id = parseInt((await params).id);
    if (isNaN(id)) return errorResponse('Invalid notification id', 400);

    const result = await query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.userId],
    );

    if (result.rows.length === 0) return errorResponse('Notification not found', 404);
    return jsonResponse(true, 'Notification marked as read');
  } catch (err: any) {
    return errorResponse('Error updating notification', 500, err);
  }
}

/** DELETE /api/notifications/[id] — delete a single notification */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const id = parseInt((await params).id);
    if (isNaN(id)) return errorResponse('Invalid notification id', 400);

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.userId],
    );

    if (result.rows.length === 0) return errorResponse('Notification not found', 404);
    return jsonResponse(true, 'Notification deleted');
  } catch (err: any) {
    return errorResponse('Error deleting notification', 500, err);
  }
}
