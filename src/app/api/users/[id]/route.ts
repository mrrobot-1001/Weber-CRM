import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import { canDeleteUser, canDeleteUserWithRole } from '@/lib/server/permissions';
import logger from '@/lib/db/logger';
import bcryptjs from 'bcryptjs';

export const dynamic = 'force-dynamic';

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);

    if (isNaN(targetUserId)) {
      return errorResponse('Invalid user ID', 400);
    }

    // Allow users to update their own profile, or admins (CEO/COO) to update users
    const isSelf = user.userId === targetUserId;
    const isAdmin = ['CEO', 'COO'].includes(user.roleName);
    
    if (!isSelf && !isAdmin) {
      return errorResponse('Forbidden: You can only update your own profile', 403);
    }

    const body = await req.json();
    const { firstName, lastName, email } = body;

    if (!firstName || !lastName || !email) {
      return errorResponse('Missing required fields', 400);
    }

    // Update query
    const result = await query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING id, username, email, first_name, last_name, role_id, status, is_departmental_head`,
      [firstName, lastName, email, targetUserId]
    );

    if (result.rows.length === 0) {
      return errorResponse('User not found', 404);
    }

    const updatedDbUser = result.rows[0];
    
    // Fetch role name for response consistency
    const roleRes = await query('SELECT name FROM roles WHERE id = $1', [updatedDbUser.role_id]);
    const roleName = roleRes.rows[0]?.name;

    const responseUser = {
      id: updatedDbUser.id,
      username: updatedDbUser.username,
      email: updatedDbUser.email,
      firstName: updatedDbUser.first_name,
      lastName: updatedDbUser.last_name,
      role: roleName,
      status: updatedDbUser.status,
      isDepartmentalHead: updatedDbUser.is_departmental_head
    };

    logger.info(`User ${targetUserId} updated by ${user.username}`);

    return jsonResponse(true, 'User updated successfully', responseUser);

  } catch (error: any) {
    logger.error('Error updating user:', error);
    // Check for unique constraint violation on email
    if (error.code === '23505') {
       return errorResponse('Email already exists', 409);
    }
    return errorResponse('Error updating user', 500, error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);

    if (isNaN(targetUserId)) {
      return errorResponse('Invalid user ID', 400);
    }

    // Only allow users to change their own password
    if (user.userId !== targetUserId) {
      return errorResponse('Forbidden: You can only change your own password', 403);
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters', 400);
    }

    // Fetch current password hash
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [targetUserId]);
    if (userResult.rows.length === 0) {
      return errorResponse('User not found', 404);
    }

    const isValid = await bcryptjs.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return errorResponse('Current password is incorrect', 401);
    }

    const newHash = await bcryptjs.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, targetUserId]);

    logger.info(`Password changed for user ${targetUserId}`);

    return jsonResponse(true, 'Password changed successfully');
  } catch (error: any) {
    logger.error('Error changing password:', error);
    return errorResponse('Error changing password', 500, error);
  }
}
