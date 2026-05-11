import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendRejectionEmail } from "@/lib/email-service";

/**
 * GET /api/admin/requests?status=pending|approved|rejected
 * Returns access requests filtered by status.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";
    const wantCounts = url.searchParams.get("counts") === "true";

    // 1. Get current user session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get admin's organization_id
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (adminError || !adminUser) {
      console.error("[ADMIN-REQUESTS] Admin user not found:", adminError);
      return NextResponse.json({ error: "Admin profile not found" }, { status: 403 });
    }

    const orgId = adminUser.organization_id;
    if (!orgId) {
      // If it's a super admin without an org, they might see everything, 
      // but based on current requirements, admins are tied to orgs.
      // For now, let's return everything if no orgId (Super Admin) or handle accordingly.
      // The user screenshot shows "Admin | gogodamart", so orgId will exist.
    }

    const adminClient = createAdminClient();

    // 3. If requested, fetch counts for all statuses
    let counts = null;
    if (wantCounts) {
      const { count: pending } = await adminClient.from("access_requests").select("*", { count: "exact", head: true }).eq("status", "pending").eq("organization_id", orgId);
      const { count: approved } = await adminClient.from("access_requests").select("*", { count: "exact", head: true }).eq("status", "approved").eq("organization_id", orgId);
      const { count: rejected } = await adminClient.from("access_requests").select("*", { count: "exact", head: true }).eq("status", "rejected").eq("organization_id", orgId);
      counts = { pending: pending || 0, approved: approved || 0, rejected: rejected || 0 };
    }

    // 4. Fetch the actual requests for the requested status
    let query = adminClient
      .from("access_requests")
      .select("id, name, email, phone, requested_role, reason, status, terms_accepted, created_at, reviewed_at, rejection_reason")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (orgId) {
      query = query.eq("organization_id", orgId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[ADMIN-REQUESTS] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      requests: data ?? [],
      counts: counts
    });
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

    // ── Fetch the access request (Simple fetch to avoid schema join errors) ──
    console.log("[ADMIN-REQUESTS] Fetching request ID:", id);
    const { data: accessReq, error: fetchError } = await supabase
      .from("access_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("[ADMIN-REQUESTS] Database error:", fetchError);
      return NextResponse.json({ error: `Database error: ${fetchError.message}` }, { status: 500 });
    }

    if (!accessReq) {
      return NextResponse.json({ error: "Access request not found." }, { status: 404 });
    }

    // ── Manually fetch Organization Name to bypass join cache issues ──
    let orgName = "GoGodam";
    const orgId = accessReq.organization_id;
    
    if (orgId) {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single();
      
      if (orgData) orgName = orgData.name;
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
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Send Formal Rejection Email
      await sendRejectionEmail(accessReq.email, accessReq.name, orgName, rejection_reason);

      return NextResponse.json({ message: "Request rejected and email sent." });
    }

    // ── APPROVE ─────────────────────────────────────────────────────────────
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "A password of at least 6 characters is required to approve." },
        { status: 400 }
      );
    }

    // Step 1: Create auth user (or resolve if already exists)
    let authUserId: string | undefined;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: accessReq.email,
      password,
      email_confirm: true,
      user_metadata: {
        name: accessReq.name,
        role: accessReq.requested_role,
        phone: accessReq.phone,
        organization_id: orgId,
      },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      // If user already exists, we find them and proceed to link them to the new org
      if (msg.includes("already") || msg.includes("registered") || msg.includes("duplicate") || authError.status === 409) {
        console.log("[ADMIN-REQUESTS] User already exists in Auth. Resolving ID...");
        const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error("[ADMIN-REQUESTS] Failed to list users:", listError);
          return NextResponse.json({ error: "Could not resolve existing user." }, { status: 500 });
        }

        const existingUser = allUsers.find(u => u.email?.toLowerCase() === accessReq.email.toLowerCase());
        if (!existingUser) {
          return NextResponse.json({ error: "Email reported as registered but not found." }, { status: 500 });
        }
        authUserId = existingUser.id;
        console.log("[ADMIN-REQUESTS] Resolved existing user ID:", authUserId);

        // Update the password for the existing user so the one in the welcome email works
        const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
          password: password,
        });
        if (updateError) {
          console.warn("[ADMIN-REQUESTS] Failed to update existing user password:", updateError);
          // We continue anyway, as the user might already know their password
        }
      } else {
        console.error("[ADMIN-REQUESTS] Auth error:", authError);
        return NextResponse.json({ error: authError.message }, { status: authError.status || 500 });
      }
    } else {
      authUserId = authData.user?.id;
    }

    if (!authUserId) throw new Error("No user ID resolved");

    // Step 2: Upsert into users table
    const { data: upsertedUser, error: userUpsertError } = await supabase.from("users").upsert({
      auth_user_id: authUserId,
      organization_id: orgId,
      name: accessReq.name,
      email: accessReq.email,
      role: accessReq.requested_role,
      phone: accessReq.phone ?? null,
      is_active: true,
    }).select("id").single();

    if (userUpsertError) {
      console.error("[ADMIN-REQUESTS] User upsert error:", userUpsertError);
    }

    // Step 3: Upsert into user_roles table
    await supabase.from("user_roles").upsert({
      user_id: authUserId,
      organization_id: orgId,
      role: accessReq.requested_role,
    });

    // Step 3b: If supplier role, auto-create the supplier profile
    if (accessReq.requested_role === "supplier" && upsertedUser?.id) {
      const { error: supplierError } = await supabase
        .from("suppliers")
        .upsert({
          user_id: upsertedUser.id,
          organization_id: orgId,
          name: accessReq.name,
          contact_email: accessReq.email,
          contact_phone: accessReq.phone ?? null,
        }, { onConflict: "user_id" });

      if (supplierError) {
        console.warn("[ADMIN-REQUESTS] Supplier profile creation warning:", supplierError);
        // Non-fatal — the user can still log in, admin can manually create supplier
      } else {
        console.log("[ADMIN-REQUESTS] Supplier profile auto-created for:", accessReq.email);
      }
    }

    // Step 4: Mark access request as approved
    await supabase
      .from("access_requests")
      .update({
        status: "approved",
        reviewed_by: adminUserId ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Step 5: Send Formal Welcome Email with Temporary Password
    await sendWelcomeEmail(accessReq.email, accessReq.name, orgName, password);

    return NextResponse.json({
      message: "Request approved. User account created and welcome email sent.",
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
