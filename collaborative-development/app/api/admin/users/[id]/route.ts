import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/users/[id]
 * Updates a user's role, status (is_active), or other fields.
 * Requires service_role for full admin access.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = await createClient();

    // Build the update object — only include fields that were sent
    const updates: Record<string, unknown> = {};
    if (body.role !== undefined) updates.role = body.role;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.organization_name !== undefined) updates.organization_name = body.organization_name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN-USERS] Error updating user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If role was changed, also update user_roles table
    if (body.role !== undefined) {
      // Try to update user_roles if the user has an auth_user_id
      if (data?.auth_user_id) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            {
              user_id: data.auth_user_id,
              role: body.role,
            },
            { onConflict: "user_id" }
          );

        if (roleError) {
          console.error("[ADMIN-USERS] Error updating user_roles:", roleError);
          // Non-fatal — the users table was already updated
        }
      }
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN-USERS] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Deactivates a user (soft delete by setting is_active = false).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // Soft delete — set is_active to false
    const { data, error } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN-USERS] Error deactivating user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN-USERS] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
