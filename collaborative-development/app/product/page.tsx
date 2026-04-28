"use client";
import React, { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Pencil, Trash2, Plus, Search } from "lucide-react";

/**
 * Interface representing the structure of a Product object
 */
interface Product {
  id: number;
  name: string;
  productId: string;
  category: string;
  price: string;
  stock: string;
  stockAlert: string;
  details: string;
  image: string | null;
}

export default function ProductPage() {
  /**
   * State management for UI view modes and search filtering
   */
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  /**
   * State management for product data and category lists
   * Initialized as empty to ensure server side and client side consistency
   */
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["General"]);
  const [hasMounted, setHasMounted] = useState(false);

  /**
   * Configuration for the initial state of the product entry form
   */
  const initialForm: Product = { 
    id: 0, 
    name: "", 
    productId: "", 
    category: "", 
    price: "", 
    stock: "", 
    stockAlert: "10", 
    details: "", 
    image: null 
  };
  const [formData, setFormData] = useState<Product>(initialForm);

  /**
   * Effect hook to synchronize state with localStorage upon initial browser mount
   */
  useEffect(() => {
    const savedProducts = localStorage.getItem("gogodam_products");
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      /**
       * Seed initial data if the local storage is currently empty
       */
      setProducts([
        { id: 1, name: "Note book", productId: "0001", category: "General", price: "250", stock: "50", stockAlert: "10", details: "A5 Size", image: null },
        { id: 2, name: "Cotton T-Shirt", productId: "0002", category: "General", price: "29.99", stock: "5", stockAlert: "10", details: "XL Size", image: null }
      ]);
    }

    const savedCats = localStorage.getItem("gogodam_categories");
    if (savedCats) {
      setCategories(JSON.parse(savedCats).map((c: any) => c.name));
    } else {
      setCategories(["General", "Bed", "Chair", "Table", "Sofa"]);
    }
    
    setHasMounted(true);
  }, []);

  /**
   * Effect hook to persist product changes to localStorage
   */
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem("gogodam_products", JSON.stringify(products));
    }
  }, [products, hasMounted]);

  /**
   * Utility function to generate a padded four digit string for new product IDs
   */
  const generateNextProductId = () => {
    if (products.length === 0) return "0001";
    const maxId = Math.max(...products.map(p => parseInt(p.productId) || 0));
    return (maxId + 1).toString().padStart(4, '0');
  };

  /**
   * Handler to transition the UI to form mode for adding a new product
   */
  const handleOpenAddForm = () => {
    setFormData({ ...initialForm, productId: generateNextProductId() });
    setViewMode("form");
  };

  /**
   * Handler to process the submission of the product form
   */
  const handleSave = () => {
    if (!formData.name) return alert("Product Name is required");
    if (!formData.productId) return alert("Product ID is required");

    if (formData.id === 0) {
      const newEntry = { ...formData, id: Date.now() };
      /**
       * Append the new product entry to the existing products array
       */
      setProducts([...products, newEntry]);
    } else {
      /**
       * Update an existing product entry within the array
       */
      setProducts(products.map(p => p.id === formData.id ? formData : p));
    }
    setViewMode("list");
    setFormData(initialForm);
  };

  /**
   * Memoized logic to filter the product list based on search terms and stock status
   */
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const match = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.productId.includes(searchQuery);
      const isLowStock = parseInt(p.stock) <= parseInt(p.stockAlert);
      return isFilterActive ? (match && isLowStock) : match;
    });
  }, [products, searchQuery, isFilterActive]);

  /**
   * Safeguard to prevent rendering before the client has successfully hydrated
   */
  if (!hasMounted) return null;

  return (
    <AppLayout title="Product">
      <div style={containerStyle}>
        {viewMode === "list" ? (
          <>
            {/* Top action bar containing the title and right aligned control buttons */}
            <div style={headerActionStyle}>
              <h3 style={{ color: "#2D0353", margin: 0 }}>All product</h3>
              <div style={{ display: "flex", gap: "15px" }}>
                {/* Filter button positioned to the left of the add button */}
                <button 
                  onClick={() => setIsFilterActive(!isFilterActive)}
                  style={{ 
                    ...filterButtonStyle, 
                    background: isFilterActive ? "#6B21FF" : "transparent", 
                    color: isFilterActive ? "white" : "#6B21FF" 
                  }}
                >
                  Filter
                </button>
                <button onClick={handleOpenAddForm} style={addNowButtonStyle}>
                  <Plus size={18} /> Add now
                </button>
              </div>
            </div>

            {/* Search utility bar positioned below the header actions */}
            <div style={toolbarStyle}>
              <div style={{ position: "relative", width: "400px" }}>
                <Search size={18} style={searchIconStyle} />
                <input 
                  style={searchInputStyle} 
                  placeholder="Search products by name or id" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Product data table with Product ID in the leftmost column */}
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th style={{ padding: "15px", width: "40px" }}><input type="checkbox" /></th>
                  <th style={{ padding: "15px" }}>PRODUCT ID</th>
                  <th style={{ padding: "15px" }}>PRODUCT</th>
                  <th style={{ padding: "15px" }}>CATEGORY</th>
                  <th style={{ padding: "15px" }}>PRICE</th>
                  <th style={{ padding: "15px" }}>STOCK</th>
                  <th style={{ padding: "15px" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isLowStock = parseInt(p.stock) <= parseInt(p.stockAlert);
                  return (
                    <tr key={p.id} style={tableRowStyle}>
                      <td style={{ padding: "15px" }}><input type="checkbox" /></td>
                      <td style={{ padding: "15px", color: "#666" }}>{p.productId}</td>
                      <td style={{ padding: "15px", fontWeight: "600" }}>{p.name}</td>
                      <td style={{ padding: "15px" }}>{p.category}</td>
                      <td style={{ padding: "15px", fontWeight: "700" }}>Rs {p.price}</td>
                      {/* Conditional styling to highlight low stock levels in red */}
                      <td style={{ 
                        padding: "15px", 
                        fontWeight: "bold", 
                        color: isLowStock ? "#FF4D4D" : "#2D0353" 
                      }}>
                        {p.stock}
                      </td>
                      <td style={{ padding: "15px" }}>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <Pencil size={18} color="#6B21FF" cursor="pointer" onClick={() => { setFormData(p); setViewMode("form"); }} />
                          <Trash2 size={18} color="#FF4D4D" cursor="pointer" onClick={() => setProducts(products.filter(i => i.id !== p.id))} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          /* Product editing and creation form layout */
          <div style={{ padding: "20px" }}>
            <h3 style={{ color: "#2D0353", marginBottom: "30px" }}>Product details</h3>
            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>Product ID</label>
                <input style={inputStyle} value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Product Name</label>
                <input style={inputStyle} placeholder="Enter product name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Price</label>
                <input style={inputStyle} placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Current Stock</label>
                <input type="number" style={inputStyle} placeholder="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Low Stock Alert Level</label>
                <input type="number" style={inputStyle} placeholder="10" value={formData.stockAlert} onChange={e => setFormData({...formData, stockAlert: e.target.value})} />
              </div>
            </div>
            {/* Action buttons for saving data or reverting to the list view */}
            <div style={{ marginTop: "30px", display: "flex", gap: "15px", justifyContent: "flex-end" }}>
              <button onClick={() => setViewMode("list")} style={cancelButtonStyle}>Cancel</button>
              <button onClick={handleSave} style={saveButtonStyle}>Save Product</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/**
 * CSS-in-JS style objects for component styling
 */
const containerStyle: React.CSSProperties = { background: "white", borderRadius: "15px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", minHeight: "80vh", marginLeft: "20px" };
const headerActionStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const toolbarStyle: React.CSSProperties = { display: "flex", alignItems: "center", marginBottom: "30px" };
const searchInputStyle: React.CSSProperties = { width: "100%", padding: "12px 12px 12px 45px", borderRadius: "10px", border: "1px solid #E0E0E0", outline: "none", background: "#F9F9F9" };
const searchIconStyle: React.CSSProperties = { position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#AAA" };
const addNowButtonStyle: React.CSSProperties = { background: "#6B21FF", color: "white", border: "none", padding: "10px 25px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" };
const filterButtonStyle: React.CSSProperties = { border: "2px solid #6B21FF", padding: "10px 30px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", transition: "0.3s" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const tableHeaderStyle: React.CSSProperties = { textAlign: "left", fontSize: "14px", color: "#2D0353", fontWeight: "bold", borderBottom: "2px solid #F0F0F0" };
const tableRowStyle: React.CSSProperties = { borderBottom: "1px solid #F5F5F5", fontSize: "14px" };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "8px", fontWeight: "600", color: "#2D0353" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E0E0E0", background: "#FAFAFA", outline: "none" };
const formGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" };
const saveButtonStyle: React.CSSProperties = { background: "#6B21FF", color: "white", border: "none", padding: "12px 40px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" };
const cancelButtonStyle: React.CSSProperties = { background: "#F1F2F7", border: "1px solid #E0E0E0", padding: "12px 40px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" };