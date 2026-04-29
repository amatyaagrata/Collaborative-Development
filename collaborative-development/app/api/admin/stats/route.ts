import { NextResponse } from "next/server";
import { createAdminClient, hasAdminClientConfig } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/stats
 * Returns aggregated dashboard statistics from the database.
 */
export async function GET() {
  try {
    let supabase;
    if (hasAdminClientConfig()) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    // Fetch all data in parallel for speed
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      supabase.from("products").select("id, price, stock, name, sku, is_active, category_id, supplier_id"),
      supabase.from("orders").select("id, status, total_amount, created_at, quantity, product_name, supplier_name, category"),
      supabase.from("users").select("id, role, is_active"),
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const users = usersRes.data || [];

    // ─── Activity Stats ─────────────────────────────────────
    const inventoryValue = products.reduce(
      (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
      0
    );
    const totalStocks = products.reduce(
      (sum, p) => sum + (Number(p.stock) || 0),
      0
    );
    const pendingOrders = orders.filter(
      (o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing"
    );
    const deliveredOrders = orders.filter((o) => o.status === "delivered");

    const stats = {
      inventoryValue: `Rs. ${inventoryValue.toLocaleString("en-IN")}`,
      totalStocks: totalStocks.toLocaleString("en-IN"),
      newOrders: pendingOrders.length.toString(),
      delivered: deliveredOrders.length.toString(),
    };

    // ─── Product Summary ─────────────────────────────────────
    const quantityInHand = totalStocks;
    const toBeReceived = pendingOrders.reduce(
      (sum, o) => sum + (Number(o.quantity) || 0),
      0
    );
    const total = quantityInHand + toBeReceived;
    const percentage = total > 0 ? Math.round((quantityInHand / total) * 100) : 0;

    const productSummary = {
      quantityInHand,
      toBeReceived,
      percentage,
    };

    // ─── Trending Products (top 4 by stock) ──────────────────
    const trendingProducts = [...products]
      .filter((p) => p.is_active !== false)
      .sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0))
      .slice(0, 4)
      .map((p, idx) => ({
        id: idx + 1,
        product: p.name || "Product",
        suppliers: "—",
        productId: p.sku || `#${String(idx + 1).padStart(3, "0")}`,
        category: "—",
        price: `$${Number(p.price || 0).toFixed(0)}`,
        quantity: Number(p.stock) || 0,
      }));

    // ─── Sales & Purchase (weekly from orders) ───────────────
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const salesByDay: Record<string, { Sales: number; Purchase: number }> = {};
    dayNames.forEach((d) => (salesByDay[d] = { Sales: 0, Purchase: 0 }));

    orders.forEach((o) => {
      const day = dayNames[new Date(o.created_at).getDay()];
      const amount = Number(o.total_amount) || 0;
      if (o.status === "delivered") {
        salesByDay[day].Sales += amount;
      }
      salesByDay[day].Purchase += amount;
    });

    const salesData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (name) => ({
        name,
        Sales: salesByDay[name].Sales,
        Purchase: salesByDay[name].Purchase,
      })
    );

    // ─── User counts ────────────────────────────────────────
    const userCounts = {
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      admins: users.filter((u) => u.role === "admin").length,
      suppliers: users.filter((u) => u.role === "supplier").length,
      transporters: users.filter((u) => u.role === "transporter").length,
      inventoryManagers: users.filter((u) => u.role === "inventory manager").length,
    };

    return NextResponse.json(
      {
        stats,
        productSummary,
        trendingProducts,
        salesData,
        userCounts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ADMIN-STATS] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
