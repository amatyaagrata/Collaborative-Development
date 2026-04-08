"use server";

import { createClient } from "@/lib/supabase/server";

export async function getOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users:user_id (
        id,
        name,
        email
      ),
      order_items (
        id,
        quantity,
        unit_price,
        products:product_id (
          id,
          name,
          price
        )
      ),
      deliveries (
        id,
        status,
        delivery_date,
        tracking_number
      )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users:user_id (
        id,
        name,
        email
      ),
      order_items (
        id,
        quantity,
        unit_price,
        products:product_id (
          id,
          name,
          price
        )
      ),
      deliveries (
        id,
        status,
        delivery_date,
        tracking_number
      )
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createOrder(orderData: {
  user_id: string;
  total_amount: number;
  status: string;
  order_items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}) {
  const supabase = await createClient();

  // Start a transaction
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([{
      user_id: orderData.user_id,
      total_amount: orderData.total_amount,
      status: orderData.status
    }])
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order items
  const orderItemsData = orderData.order_items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price
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
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
  return true;
}