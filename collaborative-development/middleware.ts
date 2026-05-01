import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role configuration
type UserRole = 'admin' | 'inventory_manager' | 'supplier' | 'transporter';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  inventory_manager: '/inventory-manager/dashboard',
  supplier: '/supplier/dashboard',
  transporter: '/transporter/dashboard',
};

function normalizeRole(role: string): UserRole {
  if (role === 'admin') return 'admin';
  if (role === 'inventory_manager') return 'inventory_manager';
  if (role === 'supplier') return 'supplier';
  if (role === 'transporter') return 'transporter';
  return 'inventory_manager'; // default
}

function getRoleRedirect(role: UserRole): string {
  return ROLE_REDIRECTS[role] || '/dashboard';
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY."
    );
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));

  // If on public route and logged in, redirect to role dashboard
  if (isPublicRoute && user) {
    const role = await fetchUserRole(supabase, user.id);
    const redirectUrl = getRoleRedirect(role);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // If on public route and not logged in, allow access
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Protected routes - require authentication
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Fetch user role and status
  const role = await fetchUserRole(supabase, user.id);
  const status = await fetchUserStatus(supabase, user.id);

  // Block pending/rejected accounts
  if (status && status !== 'approved') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'pending');
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route restrictions
  const rolePrefixes = [
    { prefix: '/admin', requiredRole: 'admin' as UserRole },
    { prefix: '/inventory-manager', requiredRole: 'inventory_manager' as UserRole },
    { prefix: '/supplier', requiredRole: 'supplier' as UserRole },
    { prefix: '/transporter', requiredRole: 'transporter' as UserRole },
  ];

  for (const { prefix, requiredRole } of rolePrefixes) {
    if (path.startsWith(prefix) && role !== requiredRole) {
      return NextResponse.redirect(new URL(getRoleRedirect(role), request.url));
    }
  }

  return supabaseResponse;
}

// Helper functions
async function fetchUserRole(supabase: any, userId: string): Promise<UserRole> {
  // Try profiles table first
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (data?.role) return normalizeRole(data.role);
  } catch {
    // fall through
  }

  // Fallback to user_metadata
  const { data: { user } } = await supabase.auth.getUser();
  return normalizeRole(user?.user_metadata?.role);
}

async function fetchUserStatus(supabase: any, userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single();
    return data?.status ?? null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};