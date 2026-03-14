import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';

export const dynamic = 'force-dynamic';

/** POST /api/push/subscribe — save a push subscription for the current user */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { endpoint, keys } = body ?? {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return errorResponse('Invalid subscription object', 400);
    }

    // Upsert: update user_id if endpoint already exists (e.g., re-login)
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4`,
      [user.userId, endpoint, keys.p256dh, keys.auth],
    );

    return jsonResponse(true, 'Push subscription saved', null, 201);
  } catch (err: any) {
    return errorResponse('Error saving push subscription', 500, err);
  }
}

/** DELETE /api/push/subscribe — remove a push subscription */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { endpoint } = body ?? {};

    if (!endpoint) return errorResponse('endpoint is required', 400);

    await query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [endpoint, user.userId],
    );

    return jsonResponse(true, 'Push subscription removed');
  } catch (err: any) {
    return errorResponse('Error removing push subscription', 500, err);
  }
}

/** GET /api/push/subscribe — return the VAPID public key so the client can subscribe */
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return errorResponse('VAPID not configured', 503);
  return jsonResponse(true, 'VAPID public key', { publicKey: key });
}
