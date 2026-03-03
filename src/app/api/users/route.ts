import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import { validateBody, createUserSchema } from '@/lib/utils/validation';
import { canManageUsers, ROLES } from '@/lib/server/permissions';
import logger from '@/lib/db/logger';
import bcryptjs from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Check if a user with a given roleId can create users with the target roleId
function canCreateRole(creatorRoleId: number, targetRoleId: number): boolean {
  // CEO (1) can create any role
  if (creatorRoleId === ROLES.CEO) return true;
  
  // COO (2) can create DEPT_HEAD (3) and below - NOT CEO
  if (creatorRoleId === ROLES.COO) return targetRoleId >= ROLES.DEPT_HEAD;
  
  // DEPT_HEAD (3) can create SENIOR (4) and below - NOT CEO or COO
  if (creatorRoleId === ROLES.DEPT_HEAD) return targetRoleId >= ROLES.SENIOR;
  
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!canManageUsers(user.roleId)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const result = await query(`
      SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.status,
             r.name as role, d.name as department, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);

    logger.info(`User list retrieved by ${user.username}`);

    return jsonResponse(true, 'Users retrieved successfully', result.rows);
  } catch (error: any) {
    logger.error('Error fetching users:', error);
    return errorResponse('Error fetching users', 500, error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!canManageUsers(user.roleId)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const body = await req.json();
    try {
      await validateBody(createUserSchema, body);
    } catch (e: any) {
      return errorResponse('Validation failed', 400, e.message);
    }

    const { email, username, firstName, lastName, roleId, departmentId, managerId } = body;

    // Validate role hierarchy - prevent creating users with higher privileges
    if (!canCreateRole(user.roleId, roleId)) {
      return errorResponse('You cannot create users with a role higher than or equal to your own', 403);
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return errorResponse('User with this email or username already exists', 400);
    }

    // Generate a temporary password for new user
    const tempPassword = `${username}_temp_2026`;
    const hashedPassword = await bcryptjs.hash(tempPassword, 10);

    const result = await query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name, role_id, department_id, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, username, first_name, last_name, role_id`,
      [email, username, hashedPassword, firstName, lastName, roleId, departmentId, managerId]
    );

    logger.info(`New user created by ${user.username}: ${username}`);
    
    return jsonResponse(true, 'User created successfully', {
       ...result.rows[0],
       tempPassword // Return this so the admin knows the password to give to the user
    }, 201);

  } catch (error: any) {
    logger.error('Error creating user:', error);
    return errorResponse('Error creating user', 500, error);
  }
}
