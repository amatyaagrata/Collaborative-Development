"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package, Plus, Search, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import "./products.css";

type CategoryRow = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
  min_stock_level: number;
  sku: string | null;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  categories: { name: string } | null;
};

export default function SupplierProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [updatingAvailability, setUpdatingAvailability] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: "",
    productId: "",
    price: "",
    stock: "0",
    categoryId: "",
    isActive: true,
  });
  const [updatingStock, setUpdatingStock] = useState<Record<string, boolean>>({});
  const [updatingPrice, setUpdatingPrice] = useState<Record<string, boolean>>({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const haystack = `${product.name} ${product.sku ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [products, searchQuery]);

  const fetchCategories = useCallback(async (currentOrgId: string) => {
    if (!currentOrgId) return;
    
    const { data, error } = await supabase
      .from("categories")
      .select("id,name")
      .eq("org_id", currentOrgId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories: " + error.message);
      setCategories([]);
      return;
    }

    setCategories((data as CategoryRow[]) || []);
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Auth error:", userError);
        toast.error("Please log in again");
        setLoading(false);
        return;
      }

      console.log("Auth user:", user.email);

      // Get supplier by email
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("id, org_id, name, email")
        .eq("email", user.email)
        .maybeSingle();

      if (supplierError || !supplierData) {
        console.error("Supplier fetch error:", supplierError);
        toast.error("Supplier profile not found. Please contact admin.");
        setLoading(false);
        return;
      }

      console.log("Supplier found:", supplierData);
      setSupplierId(supplierData.id);
      setOrgId(supplierData.org_id);

      // Fetch products for this supplier - using correct column names
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          selling_price,
          current_stock,
          min_stock_level,
          sku,
          category_id,
          is_active,
          created_at,
          categories:category_id (name)
        `)
        .eq("supplier_id", supplierData.id)
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("Products fetch error:", productsError);
        toast.error("Failed to load products: " + productsError.message);
        setProducts([]);
      } else {
        const transformedProducts = (productsData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          selling_price: p.selling_price,
          current_stock: p.current_stock,
          min_stock_level: p.min_stock_level,
          sku: p.sku,
          category_id: p.category_id,
          is_active: p.is_active,
          created_at: p.created_at,
          categories: p.categories
        }));
        setProducts(transformedProducts);
        console.log("Products loaded:", transformedProducts.length);
      }

      if (supplierData.org_id) {
        await fetchCategories(supplierData.org_id);
      }

    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddClick = () => {
    if (!supplierId) {
      toast.error("Supplier profile not found. Cannot add product.");
      return;
    }
    
    setEditingProduct(null);
    setFormData({
      name: "",
      productId: "",
      price: "",
      stock: "0",
      categoryId: "",
      isActive: true,
    });
    setIsAddingCategory(false);
    setNewCategoryName("");
    setViewMode("form");
  };

  const handleEditClick = (product: ProductRow) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      productId: product.sku || "",
      price: product.selling_price.toString(),
      stock: product.current_stock.toString(),
      categoryId: product.category_id || "",
      isActive: product.is_active,
    });
    setIsAddingCategory(false);
    setNewCategoryName("");
    setViewMode("form");
  };

  const handleCancelClick = () => {
    setViewMode("list");
  };

  const handleAddNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Category name cannot be empty.");
      return;
    }
    
    if (!orgId) {
      toast.error("Organization ID missing. Cannot add category.");
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, org_id: orgId }])
      .select("id,name")
      .single();

    if (error) {
      toast.error("Failed to add category: " + error.message);
      return;
    }

    setCategories((prev) => [...prev, data as CategoryRow].sort((a, b) => a.name.localeCompare(b.name)));
    setFormData((prev) => ({ ...prev, categoryId: data.id }));
    setIsAddingCategory(false);
    setNewCategoryName("");
    toast.success("Category added successfully!");
  };

  const handleSaveClick = async () => {
    if (!supplierId) {
      toast.error("Supplier profile not found. Cannot save product.");
      return;
    }

    const name = formData.name.trim();
    if (!name) {
      toast.error("Please fill in the product name.");
      return;
    }

    const priceValue = Number(formData.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    if (!orgId) {
      toast.error("No organization found. Cannot add product.");
      return;
    }

    const payload = {
      supplier_id: supplierId,
      org_id: orgId,
      name: name,
      sku: formData.productId.trim() || null,
      category_id: formData.categoryId || null,
      selling_price: priceValue,
      current_stock: parseInt(formData.stock, 10) || 0,
      is_active: formData.isActive,
    };

    let result;
    if (editingProduct) {
      result = await supabase.from("products").update(payload).eq("id", editingProduct.id);
    } else {
      result = await supabase.from("products").insert([payload]);
    }

    if (result.error) {
      console.error("Save error:", result.error);
      toast.error("Failed to save product: " + result.error.message);
      return;
    }

    toast.success(editingProduct ? "Product updated successfully!" : "Product added successfully!");
    setViewMode("list");
    setEditingProduct(null);
    fetchProducts();
  };

  const setProductAvailability = async (productId: string, nextValue: boolean) => {
    setUpdatingAvailability((prev) => ({ ...prev, [productId]: true }));

    const previousProducts = products;
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, is_active: nextValue } : product))
    );

    const { error } = await supabase.from("products").update({ is_active: nextValue }).eq("id", productId);
    if (error) {
      setProducts(previousProducts);
      toast.error("Failed to update availability: " + error.message);
    } else {
      toast.success(`Product marked as ${nextValue ? "available" : "unavailable"}.`);
    }

    setUpdatingAvailability((prev) => ({ ...prev, [productId]: false }));
  };

  const setProductPrice = async (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setUpdatingPrice((prev) => ({ ...prev, [productId]: true }));

    const previousProducts = products;
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, selling_price: newPrice } : product))
    );

    const { error } = await supabase.from("products").update({ selling_price: newPrice }).eq("id", productId);
    if (error) {
      setProducts(previousProducts);
      toast.error("Failed to update price: " + error.message);
    } else {
      toast.success("Price updated successfully.");
    }

    setUpdatingPrice((prev) => ({ ...prev, [productId]: false }));
  };

  const setProductStock = async (productId: string, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) return;
    setUpdatingStock((prev) => ({ ...prev, [productId]: true }));

    const previousProducts = products;
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, current_stock: newStock } : product))
    );

    const { error } = await supabase.from("products").update({ current_stock: newStock }).eq("id", productId);
    if (error) {
      setProducts(previousProducts);
      toast.error("Failed to update stock: " + error.message);
    } else {
      toast.success("Stock updated successfully.");
    }

    setUpdatingStock((prev) => ({ ...prev, [productId]: false }));
  };

  return (
    <div className="supplier-products-content">
      {viewMode === "list" && (
        <>
          <div className="supplier-products-header-row">
            <h2 className="supplier-products-title">My Products</h2>

            <div className="supplier-products-actions">
              <div className="supplier-products-search">
                <Search size={18} />
                <input
                  className="supplier-products-search-input"
                  type="text"
                  placeholder="Search products by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" onClick={handleAddClick}>
                <Plus size={18} />
                Add Product
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <Loader2 size={32} className="animate-spin" />
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <p>No products found</p>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: 4 }}>
                Products you add will appear here
              </p>
              <button className="btn btn-primary" onClick={handleAddClick} style={{ marginTop: 16 }}>
                Add your first product
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-card-header">
                    <h4 className="product-name">{product.name}</h4>
                    <div className="product-price">
                      <span style={{ fontSize: "0.8rem", marginRight: "4px" }}>Rs.</span>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="form-input-styled" 
                        style={{ width: "100px", height: "36px", padding: "0 8px", fontSize: "1.1rem", fontWeight: 700, color: "#6008f8", border: "1px solid transparent", background: "transparent" }} 
                        defaultValue={product.selling_price}
                        disabled={!!updatingPrice[product.id]}
                        onFocus={(e) => e.target.style.border = "1px solid #e2e8f0"}
                        onBlur={(e) => {
                          e.target.style.border = "1px solid transparent";
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val !== product.selling_price) {
                            setProductPrice(product.id, val);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="product-card-body">
                    <div className="product-info-row">
                      <span className="info-label">Availability</span>
                      <div className="availability-toggle">
                        <span className={`info-value ${product.is_active ? "status-active" : "status-inactive"}`}>
                          {product.is_active ? "Available" : "Unavailable"}
                        </span>
                        <label className="switch" aria-label="Toggle availability">
                          <input
                            type="checkbox"
                            checked={product.is_active}
                            disabled={!!updatingAvailability[product.id]}
                            onChange={(e) => setProductAvailability(product.id, e.target.checked)}
                          />
                          <span className="slider" />
                        </label>
                      </div>
                    </div>

                    <div className="product-info-row">
                      <span className="info-label">Category</span>
                      <span className="info-value">
                        {product.categories?.name || "Uncategorized"}
                      </span>
                    </div>

                    <div className="product-info-row">
                      <span className="info-label">ID</span>
                      <span className="info-value">{product.sku || "—"}</span>
                    </div>

                    <div className="product-info-row">
                      <span className="info-label">Stock Quantity</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input 
                            type="number" 
                            min="0"
                            className="form-input-styled" 
                            style={{ 
                              width: "80px", 
                              height: "32px", 
                              padding: "0 8px",
                              border: product.current_stock <= (product.min_stock_level || 0) ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                              color: product.current_stock <= (product.min_stock_level || 0) ? "#dc2626" : "inherit",
                              fontWeight: product.current_stock <= (product.min_stock_level || 0) ? 700 : 400
                            }}
                            defaultValue={product.current_stock || 0}
                            disabled={!!updatingStock[product.id]}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val !== product.current_stock) {
                                setProductStock(product.id, val);
                              }
                            }}
                          />
                          {product.current_stock <= (product.min_stock_level || 0) && (
                            <span style={{ 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: "4px", 
                              background: "#fef2f2", 
                              color: "#dc2626", 
                              padding: "2px 8px", 
                              borderRadius: "12px", 
                              fontSize: "0.7rem", 
                              fontWeight: 700,
                              border: "1px solid #fecaca"
                            }}>
                              <AlertCircle size={12} /> LOW STOCK
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="product-info-row">
                      <span className="info-label">Min. Stock Level</span>
                      <span className="info-value">{product.min_stock_level || 0} units</span>
                    </div>

                    <div className="product-info-row">
                      <span className="info-label">Added</span>
                      <span className="info-value">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="product-card-footer">
                    <div className="product-id-badge">UUID: {product.id.slice(0, 8)}...</div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                      onClick={() => handleEditClick(product)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === "form" && (
        <div className="supplier-product-form-container">
          <h3 className="form-breadcrumb">{editingProduct ? "Edit product" : "Add new product"}</h3>

          <div className="supplier-product-form-card">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input-styled"
                placeholder="e.g. Organic Rice"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product ID (SKU)</label>
              <input
                type="text"
                className="form-input-styled"
                placeholder="Optional SKU"
                value={formData.productId}
                onChange={(e) => setFormData((prev) => ({ ...prev, productId: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              {!isAddingCategory ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="form-select-styled"
                    style={{ flex: 1 }}
                    value={formData.categoryId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAddingCategory(true)} style={{ padding: '0 12px' }}>
                    <Plus size={16} /> New
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input-styled"
                    style={{ flex: 1 }}
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="btn btn-primary" onClick={handleAddNewCategory} style={{ padding: '0 16px' }}>
                    Save
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsAddingCategory(false); setNewCategoryName(""); }} style={{ padding: '0 16px' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Price (Rs.) *</label>
              <input
                type="number"
                inputMode="decimal"
                className="form-input-styled"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Stock</label>
              <input
                type="number"
                className="form-input-styled"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
              />
            </div>

            <div className="availability-row">
              <label className="availability-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Mark as available
              </label>
            </div>

            <div className="form-actions-row">
              <button className="btn btn-secondary" onClick={handleCancelClick}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveClick}>
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}