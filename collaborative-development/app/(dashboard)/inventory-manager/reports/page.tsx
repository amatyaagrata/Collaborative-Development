"use client";

import React from "react";
import { FileText, Download } from "lucide-react";

export default function IMReportsPage() {
  return (
    <>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>Inventory Reports</h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>View and download stock and order analytics.</p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 10, background: "#3b82f6", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} /> Export All
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e9ecf0", padding: 60, textAlign: "center", color: "#94a3b8" }}>
          <FileText size={48} style={{ margin: "0 auto 16px", opacity: 0.5, color: "#3b82f6" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#333", margin: "0 0 8px" }}>Reporting Module Coming Soon</h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>Advanced inventory analytics and automated reporting will be available here.</p>
        </div>
      </div>
    </>
  );
}
