"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import "./settings.css";

export default function SettingsPage() {
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

  // Load the existing profile once so the form starts with real account data.
  useEffect(() => {
    async function loadUserData() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Error loading user:", error);
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

  // Supabase does not expose a direct "check password" call, so we verify it by signing in again.
  const verifyCurrentPassword = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("No user found");
      return false;
    }

    if (!user.email) {
      toast.error("User email not available");
      return false;
    }

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
      // Update lightweight profile fields first so users still keep those changes
      // even if a password or email update fails later in the flow.
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

      if (user && email && email !== (user.email || "")) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) {
          toast.error("Failed to update email: " + emailError.message);
        } else {
          toast.success("Verification email sent! Please check your inbox and verify your new email.");
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);

    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="Settings">
      <div className="settings-container">
        <div className="settings-card">

          {/* Keep profile details and password fields together so account edits happen in one pass. */}
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
              <label className="settings-label">E-mail</label>
              <input
                type="email"
                className="settings-input"
                placeholder="@gmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <small className="settings-hint">Changing email will require verification</small>
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

            {/* This divider gives the password fields a little breathing room from the profile fields. */}
            <div className="settings-divider"></div>

            <div className="settings-field">
              <label className="settings-label">Current Password</label>
              <input
                type="password"
                className="settings-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">New Password</label>
              <input
                type="password"
                className="settings-input"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Confirm New Password</label>
              <input
                type="password"
                className="settings-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="settings-actions">
            <button 
              className="settings-apply-btn"
              onClick={handleApplyChanges}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Apply Changes"}
            </button>
          </div>

          {/* A short inline confirmation feels lighter than redirecting or reloading the page. */}
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
