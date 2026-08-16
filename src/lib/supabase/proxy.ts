import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth cookie and gates /admin and /account behind a
 * logged-in session. Runs in proxy.ts (this Next.js version's renamed
 * middleware).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set.");
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Customers get their own Supabase Auth accounts too, so "is signed in" is
  // not "is the admin" — the admin session must belong to ADMIN_LOGIN_EMAIL.
  const isAdmin = Boolean(user && user.email === process.env.ADMIN_LOGIN_EMAIL);

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!isAdmin && pathname !== "/admin/login") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }

    if (isAdmin && pathname === "/admin/login") {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      return NextResponse.redirect(adminUrl);
    }
  }

  if (pathname.startsWith("/account")) {
    if (!user && pathname !== "/account/login") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/account/login";
      return NextResponse.redirect(loginUrl);
    }

    if (user && pathname === "/account/login") {
      const accountUrl = request.nextUrl.clone();
      accountUrl.pathname = "/account";
      return NextResponse.redirect(accountUrl);
    }
  }

  return response;
}
