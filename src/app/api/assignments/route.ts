import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import { validateBody, createWorkAssignmentSchema } from '@/lib/utils/validation';
import { canAssignWork } from '@/lib/server/permissions';
import { notifyUser } from '@/lib/server/notifications';
import logger from '@/lib/db/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Get query parameters for sorting/filtering
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'created_at';
    const sortOrder = req.nextUrl.searchParams.get('sortOrder') || 'DESC';
    const status = req.nextUrl.searchParams.get('status');

    // Validate sort parameters to prevent SQL injection
    const validSortFields = ['created_at', 'due_date', 'priority', 'title', 'status'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereClause = 'WHERE (wa.assigned_to = $1 OR wa.assigned_by = $1)';
    const params: (string | number)[] = [user.userId];

    if (status && ['pending', 'in_progress', 'submitted', 'evaluated', 'completed'].includes(status)) {
      whereClause += ` AND wa.status = $${params.length + 1}`;
      params.push(status);
    }

    // Get assignments for current user (assigned to OR assigned by)
    const result = await query(`
      SELECT wa.id, wa.title, wa.description, wa.status, wa.priority, wa.due_date,
             u_assigned.username as assigned_by_username,
             u_to.username as assigned_to_username,
             wa.created_at, wa.updated_at, wa.completed_at
      FROM work_assignments wa
      JOIN users u_assigned ON wa.assigned_by = u_assigned.id
      JOIN users u_to ON wa.assigned_to = u_to.id
      ${whereClause}
      ORDER BY wa.${safeSortBy} ${safeSortOrder}
    `, params);

    logger.info(`Work assignments retrieved for user ${user.userId} (sorted by ${safeSortBy} ${safeSortOrder})`);

    return jsonResponse(true, 'Work assignments retrieved', result.rows);
  } catch (error: any) {
    logger.error('Error fetching assignments:', error);
    return errorResponse('Error fetching assignments', 500, error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!canAssignWork(user.roleId)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const body = await req.json();
    try {
      await validateBody(createWorkAssignmentSchema, body);
    } catch (e: any) {
      return errorResponse('Validation failed', 400, e.message);
    }

    const { title, description, assignedTo, priority, dueDate } = body;

    // Verify assigned user exists
    const userExists = await query('SELECT id FROM users WHERE id = $1', [assignedTo]);
    if (userExists.rows.length === 0) {
      return errorResponse('Assigned user not found', 404);
    }

    const result = await query(
      `INSERT INTO work_assignments (title, description, assigned_by, assigned_to, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, assigned_by, assigned_to, status, priority, due_date, created_at`,
      [title, description, user.userId, assignedTo, priority || 'medium', dueDate || null]
    );

    notifyUser(
      Number(assignedTo),
      'New assignment',
      `${user.username} assigned: ${title}`,
      'assignment',
      '/assignments',
    );

    logger.info(`Work assignment created by ${user.username}`);

    return jsonResponse(true, 'Assignment created', result.rows[0], 201);
  } catch (error: any) {
    logger.error('Error creating assignment:', error);
    return errorResponse('Error creating assignment', 500, error);
  }
}
