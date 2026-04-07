"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import "./settings.css";

export default function AdminSettingsPage() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleApplyChanges = () => {
    // TODO: Replace with Supabase API call to update admin profile
    setIsSaved(true);
    toast.success("Changes applied successfully!");
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <AdminLayout title="Settings">
      <div className="admin-settings-container">
        <div className="admin-settings-card">
          <div className="admin-settings-form-grid">

            {/* Row 1: User Name + E-mail */}
            <div className="admin-settings-field">
              <label className="admin-settings-label">User Name</label>
              <input
                type="text"
                className="admin-settings-input"
                placeholder="Add User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="admin-settings-field">
              <label className="admin-settings-label">E-mail</label>
              <input
                type="email"
                className="admin-settings-input"
                placeholder="@gmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Row 2: Contact */}
            <div className="admin-settings-field">
              <label className="admin-settings-label">Contact</label>
              <input
                type="text"
                className="admin-settings-input"
                placeholder="98xxxxxxxx"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            {/* Empty spacer for grid alignment */}
            <div></div>

            {/* Divider */}
            <div className="admin-settings-divider"></div>

            {/* Row 3: Password + New Password */}
            <div className="admin-settings-field">
              <label className="admin-settings-label">Password</label>
              <input
                type="password"
                className="admin-settings-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="admin-settings-field">
              <label className="admin-settings-label">New Password</label>
              <input
                type="password"
                className="admin-settings-input"
                placeholder="Enter password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-settings-actions">
            <button
              className="admin-settings-apply-btn"
              onClick={handleApplyChanges}
            >
              Apply Changes
            </button>
          </div>

          {isSaved && (
            <div className="admin-settings-success">
              Changes applied successfully!
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
