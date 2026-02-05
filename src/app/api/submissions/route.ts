import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import { validateBody, createSubmissionSchema } from '@/lib/utils/validation';
import { logAuditTrail } from '@/lib/services/sessionService';
import logger from '@/lib/db/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const result = await query(`
      SELECT ws.id, ws.assignment_id, ws.submitted_by, ws.submission_notes, ws.status,
             wa.title as assignment_title,
             u.username as submitted_by_username,
             ws.submission_date, ws.attachments
      FROM work_submissions ws
      JOIN work_assignments wa ON ws.assignment_id = wa.id
      JOIN users u ON ws.submitted_by = u.id
      WHERE ws.submitted_by = $1 OR wa.assigned_by = $1
      ORDER BY ws.submission_date DESC
    `, [user.userId]);

    return jsonResponse(true, 'Submissions retrieved', result.rows);
  } catch (error: any) {
    logger.error('Error fetching submissions:', error);
    return errorResponse('Error fetching submissions', 500, error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    try {
      await validateBody(createSubmissionSchema, body);
    } catch (e: any) {
      return errorResponse('Validation failed', 400, e.message);
    }

    const { assignmentId, submissionNotes, attachments } = body;

    // Verify assignment exists and is assigned to user
    const assignment = await query(
      'SELECT id FROM work_assignments WHERE id = $1 AND assigned_to = $2',
      [assignmentId, user.userId]
    );

    if (assignment.rows.length === 0) {
      return errorResponse('Assignment not found or not assigned to you', 404);
    }

    const result = await query(
      `INSERT INTO work_submissions (assignment_id, submitted_by, submission_notes, attachments)
       VALUES ($1, $2, $3, $4)
       RETURNING id, assignment_id, submitted_by, submission_notes, status, submission_date, attachments`,
      [assignmentId, user.userId, submissionNotes, JSON.stringify(attachments || [])]
    );

    // Update assignment status
    await query(
      `UPDATE work_assignments SET status = $1 WHERE id = $2`,
      ['submitted', assignmentId]
    );

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    logAuditTrail(
      user.userId,
      'SUBMISSION_CREATED',
      'work_submission',
      result.rows[0].id,
      { assignmentId },
      ipAddress,
      userAgent
    ).catch(err => console.error(err));

    logger.info(`Work submission created by ${user.username}`);

    return jsonResponse(true, 'Submission created', result.rows[0], 201);
  } catch (error: any) {
    logger.error('Error creating submission:', error);
    return errorResponse('Error creating submission', 500, error);
  }
}
