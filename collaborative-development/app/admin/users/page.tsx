"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Eye, X, Loader2, RefreshCw } from "lucide-react";
import "./users.css";

// ─── Types matching the database schema ────────────────────────
interface DbUser {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  organization_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Map DB roles to display labels
const ROLE_DISPLAY: Record<string, string> = {
  admin: "Admin",
  supplier: "Supplier",
  transporter: "Driver",
  "inventory manager": "User",
};

const DISPLAY_TO_DB_ROLE: Record<string, string> = {
  Supplier: "supplier",
  Driver: "transporter",
  User: "inventory manager",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // ─── Fetch users from API ──────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/users");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch users");
      }

      setUsers(json.users || []);
    } catch (err) {
      console.error("[ADMIN-USERS] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Handle role change via API ────────────────────────────
  const handleRoleChange = async (userId: string, displayRole: string) => {
    const dbRole = DISPLAY_TO_DB_ROLE[displayRole];
    if (!dbRole) return;

    try {
      setUpdatingUserId(userId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: dbRole }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update role");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: dbRole } : u))
      );
    } catch (err) {
      console.error("[ADMIN-USERS] Role update error:", err);
      alert(`Failed to update role: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ─── Handle toggle active/inactive ────────────────────────
  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    try {
      setUpdatingUserId(userId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update status");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentlyActive } : u
        )
      );
    } catch (err) {
      console.error("[ADMIN-USERS] Status toggle error:", err);
      alert(`Failed to update status: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <AdminLayout title="Users">
      <div className="admin-users-container">

        <div className="admin-users-card">
          {/* ─── Header with refresh button ─────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 0" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a2e" }}>
              All Users ({users.length})
            </h2>
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", border: "1px solid #e0e0e0",
                borderRadius: "6px", background: "white", cursor: "pointer",
                fontSize: "13px", color: "#555",
              }}
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="admin-users-table-wrapper">
            {/* ─── Loading state ──────────────────────────────── */}
            {loading && users.length === 0 && (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px", color: "#8c8a94" }}>
                <Loader2 size={24} className="spin" style={{ marginRight: "8px" }} />
                Loading users from database...
              </div>
            )}

            {/* ─── Error state ────────────────────────────────── */}
            {error && (
              <div style={{ padding: "16px 20px", color: "#e53935", fontSize: "14px", background: "#fef2f2", borderRadius: "8px", margin: "12px 20px" }}>
                ⚠️ {error}
                <button onClick={fetchUsers} style={{ marginLeft: "12px", color: "#1a73e8", cursor: "pointer", border: "none", background: "none", textDecoration: "underline" }}>
                  Retry
                </button>
              </div>
            )}

            {/* ─── Users Table ────────────────────────────────── */}
            {(!loading || users.length > 0) && (
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Name</th>
                    <th style={{ width: "20%" }}>Email</th>
                    <th style={{ width: "15%" }}>Role</th>
                    <th style={{ width: "15%" }}>Organization</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "10%" }}>Joined</th>
                    <th style={{ width: "10%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ opacity: updatingUserId === user.id ? 0.6 : 1 }}>
                      <td className="admin-users-column-bold">{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.role === "admin" ? (
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "#7c3aed" }}>Admin</span>
                        ) : (
                          <select
                            className="admin-users-role-select"
                            value={ROLE_DISPLAY[user.role] || user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={updatingUserId === user.id}
                          >
                            <option value="Supplier">Supplier</option>
                            <option value="Driver">Driver</option>
                            <option value="User">User</option>
                          </select>
                        )}
                      </td>
                      <td>{user.organization_name || "—"}</td>
                      <td>
                        <span
                          className={`admin-users-status-badge ${user.is_active ? "active" : "inactive"}`}
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          style={{ cursor: "pointer" }}
                          title="Click to toggle status"
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ fontSize: "13px", color: "#8c8a94" }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button className="admin-users-action-btn" onClick={() => setSelectedUser(user)}>
                          <Eye className="admin-users-action-icon" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "#8c8a94", padding: "24px" }}>
                        No users found in the database
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ─── View Modal ─────────────────────────────────────── */}
        {selectedUser && (
          <div className="admin-users-modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="admin-users-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-users-modal-header">
                <h3>User Details</h3>
                <button className="admin-users-modal-close" onClick={() => setSelectedUser(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="admin-users-modal-body">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Phone:</strong> {selectedUser.phone || "—"}</p>
                <p><strong>Organization:</strong> {selectedUser.organization_name || "—"}</p>
                <p><strong>Role:</strong> {ROLE_DISPLAY[selectedUser.role] || selectedUser.role}</p>
                <p><strong>Status:</strong> {selectedUser.is_active ? "Active" : "Inactive"}</p>
                <p><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                <p><strong>Last Updated:</strong> {new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                {selectedUser.auth_user_id && (
                  <p style={{ marginTop: "12px", fontSize: "12px", color: "#8c8a94" }}>
                    <strong>Auth ID:</strong> {selectedUser.auth_user_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
