"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Building2, Search, RefreshCw, Loader2, Mail, Phone, MapPin, ChevronRight, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Update your Supplier interface to match your database
interface Supplier {
  id: string;
  org_id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const supabase = createClient();

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);

      // Step 1: Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        toast.error("Authentication error");
        return;
      }

      // Step 2: Get user's organization
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("org_id")
        .eq("auth_user_id", user.id)
        .single();

      if (userError) {
        console.error("User fetch error:", userError);
        toast.error("Failed to get user organization");
        return;
      }

      // Step 3: Fetch suppliers for this organization
      if (userRow?.org_id) {
        const { data, error } = await supabase
          .from("suppliers")
          .select("*")
          .eq("org_id", userRow.org_id)
          .order("name", { ascending: true });

        if (error) throw error;

        setSuppliers(data || []);
      } else {
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

  const filteredSuppliers = suppliers.filter(s =>
    (s.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (s.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (s.contact_person?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (s.address || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupplierClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleCloseModal = () => {
    setSelectedSupplier(null);
  };

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
          placeholder="Search by name, email, contact person, or address..."
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
              <div 
                key={supplier.id} 
                onClick={() => handleSupplierClick(supplier)}
                style={{ 
                  border: "1px solid #f1f5f9", 
                  borderRadius: 14, 
                  padding: 18, 
                  background: "#fcfcfd",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#f1f5f9";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1a1a2e" }}>{supplier.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, background: supplier.is_active ? "#ecfdf5" : "#fef2f2", color: supplier.is_active ? "#059669" : "#dc2626", padding: "2px 8px", borderRadius: 20 }}>
                      {supplier.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <ChevronRight size={16} style={{ color: "#94a3b8" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {supplier.contact_person && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b" }}>
                      <User size={14} /> {supplier.contact_person}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b" }}>
                    <Mail size={14} /> {supplier.email || "No email provided"}
                  </div>
                  {supplier.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b" }}>
                      <Phone size={14} /> {supplier.phone}
                    </div>
                  )}
                  {supplier.address && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#64748b" }}>
                      <MapPin size={14} /> {supplier.address.length > 50 ? `${supplier.address.substring(0, 50)}...` : supplier.address}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for supplier details */}
      {selectedSupplier && (
        <div 
          onClick={handleCloseModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              maxWidth: 500,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              position: "relative"
            }}
          >
            <div style={{ 
              padding: "24px 24px 20px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#1a1a2e" }}>
                  {selectedSupplier.name}
                </h3>
                <span style={{ 
                  fontSize: "0.7rem", 
                  fontWeight: 700, 
                  background: selectedSupplier.is_active ? "#ecfdf5" : "#fef2f2", 
                  color: selectedSupplier.is_active ? "#059669" : "#dc2626", 
                  padding: "2px 10px", 
                  borderRadius: 20,
                  display: "inline-block",
                  marginTop: 8
                }}>
                  {selectedSupplier.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 0,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {selectedSupplier.contact_person && (
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "block" }}>
                    Contact Person
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <User size={16} color="#64748b" />
                    <span style={{ fontSize: "0.9rem", color: "#1a1a2e" }}>{selectedSupplier.contact_person}</span>
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "block" }}>
                  Email
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Mail size={16} color="#64748b" />
                  <span style={{ fontSize: "0.9rem", color: "#1a1a2e" }}>
                    {selectedSupplier.email || "No email provided"}
                  </span>
                </div>
              </div>

              {selectedSupplier.phone && (
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "block" }}>
                    Phone
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Phone size={16} color="#64748b" />
                    <span style={{ fontSize: "0.9rem", color: "#1a1a2e" }}>{selectedSupplier.phone}</span>
                  </div>
                </div>
              )}

              {selectedSupplier.address && (
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "block" }}>
                    Address
                  </label>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <MapPin size={16} color="#64748b" style={{ marginTop: 2 }} />
                    <span style={{ fontSize: "0.9rem", color: "#1a1a2e", lineHeight: 1.5 }}>{selectedSupplier.address}</span>
                  </div>
                </div>
              )}

              {selectedSupplier.tax_number && (
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "block" }}>
                    Tax / VAT Number
                  </label>
                  <div style={{ fontSize: "0.9rem", color: "#1a1a2e" }}>{selectedSupplier.tax_number}</div>
                </div>
              )}

              {selectedSupplier.payment_terms && (
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "block" }}>
                    Payment Terms
                  </label>
                  <div style={{ fontSize: "0.9rem", color: "#1a1a2e" }}>{selectedSupplier.payment_terms}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}