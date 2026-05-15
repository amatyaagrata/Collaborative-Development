import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";
    const wantCounts = url.searchParams.get("counts") === "true";

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get admin user from users table (uses org_id)
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("org_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== "admin") {
      console.error("[ADMIN-REQUESTS] Admin user not found:", adminError);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgId = adminUser.org_id;
    const adminClient = createAdminClient();

    let counts = null;
    if (wantCounts) {
      const { count: pending } = await adminClient
        .from("access_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("organization_id", orgId);
      
      const { count: approved } = await adminClient
        .from("access_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .eq("organization_id", orgId);
      
      const { count: rejected } = await adminClient
        .from("access_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected")
        .eq("organization_id", orgId);
      
      counts = { pending: pending || 0, approved: approved || 0, rejected: rejected || 0 };
    }

    const { data, error } = await adminClient
      .from("access_requests")
      .select("id, name, email, phone, requested_role, reason, status, terms_accepted, created_at, reviewed_at, rejection_reason")
      .eq("status", status)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, password, rejection_reason, adminUserId } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id and action are required." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: accessReq, error: fetchError } = await supabase
      .from("access_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !accessReq) {
      return NextResponse.json({ error: "Access request not found." }, { status: 404 });
    }

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
      return NextResponse.json({ error: `Request is already ${accessReq.status}.` }, { status: 409 });
    }

    // REJECT
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

      return NextResponse.json({ message: "Request rejected" });
    }

    // APPROVE
    if (action === "approve") {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

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
        if (msg.includes("already") || msg.includes("registered") || msg.includes("duplicate")) {
          const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
          const existingUser = allUsers.find(u => u.email?.toLowerCase() === accessReq.email.toLowerCase());
          if (!existingUser) {
            return NextResponse.json({ error: "User not found." }, { status: 500 });
          }
          authUserId = existingUser.id;
          await supabase.auth.admin.updateUserById(authUserId, { password });
        } else {
          return NextResponse.json({ error: authError.message }, { status: authError.status || 500 });
        }
      } else {
        authUserId = authData.user?.id;
      }

      // Insert into users table (uses org_id)
      await supabase.from("users").insert({
        auth_user_id: authUserId,
        org_id: orgId,
        name: accessReq.name,
        email: accessReq.email,
        role: accessReq.requested_role,
        phone: accessReq.phone ?? null,
        is_active: true,
        is_approved: true,
      });

      // If supplier, create supplier profile (uses org_id)
      if (accessReq.requested_role === "supplier") {
        const { data: newUser } = await supabase
          .from("users")
          .select("id")
          .eq("auth_user_id", authUserId)
          .single();

        if (newUser) {
          await supabase.from("suppliers").insert({
            user_id: newUser.id,
            org_id: orgId,
            name: accessReq.name,
            email: accessReq.email,
            phone: accessReq.phone ?? null,
            is_active: true,
          });
        }
      }

      await supabase
        .from("access_requests")
        .update({
          status: "approved",
          reviewed_by: adminUserId ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({ message: "Request approved. User account created." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[ADMIN-REQUESTS] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}