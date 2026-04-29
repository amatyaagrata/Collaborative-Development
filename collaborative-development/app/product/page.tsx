"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Pencil, Trash2, Plus, Search, Circle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/* Interface defining the structure of a product category */
interface Category {
  id: string;
  name: string;
}

/* Interface defining the structure of a product record including optional category relation */
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
  const router = useRouter();

  /* State to toggle between the main product list and the add edit form */
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  
  /* State for the search input value used to filter the product table */
  const [searchQuery, setSearchQuery] = useState("");
  
  /* State for the main product data array fetched from the database */
  const [products, setProducts] = useState<Product[]>([]);
  
  /* State for the list of categories used to populate the form dropdown */
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  
  /* State to determine if the form is currently adding a new item or editing an existing one */
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  
  /* State to track the ID of the specific product being edited */
  const [editingId, setEditingId] = useState<string | null>(null);
  
  /* State to track which products are currently selected via checkboxes */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /* State object representing the current values in the form fields */
  const [formData, setFormData] = useState({
    name: "",
    category_id: "", 
    price: "",
    stock: ""
  });

  /* Asynchronous function to fetch data from Supabase tables */
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

  /* Effect hook to trigger the initial data fetch when the component mounts */
  useEffect(() => { fetchData(); }, []);

  /* Function to sign the user out and redirect them to the login screen */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* Memoized logic to filter products based on search query and format display IDs */
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

  /* Logic to either insert a new product or update an existing one in the database */
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
    <AppLayout title="">
      {/* Container for the page title and the logout button positioned on the right */}
      <div style={headerSection}>
        <h2 style={pageTitle}>Product</h2>
        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
      </div>

      <div style={containerStyle}>
        {viewMode === "list" ? (
          <>
            {/* Control row containing the subsection title and the filter plus add buttons */}
            <div style={topActionsRow}>
              <h3 style={listTitleStyle}>All product</h3>
              <div style={rightGroup}>
                <button style={filterButtonStyle}>Filter</button>
                
                <button onClick={() => { 
                  setFormMode("add"); 
                  setFormData({name:"", category_id:"", price:"", stock:""}); 
                  setViewMode("form"); 
                }} style={addButtonStyle}>
                  <Plus size={18} /> Add now
                </button>
              </div>
            </div>

            {/* Input area for searching products by name or category */}
            <div style={searchWrapper}>
              <Search size={18} style={searchIcon} />
              <input style={searchInput} placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Table layout for displaying product details and management actions */}
            <table style={tableStyle}>
              <thead>
                <tr style={headerRowStyle}>
                  <th style={thStyle}><Circle size={18} color="#000" /></th>
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
                  const isLowStock = p.stock < 3;
                  
                  return (
                    <tr key={p.id} style={rowStyle}>
                      <td style={tdStyle} onClick={() => setSelectedIds(prev => isSelected ? prev.filter(i=>i!==p.id) : [...prev, p.id])}>
                        <div style={{ cursor: "pointer" }}>
                          {isSelected ? <CheckCircle2 size={20} fill="#6B21FF" color="white" /> : <Circle size={20} color="#000" />}
                        </div>
                      </td>
                      <td style={tdStyle}>{p.name}</td>
                      <td style={tdStyle}>{p.displayId}</td>
                      <td style={tdStyle}>{p.catName}</td>
                      <td style={tdStyle}>${p.price}</td>
                      <td style={{ ...tdStyle, color: isLowStock ? "red" : "black" }}>
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
          /* Card container for the product creation and editing form */
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
            {/* Row for action buttons to confirm or cancel form input */}
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

/* Style declarations for layout and visual components */

const headerSection: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", padding: "0 10px" };
const pageTitle: React.CSSProperties = { fontSize: "24px", fontWeight: "700", color: "#3B1E7B" };
const logoutButtonStyle: React.CSSProperties = { background: "none", border: "none", color: "#3B1E7B", fontWeight: "600", fontSize: "16px", cursor: "pointer", paddingRight: "15px" };

const containerStyle: React.CSSProperties = { background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" };
const listTitleStyle: React.CSSProperties = { color: "#3B1E7B", fontWeight: "600", fontSize: "14px" };
const topActionsRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" };
const rightGroup: React.CSSProperties = { display: "flex", gap: "15px" };

const filterButtonStyle: React.CSSProperties = { border: "1px solid #6B21FF", color: "#6B21FF", background: "white", padding: "6px 30px", borderRadius: "10px", fontWeight: "600", cursor: "pointer" };
const addButtonStyle: React.CSSProperties = { background: "#6B21FF", color: "white", padding: "6px 20px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600", cursor: "pointer", border: "none" };

const searchWrapper: React.CSSProperties = { position: "relative", marginBottom: "25px", maxWidth: "300px" };
const searchInput: React.CSSProperties = { width: "100%", padding: "8px 12px 8px 35px", borderRadius: "8px", border: "1px solid #E5E7EB", outline: "none", fontSize: "14px" };
const searchIcon: React.CSSProperties = { position: "absolute", left: "10px", top: "10px", color: "#9CA3AF" };

const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const headerRowStyle: React.CSSProperties = { borderBottom: "1px solid #F3F4F6" };
const rowStyle: React.CSSProperties = { borderBottom: "1px solid #F3F4F6" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "15px 10px", fontSize: "13px", fontWeight: "600", color: "#000" };
const tdStyle: React.CSSProperties = { padding: "15px 10px", fontSize: "13px", color: "#000" };

const actionIconGroup: React.CSSProperties = { display: "flex", gap: "12px" };
const iconStyle: React.CSSProperties = { cursor: "pointer", color: "#374151" };

const formCard: React.CSSProperties = { background: "#F9FAFB", padding: "30px", borderRadius: "15px" };
const formTitle: React.CSSProperties = { fontSize: "22px", fontWeight: "700", color: "#3B1E7B", marginBottom: "20px" };
const formGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" };
const formColumn: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "8px" };
const formLabel: React.CSSProperties = { fontSize: "13px", fontWeight: "600", color: "#3B1E7B" };
const formInput: React.CSSProperties = { padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "white" };
const formActions: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "30px" };
const saveButtonStyle: React.CSSProperties = { background: "#6B21FF", color: "white", padding: "10px 45px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" };
const cancelButtonStyle: React.CSSProperties = { background: "#E5E7EB", color: "#374151", padding: "10px 45px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" };