"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminActiveUsers, adminApplications, AdminActiveUser, AdminApplication } from "@/lib/data/adminDashboardData";
import { Eye, Check, X } from "lucide-react";
import "./users.css";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "applications">("users");
  
  // Local state for mock functionality
  const [activeUsers, setActiveUsers] = useState<AdminActiveUser[]>(adminActiveUsers);
  const [applications, setApplications] = useState<AdminApplication[]>(adminApplications);
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<Readonly<AdminActiveUser | AdminApplication> | null>(null);

  // TODO: Replace with actual Supabase update calls in the future
  const handleRoleChange = (userId: number, newRole: string) => {
    setActiveUsers((prev) => 
      prev.map((u) => u.id === userId ? { ...u, role: newRole } : u)
    );
  };

  const handleVerify = (app: AdminApplication) => {
    // 1. Remove from applications
    setApplications((prev) => prev.filter((a) => a.id !== app.id));
    
    // 2. Add to active users
    const newUser: AdminActiveUser = {
      id: Date.now(), // Mock ID
      name: app.organization,
      email: app.email,
      role: "User", // Default role
      organization: app.organization,
      subscription: "None",
    };
    setActiveUsers((prev) => [...prev, newUser]);
  };

  return (
    <AdminLayout title={activeTab === "users" ? "Users" : "Applications"}>
      <div className="admin-users-container">

        {/* ─── Tabs Navigation ──────────────────────────────── */}
        <div className="admin-users-tabs">
          <button
            className={`admin-users-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Active Users
          </button>
          <button
            className={`admin-users-tab ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => setActiveTab("applications")}
          >
            Applications
          </button>
        </div>

        <div className="admin-users-card">
          <div className="admin-users-table-wrapper">
            
            {/* ─── Active Users Table ─────────────────────────── */}
            {activeTab === "users" && (
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Name</th>
                    <th style={{ width: "25%" }}>Email</th>
                    <th style={{ width: "15%" }}>Role</th>
                    <th style={{ width: "15%" }}>Organization</th>
                    <th style={{ width: "15%" }}>Subscription</th>
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
                      <td>{user.subscription}</td>
                      <td>
                        <button className="admin-users-action-btn" onClick={() => setSelectedUser(user as Readonly<AdminActiveUser>)}>
                          <Eye className="admin-users-action-icon" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#8c8a94", padding: "24px" }}>
                        No active users yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* ─── Applications Table ─────────────────────────── */}
            {activeTab === "applications" && (
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Organization</th>
                    <th style={{ width: "20%" }}>Email</th>
                    <th style={{ width: "15%" }}>Phone</th>
                    <th style={{ width: "25%" }}>Requirement</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "10%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="admin-users-column-bold">{app.organization}</td>
                      <td>{app.email}</td>
                      <td>{app.phone}</td>
                      <td>{app.requirement}</td>
                      <td>{app.status}</td>
                      <td>
                        <button 
                          className="admin-users-action-btn" 
                          onClick={() => handleVerify(app)}
                          style={{ color: "#16a34a" }}
                        >
                          <Check className="admin-users-action-icon" />
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#8c8a94", padding: "36px" }}>
                        No applications yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

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
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Organization:</strong> {selectedUser.organization}</p>
                {'role' in selectedUser && <p><strong>Role:</strong> {selectedUser.role}</p>}
                {'requirement' in selectedUser && <p><strong>Requirement:</strong> {selectedUser.requirement}</p>}
                {'phone' in selectedUser && <p><strong>Phone:</strong> {selectedUser.phone}</p>}
                
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
