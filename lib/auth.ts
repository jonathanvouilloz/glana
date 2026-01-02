import { NextResponse } from 'next/server';

const API_KEY = process.env.API_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice(7) === API_KEY;
}

export function optionsResponse() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401, headers: corsHeaders }
  );
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: corsHeaders }
  );
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, ...data },
    { status, headers: corsHeaders }
  );
}
