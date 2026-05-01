"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PendingProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  status: string;
  created_at: string;
  organizations?: { name: string } | null;
}

const ROLE_COLORS: Record<string, string> = {
  inventory_manager: "#3b82f6",
  "inventory manager": "#3b82f6",
  supplier:           "#f59e0b",
  transporter:        "#10b981",
  admin:              "#7c3aed",
};

const ROLE_LABELS: Record<string, string> = {
  inventory_manager: "Inventory Manager",
  "inventory manager": "Inventory Manager",
  supplier:           "Supplier",
  transporter:        "Transporter",
  admin:              "Admin",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/requests?status=${statusFilter}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch requests");
      setRequests(json.requests ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      setActionLoadingId(id);
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      toast.success(action === "approve" ? "✅ Account approved! User can now log in." : "❌ Request rejected.");
      await fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabs: { label: string; value: typeof statusFilter }[] = [
    { label: "Pending",  value: "pending"  },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>
              User Access Requests
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              Review and approve or reject signup requests from new users.
            </p>
          </div>
          <button onClick={fetchRequests} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff",
            fontSize: "0.8rem", cursor: "pointer", color: "#64748b",
          }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>

        {/* Status Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e9ecf0", paddingBottom: -1 }}>
          {tabs.map(tab => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)} style={{
              padding: "8px 18px", border: "none", cursor: "pointer", fontWeight: 600,
              fontSize: "0.85rem", borderRadius: "8px 8px 0 0",
              background: statusFilter === tab.value ? "#fff" : "transparent",
              color: statusFilter === tab.value ? "#7c3aed" : "#64748b",
              borderBottom: statusFilter === tab.value ? "2px solid #7c3aed" : "2px solid transparent",
              marginBottom: -2,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e9ecf0", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60, gap: 10, color: "#64748b" }}>
              <Loader2 size={22} className="spin" /> Loading requests…
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <Clock size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontWeight: 600, margin: "0 0 4px" }}>No {statusFilter} requests</p>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>New signup requests will appear here.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e9ecf0" }}>
                  {["Name", "Email", "Role", "Organization", "Phone", "Date", ...(statusFilter === "pending" ? ["Actions"] : ["Status"])].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, i) => (
                  <tr key={req.id} style={{ borderBottom: i < requests.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1a1a2e" }}>{req.name || "—"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#374151" }}>{req.email}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                        background: `${ROLE_COLORS[req.role] ?? "#6b7280"}18`,
                        color: ROLE_COLORS[req.role] ?? "#6b7280",
                      }}>
                        {ROLE_LABELS[req.role] ?? req.role}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#64748b" }}>
                      {(req.organizations as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#64748b" }}>{req.phone ?? "—"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#94a3b8" }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    {statusFilter === "pending" ? (
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleAction(req.id, "approve")}
                            disabled={actionLoadingId === req.id}
                            style={{
                              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                              border: "none", borderRadius: 8, background: "#dcfce7", color: "#16a34a",
                              fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                            }}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "reject")}
                            disabled={actionLoadingId === req.id}
                            style={{
                              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                              border: "none", borderRadius: 8, background: "#fee2e2", color: "#dc2626",
                              fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                            }}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    ) : (
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                          background: req.status === "approved" ? "#dcfce7" : "#fee2e2",
                          color: req.status === "approved" ? "#16a34a" : "#dc2626",
                        }}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <style jsx global>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
