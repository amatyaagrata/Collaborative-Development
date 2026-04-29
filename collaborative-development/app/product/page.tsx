"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Pencil, Trash2, Plus, Search, Circle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string; 
  name: string;
  category_id: string; 
  categories?: { name: string }; 
  price: number;
  stock: number;
}

export default function ProductPage() {
  const supabase = createClient();

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    category_id: "", 
    price: "",
    stock: ""
  });

  /* Fetch products with category names and fetch the full category list for the dropdown */
  const fetchData = async () => {
    const { data: prodData } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: true });
    
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name");

    if (prodData) setProducts(prodData);
    if (catData) setAvailableCategories(catData);
  };

  useEffect(() => { fetchData(); }, []);

  /* Process search filters and generate display IDs like #0001 */
  const processedProducts = useMemo(() => {
    return products
      .map((p, index) => ({ 
        ...p, 
        displayId: `#${(index + 1).toString().padStart(4, '0')}`,
        catName: p.categories?.name || "Uncategorized"
      }))
      .filter((p) => {
        return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               p.displayId.includes(searchQuery) ||
               p.catName.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [products, searchQuery]);

  /* Handle adding new products or updating existing ones */
  const handleSave = async () => {
    const payload = {
      name: formData.name,
      category_id: formData.category_id || null,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
    };

    let result;
    if (formMode === "add") {
      result = await supabase.from("products").insert([payload]);
    } else {
      result = await supabase.from("products").update(payload).eq("id", editingId);
    }

    if (result.error) {
      toast.error(`Database Error: ${result.error.message}`);
    } else {
      toast.success("Saved successfully");
      setViewMode("list");
      fetchData();
    }
  };

  return (
    <AppLayout title="Product">
      <div style={containerStyle}>
        {viewMode === "list" ? (
          <>
            <div style={topActionsRow}>
              <h3 style={titleStyle}>All product</h3>
              <div style={rightGroup}>
                <button onClick={() => { 
                  setFormMode("add"); 
                  setFormData({name:"", category_id:"", price:"", stock:""}); 
                  setViewMode("form"); 
                }} style={addButtonStyle}>
                  <Plus size={18} /> Add now
                </button>
              </div>
            </div>

            <div style={searchWrapper}>
              <Search size={18} style={searchIcon} />
              <input style={searchInput} placeholder="Search product..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <table style={tableStyle}>
              <thead>
                <tr style={headerRowStyle}>
                  <th style={thStyle}><Circle size={18} color="#D1D5DB" /></th>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Product Id</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Stock</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {processedProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  /* Apply red color if stock is strictly less than 3 */
                  const isLowStock = p.stock < 3;
                  
                  return (
                    <tr key={p.id} style={rowStyle}>
                      <td style={tdStyle} onClick={() => setSelectedIds(prev => isSelected ? prev.filter(i=>i!==p.id) : [...prev, p.id])}>
                        <div style={{ cursor: "pointer" }}>
                          {isSelected ? <CheckCircle2 size={20} fill="#6B21FF" color="white" /> : <Circle size={20} color="#D1D5DB" />}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{p.name}</td>
                      <td style={tdStyle}>{p.displayId}</td>
                      <td style={tdStyle}>{p.catName}</td>
                      <td style={tdStyle}>${p.price}</td>
                      <td style={{ ...tdStyle, color: isLowStock ? "red" : "black", fontWeight: isLowStock ? "bold" : "normal" }}>
                        {p.stock}
                      </td>
                      <td style={tdStyle}>
                        <div style={actionIconGroup}>
                          <Pencil size={18} style={iconStyle} onClick={() => {
                            setEditingId(p.id); setFormMode("edit");
                            setFormData({name:p.name, category_id:p.category_id || "", price:p.price.toString(), stock:p.stock.toString()});
                            setViewMode("form");
                          }} />
                          <Trash2 size={18} style={iconStyle} onClick={async () => { if(confirm("Delete?")) { await supabase.from("products").delete().eq("id",p.id); fetchData(); } }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <div style={formCard}>
            <h2 style={formTitle}>{formMode === "add" ? "New Product" : "Edit Product"}</h2>
            <div style={formGrid}>
              <div style={formColumn}>
                <label style={formLabel}>Product Name</label>
                <input style={formInput} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                
                <label style={formLabel}>Category</label>
                <select style={formInput} value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                  <option value="">Select Category</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={formColumn}>
                <label style={formLabel}>Price</label>
                <input style={formInput} type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                
                <label style={formLabel}>Stock Quantity</label>
                <input style={formInput} type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
            </div>
            <div style={formActions}>
              <button style={cancelButtonStyle} onClick={() => setViewMode("list")}>Cancel</button>
              <button style={saveButtonStyle} onClick={handleSave}>Save</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* UI Styles mapped to your specific design screenshots */
const containerStyle: React.CSSProperties = { background: "white", padding: "30px", borderRadius: "12px" };
const titleStyle: React.CSSProperties = { color: "#4A1D96", fontWeight: "600", fontSize: "18px" };
const topActionsRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" };
const rightGroup: React.CSSProperties = { display: "flex", gap: "12px" };
const addButtonStyle: React.CSSProperties = { background: "#6B21FF", color: "white", padding: "6px 20px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "5px", fontWeight: "500", cursor: "pointer", border: "none" };
const searchWrapper: React.CSSProperties = { position: "relative", marginBottom: "25px", maxWidth: "400px" };
const searchInput: React.CSSProperties = { width: "100%", padding: "10px 40px", borderRadius: "8px", border: "1px solid #F3F4F6", outline: "none" };
const searchIcon: React.CSSProperties = { position: "absolute", left: "12px", top: "12px", color: "#9CA3AF" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const headerRowStyle: React.CSSProperties = { borderBottom: "1px solid #F3F4F6" };
const rowStyle: React.CSSProperties = { borderBottom: "1px solid #F3F4F6" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "15px 10px", fontSize: "14px", fontWeight: "600" };
const tdStyle: React.CSSProperties = { padding: "15px 10px", fontSize: "14px", color: "#374151" };
const actionIconGroup: React.CSSProperties = { display: "flex", gap: "15px" };
const iconStyle: React.CSSProperties = { cursor: "pointer", color: "#374151" };
const formCard: React.CSSProperties = { background: "#F9FAFB", padding: "30px", borderRadius: "15px" };
const formTitle: React.CSSProperties = { fontSize: "22px", fontWeight: "700", color: "#4A1D96", marginBottom: "20px" };
const formGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" };
const formColumn: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "8px" };
const formLabel: React.CSSProperties = { fontSize: "13px", fontWeight: "600", color: "#4A1D96" };
const formInput: React.CSSProperties = { padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "white" };
const formActions: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "30px" };
const saveButtonStyle: React.CSSProperties = { background: "#6B21FF", color: "white", padding: "10px 45px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" };
const cancelButtonStyle: React.CSSProperties = { background: "#E5E7EB", color: "#374151", padding: "10px 45px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" };