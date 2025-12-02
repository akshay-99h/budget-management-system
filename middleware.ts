import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the path requires authentication
  const protectedPaths = [
    "/dashboard",
    "/transactions",
    "/budgets",
    "/loans",
    "/reports",
    "/settings",
  ]
  
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  
  if (isProtectedPath) {
    // Check for session cookie
    const sessionToken = request.cookies.get("authjs.session-token") || 
                        request.cookies.get("__Secure-authjs.session-token")
    
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/loans/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
}

