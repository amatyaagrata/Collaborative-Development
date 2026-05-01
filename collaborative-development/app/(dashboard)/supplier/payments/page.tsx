"use client";

import React from "react";
import { CreditCard, Download } from "lucide-react";

export default function SupplierPaymentsPage() {
  return (
    <>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#451a03", margin: "0 0 4px" }}>Payment History</h2>
            <p style={{ fontSize: "0.875rem", color: "#78350f", margin: 0 }}>View your invoices and pending payments.</p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 10, background: "#f59e0b", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} /> Download Statement
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1e6de", padding: 60, textAlign: "center", color: "#78350f" }}>
          <CreditCard size={48} style={{ margin: "0 auto 16px", opacity: 0.5, color: "#f59e0b" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#451a03", margin: "0 0 8px" }}>Payments Module Coming Soon</h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>Invoice generation and payment tracking will be available here.</p>
        </div>
      </div>
    </>
  );
}
