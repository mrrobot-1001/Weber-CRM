import { NextRequest } from 'next/server';
import { getAuthenticatedUser, jsonResponse, errorResponse } from '@/lib/server/api-utils';
import { query } from '@/lib/db/pool';
import logger from '@/lib/db/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    
    const { id } = await params;

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
      WHERE e.id = $1 AND (e.evaluated_by = $2 OR ws.submitted_by = $2)
    `, [id, user.userId]);

    if (result.rows.length === 0) {
      return errorResponse('Evaluation not found', 404);
    }

    return jsonResponse(true, 'Evaluation retrieved', result.rows[0]);
  } catch (error: any) {
    logger.error('Error fetching evaluation:', error);
    return errorResponse('Error fetching evaluation', 500, error);
  }
}
