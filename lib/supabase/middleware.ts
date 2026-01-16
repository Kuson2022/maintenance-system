import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Create a Supabase client for middleware
 * ใช้สำหรับ refresh session และ protect routes
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: ต้องเรียก getUser() เพื่อ refresh session
  // อย่าใช้ getSession() เพราะไม่ refresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 🔍 Debug logging (ลบออกตอน production)
  console.log("🔐 Middleware Check:", {
    pathname,
    hasUser: !!user,
    userEmail: user?.email || "none",
  });

  // ตรวจสอบว่าเป็น route ไหน
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isRootPage = pathname === "/";

  // Redirect root ไป dashboard ถ้ามี user แล้ว, ไม่งั้นไป login
  if (isRootPage) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    console.log("🔄 Redirecting from root to:", url.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged in users away from auth pages (login/register)
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    console.log("🔄 Logged in user tried to access auth page, redirecting to dashboard");
    return NextResponse.redirect(url);
  }

  // 🚨 PROTECT DASHBOARD: Redirect non-logged in users to login
  if (isDashboardPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // เก็บ original URL เพื่อ redirect กลับหลัง login
    url.searchParams.set("redirectTo", pathname);
    console.log("🚨 Unauthorized access to dashboard, redirecting to login");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}