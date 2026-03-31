"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";

interface Order {
  id: string;
  product: string;
  suppliers: string;
  productId: string;
  category: string;
  price: number;
  quantity: number;
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([
    { id: "1", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "2", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "3", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "4", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "5", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "6", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "7", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
  ]);

  const filteredOrders = orders.filter((order) =>
    order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.suppliers.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      setOrders(orders.filter((order) => order.id !== id));
      toast.success("Order deleted successfully");
    }
  };

  return (
    <AppLayout title="Orders">
      <div style={{ padding: "24px" }}>
        {/* Search and Add Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
            <svg
              style={{ position: "absolute", left: "12px", top: "10px", width: "20px", height: "20px", color: "#9ca3af" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 40px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
          <Link href="/orders/add">
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Order
            </button>
          </Link>
        </div>

        {/* Orders Table */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Product</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Suppliers</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Product Id</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Category</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Price</th>
                  <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Quantity</th>
                  <th style={{ padding: "12px 24px", textAlign: "right", fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.2s" }}>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500, color: "#111827", whiteSpace: "nowrap" }}>{order.product}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "#4b5563", whiteSpace: "nowrap" }}>{order.suppliers}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "#4b5563", whiteSpace: "nowrap" }}>{order.productId}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "#4b5563", whiteSpace: "nowrap" }}>{order.category}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 500, color: "#111827", whiteSpace: "nowrap" }}>${order.price}</td>
                    <td style={{ padding: "16px 24px", fontSize: "14px", color: "#4b5563", whiteSpace: "nowrap" }}>{order.quantity}</td>
                    <td style={{ padding: "16px 24px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
                        <Link href={`/orders/edit/${order.id}`} style={{ color: "#8b5cf6", textDecoration: "none" }} title="Edit">
                          <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button onClick={() => handleDelete(order.id)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }} title="Delete">
                          <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}