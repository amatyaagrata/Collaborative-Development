"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, Loader2, Eye, EyeOff, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  requested_role: string;
  reason: string | null;
  status: string;
  terms_accepted: boolean;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  "inventory manager": "#3b82f6",
  inventory_manager:   "#3b82f6",
  supplier:            "#f59e0b",
  transporter:         "#10b981",
  admin:               "#7c3aed",
};

const ROLE_LABELS: Record<string, string> = {
  "inventory manager": "Inventory Manager",
  inventory_manager:   "Inventory Manager",
  supplier:            "Supplier",
  transporter:         "Transporter",
  admin:               "Admin",
};

// Add CSS animations to document head
const addAnimationStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('request-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'request-animation-styles';
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .spin { animation: spin 1s linear infinite; }
    `;
    document.head.appendChild(style);
  }
};

/* ── Approve Modal ─────────────────────────────────────────────────────────── */
function ApproveModal({
  request,
  onClose,
  onConfirm,
  loading,
}: {
  request: AccessRequest;
  onClose: () => void;
  onConfirm: (password: string) => void;
  loading: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [pwError, setPwError] = useState("");

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setConfirm(result);
    setPwError("");
  };

  const handleSubmit = () => {
    if (password.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwError("");
    onConfirm(password);
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ borderBottom: "1px solid #e9ecf0", padding: "20px 24px" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1a1a2e" }}>
            Approve Request
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
            Set a password for <strong>{request.name}</strong> ({request.email})
          </p>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Role:</span>
            <span style={{
              padding: "2px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
              background: `${ROLE_COLORS[request.requested_role] ?? "#6b7280"}18`,
              color: ROLE_COLORS[request.requested_role] ?? "#6b7280",
            }}>
              {ROLE_LABELS[request.requested_role] ?? request.requested_role}
            </span>
          </div>

          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={eyeBtn}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <div style={{ position: "relative" }}>
              <input
                type={showCfm ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowCfm(!showCfm)} style={eyeBtn}>
                {showCfm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwError && <p style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: 4 }}>{pwError}</p>}
          </div>

          <button
            type="button"
            onClick={generateRandomPassword}
            style={{
              padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#f8fafc", fontSize: "0.75rem", cursor: "pointer", color: "#64748b",
              alignSelf: "flex-start",
            }}
          >
            🔄 Generate Random Password
          </button>

          <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
            ⚠️ Share this password with the user securely. They can change it after logging in.
          </p>
        </div>

        <div style={{ borderTop: "1px solid #e9ecf0", padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !password || !confirm} style={approveBtn}>
            {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
            {loading ? " Approving..." : " Approve & Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reject Modal ──────────────────────────────────────────────────────────── */
function RejectModal({
  request,
  onClose,
  onConfirm,
  loading,
}: {
  request: AccessRequest;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: 440 }}>
        <div style={{ borderBottom: "1px solid #e9ecf0", padding: "20px 24px" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1a1a2e" }}>
            Reject Request
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
            Rejecting access request from <strong>{request.name}</strong>
          </p>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <label style={labelStyle}>Reason for rejection (optional)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Insufficient information provided, duplicate request..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ borderTop: "1px solid #e9ecf0", padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={cancelBtn}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading} style={rejectBtn}>
            {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={14} />}
            {loading ? " Rejecting..." : " Reject Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [approveTarget, setApproveTarget] = useState<AccessRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AccessRequest | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  // Add animation styles
  useEffect(() => {
    addAnimationStyles();
  }, []);

  // Get the current admin's user ID for auditing
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminUserId(data.user.id);
    });
  }, []);

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

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Fetch counts for each status
  useEffect(() => {
    const fetchCounts = async () => {
      const supabase = createClient();
      const { count: pending } = await supabase.from('access_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: approved } = await supabase.from('access_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved');
      const { count: rejected } = await supabase.from('access_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected');
      setCounts({ pending: pending || 0, approved: approved || 0, rejected: rejected || 0 });
    };
    fetchCounts();
  }, [requests]);

  // Filter requests by search term
  const filteredRequests = requests.filter(req =>
    req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.reason && req.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  /* ── Approve handler ── */
  const handleApprove = async (password: string) => {
    if (!approveTarget) return;
    try {
      setActionLoadingId(approveTarget.id);
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: approveTarget.id,
          action: "approve",
          password,
          adminUserId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Approval failed");
      
      toast.success(`✅ ${approveTarget.name}'s account has been created!`);
      console.log(`📧 Credentials for ${approveTarget.email}: Password: ${password}`);
      
      setApproveTarget(null);
      await fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ── Reject handler ── */
  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      setActionLoadingId(rejectTarget.id);
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rejectTarget.id,
          action: "reject",
          rejection_reason: reason || null,
          adminUserId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rejection failed");
      toast.success(`❌ Request from ${rejectTarget.name} rejected.`);
      setRejectTarget(null);
      await fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabs: { label: string; value: typeof statusFilter; count: number }[] = [
    { label: "Pending", value: "pending", count: counts.pending },
    { label: "Approved", value: "approved", count: counts.approved },
    { label: "Rejected", value: "rejected", count: counts.rejected },
  ];

  return (
    <>
      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          loading={actionLoadingId === approveTarget.id}
        />
      )}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          loading={actionLoadingId === rejectTarget.id}
        />
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>
              Access Requests
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              Review and approve or reject new user access requests
            </p>
          </div>
          <button 
            onClick={fetchRequests} 
            disabled={loading} 
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
              border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff",
              fontSize: "0.85rem", cursor: "pointer", color: "#64748b",
              transition: "all 0.2s",
            }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} /> 
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {tabs.map((tab) => (
            <div
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              style={{
                background: statusFilter === tab.value ? "#7c3aed" : "#fff",
                border: statusFilter === tab.value ? "none" : "1px solid #e2e8f0",
                borderRadius: 12, padding: "16px 20px", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 500, color: statusFilter === tab.value ? "#e9d5ff" : "#64748b" }}>
                {tab.label}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: statusFilter === tab.value ? "#fff" : "#1a1a2e" }}>
                {tab.count}
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 20, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search by name, email, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px 10px 38px", borderRadius: 10,
              border: "1px solid #e2e8f0", fontSize: "0.875rem", outline: "none",
            }}
          />
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e9ecf0", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60, gap: 10, color: "#64748b" }}>
              <Loader2 size={24} className="spin" /> Loading requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <Clock size={48} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
              <p style={{ fontWeight: 600, margin: "0 0 4px", fontSize: "1rem" }}>
                No {statusFilter} requests
              </p>
              <p style={{ fontSize: "0.875rem", margin: 0 }}>
                {statusFilter === "pending" 
                  ? "New access requests will appear here." 
                  : `There are no ${statusFilter} requests to display.`}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e9ecf0" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Name</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Email</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Role</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Reason</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Date</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>
                      {statusFilter === "pending" ? "Actions" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req, idx) => {
                    const isLastRow = idx === filteredRequests.length - 1;
                    return (
                      <tr key={req.id} style={{ borderBottom: isLastRow ? "none" : "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1a1a2e", whiteSpace: "nowrap" }}>{req.name}</td>
                        <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#374151" }}>{req.email}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                            background: `${ROLE_COLORS[req.requested_role] ?? "#6b7280"}15`,
                            color: ROLE_COLORS[req.requested_role] ?? "#6b7280",
                            whiteSpace: "nowrap",
                          }}>
                            {ROLE_LABELS[req.requested_role] ?? req.requested_role}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#64748b", maxWidth: 250 }}>
                          {req.reason ? (
                            <span title={req.reason} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {req.reason}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        {statusFilter === "pending" ? (
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                              <button
                                onClick={() => setApproveTarget(req)}
                                disabled={actionLoadingId === req.id}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                                  border: "none", borderRadius: 8, background: "#dcfce7", color: "#16a34a",
                                  fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                                }}
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                onClick={() => setRejectTarget(req)}
                                disabled={actionLoadingId === req.id}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                                  border: "none", borderRadius: 8, background: "#fee2e2", color: "#dc2626",
                                  fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                                }}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          </td>
                        ) : (
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                              <span style={{
                                padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                                background: req.status === "approved" ? "#dcfce7" : "#fee2e2",
                                color: req.status === "approved" ? "#16a34a" : "#dc2626",
                              }}>
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </span>
                              {req.status === "rejected" && req.rejection_reason && (
                                <span style={{ fontSize: "0.7rem", color: "#94a3b8", maxWidth: 200 }}>
                                  {req.rejection_reason.length > 50 ? req.rejection_reason.substring(0, 50) + "..." : req.rejection_reason}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Shared Styles ─────────────────────────────────────────────────────────── */
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 50,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
};

const modal: React.CSSProperties = {
  background: "#fff", borderRadius: 20, width: "100%", maxWidth: 500,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)", margin: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.8rem", fontWeight: 600,
  color: "#374151", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 40px 10px 12px", borderRadius: 10,
  border: "1px solid #d1d5db", fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box", color: "#1a1a2e",
};

const eyeBtn: React.CSSProperties = {
  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex",
};

const cancelBtn: React.CSSProperties = {
  padding: "8px 20px", borderRadius: 10, border: "1px solid #e2e8f0",
  background: "#fff", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", color: "#64748b",
};

const approveBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "8px 20px", borderRadius: 10, border: "none",
  background: "#7c3aed", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
};

const rejectBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "8px 20px", borderRadius: 10, border: "none",
  background: "#dc2626", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
};