"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrgId } from "./orgHelper";

export async function getSuppliers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select(`
      *,
      products (
        id,
        name,
        price,
        stock
      )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSupplierById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
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

export async function createSupplier(supplierData: {
  name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
}) {
  const supabase = await createClient();
  const orgId = await getCurrentUserOrgId();
  const payload: Record<string, unknown> = { ...supplierData };
  if (orgId) payload.organization_id = orgId;
  const { data, error } = await supabase
    .from("suppliers")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSupplier(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
  return true;
}