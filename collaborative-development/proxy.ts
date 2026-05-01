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
  return 'inventory_manager';
}

function getRoleRedirect(role: UserRole): string {
  return ROLE_REDIRECTS[role] || '/dashboard';
}

export async function proxy(request: NextRequest) {
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

  // ✅ SKIP AUTH FOR API ROUTES
  if (path.startsWith('/api')) {
    return supabaseResponse;
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));

  if (isPublicRoute && user) {
    const role = await fetchUserRole(supabase, user.id);
    const redirectUrl = getRoleRedirect(role);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (isPublicRoute) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  const role = await fetchUserRole(supabase, user.id);
  const hasAccess = await checkUserAccess(supabase, user.id);

  if (!hasAccess) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'pending');
    return NextResponse.redirect(loginUrl);
  }

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

async function fetchUserRole(supabase: any, userId: string): Promise<UserRole> {
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    if (data?.role) return normalizeRole(data.role);
  } catch {
    // fall through
  }

  const { data: { user } } = await supabase.auth.getUser();
  return normalizeRole(user?.user_metadata?.role);
}

async function checkUserAccess(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();
    return !!data;
  } catch {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .single();
      if (data) return data.status === 'approved';
    } catch {
      // fall through
    }
  }
  return false;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};