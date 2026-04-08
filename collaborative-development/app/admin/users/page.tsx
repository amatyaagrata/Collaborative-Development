"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminActiveUsers, AdminActiveUser } from "@/lib/data/adminDashboardData";
import { Eye, X } from "lucide-react";
import "./users.css";

export default function AdminUsersPage() {
  // Local state for mock functionality
  const [activeUsers, setActiveUsers] = useState<AdminActiveUser[]>(adminActiveUsers);
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<AdminActiveUser | null>(null);

  // TODO: Replace with actual Supabase update calls in the future
  const handleRoleChange = (userId: number, newRole: string) => {
    setActiveUsers((prev) => 
      prev.map((u) => u.id === userId ? { ...u, role: newRole } : u)
    );
  };

  return (
    <AdminLayout title="Users">
      <div className="admin-users-container">

        <div className="admin-users-card">
          <div className="admin-users-table-wrapper">
            
            {/* ─── Active Users Table ─────────────────────────── */}
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Name</th>
                  <th style={{ width: "20%" }}>Email</th>
                  <th style={{ width: "15%" }}>Role</th>
                  <th style={{ width: "15%" }}>Organization</th>
                  <th style={{ width: "10%" }}>Status</th>
                  <th style={{ width: "10%" }}>Subscription</th>
                  <th style={{ width: "10%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="admin-users-column-bold">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="admin-users-role-select"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="Supplier">Supplier</option>
                        <option value="Driver">Driver</option>
                        <option value="User">User</option>
                      </select>
                    </td>
                    <td>{user.organization}</td>
                    <td>
                      <span className={`admin-users-status-badge ${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.subscription}</td>
                    <td>
                      <button className="admin-users-action-btn" onClick={() => setSelectedUser(user)}>
                        <Eye className="admin-users-action-icon" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {activeUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#8c8a94", padding: "24px" }}>
                      No active users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          </div>
        </div>

        {/* ─── View Modal Mockup ─────────────────────────────── */}
        {selectedUser && (
          <div className="admin-users-modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="admin-users-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-users-modal-header">
                <h3>Participant Details</h3>
                <button className="admin-users-modal-close" onClick={() => setSelectedUser(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="admin-users-modal-body">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Organization:</strong> {selectedUser.organization}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
                <p><strong>Subscription:</strong> {selectedUser.subscription}</p>
                
                <div style={{ marginTop: '24px', fontSize: '13px', color: '#8c8a94' }}>
                  <p>In a real backend environment, this modal displays all the information collected during the organization signup process.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
