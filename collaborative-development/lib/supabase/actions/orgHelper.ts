"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the current authenticated user's organization_id.
 * Returns null if the column doesn't exist yet (old schema).
 */
export async function getCurrentUserOrgId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Try user_roles first (canonical source for RLS)
    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!roleError && roleRow?.organization_id) {
      return roleRow.organization_id;
    }

    // Fallback: check users table
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!userError && userRow?.organization_id) {
      return userRow.organization_id;
    }

    // Schema doesn't have organization_id yet — that's OK
    return null;
  } catch {
    return null;
  }
}
