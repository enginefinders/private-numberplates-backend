// // middleware.ts
// import { NextResponse } from "next/server";

// export function middleware(req) {
//   const res = NextResponse.next();
//   res.headers.set("Access-Control-Allow-Origin", "*");
//   res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PATCH,DELETE,PUT");
//   res.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Content-Type");
//   res.headers.set("Access-Control-Allow-Credentials", "true");

//   if (req.method === "OPTIONS") return new Response(null, { status: 200 });
//   return res;
// }

// export const config = {
//   matcher: "/api/:path*",
// };

import { NextResponse } from "next/server";

export function middleware(req) {
  const origin = req.headers.get("origin");
  const allowedOrigin = "https://private-numberplates.netlify.app";

  // 1. Handle Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PATCH,DELETE,PUT",
        "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // 2. Handle Actual Request
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PATCH,DELETE,PUT");
  res.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");

  return res;
}

export const config = {
  matcher: "/api/:path*",
};