"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getSupplierOrders(supplierId: string) {
  try {
    const supabaseAdmin = createAdminClient();
    
    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .select(`
        id,
        order_number,
        status,
        priority,
        total_amount,
        expected_delivery_date,
        notes,
        created_at,
        supplier_id,
        order_items(
          id,
          quantity,
          unit_price,
          total_price,
          products(
            id,
            name,
            selling_price
          )
        ),
        suppliers!supplier_id(name, email),
        organizations!org_id(name, address, phone)
      `)
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getSupplierOrders] Error:", error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error("[getSupplierOrders] Unexpected error:", error);
    throw error;
  }
}
