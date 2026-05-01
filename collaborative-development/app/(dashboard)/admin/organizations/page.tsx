"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Building2, Plus, RefreshCw, Loader2, Edit2, X } from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  const fetchOrgs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/organizations");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOrgs(json.organizations ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Organization name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: editOrg ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editOrg ? { id: editOrg.id, ...form } : form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(editOrg ? "Organization updated!" : "Organization created!");
      setShowForm(false);
      setEditOrg(null);
      setForm({ name: "", phone: "", address: "" });
      await fetchOrgs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (org: Organization) => {
    setEditOrg(org);
    setForm({ name: org.name, phone: org.phone ?? "", address: org.address ?? "" });
    setShowForm(true);
  };

  return (
    <>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>Organizations</h2>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>Manage all registered organizations on the platform.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={fetchOrgs} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", fontSize: "0.8rem", cursor: "pointer", color: "#64748b" }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => { setShowForm(true); setEditOrg(null); setForm({ name: "", phone: "", address: "" }); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 10, background: "#7c3aed", fontSize: "0.8rem", cursor: "pointer", color: "#fff", fontWeight: 600 }}>
              <Plus size={14} /> Add Organization
            </button>
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, position: "relative" }}>
              <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
              <h3 style={{ margin: "0 0 20px", fontWeight: 700, color: "#1a1a2e" }}>{editOrg ? "Edit Organization" : "New Organization"}</h3>
              {(["name", "phone", "address"] as const).map(field => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6, textTransform: "capitalize" }}>{field}{field === "name" ? " *" : ""}</label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={field === "address" ? "123 Main St, City" : field === "phone" ? "+1 234 567 8900" : "Organization name"}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: "0.875rem" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, background: "#7c3aed", color: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
                  {saving ? "Saving…" : editOrg ? "Save Changes" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e9ecf0", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60, gap: 10, color: "#64748b" }}>
              <Loader2 size={22} /> Loading…
            </div>
          ) : orgs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <Building2 size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontWeight: 600 }}>No organizations yet</p>
              <p style={{ fontSize: "0.85rem" }}>Click "Add Organization" to get started.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e9ecf0" }}>
                  {["Name", "Phone", "Address", "Created", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map((org, i) => (
                  <tr key={org.id} style={{ borderBottom: i < orgs.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1a1a2e" }}>{org.name}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#64748b" }}>{org.phone ?? "—"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#64748b" }}>{org.address ?? "—"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.8rem", color: "#94a3b8" }}>{new Date(org.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => openEdit(org)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "none", borderRadius: 8, background: "#f1f5f9", color: "#374151", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>
                        <Edit2 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
