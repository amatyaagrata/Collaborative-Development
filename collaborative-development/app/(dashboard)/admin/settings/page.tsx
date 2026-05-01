"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import "./settings.css";

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) { toast.error("Failed to load user data"); return; }
      if (user) {
        setUser(user);
        setUserName(user.user_metadata?.full_name || "");
        setEmail(user.email || "");
        setContact(String(user.user_metadata?.contact || ""));
      }
    }
    loadUserData();
  }, [supabase]);

  const verifyCurrentPassword = async () => {
    if (!user?.email) return false;
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    return !error;
  };

  const handleApplyChanges = async () => {
    setIsLoading(true);
    try {
      if (user && (userName !== (user.user_metadata?.full_name || "") || contact !== String(user.user_metadata?.contact || ""))) {
        const { error } = await supabase.auth.updateUser({ data: { full_name: userName, contact } });
        if (error) { toast.error("Failed to update profile: " + error.message); setIsLoading(false); return; }
        toast.success("Profile information updated!");
      }

      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) { toast.error("New passwords do not match"); setIsLoading(false); return; }
        if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); setIsLoading(false); return; }
        if (!(await verifyCurrentPassword())) { toast.error("Current password is incorrect"); setIsLoading(false); return; }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) { toast.error("Failed to update password: " + error.message); setIsLoading(false); return; }
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        toast.success("Password updated successfully!");
      }

      if (user && email && email !== (user.email || "")) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) toast.error("Failed to update email: " + error.message);
        else toast.success("Verification email sent! Please check your inbox.");
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="admin-settings-container">
        <div className="admin-settings-card">
          <div className="admin-settings-form-grid">
            <div className="admin-settings-field">
              <label className="admin-settings-label">User Name</label>
              <input type="text" className="admin-settings-input" placeholder="Add User Name" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
            <div className="admin-settings-field">
              <label className="admin-settings-label">E-mail</label>
              <input type="email" className="admin-settings-input" placeholder="@gmail" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="admin-settings-field">
              <label className="admin-settings-label">Contact</label>
              <input type="text" className="admin-settings-input" placeholder="98xxxxxxxx" value={contact} onChange={e => setContact(e.target.value)} />
            </div>
            <div className="admin-settings-divider" />
            <div className="admin-settings-field">
              <label className="admin-settings-label">Current Password</label>
              <input type="password" className="admin-settings-input" placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="admin-settings-field">
              <label className="admin-settings-label">New Password</label>
              <input type="password" className="admin-settings-input" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="admin-settings-field">
              <label className="admin-settings-label">Confirm New Password</label>
              <input type="password" className="admin-settings-input" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <div className="admin-settings-actions">
            <button className="admin-settings-apply-btn" onClick={handleApplyChanges} disabled={isLoading}>
              {isLoading ? "Updating..." : "Apply Changes"}
            </button>
          </div>
          {isSaved && <div className="admin-settings-success">Changes applied successfully!</div>}
        </div>
      </div>
    </>
  );
}
