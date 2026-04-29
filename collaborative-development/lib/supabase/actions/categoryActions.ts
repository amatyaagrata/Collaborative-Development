"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      products (
        id,
        name,
        price,
        stock
      )
    `)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getCategoryById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      products (
        id,
        name,
        price,
        stock
      )
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCategory(categoryData: {
  name: string;
  description?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert([categoryData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  return true;
}