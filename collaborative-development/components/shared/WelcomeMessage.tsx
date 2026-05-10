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

      try {
        const { data: dbUser } = await supabase
          .from("users")
          .select("name, role")
          .eq("auth_user_id", user.id)
          .single();

        if (dbUser?.name) displayName = dbUser.name;

        if (dbUser?.role) {
          const dbRole = normalizeRole(dbUser.role);

          if (dbRole === "admin") {
            // Count unapproved users as pending for admin
            const { count: pendingCount } = await supabase
              .from("users")
              .select("*", { count: "exact", head: true })
              .eq("is_approved", false);

            const pending = pendingCount ?? 0;
            setIcon("📊");
            const pendingText = pending > 0
              ? ` You have ${pending} pending approval${pending > 1 ? "s" : ""}.`
              : " No pending approvals right now.";
            setMessage(`Welcome back, ${displayName}!${pendingText}`);
          } else {
            const displayRole = roleOverride ?? dbRole.replace("_", " ");
            setIcon("👋");
            setMessage(`Welcome back, ${displayName}! You're logged in as ${displayRole}.`);
          }
          return;
        }
      } catch {
        // Fall through to metadata-based message
      }

      // Fallback: use auth metadata role
      const role: UserRole = normalizeRole(user.user_metadata?.role as string);
      const displayRole = roleOverride ?? role.replace("_", " ");
      setIcon("👋");
      setMessage(`Welcome back, ${displayName}! You're logged in as ${displayRole}.`);
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
