"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Pencil, Trash2, Search, Package, ArrowLeft, Calendar, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import "./product.css";

/* Interface defining the structure of a product category */
interface Category {
  id: string;
  name: string;
  description?: string | null;
}

/* Interface defining the structure of a product record including optional category relation */
interface Product {
  id: string;
  name: string;
  category_id: string | null;
  categories?: { name: string };
  price: number;
  stock: number;
  created_at: string;
}

export default function ProductPage() {
  const supabase = createClient();
  const router = useRouter();

  React.useEffect(() => {
    async function checkSupplier() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.role === "supplier") {
        router.push("/suppliers/orders");
      }
    }
    checkSupplier();
  }, [supabase, router]);

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

  /* State object representing the current values in the form fields */
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    price: "",
    stock: ""
  });

  /* Loading state */
  const [loading, setLoading] = useState(true);

  /* Asynchronous function to fetch data from Supabase tables */
  const fetchData = async () => {
    setLoading(true);
    const { data: prodData } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });
    
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (prodData) setProducts(prodData);
    if (catData) setAvailableCategories(catData);
    setLoading(false);
  };

  /* Effect hook to trigger the initial data fetch when the component mounts */
  useEffect(() => { fetchData(); }, []);

  /* Function to sign the user out and redirect them to the login screen */
  /* Memoized logic to filter products based on search query */
  const filteredProducts = useMemo(() => {
    return products
      .map((p, index) => ({
        ...p,
        categoryName: p.categories?.name || "Uncategorized",
        isLowStock: p.stock < 10,
        productNumber: `PRD-${(index + 1).toString().padStart(4, '0')}`,
        formattedDate: new Date(p.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }))
      .filter((p) => {
        return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               p.productNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
               p.price.toString().includes(searchQuery);
      });
  }, [products, searchQuery]);

  /* Get total product count */
  const totalProducts = filteredProducts.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;

  /* Logic to either insert a new product or update an existing one in the database */
  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please fill in the Product Name");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) {
      toast.error("Please enter a valid stock quantity");
      return;
    }

    const payload = {
      name: formData.name,
      category_id: formData.category_id || null,
      price: price,
      stock: stock,
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
      toast.success(formMode === "add" ? "Product added successfully!" : "Product updated successfully!");
      setViewMode("list");
      fetchData();
      // Reset form
      setFormData({ name: "", category_id: "", price: "", stock: "" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete product: " + error.message);
      } else {
        toast.success("Product deleted successfully");
        fetchData();
      }
    }
  };

  return (
    <AppLayout title="Products">
      <div className="products-content">
        
        {/* LIST VIEW */}
        {viewMode === "list" ? (
          <>
            {/* Header Section */}
            <div className="products-header-row">
              <div>
                <h2 className="products-title">Products</h2>
                <p className="products-subtitle">Manage your product inventory</p>
              </div>
              <div className="products-header-actions">
              </div>
            </div>

            {/* Stats Cards */}
            <div className="products-stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Package size={24} />
                </div>
                <div className="stat-info">
                  <h3>{totalProducts}</h3>
                  <p>Total Products</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Package size={24} />
                </div>
                <div className="stat-info">
                  <h3>{totalStock}</h3>
                  <p>Total Stock Units</p>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">
                  <Package size={24} />
                </div>
                <div className="stat-info">
                  <h3>{lowStockCount}</h3>
                  <p>Low Stock Items</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="products-search-wrapper">
              <Search size={18} className="products-search-icon" />
              <input
                type="text"
                className="products-search-input"
                placeholder="Search by name, ID, category, or price..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <p>No products found</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-card-header">
                      <div className="product-badges">
                        <span className="product-id-badge-large">
                          <Hash size={14} />
                          {product.productNumber}
                        </span>
                      </div>
                      <h4 className="product-name">{product.name}</h4>
                      <div className="product-price">Rs. {product.price.toLocaleString()}</div>
                    </div>
                    
                    <div className="product-card-body">
                      <div className="product-info-row">
                        <span className="info-label">Category:</span>
                        <span className="info-value">{product.categoryName}</span>
                      </div>
                      <div className="product-info-row">
                        <span className="info-label">Stock:</span>
                        <span className={`info-value ${product.isLowStock ? 'stock-low' : 'stock-normal'}`}>
                          {product.stock} units
                          {product.isLowStock && " ⚠️ Low stock!"}
                        </span>
                      </div>
                      <div className="product-info-row">
                        <span className="info-label">
                          <Calendar size={14} />
                          Added:
                        </span>
                        <span className="info-value">{product.formattedDate}</span>
                      </div>
                    </div>
                    
                    <div className="product-card-footer">
                      <div className="product-uuid">
                        UUID: {product.id.slice(0, 8)}...
                      </div>
                      <div className="product-actions">
                        <button 
                          className="product-action-btn edit"
                          onClick={() => {
                            setEditingId(product.id);
                            setFormMode("edit");
                            setFormData({
                              name: product.name,
                              category_id: product.category_id || "",
                              price: product.price.toString(),
                              stock: product.stock.toString()
                            });
                            setViewMode("form");
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="product-action-btn delete"
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* FORM VIEW - Add/Edit Product */
          <div className="product-form-container">
            <button 
              className="back-btn"
              onClick={() => setViewMode("list")}
            >
              <ArrowLeft size={18} />
              Back to Products
            </button>

            <div className="product-form-card">
              <h2 className="form-title">{formMode === "add" ? "Add New Product" : "Edit Product"}</h2>
              
              <div className="product-form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="product-form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="product-form-row">
                <div className="product-form-group">
                  <label className="form-label">Price (Rs.) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="product-form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="product-form-actions">
                <button className="btn btn-secondary" onClick={() => setViewMode("list")}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  {formMode === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
