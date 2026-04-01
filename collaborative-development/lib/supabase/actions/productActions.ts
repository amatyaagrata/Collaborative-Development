"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*");
  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
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
