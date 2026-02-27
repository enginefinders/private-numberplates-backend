// middleware.ts
import { NextResponse } from "next/server";

export function middleware(req) {
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PATCH,DELETE,PUT");
  res.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Content-Type");
  res.headers.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return new Response(null, { status: 200 });
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
