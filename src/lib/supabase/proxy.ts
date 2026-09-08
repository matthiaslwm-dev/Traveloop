import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Urban Sprint pages anyone may see without signing in. The campaign leans on
 * its leaderboard being public, so the board and the landing page that
 * previews it are deliberately open, as is the pulse endpoint they poll.
 */
const URBAN_SPRINT_PUBLIC = [
  "/urban-sprint",
  "/urban-sprint/leaderboard",
  "/urban-sprint/login",
  "/urban-sprint/api/pulse",
];

/**
 * Refreshes the Supabase auth cookie and gates /admin, /account and the
 * signed-in half of /urban-sprint behind a logged-in session. Runs in proxy.ts
 * (this Next.js version's renamed middleware).
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

  // Urban Sprint is a separate product with its own roles, so "signed in" is
  // all that is checked here. *Which* Urban Sprint role a page needs is
  // decided by requireRole() in the page or action that serves the data —
  // proxy is the optimistic check, not the authorisation.
  if (pathname.startsWith("/urban-sprint")) {
    const isPublic = URBAN_SPRINT_PUBLIC.includes(pathname);

    if (!user && !isPublic) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/urban-sprint/login";
      // So a deep link survives the detour through the login form.
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
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
