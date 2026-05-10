import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * Fetches all users from the database for the admin panel.
 * Uses the authenticated client to enforce RLS and isolate by organization.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, phone, is_approved, created_at, approved_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN-USERS] Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users ?? [] }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN-USERS] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
