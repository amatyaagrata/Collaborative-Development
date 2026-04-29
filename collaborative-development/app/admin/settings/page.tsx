"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
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

  // Load existing profile data
  useEffect(() => {
    async function loadUserData() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Error loading admin user:", error);
        toast.error("Failed to load user data");
        return;
      }

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

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (error) {
      console.error("Password verification error:", error);
      return false;
    }

    return true;
  };

  const handleApplyChanges = async () => {
    setIsLoading(true);

    try {
      // Update metadata (name, contact)
      if (
        user &&
        (userName !== (user.user_metadata?.full_name || "") ||
          contact !== String(user.user_metadata?.contact || ""))
      ) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            full_name: userName,
            contact: contact,
          }
        });

        if (metadataError) {
          toast.error("Failed to update profile: " + metadataError.message);
          setIsLoading(false);
          return;
        }
        toast.success("Profile information updated!");
      }

      // Update password
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match");
          setIsLoading(false);
          return;
        }

        if (newPassword.length < 6) {
          toast.error("New password must be at least 6 characters");
          setIsLoading(false);
          return;
        }

        const isValid = await verifyCurrentPassword();
        if (!isValid) {
          toast.error("Current password is incorrect");
          setIsLoading(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) {
          toast.error("Failed to update password: " + passwordError.message);
          setIsLoading(false);
          return;
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password updated successfully!");
      }

      // Update email
      if (user && email && email !== (user.email || "")) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) {
          toast.error("Failed to update email: " + emailError.message);
        } else {
          toast.success("Verification email sent! Please check your inbox.");
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      // Refresh local user state
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);

    } catch (error) {
      console.error("Error updating admin profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div className="admin-settings-container">
        <div className="admin-settings-card">
          <div className="admin-settings-form-grid">

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

            <div className="admin-settings-divider"></div>

            <div className="admin-settings-field">
              <label className="admin-settings-label">Current Password</label>
              <input
                type="password"
                className="admin-settings-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="admin-settings-field">
              <label className="admin-settings-label">New Password</label>
              <input
                type="password"
                className="admin-settings-input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="admin-settings-field">
              <label className="admin-settings-label">Confirm New Password</label>
              <input
                type="password"
                className="admin-settings-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-settings-actions">
            <button
              className="admin-settings-apply-btn"
              onClick={handleApplyChanges}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Apply Changes"}
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
