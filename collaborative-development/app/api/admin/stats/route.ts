import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/stats
 * Returns aggregated dashboard statistics from the database.
 * Uses the authenticated client to enforce RLS and isolate by organization.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all data in parallel for speed
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      supabase.from("products").select("id, name, current_stock, min_stock_level, unit"),
      supabase.from("purchase_orders").select("id, status, created_at, updated_at"),
      supabase.from("users").select("id, role, is_approved"),
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const users = usersRes.data || [];

    // ─── Activity Stats ─────────────────────────────────────
    const inventoryValue = products.reduce(
      (sum, p) => sum + (Number(p.current_stock) || 0),
      0
    );
    const totalStocks = products.reduce(
      (sum, p) => sum + (Number(p.current_stock) || 0),
      0
    );
    const pendingOrders = orders.filter((o) => o.status === "pending");
    const deliveredOrders = orders.filter((o) => o.status === "delivered");

    const stats = {
      inventoryValue: `${inventoryValue.toLocaleString("en-IN")} units`,
      totalStocks: totalStocks.toLocaleString("en-IN"),
      totalProducts: products.length,
      totalOrders: orders.length,
      newOrders: pendingOrders.length.toString(),
      delivered: deliveredOrders.length.toString(),
    };

    // ─── Product Summary ─────────────────────────────────────
    const quantityInHand = totalStocks;
    const toBeReceived = pendingOrders.length; // count of pending POs
    const total = quantityInHand + toBeReceived;
    const percentage = total > 0 ? Math.round((quantityInHand / total) * 100) : 0;

    const productSummary = {
      quantityInHand,
      toBeReceived,
      percentage,
    };

    // ─── Trending Products (top 4 by current_stock) ──────────────────
    const trendingProducts = [...products]
      .sort((a, b) => (Number(b.current_stock) || 0) - (Number(a.current_stock) || 0))
      .slice(0, 4)
      .map((p, idx) => ({
        id: idx + 1,
        product: p.name || "Product",
        suppliers: "—",
        productId: `#${String(idx + 1).padStart(3, "0")}`,
        category: "—",
        price: "—",
        quantity: Number(p.current_stock) || 0,
      }));

    // ─── Sales & Purchase (weekly from purchase_orders) ───────────────
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const salesByDay: Record<string, { Sales: number; Purchase: number }> = {};
    dayNames.forEach((d) => (salesByDay[d] = { Sales: 0, Purchase: 0 }));

    orders.forEach((o) => {
      const day = dayNames[new Date(o.created_at).getDay()];
      // purchase_orders has no total_amount — count orders instead
      if (o.status === "delivered") salesByDay[day].Sales += 1;
      salesByDay[day].Purchase += 1;
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
      active: users.filter((u) => u.is_approved).length,
      admins: users.filter((u) => u.role === "admin").length,
      suppliers: users.filter((u) => u.role === "supplier").length,
      transporters: users.filter((u) => u.role === "driver").length,
      inventoryManagers: users.filter((u) => u.role === "inventory_manager").length,
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
