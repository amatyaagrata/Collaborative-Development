"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrgId } from "./orgHelper";

export async function getUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getUserById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createUser(userData: {
  name: string;
  email: string;
  role: string;
  phone?: string;
}) {
  const supabase = await createClient();
  const orgId = await getCurrentUserOrgId();
  const payload: Record<string, unknown> = { ...userData };
  if (orgId) payload.organization_id = orgId;
  const { data, error } = await supabase
    .from("users")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUser(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUser(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
  return true;
}