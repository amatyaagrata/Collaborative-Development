"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeRole, getRoleRedirect, ROLE_ROUTE_PREFIX } from "@/lib/roles/config";
import type { UserRole } from "@/lib/roles/config";

interface RoleGuardProps {
  /** The role that is allowed to view the wrapped content */
  allowedRole: UserRole;
  children: React.ReactNode;
}

/**
 * RoleGuard — client-side role guard.
 * Redirects unauthenticated users to /login.
 * Redirects users with a different role to their own dashboard.
 */
export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      let role: UserRole = normalizeRole(user.user_metadata?.role as string);

      // Try profiles table for most accurate role
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.status && profile.status !== "approved") {
            router.replace("/login?error=pending");
            return;
          }
          if (profile.role) role = normalizeRole(profile.role);
        }
      } catch { /* fall through */ }

      if (role !== allowedRole) {
        router.replace(getRoleRedirect(role));
        return;
      }

      setAuthorized(true);
      setChecking(false);
    }

    check();
  }, [supabase, router, allowedRole]);

  if (checking) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "#6b7280" }}>
        Verifying access…
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
