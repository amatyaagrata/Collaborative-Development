"use server";

import { createClient } from "@/lib/supabase/server";


export async function getOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      users:created_by (
        id,
        name,
        email
      ),
      order_items (
        id,
        quantity,
        price_at_order,
        supplier_products:supplier_product_id (
          id,
          price,
          products:product_id ( id, name )
        )
      ),
      suppliers:supplier_id ( id, name, address )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      users:created_by ( id, name, email ),
      order_items (
        id,
        quantity,
        price_at_order,
        supplier_products:supplier_product_id (
          id, price,
          products:product_id ( id, name )
        )
      ),
      suppliers:supplier_id ( id, name, address )
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createOrder(orderData: {
  created_by: string;
  supplier_id: string;
  priority?: 'high' | 'medium' | 'low';
  expected_delivery_days?: number;
  notes?: string;
  order_items: Array<{
    supplier_product_id: string;
    quantity: number;
    price_at_order: number;
  }>;
}) {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("purchase_orders")
    .insert([{
      created_by: orderData.created_by,
      supplier_id: orderData.supplier_id,
      priority: orderData.priority ?? 'medium',
      expected_delivery_days: orderData.expected_delivery_days,
      notes: orderData.notes,
      status: 'pending',
    }])
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order items
  const orderItemsData = orderData.order_items.map(item => ({
    purchase_order_id: order.id,
    supplier_product_id: item.supplier_product_id,
    quantity: item.quantity,
    price_at_order: item.price_at_order,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsData);

  if (itemsError) throw itemsError;

  return order;
}

export async function updateOrder(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
  if (error) throw error;
  return true;
}