import { NextRequest } from 'next/server';
import { validateBody, loginSchema } from '@/lib/utils/validation';
import { validateCredentials } from '@/lib/utils/auth';
import { createSession, logAuditTrail } from '@/lib/services/sessionService';
import { jsonResponse, errorResponse } from '@/lib/server/api-utils';
import logger from '@/lib/db/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    try {
      await validateBody(loginSchema, body);
    } catch (e: any) {
      return errorResponse('Validation failed', 400, e.message);
    }

    const { username, password } = body;
    const user = await validateCredentials(username, password);

    if (!user) {
      logger.warn(`Failed login attempt for username: ${username}`);
      return errorResponse('Invalid username or password', 401);
    }

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const { token, sessionId, expiresAt } = await createSession(
      user.id,
      user.username,
      user.roleId,
      user.roleName,
      ipAddress,
      userAgent
    );

    // Log audit trail — must await on Vercel serverless or it may be killed
    await logAuditTrail(
      user.id,
      'LOGIN',
      'user',
      user.id,
      { username },
      ipAddress,
      userAgent
    ).catch(() => {});

    logger.info(`User ${user.username} logged in successfully`);

    return jsonResponse(true, 'Login successful', {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.roleName,
      },
      sessionId,
      token,
      expiresAt,
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    return errorResponse('Login failed', 500, error);
  }
}
