"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, TrendingUp, Package, ShoppingCart, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function IMReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalInventoryValue: 0,
    totalProducts: 0,
    orderStatusCounts: {} as Record<string, number>,
    totalOrders: 0
  });

  useEffect(() => {
    async function fetchReportData() {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          supabase.from("products").select("price, stock"),
          supabase.from("orders").select("status")
        ]);

        const products = productsRes.data || [];
        const orders = ordersRes.data || [];

        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const statusCounts = orders.reduce((acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setData({
          totalInventoryValue: totalValue,
          totalProducts: products.length,
          orderStatusCounts: statusCounts,
          totalOrders: orders.length
        });
      } catch (err) {
        console.error("Report fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, [supabase]);

  if (loading) return <div style={{ textAlign: "center", padding: 60 }}><Loader2 className="animate-spin" /> Preparing report data...</div>;

  return (
    <>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>Inventory Reports</h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>Live snapshot of your stock and order performance.</p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 10, background: "#3b82f6", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} /> Export Report
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #e9ecf0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#64748b" }}>
              <TrendingUp size={16} /> <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Total Value</span>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e" }}>Rs. {data.totalInventoryValue.toLocaleString()}</div>
          </div>
          <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #e9ecf0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#64748b" }}>
              <Package size={16} /> <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>SKU Count</span>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e" }}>{data.totalProducts}</div>
          </div>
          <div style={{ background: "#fff", padding: 20, borderRadius: 12, border: "1px solid #e9ecf0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#64748b" }}>
              <ShoppingCart size={16} /> <span style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Total Orders</span>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e" }}>{data.totalOrders}</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e9ecf0", padding: 24 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a2e", marginBottom: 16 }}>Order Status Breakdown</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Count</th>
                <th style={{ padding: "12px 8px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.orderStatusCounts).map(([status, count]) => (
                <tr key={status} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 8px", fontWeight: 600, color: "#334155", textTransform: "capitalize" }}>{status.replace(/_/g, " ")}</td>
                  <td style={{ padding: "14px 8px", color: "#334155" }}>{count}</td>
                  <td style={{ padding: "14px 8px", color: "#64748b" }}>{((count / data.totalOrders) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.totalOrders === 0 && <p style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No order data available for breakdown.</p>}
        </div>
      </div>
    </>
  );
}
