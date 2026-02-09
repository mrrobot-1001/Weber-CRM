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

    if (isNaN(submissionId) || submissionId <= 0) {
      return errorResponse('Invalid submission ID', 400);
    }

    // Get the submission to check ownership/permissions
    const submission = await query(`
      SELECT ws.id, ws.submitted_by, ws.status, wa.assigned_by, wa.title as assignment_title
      FROM work_submissions ws
      JOIN work_assignments wa ON ws.assignment_id = wa.id
      WHERE ws.id = $1
    `, [submissionId]);

    if (submission.rows.length === 0) {
      return errorResponse('Submission not found', 404);
    }

    const { submitted_by, assigned_by, assignment_title, status } = submission.rows[0];

    // Permission check:
    // - CEO/COO can delete any submission
    // - Submitter can delete their own submission (only if not evaluated)
    // - Assignment creator can delete submissions to their assignment (only if not evaluated)
    const isCeoOrCoo = [ROLES.CEO, ROLES.COO].includes(user.roleId);
    const isSubmitter = submitted_by === user.userId;
    const isAssignmentCreator = assigned_by === user.userId;

    if (!isCeoOrCoo && !isSubmitter && !isAssignmentCreator) {
      return errorResponse('You do not have permission to delete this submission', 403);
    }

    // Non-admins cannot delete evaluated submissions
    if (!isCeoOrCoo && status === 'evaluated') {
      return errorResponse('Cannot delete evaluated submissions. Only administrators can delete evaluated work.', 403);
    }

    // Check for related evaluations
    const evaluations = await query(
      'SELECT COUNT(*) as count FROM evaluations WHERE submission_id = $1',
      [submissionId]
    );

    const evaluationCount = parseInt(evaluations.rows[0].count);

    // Delete cascades to evaluations automatically via FK constraints
    const result = await query(
      'DELETE FROM work_submissions WHERE id = $1 RETURNING id, assignment_id',
      [submissionId]
    );

    if (result.rows.length === 0) {
      return errorResponse('Submission not found or already deleted', 404);
    }

    // Reset assignment status back to pending if this was the only submission
    const remainingSubmissions = await query(
      'SELECT COUNT(*) as count FROM work_submissions WHERE assignment_id = $1',
      [result.rows[0].assignment_id]
    );

    if (parseInt(remainingSubmissions.rows[0].count) === 0) {
      await query(
        'UPDATE work_assignments SET status = $1 WHERE id = $2',
        ['pending', result.rows[0].assignment_id]
      );
    }

    logger.info(
      `Submission ${submissionId} for assignment "${assignment_title}" deleted by user ${user.userId} ` +
      `(${user.username}). Deleted ${evaluationCount} related evaluation(s).`
    );

    return jsonResponse(true, 'Submission deleted successfully', {
      id: result.rows[0].id,
      evaluationsDeleted: evaluationCount,
    });
  } catch (error: any) {
    logger.error('Error deleting submission:', error);
    return errorResponse('Error deleting submission', 500, error);
  }
}

