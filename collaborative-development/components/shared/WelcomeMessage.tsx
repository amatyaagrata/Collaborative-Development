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

      const role: UserRole = normalizeRole(user.user_metadata?.role as string);
      const displayName =
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ??
        "there";

      // Fetch profile data
      let isFirstLogin = false;
      let pendingRequests = 0;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_first_login, name")
          .eq("id", user.id)
          .single();

        isFirstLogin = profile?.is_first_login ?? false;

        if (isFirstLogin) {
          await supabase
            .from("profiles")
            .update({ is_first_login: false })
            .eq("id", user.id);
        }
      } catch {
        // profiles table may not exist — treat as returning user
      }

      // For admin: fetch pending request count
      if (role === "admin") {
        try {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");
          pendingRequests = count ?? 0;
        } catch {
          // ignore
        }
      }

      // ── Pick the right message ──────────────────────────────────────────────

      if (isFirstLogin) {
        // New user — first time ever
        setIcon("🎉");
        setMessage(`Welcome to GoGodam! Let's get started, ${displayName}.`);
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
