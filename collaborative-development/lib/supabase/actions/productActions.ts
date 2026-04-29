"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      suppliers:supplier_id (
        id,
        name,
        contact_email,
        contact_phone
      ),
      categories:category_id (
        id,
        name,
        description
      )
    `);
  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      suppliers:supplier_id (
        id,
        name,
        contact_email,
        contact_phone
      ),
      categories:category_id (
        id,
        name,
        description
      )
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createProduct(productData: { name: string; price: number; stock: number; category_id?: string; supplier_id?: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert([productData]).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return true;
}
