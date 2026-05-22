"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Shield,
  Key,
  Building2
} from "lucide-react";

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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

    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark-mode');
    }
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
        const valRes = await fetch("/api/auth/validate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const valData = await valRes.json();
        
        if (!valData.valid) {
          toast.error(valData.reason || "This email address does not seem to exist.");
          setIsLoading(false);
          return;
        }

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
    <div className={`settings-page ${darkMode ? 'dark' : ''}`}>
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-content">
            <h1 className="settings-title">Account Settings</h1>
            <p className="settings-subtitle">Manage your profile information and security settings</p>
          </div>
        </div>

        <div className="settings-grid">
          {/* Profile Section */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon purple">
                <UserIcon size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Profile Information</h3>
                <p className="settings-card-subtitle">Update your personal details</p>
              </div>
            </div>
            <div className="settings-card-body">
              <div className="form-group">
                <label className="form-label">
                  <UserIcon size={14} />
                  Full Name
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your full name" 
                  value={userName} 
                  onChange={e => setUserName(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} />
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="your@email.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
                <p className="form-hint">Changing email will require verification</p>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Phone size={14} />
                  Contact Number
                </label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="Enter your phone number" 
                  value={contact} 
                  onChange={e => setContact(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon orange">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Security</h3>
                <p className="settings-card-subtitle">Change your password</p>
              </div>
            </div>
            <div className="settings-card-body">
              <div className="form-group">
                <label className="form-label">
                  <Lock size={14} />
                  Current Password
                </label>
                <div className="password-input-wrapper">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    className="form-input" 
                    placeholder="Enter current password" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Key size={14} />
                  New Password
                </label>
                <div className="password-input-wrapper">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    className="form-input" 
                    placeholder="Enter new password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="form-hint">Password must be at least 6 characters</p>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Key size={14} />
                  Confirm New Password
                </label>
                <div className="password-input-wrapper">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="form-input" 
                    placeholder="Confirm new password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="form-error">
                    <AlertCircle size={12} />
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="settings-actions">
          <button 
            className="settings-save-btn" 
            onClick={handleApplyChanges} 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner-small"></div>
            ) : (
              <Save size={16} />
            )}
            {isLoading ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>

        {/* Success Message */}
        {isSaved && (
          <div className="settings-success">
            <CheckCircle size={18} />
            Changes applied successfully!
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e9eef5 100%);
          transition: background 0.3s ease;
        }

        .settings-page.dark {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .settings-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
        }

        .settings-header {
          margin-bottom: 32px;
        }

        .settings-header-content {
          text-align: center;
        }

        .settings-title {
          font-size: 32px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .dark .settings-title {
          color: #ffffff;
          background: none;
          -webkit-background-clip: unset;
          background-clip: unset;
        }

        .settings-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .dark .settings-subtitle {
          color: #a0aec0;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .settings-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .settings-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .dark .settings-card {
          background: rgba(26, 26, 46, 0.95);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .settings-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dark .settings-card-header {
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        .settings-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-card-icon.purple {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .settings-card-icon.orange {
          background: #fef3c7;
          color: #f59e0b;
        }

        .dark .settings-card-icon.purple {
          background: rgba(124, 58, 237, 0.2);
        }

        .dark .settings-card-icon.orange {
          background: rgba(245, 158, 11, 0.2);
        }

        .settings-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .dark .settings-card-title {
          color: #ffffff;
        }

        .settings-card-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .dark .settings-card-subtitle {
          color: #a0aec0;
        }

        .settings-card-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .dark .form-label {
          color: #cbd5e1;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
        }

        .dark .form-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .form-input:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .dark .form-input::placeholder {
          color: #64748b;
        }

        .form-hint {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 6px;
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #dc2626;
          margin-top: 6px;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-input-wrapper .form-input {
          padding-right: 40px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
        }

        .password-toggle:hover {
          color: #7c3aed;
        }

        .settings-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
        }

        .settings-save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .settings-save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .settings-success {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          color: #16a34a;
          font-size: 14px;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }

        .dark .settings-success {
          background: rgba(22, 163, 74, 0.2);
          border-color: rgba(22, 163, 74, 0.3);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .settings-container {
            padding: 16px;
          }
          .settings-grid {
            grid-template-columns: 1fr;
          }
          .settings-title {
            font-size: 24px;
          }
          .settings-card-header {
            padding: 16px 20px;
          }
          .settings-card-body {
            padding: 20px;
          }
          .settings-actions {
            justify-content: stretch;
          }
          .settings-save-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}