import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/requests
 * Returns all profiles with status = 'pending'
 */
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, role, phone, organization_id, status, created_at, organizations(name)")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[REQUESTS] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (err) {
    console.error("[REQUESTS] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/requests
 * Body: { id: string; action: "approve" | "reject" }
 * Approves or rejects a pending profile.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body as { id: string; action: "approve" | "reject" };

    if (!id || !action) {
      return NextResponse.json({ error: "id and action are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const newStatus = action === "approve" ? "approved" : "rejected";

    const { data, error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[REQUESTS] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data, message: `Profile ${newStatus} successfully.` });
  } catch (err) {
    console.error("[REQUESTS] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
