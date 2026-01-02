import { NextResponse } from 'next/server';

const API_KEY = process.env.API_KEY;

export function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice(7) === API_KEY;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, ...data },
    { status }
  );
}
