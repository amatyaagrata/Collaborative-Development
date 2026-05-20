"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeRole } from "@/lib/roles/config";
import type { UserRole } from "@/lib/roles/config";

interface WelcomeMessageProps {
  className?: string;
  roleOverride?: string;
}

export function WelcomeMessage({ className, roleOverride }: WelcomeMessageProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [icon, setIcon] = useState("👋");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get display name and role from the users table (source of truth)
      let displayName =
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ??
        "there";

      // Fetch the user's record from the users table to check when they were added
      let isNewToOrg = false;
      let orgName = "";
      let pendingRequests = 0;
      let role: string = "inventory_manager";

      try {
        const { data: userRecord } = await supabase
          .from("users")
          .select("created_at, org_id, role, organizations(name)")
          .eq("auth_user_id", user.id)
          .single();

        if (userRecord) {
          // If the user record was created within the last 24 hours, treat as new
          const createdAt = new Date(userRecord.created_at);
          const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          isNewToOrg = hoursAgo < 24;

          role = normalizeRole(userRecord.role);

          if (userRecord.organizations) {
            orgName = (userRecord.organizations as any).name ?? "";
          }
        }
      } catch {
        // users table query failed — treat as returning user
      }

      // For admin: fetch pending request count via API
      if (role === "admin") {
        try {
          const res = await fetch("/api/admin/requests?counts=true");
          const json = await res.json();
          if (json.counts) {
            pendingRequests = json.counts.pending;
          }
        } catch (error) {
          console.error("[WelcomeMessage] Failed to fetch requests count:", error);
        }
      }

      // ── Pick the right message ──────────────────────────────────────────────

      if (isNewToOrg) {
        // New user to this organization
        setIcon("🎉");
        const orgText = orgName ? ` ${orgName}` : " GoGodam";
        setMessage(`Welcome to${orgText}, ${displayName}! Let's get you started.`);
      } else if (role === "admin") {
        // Admin returning user with pending count
        setIcon("📊");
        const pendingText =
          pendingRequests > 0
            ? ` You have ${pendingRequests} pending request${pendingRequests > 1 ? "s" : ""}.`
            : " No pending requests right now.";
        setMessage(`Welcome back, ${displayName}!${pendingText}`);
      } else {
        // Normal returning user
        setIcon("👋");
        const displayRole = roleOverride ?? role.replace("_", " ");
        setMessage(`Welcome back, ${displayName}! You're logged in as ${displayRole}.`);
      }
    }

    load();
  }, [supabase, roleOverride]);

  if (!message) return null;

  return (
    <div
      className={`welcome-message-banner ${className ?? ""}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)",
        border: "1px solid #e0e7ff",
        borderRadius: 14,
        padding: "14px 18px",
        marginBottom: 20,
        animation: "wmSlideDown 0.4s ease",
      }}
    >
      <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</span>
      <p style={{ fontSize: "0.92rem", color: "#374151", lineHeight: 1.5, margin: 0 }}>
        {message}
      </p>
      <style>{`
        @keyframes wmSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
