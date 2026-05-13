"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package, Plus, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import "./products.css";

type CategoryRow = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
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

  const fetchCategories = useCallback(async (currentOrgId: string, currentSupplierId?: string | null) => {
    if (!currentOrgId) return;
    let query = supabase
      .from("categories")
      .select("id,name")
      .eq("organization_id", currentOrgId);

    if (currentSupplierId) {
      query = query.eq("supplier_id", currentSupplierId);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      toast.error("Failed to load categories: " + error.message);
      setCategories([]);
      return;
    }

    setCategories((data as CategoryRow[]) || []);
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      toast.error("Failed to load user: " + (userError?.message ?? "No user"));
      setLoading(false);
      return;
    }

    // Resolve: auth.uid → users.id → suppliers.user_id → suppliers.id
    const { data: userRow } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_user_id", userData.user.id)
      .single();

    let resolvedSupplierId: string | null = null;
    let currentOrgId: string | null = null;

    if (userRow) {
      currentOrgId = userRow.organization_id;
      const { data: supplierRow } = await supabase
        .from("suppliers")
        .select("id")
        .eq("user_id", userRow.id)
        .single();

      if (supplierRow) {
        resolvedSupplierId = supplierRow.id;
      }
    }

    setOrgId(currentOrgId);
    setSupplierId(resolvedSupplierId);

    if (!resolvedSupplierId) {
      // Auto-create supplier profile if user has supplier role but no profile yet
      if (userRow) {
        console.log("[SUPPLIER-PRODUCTS] No supplier profile found. Auto-creating...");
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const { data: newSupplier, error: createError } = await supabase
          .from("suppliers")
          .insert({
            user_id: userRow.id,
            organization_id: currentOrgId,
            name: authUser?.user_metadata?.name ?? authUser?.email?.split("@")[0] ?? "Supplier",
            contact_email: authUser?.email ?? "",
            contact_phone: authUser?.user_metadata?.phone ?? null,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("[SUPPLIER-PRODUCTS] Failed to auto-create supplier:", createError);
          toast.error("No supplier profile found. Ask your admin to create one.");
          setProducts([]);
          setLoading(false);
          return null;
        }

        resolvedSupplierId = newSupplier.id;
        toast.success("Supplier profile created automatically!");
      } else {
        toast.error("No supplier profile found. Ask your admin to create one.");
        setProducts([]);
        setLoading(false);
        return null;
      }
    }

    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,stock,min_stock_level,sku,category_id,is_active,created_at,categories(name)")
      .eq("supplier_id", resolvedSupplierId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load products: " + error.message);
      setProducts([]);
    } else {
      setProducts((data as unknown as ProductRow[]) || []);
    }
    setLoading(false);
    return { orgId: currentOrgId, supplierId: resolvedSupplierId };
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const result = await fetchProducts();
      if (result?.orgId) {
        fetchCategories(result.orgId, result.supplierId);
      }
    };
    init();
  }, [fetchProducts, fetchCategories]);

  const handleAddClick = () => {
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
      price: product.price.toString(),
      stock: product.stock.toString(),
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
      .insert([{ name, organization_id: orgId, supplier_id: supplierId }])
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

    if (!supplierId) {
      toast.error("No supplier profile found. Cannot add product.");
      return;
    }

    const payload = {
      supplier_id: supplierId,
      organization_id: orgId,
      name,
      sku: formData.productId.trim() ? formData.productId.trim() : null,
      category_id: formData.categoryId || null,
      price: priceValue,
      stock: parseInt(formData.stock, 10) || 0,
      is_active: formData.isActive,
    };

    let result;
    if (editingProduct) {
      result = await supabase.from("products").update(payload).eq("id", editingProduct.id);
    } else {
      result = await supabase.from("products").insert([payload]);
    }

    if (result.error) {
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

  const [updatingPrice, setUpdatingPrice] = useState<Record<string, boolean>>({});

  const setProductPrice = async (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setUpdatingPrice((prev) => ({ ...prev, [productId]: true }));

    const previousProducts = products;
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, price: newPrice } : product))
    );

    const { error } = await supabase.from("products").update({ price: newPrice }).eq("id", productId);
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
      prev.map((product) => (product.id === productId ? { ...product, stock: newStock } : product))
    );

    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", productId);
    if (error) {
      setProducts(previousProducts);
      toast.error("Failed to update stock: " + error.message);
    } else {
      toast.success("Stock updated successfully.");
    }

    setUpdatingStock((prev) => ({ ...prev, [productId]: false }));
  };

  return (
    <>
      <div className="supplier-products-content">
        {viewMode === "list" && (
          <>
            <div className="supplier-products-header-row">
              <h2 className="supplier-products-title">Product List</h2>

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
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <p>No products found</p>
                <button className="btn btn-primary" onClick={handleAddClick}>
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
                          defaultValue={product.price}
                          disabled={!!updatingPrice[product.id]}
                          onFocus={(e) => e.target.style.border = "1px solid #e2e8f0"}
                          onBlur={(e) => {
                            e.target.style.border = "1px solid transparent";
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val !== product.price) {
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
                          {Array.isArray(product.categories) 
                            ? product.categories[0]?.name 
                            : (product.categories as any)?.name || "Uncategorized"}
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
                                border: product.stock <= (product.min_stock_level || 0) ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                                color: product.stock <= (product.min_stock_level || 0) ? "#dc2626" : "inherit",
                                fontWeight: product.stock <= (product.min_stock_level || 0) ? 700 : 400
                              }}
                              defaultValue={product.stock || 0}
                              disabled={!!updatingStock[product.id]}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val !== product.stock) {
                                  setProductStock(product.id, val);
                                }
                              }}
                            />
                            {product.stock <= (product.min_stock_level || 0) && (
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
            <h3 className="form-breadcrumb">{editingProduct ? "Edit product" : "Product details"}</h3>

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
                <label className="form-label">Product ID</label>
                <input
                  type="text"
                  className="form-input-styled"
                  placeholder="SKU / custom ID"
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
                <label className="form-label">Price *</label>
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
      </div>
    </>
  );
}
