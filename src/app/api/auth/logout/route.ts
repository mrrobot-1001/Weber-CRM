import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { closeSession, logAuditTrail } from '@/lib/services/sessionService';
import logger from '@/lib/db/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    // Even if user validation fails (expired token), we try to close the session if token is provided
    
    // Extract token
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await closeSession(token);
    }
    
    if (user) {
      const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';

      logAuditTrail(
        user.userId,
        'LOGOUT',
        'user',
        user.userId,
        {},
        ipAddress,
        userAgent
      ).catch(err => console.error(err));

      logger.info(`User ${user.username} logged out`);
    }

    return jsonResponse(true, 'Logged out successfully');
  } catch (error: any) {
    logger.error('Logout error:', error);
    return errorResponse('Logout failed', 500, error);
  }
}
