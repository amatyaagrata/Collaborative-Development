import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Default demo org ID from DATABASE_SCHEMA_V3.sql
const DEMO_ORG_ID = "a0000000-0000-0000-0000-000000000001";

/**
 * GET /api/admin/requests?status=pending|approved|rejected
 * Returns access requests filtered by status.
 */
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";

    const { data, error } = await supabase
      .from("access_requests")
      .select(
        "id, name, email, phone, requested_role, reason, status, terms_accepted, created_at, reviewed_at, rejection_reason"
      )
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN-REQUESTS] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (err) {
    console.error("[ADMIN-REQUESTS] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/requests
 * Body (approve): { id, action: "approve", password, adminUserId? }
 * Body (reject):  { id, action: "reject", rejection_reason? }
 *
 * On approve:
 *   1. Creates an auth user with the admin-supplied password
 *   2. Upserts into `users` and `user_roles` tables
 *   3. Marks the access_request as approved
 *
 * On reject:
 *   1. Marks the access_request as rejected with optional reason
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, password, rejection_reason, adminUserId } = body as {
      id: string;
      action: "approve" | "reject";
      password?: string;
      rejection_reason?: string;
      adminUserId?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: "id and action are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // ── Fetch the access request ────────────────────────────────────────────
    const { data: accessReq, error: fetchError } = await supabase
      .from("access_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !accessReq) {
      return NextResponse.json(
        { error: "Access request not found." },
        { status: 404 }
      );
    }

    if (accessReq.status !== "pending") {
      return NextResponse.json(
        { error: `Request is already ${accessReq.status}.` },
        { status: 409 }
      );
    }

    // ── REJECT ──────────────────────────────────────────────────────────────
    if (action === "reject") {
      const { error: updateError } = await supabase
        .from("access_requests")
        .update({
          status: "rejected",
          rejection_reason: rejection_reason ?? null,
          reviewed_by: adminUserId ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        console.error("[ADMIN-REQUESTS] Reject update error:", updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Request rejected successfully." });
    }

    // ── APPROVE ─────────────────────────────────────────────────────────────
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "A password of at least 6 characters is required to approve." },
        { status: 400 }
      );
    }

    // Step 1: Create auth user
    console.log("[ADMIN-REQUESTS] Creating auth user for:", accessReq.email);
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: accessReq.email,
        password,
        email_confirm: true,
        user_metadata: {
          name: accessReq.name,
          role: accessReq.requested_role,
          phone: accessReq.phone,
        },
      });

    if (authError) {
      console.error("[ADMIN-REQUESTS] Auth user creation error:", authError);

      // If user already exists in auth, try to continue gracefully
      if (
        authError.message?.toLowerCase().includes("already") ||
        authError.message?.toLowerCase().includes("duplicate")
      ) {
        return NextResponse.json(
          {
            error:
              "An auth account already exists for this email. If this user was previously approved, check the users table.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const authUserId = authData.user?.id;
    if (!authUserId) {
      return NextResponse.json(
        { error: "Auth user created but no ID returned." },
        { status: 500 }
      );
    }

    console.log("[ADMIN-REQUESTS] Auth user created:", authUserId);

    // Step 2: Upsert into `users` table
    const { error: userError } = await supabase.from("users").upsert(
      {
        auth_user_id: authUserId,
        organization_id: DEMO_ORG_ID,
        name: accessReq.name,
        email: accessReq.email,
        role: accessReq.requested_role,
        phone: accessReq.phone ?? null,
        is_active: true,
      },
      { onConflict: "auth_user_id" }
    );

    if (userError) {
      console.error("[ADMIN-REQUESTS] users upsert error:", userError);
      // Non-fatal — log and continue
    }

    // Step 3: Upsert into `user_roles` table
    const { error: roleError } = await supabase.from("user_roles").upsert(
      {
        user_id: authUserId,
        organization_id: DEMO_ORG_ID,
        role: accessReq.requested_role,
      },
      { onConflict: "user_id" }
    );

    if (roleError) {
      console.error("[ADMIN-REQUESTS] user_roles upsert error:", roleError);
      // Non-fatal — log and continue
    }

    // Step 4: Mark access request as approved
    const { error: approveError } = await supabase
      .from("access_requests")
      .update({
        status: "approved",
        reviewed_by: adminUserId ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (approveError) {
      console.error("[ADMIN-REQUESTS] Approve update error:", approveError);
      return NextResponse.json(
        { error: approveError.message },
        { status: 500 }
      );
    }

    console.log("[ADMIN-REQUESTS] Request approved for:", accessReq.email);

    return NextResponse.json({
      message: "Request approved. User account created successfully.",
      authUserId,
    });
  } catch (err) {
    console.error("[ADMIN-REQUESTS] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
