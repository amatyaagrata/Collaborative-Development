"use server";

import { createClient } from "@/lib/supabase/server";

export async function getInventory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      stock,
      min_stock_level,
      suppliers:supplier_id (
        id,
        name
      ),
      categories:category_id (
        id,
        name
      )
    `)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getLowStockProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      stock,
      min_stock_level,
      suppliers:supplier_id (
        id,
        name
      ),
      categories:category_id (
        id,
        name
      )
    `)
    .lte("stock", "min_stock_level")
    .order("stock");
  if (error) throw error;
  return data;
}

export async function updateProductStock(id: string, newStock: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adjustProductStock(id: string, adjustment: number) {
  const supabase = await createClient();

  // First get current stock
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const newStock = Math.max(0, product.stock + adjustment);

  const { data, error } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInventoryValue() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("price, stock");
  if (error) throw error;

  const totalValue = data.reduce((sum, product) => {
    return sum + (product.price * product.stock);
  }, 0);

  return totalValue;
}

export async function getOutOfStockProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      stock,
      suppliers:supplier_id (
        id,
        name
      ),
      categories:category_id (
        id,
        name
      )
    `)
    .eq("stock", 0)
    .order("name");
  if (error) throw error;
  return data;
}