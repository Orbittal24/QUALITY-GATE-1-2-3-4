import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export function middleware(request) {
  console.log("middleware");
  return NextResponse.redirect(new URL("/auth/signin", request.url));
}

export const config = {
  matcher: ["/:path " ],
};