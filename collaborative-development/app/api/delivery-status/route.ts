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
    const { assignmentId, orderId, deliveryStatus } = body;

    if (!assignmentId || !deliveryStatus) {
      return NextResponse.json(
        { error: "Missing assignmentId or deliveryStatus" },
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

    // 2. Use admin client to look up the user
    const admin = createAdminClient();

    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id, role, org_id")
      .eq("auth_user_id", user.id)
      .single();

    if (userErr || !userRow) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      );
    }

    if (userRow.role !== "driver" && userRow.role !== "transporter") {
      return NextResponse.json(
        { error: "Only transporters can update delivery status" },
        { status: 403 }
      );
    }

    // 3. Get driver profile
    const { data: driverRow, error: driverErr } = await admin
      .from("drivers")
      .select("id")
      .eq("user_id", userRow.id)
      .single();

    if (driverErr || !driverRow) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 403 });
    }

    // 4. Verify assignment belongs to this driver
    const { data: assignment, error: assignmentErr } = await admin
      .from("order_driver_assignments")
      .select("id, driver_id, purchase_order_id")
      .eq("id", assignmentId)
      .single();

    if (assignmentErr || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.driver_id !== driverRow.id) {
      return NextResponse.json({ error: "This assignment is not yours" }, { status: 403 });
    }

    // 5. Perform the update using admin client (bypasses RLS)
    const { data: updatedAssign, error: updateAssignErr } = await admin
      .from("order_driver_assignments")
      .update({
        status: deliveryStatus,
        responded_at: new Date().toISOString()
      })
      .eq("id", assignmentId)
      .select()
      .single();

    if (updateAssignErr) throw updateAssignErr;
    if (!updatedAssign) {
      return NextResponse.json({ error: "Failed to update assignment. No rows matched." }, { status: 400 });
    }

    // 6. Sync purchase order status
    const poStatus = DELIVERY_TO_ORDER_STATUS[deliveryStatus as DeliveryStatus];
    const targetPoId = orderId || assignment.purchase_order_id;

    if (targetPoId) {
      const { error: poErr } = await admin
        .from("purchase_orders")
        .update({ status: poStatus || deliveryStatus })
        .eq("id", targetPoId);

      if (poErr) {
        console.error("[delivery-status] PO sync error:", poErr);
      } else {
        console.log(`[delivery-status] PO ${targetPoId} status → ${poStatus}`);
      }

      // 7. Stock auto-increment is handled by the database trigger
      //    (handle_purchase_order_delivery) when status → 'delivered'
      if (deliveryStatus === "delivered") {
        console.log(`[delivery-status] PO ${targetPoId} delivered — stock update handled by DB trigger`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[delivery-status API] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
