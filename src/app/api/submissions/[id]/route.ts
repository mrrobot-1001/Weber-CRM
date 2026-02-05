import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import { ROLES } from '@/lib/server/permissions';
import logger from '@/lib/db/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    
    const { id } = await params;

    const result = await query(`
      SELECT ws.id, ws.assignment_id, ws.submitted_by, ws.submission_notes, ws.status,
             wa.title as assignment_title,
             u.username as submitted_by_username,
             ws.submission_date, ws.attachments
      FROM work_submissions ws
      JOIN work_assignments wa ON ws.assignment_id = wa.id
      JOIN users u ON ws.submitted_by = u.id
      WHERE ws.id = $1 AND (ws.submitted_by = $2 OR wa.assigned_by = $2)
    `, [id, user.userId]);

    if (result.rows.length === 0) {
      return errorResponse('Submission not found', 404);
    }

    return jsonResponse(true, 'Submission retrieved', result.rows[0]);
  } catch (error: any) {
    logger.error('Error fetching submission:', error);
    return errorResponse('Error fetching submission', 500, error);
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

    const { id } = await params;
    const submissionId = parseInt(id, 10);

    if (isNaN(submissionId)) {
      return errorResponse('Invalid submission ID', 400);
    }

    // Get the submission to check ownership/permissions
    const submission = await query(`
      SELECT ws.submitted_by, wa.assigned_by
      FROM work_submissions ws
      JOIN work_assignments wa ON ws.assignment_id = wa.id
      WHERE ws.id = $1
    `, [submissionId]);

    if (submission.rows.length === 0) {
      return errorResponse('Submission not found', 404);
    }

    const { submitted_by, assigned_by } = submission.rows[0];

    // Permission check:
    // - CEO/COO can delete any submission
    // - Submitter can delete their own submission
    // - Assignment creator can delete submissions to their assignment
    const isCeoOrCoo = [ROLES.CEO, ROLES.COO].includes(user.roleId);
    const isSubmitter = submitted_by === user.userId;
    const isAssignmentCreator = assigned_by === user.userId;

    if (!isCeoOrCoo && !isSubmitter && !isAssignmentCreator) {
      return errorResponse('You do not have permission to delete this submission', 403);
    }

    // Perform delete
    const result = await query(
      'DELETE FROM work_submissions WHERE id = $1 RETURNING id',
      [submissionId]
    );

    if (result.rows.length === 0) {
      return errorResponse('Submission not found', 404);
    }

    logger.info(`Submission ${submissionId} deleted by ${user.username}`);

    return jsonResponse(true, 'Submission deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting submission:', error);
    return errorResponse('Error deleting submission', 500, error);
  }
}

