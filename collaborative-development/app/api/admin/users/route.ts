import { NextResponse } from "next/server";
import { createAdminClient, hasAdminClientConfig } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * Fetches all users from the database for the admin panel.
 * Uses service_role client to bypass RLS when available.
 */
export async function GET() {
  try {
    let supabase;

    if (hasAdminClientConfig()) {
      // Use service_role client — bypasses RLS, can see ALL users
      supabase = createAdminClient();
    } else {
      // Fallback to server client (limited by RLS)
      supabase = await createClient();
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN-USERS] Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN-USERS] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
