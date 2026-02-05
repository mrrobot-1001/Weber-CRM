import { query } from '../db/pool';
import logger from '../db/logger';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '../utils/auth';

export const createSession = async (userId: number, username: string, roleId: number, roleName: string, ipAddress: string, userAgent: string) => {
  const sessionId = uuidv4();
  const token = generateToken(userId, username, roleId, roleName);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  try {
    await query(
      `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, userId, token, ipAddress, userAgent, expiresAt]
    );

    logger.info(`Session created for user ${userId}`, { sessionId, ipAddress });
    return { sessionId, token, expiresAt };
  } catch (error) {
    logger.error('Error creating session:', error);
    // return pseudo session if DB fails
    return { sessionId, token, expiresAt };
  }
};

export const getSession = async (token: string) => {
  try {
    const result = await query(
      `SELECT * FROM sessions WHERE token = $1 AND is_active = TRUE AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error retrieving session:', error);
    return null;
  }
};

export const closeSession = async (token: string) => {
  try {
    await query(
      `UPDATE sessions SET is_active = FALSE, logout_time = NOW() WHERE token = $1`,
      [token]
    );
    logger.info('Session closed', { token });
  } catch (error) {
    logger.error('Error closing session:', error);
  }
};

export const logAuditTrail = async (userId: number, action: string, entityType: string, entityId: number, changes: object, ipAddress: string, userAgent: string) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType, entityId, JSON.stringify(changes), ipAddress, userAgent]
    );
    logger.info(`Audit: ${action} on ${entityType}`, { userId, entityId });
  } catch (error) {
    logger.error('Error logging audit trail:', error);
  }
};
