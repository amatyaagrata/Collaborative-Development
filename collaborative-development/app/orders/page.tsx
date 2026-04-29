"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import "./orders.css";

// TypeScript Interfaces for type safety
interface Order {
  id: string; 
  product_name: string;
  supplier_name: string;
  custom_product_id: string;
  category: string;
  total_price: number;
  quantity: number;
  created_at?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  categories?: {
    name?: string;
  }[] | {
    name?: string;
  } | null;
}

/**
 * Helper function to extract category name from product object
 * Handles both array and single object category structures
 */
function getCategoryName(product: Product): string {
  if (Array.isArray(product.categories)) return product.categories[0]?.name || "";
  return product.categories?.name || "";
}

export default function OrdersPage() {
  // Supabase client instance for database operations
  const supabase = createClient();
  
  // UI State Management
  const [searchTerm, setSearchTerm] = useState(""); // Search filter for orders
  const [orders, setOrders] = useState<Order[]>([]); // List of orders from database
  const [products, setProducts] = useState<Product[]>([]); // List of products for dropdown
  const [loading, setLoading] = useState(true); // Loading state for orders
  const [loadingProducts, setLoadingProducts] = useState(false); // Loading state for products

  // View Management (list vs form view)
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form data state for creating/editing orders
  const [formData, setFormData] = useState({
    product_name: "",
    supplier_name: "",
    custom_product_id: "",
    category: "",
    total_price: "",
    quantity: "",
    selected_product_id: "", // Track selected product ID for stock management
  });

  /**
   * Fetch all orders from Supabase database
   * Orders are sorted by creation date (newest first)
   */
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load orders: " + error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [supabase]);

  /**
   * Fetch all products from Supabase database
   * Includes related category information via foreign key
   * Products are sorted alphabetically by name
   */
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, stock, categories:category_id(name)")
      .order("name", { ascending: true });
    if (error) {
      toast.error("Failed to load products: " + error.message);
    } else {
      setProducts(data || []);
    }
    setLoadingProducts(false);
  }, [supabase]);

  /**
   * Initial data load when component mounts
   * Uses Promise.resolve() to ensure async operations don't block rendering
   */
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchOrders();
      fetchProducts();
    });
  }, [fetchOrders, fetchProducts]);

  /**
   * Filter orders based on search term
   * Searches across multiple fields: product name, supplier, product ID, and category
   */
  const filteredOrders = orders.filter((order) =>
    (order.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.custom_product_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Switch to form view for adding a new order
   * Reset all form fields to empty/default values
   */
  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ 
      product_name: "", 
      supplier_name: "", 
      custom_product_id: "", 
      category: "", 
      total_price: "", 
      quantity: "",
      selected_product_id: "",
    });
    setViewMode("form");
  };

  /**
   * Handle product selection from dropdown
   * Auto-populates product details (name, category, price)
   * Does NOT auto-fill quantity - user specifies how many they want
   */
  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setFormData({
        ...formData,
        selected_product_id: productId,
        product_name: selectedProduct.name,
        category: getCategoryName(selectedProduct),
        total_price: selectedProduct.price.toString(),
        // Quantity intentionally left empty - user must specify order quantity
      });
    }
  };

  /**
   * Switch to form view for editing an existing order
   * Populate form with existing order data
   */
  const handleEditClick = (order: Order) => {
    setFormMode("edit");
    setEditingId(order.id);
    setFormData({
      product_name: order.product_name || "",
      supplier_name: order.supplier_name || "",
      custom_product_id: order.custom_product_id || "",
      category: order.category || "",
      total_price: (order.total_price || 0).toString(),
      quantity: (order.quantity || 0).toString(),
      selected_product_id: "",
    });
    setViewMode("form");
  };

  /**
   * Cancel form editing and return to list view
   */
  const handleCancelClick = () => {
    setViewMode("list");
  };

  /**
   * Save order to database (create new or update existing)
   * Handles validation, stock management, and database operations
   */
  const handleSaveClick = async () => {
    // Validate required fields
    if (!formData.product_name || !formData.category) {
      toast.error("Please fill in the required fields (Product and Category).");
      return;
    }

    // Parse and validate numeric values
    const total_price = parseFloat(formData.total_price);
    const quantity = parseInt(formData.quantity, 10);

    // Price validation - must be a valid number and non-negative
    if (isNaN(total_price)) {
      toast.error("Please enter a valid price.");
      return;
    }
    
    if (total_price < 0) {
      toast.error("Price cannot be negative. Please enter a valid price.");
      return;
    }

    // Quantity validation - must be a valid number and non-negative
    if (isNaN(quantity)) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    if (quantity < 0) {
      toast.error("Quantity cannot be negative. Please enter a valid quantity.");
      return;
    }

    // Stock validation for new orders - check if enough stock available
    if (formMode === "add" && formData.selected_product_id) {
      const selectedProduct = products.find(p => p.id === formData.selected_product_id);
      if (selectedProduct && quantity > selectedProduct.stock) {
        toast.error(`Insufficient stock! Available stock: ${selectedProduct.stock}`);
        return;
      }
    }

    // Prepare order payload for database
    const payload = {
      product_name: formData.product_name,
      supplier_name: formData.supplier_name || "Unknown",
      custom_product_id: formData.custom_product_id || `#${Math.floor(Math.random() * 9999)}`,
      category: formData.category,
      total_price: total_price || 0,
      quantity: quantity || 0,
      total_amount: (total_price || 0) * (quantity || 0),
    };

    // Handle Add New Order
    if (formMode === "add") {
      const insertPayload = {
        ...payload,
        order_number: `ORD-${Date.now()}`, // Generate unique order number using timestamp
        status: "pending",
      };
      
      // Step 1: Create the order in database
      const { data: orderData, error: orderError } = await supabase.from("orders").insert([insertPayload]).select();
      
      if (orderError) {
        toast.error("Failed to add order: " + orderError.message);
        return;
      }

      // Step 2: Update product stock if a product was selected
      if (formData.selected_product_id && orderData) {
        const selectedProduct = products.find(p => p.id === formData.selected_product_id);
        if (selectedProduct) {
          const newStock = selectedProduct.stock - quantity;
          const { error: updateError } = await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", formData.selected_product_id);
          
          if (updateError) {
            toast.error("Order added but failed to update stock: " + updateError.message);
          } else {
            toast.success("Order added and stock updated successfully!");
            fetchProducts(); // Refresh products list to show updated stock
          }
        } else {
          toast.success("Order added successfully!");
        }
      } else {
        toast.success("Order added successfully!");
      }
    } 
    // Handle Edit Existing Order
    else if (formMode === "edit" && editingId !== null) {
      // Calculate stock difference for edit operations
      const originalOrder = orders.find(o => o.id === editingId);
      const quantityDifference = quantity - (originalOrder?.quantity || 0);
      
      // Update order in database
      const { error } = await supabase.from("orders").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Failed to update order: " + error.message);
        return;
      }
      
      // Update stock if quantity changed and product is linked
      if (formData.selected_product_id && quantityDifference !== 0) {
        const selectedProduct = products.find(p => p.id === formData.selected_product_id);
        if (selectedProduct) {
          const newStock = selectedProduct.stock - quantityDifference;
          // Prevent negative stock
          if (newStock < 0) {
            toast.error("Cannot update order: Insufficient stock for the additional quantity!");
            return;
          }
          const { error: updateError } = await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", formData.selected_product_id);
          
          if (updateError) {
            toast.error("Order updated but failed to update stock: " + updateError.message);
          } else {
            toast.success("Order updated and stock adjusted successfully!");
            fetchProducts(); // Refresh products list
          }
        }
      } else {
        toast.success("Order updated successfully!");
      }
    }

    // Refresh orders list and return to list view
    setLoading(true);
    fetchOrders();
    setViewMode("list");
  };

  /**
   * Delete an order from database
   * Restores product stock when order is deleted
   * Shows confirmation dialog before deletion
   */
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this order?")) {
      // Get order details before deletion to restore stock
      const orderToDelete = orders.find(o => o.id === id);
      
      // Delete the order
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete order: " + error.message);
      } else {
        // Restore stock by finding matching product by name
        if (orderToDelete) {
          const relatedProduct = products.find(p => p.name === orderToDelete.product_name);
          if (relatedProduct) {
            const restoredStock = relatedProduct.stock + orderToDelete.quantity;
            await supabase
              .from("products")
              .update({ stock: restoredStock })
              .eq("id", relatedProduct.id);
            fetchProducts(); // Refresh products list
          }
        }
        toast.success("Order deleted and stock restored.");
        setLoading(true);
        fetchOrders(); // Refresh orders list
      }
    }
  };

  // Dynamic header title based on current view and mode
  const headerTitle = viewMode === "list" ? "Orders" : formMode === "add" ? "New Order" : "Edit Order";

  return (
    <AppLayout title={headerTitle}>
      <div className="orders-content">
        
        {/* LIST VIEW - Display all orders in a table */}
        {viewMode === "list" && (
          <>
            {/* Header Section */}
            <div className="orders-header-row">
              <h2 className="orders-title">All Orders</h2>
            </div>

            {/* Toolbar with search and add button */}
            <div className="orders-toolbar">
              {/* Search Input */}
              <div className="orders-search-wrapper">
                <Search size={16} className="orders-search-icon" />
                <input
                  type="text"
                  className="orders-search-input"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Add New Order Button */}
              <div className="orders-toolbar-actions">
                <button className="orders-add-btn" onClick={handleAddClick}>
                  <Plus size={16} />
                  Add New Order
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="orders-table-card">
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input type="checkbox" className="orders-checkbox" />
                      </th>
                      <th>Product</th>
                      <th>Suppliers</th>
                      <th>Product Id</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Loading State */}
                    {loading ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>Loading orders from database...</td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      /* Empty State - No orders found */
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>No orders found</td>
                      </tr>
                    ) : (
                      /* Render each order as a table row */
                      filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <input type="checkbox" className="orders-checkbox" />
                          </td>
                          <td style={{ fontWeight: 600 }}>{order.product_name}</td>
                          <td>{order.supplier_name}</td>
                          <td>{order.custom_product_id}</td>
                          <td>{order.category}</td>
                          <td>${Number(order.total_price).toLocaleString()}</td>
                          <td>
                            {/* Visual indicator for quantity levels */}
                            <span className={order.quantity > 50 ? "orders-quantity-high" : "orders-quantity-low"}>
                              {order.quantity}
                            </span>
                          </td>
                          <td>
                            {/* Action Buttons - Edit and Delete */}
                            <div className="orders-action-buttons">
                              <button className="orders-action-btn" onClick={() => handleEditClick(order)}>
                                <Pencil size={16} />
                              </button>
                              <button className="orders-action-btn delete" onClick={() => handleDelete(order.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* FORM VIEW - Add/Edit Order Form */}
        {viewMode === "form" && (
          <div className="orders-form-container">
            {/* Form Breadcrumb/Title */}
            <h3 className="orders-form-breadcrumb">Order Details</h3>

            <div className="orders-form-card">
              {/* Row 1: Product Selection */}
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Select Product *</label>
                  <select
                    className="orders-form-input"
                    value={formData.selected_product_id}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    disabled={formMode === "edit"} // Product cannot be changed in edit mode
                  >
                    <option value="">-- Select a product --</option>
                    {loadingProducts ? (
                      <option disabled>Loading products...</option>
                    ) : (
                      products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Stock: {product.stock} - Price: ${product.price}
                        </option>
                      ))
                    )}
                  </select>
                  {/* Edit mode note */}
                  {formMode === "edit" && (
                    <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
                      Product cannot be changed in edit mode
                    </small>
                  )}
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Product Name *</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Enter product name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    readOnly={!!formData.selected_product_id} // Read-only when product is selected from dropdown
                  />
                </div>
              </div>

              {/* Row 2: Supplier and Product ID */}
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Suppliers</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Supplier name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Product ID</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="#364738"
                    value={formData.custom_product_id}
                    onChange={(e) => setFormData({ ...formData, custom_product_id: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Category and Price */}
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Category *</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    readOnly={!!formData.selected_product_id} // Read-only when product is selected
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Price</label>
                  <input
                    type="number"
                    className="orders-form-input"
                    placeholder="$.00"
                    min="0"
                    step="0.01"
                    value={formData.total_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow non-negative values
                      if (value === "" || parseFloat(value) >= 0) {
                        setFormData({ ...formData, total_price: value });
                      }
                    }}
                    readOnly={!!formData.selected_product_id} // Read-only when product is selected
                  />
                </div>
              </div>

              {/* Row 4: Quantity */}
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Quantity</label>
                  <input
                    type="number"
                    className="orders-form-input"
                    placeholder="Quantity"
                    min="0"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow non-negative values
                      if (value === "" || parseInt(value, 10) >= 0) {
                        setFormData({ ...formData, quantity: value });
                      }
                    }}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="orders-form-actions">
                <button className="orders-btn orders-btn-secondary" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="orders-btn orders-btn-primary" onClick={handleSaveClick}>
                  Save Order
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}