import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const VALID_DELIVERY_STATUSES = ["accepted", "rejected", "in_transit", "delivered"] as const;
type DeliveryStatus = (typeof VALID_DELIVERY_STATUSES)[number];

const DELIVERY_TO_ORDER_STATUS: Record<DeliveryStatus, string> = {
  accepted: "accepted",
  rejected: "rejected",
  in_transit: "out_for_delivery",
  delivered: "delivered",
};

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, deliveryStatus } = body;

    if (!orderId || !deliveryStatus) {
      return NextResponse.json(
        { error: "Missing orderId or deliveryStatus" },
        { status: 400 }
      );
    }

    if (!VALID_DELIVERY_STATUSES.includes(deliveryStatus)) {
      return NextResponse.json(
        { error: `Invalid deliveryStatus: ${deliveryStatus}` },
        { status: 400 }
      );
    }

    // 1. Verify the caller is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Use admin client to look up the user and verify they are a transporter
    const admin = createAdminClient();

    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id, role, organization_id")
      .eq("auth_user_id", user.id)
      .single();

    if (userErr || !userRow) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      );
    }

    if (userRow.role !== "transporter") {
      return NextResponse.json(
        { error: "Only transporters can update delivery status" },
        { status: 403 }
      );
    }

    // 3. Verify the order belongs to this transporter
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, transporter_id, organization_id, delivery_status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.transporter_id !== userRow.id) {
      return NextResponse.json(
        { error: "This order is not assigned to you" },
        { status: 403 }
      );
    }

    if (order.organization_id !== userRow.organization_id) {
      return NextResponse.json(
        { error: "Organization mismatch" },
        { status: 403 }
      );
    }

    // 4. Perform the update using admin client (bypasses RLS)
    const { data: updated, error: updateErr } = await admin
      .from("orders")
      .update({
        delivery_status: deliveryStatus,
        status: DELIVERY_TO_ORDER_STATUS[deliveryStatus as DeliveryStatus],
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr) {
      console.error("[delivery-status API] Update error:", updateErr);
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("[delivery-status API] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
