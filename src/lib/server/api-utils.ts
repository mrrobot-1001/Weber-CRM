import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, validateCredentials } from '../utils/auth';
import { query } from '../db/pool';

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Optional: Check if session is active in DB, but JWT verification is usually enough for stateless
  // Here we trust the token if it verifies.
  // If strict session tracking is needed, we would check DB here.
  
  return payload as {
    userId: number;
    username: string;
    roleId: number;
    roleName: string;
  };
}

export function jsonResponse(success: boolean, message: string, data?: any, status: number = 200) {
  return NextResponse.json(
    {
      success,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message: string, status: number = 500, error?: any) {
  // console.error(message, error);
  return NextResponse.json(
    {
      success: false,
      message,
      errors: error ? [error.message || error] : undefined,
    },
    { status }
  );
}
