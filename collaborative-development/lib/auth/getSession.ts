import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { normalizeRole, getRoleRedirect } from '@/lib/roles/config';
import type { UserRole } from '@/lib/roles/config';

export interface SessionData {
  userId:   string;
  email:    string;
  role:     UserRole;
  redirect: string;
  name:     string;
}

/**
 * Server-side session helper — reads the current Supabase session from cookies
 * and returns a normalized session object with role and redirect path.
 * Returns null if the user is not authenticated.
 */
export async function getSession(): Promise<SessionData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll()           { return cookieStore.getAll(); },
      setAll(list)       { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Try profiles table first (new schema), then user_roles (old schema), then metadata
  let role: UserRole = 'inventory_manager';

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profile?.role) {
      role = normalizeRole(profile.role);
      return {
        userId:   user.id,
        email:    user.email ?? '',
        role,
        redirect: getRoleRedirect(role),
        name:     profile.name ?? user.email?.split('@')[0] ?? 'User',
      };
    }
  } catch { /* profiles table may not exist yet */ }

  try {
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleRow?.role) role = normalizeRole(roleRow.role);
  } catch { /* user_roles table fallback */ }

  // Final fallback: read from Supabase auth metadata
  if (user.user_metadata?.role) {
    role = normalizeRole(user.user_metadata.role as string);
  }

  return {
    userId:   user.id,
    email:    user.email ?? '',
    role,
    redirect: getRoleRedirect(role),
    name:     user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
  };
}
