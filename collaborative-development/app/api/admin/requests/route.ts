import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/requests?status=pending|approved|rejected
 * Reads from the `access_requests` table (which exists in the live DB).
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
 *   1. Fetch the access_request row
 *   2. Create a Supabase auth user (requires service_role key)
 *   3. Insert into `users` table with is_approved = true
 *   4. Mark access_request as approved
 *
 * On reject:
 *   1. Mark access_request as rejected
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

    // ── Fetch the access request ─────────────────────────────────────────────
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

    const now = new Date().toISOString();

    // ── REJECT ───────────────────────────────────────────────────────────────
    if (action === "reject") {
      const { error: updateError } = await supabase
        .from("access_requests")
        .update({
          status: "rejected",
          rejection_reason: rejection_reason ?? null,
          reviewed_by: adminUserId ?? null,
          reviewed_at: now,
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ message: "Request rejected successfully." });
    }

    // ── APPROVE ──────────────────────────────────────────────────────────────
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "A password of at least 6 characters is required to approve." },
        { status: 400 }
      );
    }

    // Step 1: Create auth user via admin API (requires SUPABASE_SERVICE_ROLE_KEY)
    console.log("[ADMIN-REQUESTS] Creating auth user for:", accessReq.email);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
      if (
        authError.message?.toLowerCase().includes("already") ||
        authError.message?.toLowerCase().includes("duplicate")
      ) {
        return NextResponse.json(
          { error: "An account already exists for this email." },
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
    // Schema: users(id, auth_user_id, name, email, role, phone, is_approved, approved_at)
    const { error: userError } = await supabase.from("users").upsert(
      {
        auth_user_id: authUserId,
        name: accessReq.name,
        email: accessReq.email,
        role: accessReq.requested_role,
        phone: accessReq.phone ?? null,
        is_approved: true,
        approved_at: now,
      },
      { onConflict: "auth_user_id" }
    );

    if (userError) {
      console.error("[ADMIN-REQUESTS] users upsert error:", userError);
      // Non-fatal — user can still log in via auth
    }

    // Step 3: Mark access_request as approved
    const { error: approveError } = await supabase
      .from("access_requests")
      .update({
        status: "approved",
        reviewed_by: adminUserId ?? null,
        reviewed_at: now,
      })
      .eq("id", id);

    if (approveError) {
      console.error("[ADMIN-REQUESTS] Approve update error:", approveError);
      return NextResponse.json({ error: approveError.message }, { status: 500 });
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
