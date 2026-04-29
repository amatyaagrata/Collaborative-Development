import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1);
    if (
      (val.startsWith("\"") && val.endsWith("\"")) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env keys. Need NEXT_PUBLIC_SUPABASE_URL, anon/publishable key, and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const client = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = Date.now();
const email = `smoke.inventory.${runId}@example.com`;
const password = "Password123!";
const ids = {
  authUserId: null,
  appUserId: null,
  categoryId: null,
  productId: null,
  orderId: null,
  orderItemId: null,
};

function assertNoError(step, error) {
  if (error) {
    throw new Error(`${step} failed: ${error.message}`);
  }
}

async function cleanup() {
  const adminDb = admin;

  if (ids.orderItemId) {
    await adminDb.from("order_items").delete().eq("id", ids.orderItemId);
  }
  if (ids.orderId) {
    await adminDb.from("orders").delete().eq("id", ids.orderId);
  }
  if (ids.productId) {
    await adminDb.from("products").delete().eq("id", ids.productId);
  }
  if (ids.categoryId) {
    await adminDb.from("categories").delete().eq("id", ids.categoryId);
  }
  if (ids.authUserId) {
    await adminDb.from("user_roles").delete().eq("user_id", ids.authUserId);
    await adminDb.from("users").delete().eq("auth_user_id", ids.authUserId);
    await admin.auth.admin.deleteUser(ids.authUserId);
  }
}

async function main() {
  console.log("Starting bruteforce smoke test...");
  try {
    const { data: createdUser, error: createAuthError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: "Smoke Tester",
        role: "inventory manager",
      },
    });
    assertNoError("create auth user", createAuthError);
    ids.authUserId = createdUser.user?.id ?? null;
    if (!ids.authUserId) throw new Error("create auth user failed: no user id returned");

    const { data: appUser, error: appUserError } = await admin
      .from("users")
      .upsert(
        {
          auth_user_id: ids.authUserId,
          name: "Smoke Tester",
          email,
          role: "inventory manager",
        },
        { onConflict: "auth_user_id" }
      )
      .select("id")
      .single();
    assertNoError("upsert users row", appUserError);
    ids.appUserId = appUser.id;

    const { error: roleError } = await admin.from("user_roles").upsert(
      {
        user_id: ids.authUserId,
        role: "inventory manager",
      },
      { onConflict: "user_id" }
    );
    assertNoError("upsert user_roles row", roleError);

    const { error: loginError } = await client.auth.signInWithPassword({ email, password });
    assertNoError("authenticated login", loginError);

    const { data: category, error: categoryInsertErr } = await client
      .from("categories")
      .insert([{ name: `Smoke Category ${runId}`, description: "smoke-test" }])
      .select("id")
      .single();
    assertNoError("insert category", categoryInsertErr);
    ids.categoryId = category.id;

    const { error: categoryUpdateErr } = await client
      .from("categories")
      .update({ description: "smoke-test-updated" })
      .eq("id", ids.categoryId);
    assertNoError("update category", categoryUpdateErr);

    const { data: product, error: productInsertErr } = await client
      .from("products")
      .insert([
        {
          name: `Smoke Product ${runId}`,
          price: 100,
          stock: 10,
          category_id: ids.categoryId,
        },
      ])
      .select("id")
      .single();
    assertNoError("insert product", productInsertErr);
    ids.productId = product.id;

    const { error: productUpdateErr } = await client
      .from("products")
      .update({ stock: 12 })
      .eq("id", ids.productId);
    assertNoError("update product", productUpdateErr);

    const { data: order, error: orderInsertErr } = await client
      .from("orders")
      .insert([
        {
          order_number: `ORD-SMOKE-${runId}`,
          product_name: `Smoke Product ${runId}`,
          supplier_name: "Smoke Supplier",
          custom_product_id: `SMK-${runId}`,
          category: "Smoke",
          total_price: 200,
          quantity: 2,
          total_amount: 200,
          status: "pending",
        },
      ])
      .select("id")
      .single();
    assertNoError("insert order", orderInsertErr);
    ids.orderId = order.id;

    const { data: orderItem, error: orderItemInsertErr } = await client
      .from("order_items")
      .insert([
        {
          order_id: ids.orderId,
          product_id: ids.productId,
          quantity: 2,
          unit_price: 100,
          total_price: 200,
        },
      ])
      .select("id")
      .single();
    assertNoError("insert order item", orderItemInsertErr);
    ids.orderItemId = orderItem.id;

    const { error: orderUpdateErr } = await client
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", ids.orderId);
    assertNoError("update order", orderUpdateErr);

    console.log("Smoke test PASSED: auth + inventory manager CRUD policies are working.");
  } finally {
    await cleanup();
    await client.auth.signOut();
  }
}

main().catch((err) => {
  console.error("Smoke test FAILED:", err.message);
  process.exit(1);
});
