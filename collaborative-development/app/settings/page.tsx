"use client";

// ============================================
// IMPORTS
// ============================================
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import "./settings.css";

// ============================================
// MAIN COMPONENT
// ============================================
export default function SettingsPage() {
  // Router for navigation (if needed for redirects)
  const router = useRouter();
  
  // Initialize Supabase client for database/auth operations
  const supabase = createClient();
  
  // ============================================
  // STATE VARIABLES
  // ============================================
  
  // User profile data states
  const [userName, setUserName] = useState("");      // User's full name
  const [email, setEmail] = useState("");             // User's email address
  const [contact, setContact] = useState("");         // User's contact number
  
  // Password management states
  const [currentPassword, setCurrentPassword] = useState("");  // For verification
  const [newPassword, setNewPassword] = useState("");          // New password to set
  const [confirmPassword, setConfirmPassword] = useState("");  // Confirm match
  
  // UI state management
  const [isLoading, setIsLoading] = useState(false);   // Disables button during API calls
  const [isSaved, setIsSaved] = useState(false);       // Shows success popup
  const [user, setUser] = useState(null);              // Stores full user object from Supabase

  // ============================================
  // EFFECTS
  // ============================================
  
  /**
   * Load current user data when component mounts
   * Fetches user info from Supabase and populates form fields
   */
  useEffect(() => {
    async function loadUserData() {
      // Fetch authenticated user from Supabase session
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // Handle error case
      if (error) {
        console.error("Error loading user:", error);
        toast.error("Failed to load user data");
        return;
      }
      
      // Populate state with existing user data
      if (user) {
        setUser(user);                                          // Store full user object
        setUserName(user.user_metadata?.full_name || "");      // Set name or empty string
        setEmail(user.email || "");                             // Set email or empty string
        setContact(user.user_metadata?.contact || "");         // Set contact or empty string
      }
    }
    
    loadUserData(); // Execute on component mount
  }, [supabase]); // Re-run if supabase client changes

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  /**
   * Verifies if the provided current password matches the user's actual password
   * @returns {Promise<boolean>} - Returns true if password is correct, false otherwise
   */
  const verifyCurrentPassword = async () => {
    // Get current user from session
    const { data: { user } } = await supabase.auth.getUser();
    
    // Validate user exists
    if (!user) {
      toast.error("No user found");
      return false;
    }
    
    // Attempt to sign in with provided credentials
    // If successful, password is correct; if error, password is wrong
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,           // User's email from session
      password: currentPassword,   // Password entered by user
    });
    
    // Log error for debugging but don't expose details to user
    if (error) {
      console.error("Password verification error:", error);
      return false;
    }
    
    return true; // Password verified successfully
  };

  // ============================================
  // MAIN HANDLER FUNCTION
  // ============================================
  
  /**
   * Handles applying all changes (profile info, password, email)
   * Validates input, updates Supabase, and provides user feedback
   */
  const handleApplyChanges = async () => {
    // Show loading state to prevent multiple submissions
    setIsLoading(true);
    
    try {
      // ----------------------------------------
      // PART 1: UPDATE PROFILE METADATA (Name & Contact)
      // ----------------------------------------
      // Check if name or contact actually changed
      if (userName !== user?.user_metadata?.full_name || contact !== user?.user_metadata?.contact) {
        // Update user metadata in Supabase
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            full_name: userName,   // New name
            contact: contact,       // New contact
          }
        });
        
        // Handle metadata update error
        if (metadataError) {
          toast.error("Failed to update profile: " + metadataError.message);
          setIsLoading(false);
          return; // Stop execution if profile update fails
        }
        toast.success("Profile information updated!");
      }
      
      // ----------------------------------------
      // PART 2: UPDATE PASSWORD (if provided)
      // ----------------------------------------
      // Only attempt password update if both fields are filled
      if (currentPassword && newPassword) {
        // Validation 1: Check if new password matches confirmation
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match");
          setIsLoading(false);
          return;
        }
        
        // Validation 2: Check minimum password length (security requirement)
        if (newPassword.length < 6) {
          toast.error("New password must be at least 6 characters");
          setIsLoading(false);
          return;
        }
        
        // Validation 3: Verify current password is correct
        const isValid = await verifyCurrentPassword();
        
        if (!isValid) {
          toast.error("Current password is incorrect");
          setIsLoading(false);
          return;
        }
        
        // All validations passed - update password in Supabase
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        // Handle password update error
        if (passwordError) {
          toast.error("Failed to update password: " + passwordError.message);
          setIsLoading(false);
          return;
        }
        
        // Clear password fields for security (remove from memory)
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password updated successfully!");
      }
      
     
      // PART 3: UPDATE EMAIL (if changed)
      // Check if email was modified
      if (email !== user?.email) {
        // Update email in Supabase (requires verification)
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });
        
        // Handle email update (non-critical, can continue even if fails)
        if (emailError) {
          toast.error("Failed to update email: " + emailError.message);
        } else {
          toast.success("Verification email sent! Please check your inbox and verify your new email.");
        }
      }
      

      // PART 4: SUCCESS FEEDBACK
      // Show success popup message
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000); // Auto-hide after 3 seconds
      
      // Refresh user data to reflect latest changes in state
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser); // Update user object with new data
      
    } catch (error) {
      // Catch any unexpected errors
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      // Always turn off loading state, even if error occurred
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER COMPONENT
  // ============================================
  
  return (
    <AppLayout title="Settings">
      <div className="settings-container">
        <div className="settings-card">
          
          {/* FORM FIELDS GRID */}
          <div className="settings-form-grid">
            
            {/* USER NAME FIELD */}
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

            {/* EMAIL FIELD with hint text */}
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

            {/* CONTACT FIELD */}
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

            {/* VISUAL DIVIDER */}
            <div className="settings-divider"></div>

            {/* CURRENT PASSWORD FIELD (for verification) */}
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

            {/* NEW PASSWORD FIELD */}
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

            {/* CONFIRM NEW PASSWORD FIELD */}
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

          {/* ACTION BUTTONS SECTION */}
          <div className="settings-actions">
            <button 
              className="settings-apply-btn"
              onClick={handleApplyChanges}
              disabled={isLoading}  // Disable button while loading
            >
              {isLoading ? "Updating..." : "Apply Changes"}  {/* Dynamic button text */}
            </button>
          </div>

          {/* SUCCESS POPUP MESSAGE (auto-hides after 3 seconds) */}
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