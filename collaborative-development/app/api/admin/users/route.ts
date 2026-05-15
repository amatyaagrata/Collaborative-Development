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

    // First, get the current admin user to know their org_id
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[ADMIN-USERS] Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get admin's org_id - FIXED: use org_id
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("org_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== "admin") {
      console.error("[ADMIN-USERS] Not an admin:", adminError);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgId = adminUser.org_id;

    // Fetch users for this organization only - FIXED: use org_id and join with organizations
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id, 
        auth_user_id,
        name, 
        email, 
        role, 
        phone, 
        is_active,
        is_approved, 
        created_at, 
        approved_at,
        updated_at,
        organizations!org_id (
          name
        )
      `)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN-USERS] Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to include organization_name
    const transformedUsers = (users || []).map((user: any) => ({
      id: user.id,
      auth_user_id: user.auth_user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      organization_name: user.organizations?.name || null,
      is_active: user.is_active,
      is_approved: user.is_approved,
      created_at: user.created_at,
      approved_at: user.approved_at,
      updated_at: user.updated_at,
    }));

    return NextResponse.json({ users: transformedUsers }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN-USERS] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}