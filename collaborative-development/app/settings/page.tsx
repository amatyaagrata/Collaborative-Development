"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import "./settings.css";

export default function SettingsPage() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleApplyChanges = () => {
    // Logic to save settings would go here
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <AppLayout title="Settings">
      <div className="settings-container">
        <div className="settings-card">
          <div className="settings-form-grid">
            <div className="settings-field">
              <label className="settings-label">User Name</label>
              <input
                type="text"
                className="settings-input"
                placeholder="Add User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">E-main</label>
              <input
                type="email"
                className="settings-input"
                placeholder="@gmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Contact</label>
              <input
                type="text"
                className="settings-input"
                placeholder="98xxxxxxxx"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div className="settings-divider"></div>

            <div className="settings-field">
              <label className="settings-label">Password</label>
              <input
                type="password"
                className="settings-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">New Password</label>
              <input
                type="password"
                className="settings-input"
                placeholder="Enter password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="settings-actions">
            <button 
              className="settings-apply-btn"
              onClick={handleApplyChanges}
            >
              Apply Changes
            </button>
          </div>

          {isSaved && (
            <div className="settings-success">
              Changes applied successfully!
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
