import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import { validateBody, createEvaluationSchema } from '@/lib/utils/validation';
import { canEvaluate, ROLES } from '@/lib/server/permissions';
import { logAuditTrail } from '@/lib/services/sessionService';
import logger from '@/lib/db/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Get query parameters for sorting/filtering
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'evaluation_date';
    const sortOrder = req.nextUrl.searchParams.get('sortOrder') || 'DESC';
    const rating = req.nextUrl.searchParams.get('rating');
    const status = req.nextUrl.searchParams.get('status');

    // Validate sort parameters to prevent SQL injection
    const validSortFields = ['evaluation_date', 'rating', 'status'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'evaluation_date';
    const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereClause = 'WHERE (e.evaluated_by = $1 OR ws.submitted_by = $1)';
    const params: (string | number)[] = [user.userId];

    if (rating && ['1', '2', '3', '4', '5'].includes(rating)) {
      whereClause += ` AND e.rating = $${params.length + 1}`;
      params.push(parseInt(rating));
    }

    if (status && ['pending', 'completed'].includes(status)) {
      whereClause += ` AND e.status = $${params.length + 1}`;
      params.push(status);
    }

    const result = await query(`
      SELECT e.id, e.submission_id, e.evaluated_by, e.rating, e.comments, e.status,
             ws.submitted_by, wa.title as assignment_title,
             u_eval.username as evaluated_by_username,
             u_sub.username as submitted_by_username,
             e.evaluation_date, e.feedback
      FROM evaluations e
      JOIN work_submissions ws ON e.submission_id = ws.id
      JOIN work_assignments wa ON ws.assignment_id = wa.id
      JOIN users u_eval ON e.evaluated_by = u_eval.id
      JOIN users u_sub ON ws.submitted_by = u_sub.id
      ${whereClause}
      ORDER BY e.${safeSortBy} ${safeSortOrder}
    `, params);

    return jsonResponse(true, 'Evaluations retrieved', result.rows);
  } catch (error: any) {
    logger.error('Error fetching evaluations:', error);
    return errorResponse('Error fetching evaluations', 500, error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!canEvaluate(user.roleId)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const body = await req.json();
    try {
      await validateBody(createEvaluationSchema, body);
    } catch (e: any) {
      return errorResponse('Validation failed', 400, e.message);
    }

    const { submissionId, rating, comments, feedback } = body;

    // Verify submission exists
    const submission = await query(`
      SELECT ws.id, wa.assigned_by FROM work_submissions ws
      JOIN work_assignments wa ON ws.assignment_id = wa.id
      WHERE ws.id = $1
    `, [submissionId]);

    if (submission.rows.length === 0) {
      return errorResponse('Submission not found', 404);
    }

    // Verify user is authorized to evaluate
    // The author of assignment OR CEO/COO
    const assignedBy = submission.rows[0].assigned_by;
    const isCEOorCOO = [ROLES.CEO, ROLES.COO].includes(user.roleId);
    
    if (user.userId !== assignedBy && !isCEOorCOO) {
      return errorResponse('Not authorized to evaluate this submission', 403);
    }

    const result = await query(
      `INSERT INTO evaluations (submission_id, evaluated_by, rating, comments, feedback)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, submission_id, evaluated_by, rating, comments, status, evaluation_date, feedback`,
      [submissionId, user.userId, rating, comments, JSON.stringify(feedback || {})]
    );

    // Update submission status
    await query(
      `UPDATE work_submissions SET status = $1 WHERE id = $2`,
      ['evaluated', submissionId]
    );

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await logAuditTrail(
      user.userId,
      'EVALUATION_CREATED',
      'evaluation',
      result.rows[0].id,
      { submissionId, rating },
      ipAddress,
      userAgent
    ).catch(() => {});

    logger.info(`Evaluation created by ${user.username}`);

    return jsonResponse(true, 'Evaluation created', result.rows[0], 201);
  } catch (error: any) {
    logger.error('Error creating evaluation:', error);
    return errorResponse('Error creating evaluation', 500, error);
  }
}
