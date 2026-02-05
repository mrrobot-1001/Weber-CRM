import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import { canDeleteUser, canDeleteUserWithRole } from '@/lib/server/permissions';
import logger from '@/lib/db/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    
    const { id } = await params;

    const result = await query(`
      SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.status,
             u.role_id, r.name as role, d.name as department, u.is_departmental_head, 
             u.created_at, u.last_login
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return errorResponse('User not found', 404);
    }

    return jsonResponse(true, 'User retrieved successfully', result.rows[0]);
  } catch (error: any) {
    logger.error('Error fetching user:', error);
    return errorResponse('Error fetching user', 500, error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!canDeleteUser(user.roleId)) {
      return errorResponse('Forbidden: Only CEO and COO can delete users', 403);
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return errorResponse('Invalid user ID', 400);
    }

    // Prevent deleting yourself
    if (userId === user.userId) {
      return errorResponse('You cannot delete your own account', 400);
    }

    // Get the target user to check their role
    const targetUser = await query('SELECT role_id FROM users WHERE id = $1', [userId]);
    
    if (targetUser.rows.length === 0) {
      return errorResponse('User not found', 404);
    }

    const targetRoleId = targetUser.rows[0].role_id;

    // Check role hierarchy
    if (!canDeleteUserWithRole(user.roleId, targetRoleId)) {
      return errorResponse('You cannot delete users with a role equal to or higher than your own', 403);
    }

    // Perform soft delete (set status to 'deleted')
    const result = await query(
      `UPDATE users SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0) {
      return errorResponse('User not found', 404);
    }

    logger.info(`User ${userId} deleted by ${user.username}`);

    return jsonResponse(true, 'User deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting user:', error);
    return errorResponse('Error deleting user', 500, error);
  }
}

