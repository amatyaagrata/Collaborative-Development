"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Building2, Search, RefreshCw, Loader2, Mail, Phone, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Supplier } from "@/types/models";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);

      // Step 1: Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        return;
      }

      console.log("Logged in user:", user.email);

      // Step 2: Get user's organization - FIXED: use 'org_id' not 'organization_id'
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("org_id")  // Changed from "organization_id"
        .eq("auth_user_id", user.id)
        .single();

      if (userError) {
        console.error("User fetch error:", userError);
        return;
      }

      console.log("User org_id:", userRow?.org_id);

      // Step 3: Fetch suppliers for this organization - FIXED: use 'org_id' not 'organization_id'
      if (userRow?.org_id) {
        const { data, error } = await supabase
          .from("suppliers")
          .select("*")
          .eq("org_id", userRow.org_id)  // Changed from "organization_id"
          .order("name", { ascending: true });

        if (error) throw error;

        console.log("Suppliers found:", data?.length || 0);
        setSuppliers(data || []);
      } else {
        console.log("No org_id found for user");
        setSuppliers([]);
      }
    } catch (err) {
      console.error("Fetch suppliers error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // FIXED: Check for undefined properties
  const filteredSuppliers = suppliers.filter(s =>
    (s.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (s.contact_email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (s.address || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>Suppliers</h2>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>Manage suppliers registered under your organization.</p>
        </div>
        <button
          onClick={fetchSuppliers}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", fontSize: "0.8rem", cursor: "pointer", color: "#64748b" }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input
          type="text"
          placeholder="Search by name, email, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "12px 14px 12px 42px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e9ecf0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60, gap: 10, color: "#64748b" }}>
            <Loader2 size={22} className="spin" /> Loading suppliers...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <Building2 size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No suppliers found</p>
            <p style={{ fontSize: "0.8rem", marginTop: 8 }}>Add suppliers to get started</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, padding: 20 }}>
            {filteredSuppliers.map(supplier => (
              <div key={supplier.id} style={{ border: "1px solid #f1f5f9", borderRadius: 14, padding: 18, background: "#fcfcfd" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1a1a2e" }}>{supplier.name}</h3>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, background: supplier.is_active ? "#ecfdf5" : "#fef2f2", color: supplier.is_active ? "#059669" : "#dc2626", padding: "2px 8px", borderRadius: 20 }}>
                    {supplier.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b" }}>
                    <Mail size={14} /> {supplier.contact_email || "No email"}
                  </div>
                  {supplier.contact_phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b" }}>
                      <Phone size={14} /> {supplier.contact_phone}
                    </div>
                  )}
                  {supplier.address && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b" }}>
                      <MapPin size={14} /> {supplier.address}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx global>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}