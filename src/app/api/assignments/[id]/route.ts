import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import { canDeleteAssignment, ROLES } from '@/lib/server/permissions';
import logger from '@/lib/db/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    
    const { id } = await params;

    const result = await query(`
      SELECT wa.id, wa.title, wa.description, wa.status, wa.priority, wa.due_date,
             wa.assigned_by, wa.assigned_to,
             u_assigned.username as assigned_by_username,
             u_to.username as assigned_to_username,
             wa.created_at, wa.updated_at, wa.completed_at
      FROM work_assignments wa
      JOIN users u_assigned ON wa.assigned_by = u_assigned.id
      JOIN users u_to ON wa.assigned_to = u_to.id
      WHERE wa.id = $1 AND (wa.assigned_to = $2 OR wa.assigned_by = $2)
    `, [id, user.userId]);

    if (result.rows.length === 0) {
      return errorResponse('Assignment not found', 404);
    }

    return jsonResponse(true, 'Assignment retrieved', result.rows[0]);
  } catch (error: any) {
    logger.error('Error fetching assignment:', error);
    return errorResponse('Error fetching assignment', 500, error);
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

    if (!canDeleteAssignment(user.roleId)) {
      return errorResponse('Forbidden: You do not have permission to delete assignments', 403);
    }

    const { id } = await params;
    const assignmentId = parseInt(id, 10);

    if (isNaN(assignmentId)) {
      return errorResponse('Invalid assignment ID', 400);
    }

    // Get the assignment to check ownership/permissions
    const assignment = await query(
      'SELECT assigned_by, assigned_to FROM work_assignments WHERE id = $1',
      [assignmentId]
    );

    if (assignment.rows.length === 0) {
      return errorResponse('Assignment not found', 404);
    }

    const { assigned_by, assigned_to } = assignment.rows[0];

    // Permission check:
    // - CEO/COO can delete any assignment
    // - DEPT_HEAD/SENIOR can delete assignments they created OR are assigned to them
    const isCeoOrCoo = [ROLES.CEO, ROLES.COO].includes(user.roleId);
    const isCreator = assigned_by === user.userId;
    const isAssignee = assigned_to === user.userId;

    if (!isCeoOrCoo && !isCreator && !isAssignee) {
      return errorResponse('You can only delete assignments you created or are assigned to', 403);
    }

    // Perform delete
    const result = await query(
      'DELETE FROM work_assignments WHERE id = $1 RETURNING id',
      [assignmentId]
    );

    if (result.rows.length === 0) {
      return errorResponse('Assignment not found', 404);
    }

    logger.info(`Assignment ${assignmentId} deleted by ${user.username}`);

    return jsonResponse(true, 'Assignment deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting assignment:', error);
    return errorResponse('Error deleting assignment', 500, error);
  }
}

