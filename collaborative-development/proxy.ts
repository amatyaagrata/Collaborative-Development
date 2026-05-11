import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role configuration aligned with schema:
// DB stores: 'admin' | 'inventory_manager' | 'supplier' | 'driver'
// UI displays: 'admin' | 'inventory_manager' | 'supplier' | 'transporter'
type UserRole = 'admin' | 'inventory_manager' | 'supplier' | 'transporter';

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/request-access', '/register-org'];

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  inventory_manager: '/inventory-manager/dashboard',
  supplier: '/supplier/dashboard',
  transporter: '/transporter/dashboard',
};

/**
 * Normalizes DB role values to UI-facing role values.
 * Key mapping: 'driver' → 'transporter' (schema stores 'driver', UI calls it 'transporter')
 */
function normalizeRole(role: string | undefined | null): UserRole {
  switch (role) {
    case 'admin':              return 'admin';
    case 'inventory_manager':  return 'inventory_manager';
    case 'supplier':           return 'supplier';
    case 'driver':
    case 'transporter':        return 'transporter';
    default:                   return 'inventory_manager';
  }
}

function getRoleRedirect(role: UserRole): string {
  return ROLE_REDIRECTS[role] || '/login';
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Env not configured — allow request through and let page handle it
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Always call getUser() to refresh session cookies.
  // This is what prevents the "Failed to fetch RSC payload" error.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // ✅ Always allow API routes and Next.js internals
  if (path.startsWith('/api') || path.startsWith('/_next')) {
    return supabaseResponse;
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    path === route || path.startsWith(route + '/')
  );

  // Logged-in user on a public route → redirect to their dashboard
  if (isPublicRoute && user) {
    const hasAccess = await checkUserApproval(supabase, user.id);
    if (hasAccess) {
      const role = await fetchUserRole(supabase, user.id);
      const redirectUrl = getRoleRedirect(role);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Not logged in on public route → allow through
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Not logged in on protected route → redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Check approval status
  const hasAccess = await checkUserApproval(supabase, user.id);
  if (!hasAccess) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'pending');
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  const role = await fetchUserRole(supabase, user.id);
  const rolePrefixes: { prefix: string; requiredRole: UserRole }[] = [
    { prefix: '/admin',             requiredRole: 'admin'             },
    { prefix: '/inventory-manager', requiredRole: 'inventory_manager' },
    { prefix: '/supplier',          requiredRole: 'supplier'          },
    { prefix: '/transporter',       requiredRole: 'transporter'       },
  ];

  for (const { prefix, requiredRole } of rolePrefixes) {
    if (path.startsWith(prefix) && role !== requiredRole) {
      return NextResponse.redirect(new URL(getRoleRedirect(role), request.url));
    }
  }

  return supabaseResponse;
}

/**
 * Fetches the user's role from the users table (source of truth per schema).
 * Falls back to user_metadata if DB lookup fails.
 */
async function fetchUserRole(supabase: any, authUserId: string): Promise<UserRole> {
  try {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', authUserId)
      .single();
    if (data?.role) return normalizeRole(data.role);
  } catch {
    // fall through
  }

  // Fallback: user metadata set during signup
  const { data: { user } } = await supabase.auth.getUser();
  return normalizeRole(user?.user_metadata?.role);
}

/**
 * Checks if the user is approved to access the system.
 * Uses the users.is_approved column (source of truth per schema).
 */
async function checkUserApproval(supabase: any, authUserId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('users')
      .select('is_approved')
      .eq('auth_user_id', authUserId)
      .single();
    // If row not found, allow through (admin may not have is_approved set)
    if (!data) return true;
    return data.is_approved === true;
  } catch {
    // On error, allow through to avoid locking out everyone
    return true;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};