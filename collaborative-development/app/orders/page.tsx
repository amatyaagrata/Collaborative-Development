"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import "./orders.css"; // You'll need to create this CSS file

interface Order {
  id: string;
  product: string;
  suppliers: string;
  productId: string;
  category: string;
  price: number;
  quantity: number;
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([
    { id: "1", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "2", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "3", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "4", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "5", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "6", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
    { id: "7", product: "Product", suppliers: "AB", productId: "#1234", category: "Bed", price: 1000, quantity: 67 },
  ]);

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    product: "",
    suppliers: "",
    productId: "",
    category: "",
    price: "",
    quantity: "",
  });

  const filteredOrders = orders.filter((order) =>
    order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.suppliers.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ product: "", suppliers: "", productId: "", category: "", price: "", quantity: "" });
    setViewMode("form");
  };

  const handleEditClick = (order: Order) => {
    setFormMode("edit");
    setEditingId(order.id);
    setFormData({
      product: order.product,
      suppliers: order.suppliers,
      productId: order.productId,
      category: order.category,
      price: order.price.toString(),
      quantity: order.quantity.toString(),
    });
    setViewMode("form");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      setOrders(orders.filter((order) => order.id !== id));
      toast.success("Order deleted successfully");
    }
  };

  const handleCancelClick = () => {
    setViewMode("list");
  };

  const handleSaveClick = () => {
    if (!formData.product || !formData.category) {
      toast.error("Please fill in the required fields (Product and Category).");
      return;
    }

    if (formMode === "add") {
      addOrder();
    } else if (formMode === "edit" && editingId !== null) {
      updateOrder(editingId);
    }

    setViewMode("list");
  };

  const addOrder = () => {
    const newOrder: Order = {
      id: Date.now().toString(),
      product: formData.product,
      suppliers: formData.suppliers || "Unknown",
      productId: formData.productId || `#${Math.floor(Math.random() * 9999)}`,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity) || 0,
    };
    setOrders([...orders, newOrder]);
    toast.success("Order added successfully");
  };

  const updateOrder = (id: string) => {
    const updatedOrders = orders.map((order) =>
      order.id === id
        ? {
            ...order,
            product: formData.product,
            suppliers: formData.suppliers,
            productId: formData.productId,
            category: formData.category,
            price: parseFloat(formData.price) || 0,
            quantity: parseInt(formData.quantity) || 0,
          }
        : order
    );
    setOrders(updatedOrders);
    toast.success("Order updated successfully");
  };

  const headerTitle = viewMode === "list" ? "Orders" : formMode === "add" ? "New Order" : "Edit Order";

  return (
    <AppLayout title={headerTitle}>
      <div className="orders-content">
        
        {/* ═══ LIST VIEW ═══ */}
        {viewMode === "list" && (
          <>
            <div className="orders-header-row">
              <h2 className="orders-title">All Orders</h2>
            </div>

            {/* Toolbar: Search + Add */}
            <div className="orders-toolbar">
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
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <input type="checkbox" className="orders-checkbox" />
                          </td>
                          <td style={{ fontWeight: 600 }}>{order.product}</td>
                          <td>{order.suppliers}</td>
                          <td>{order.productId}</td>
                          <td>{order.category}</td>
                          <td>${order.price.toLocaleString()}</td>
                          <td>
                            <span className={order.quantity > 50 ? "orders-quantity-high" : "orders-quantity-low"}>
                              {order.quantity}
                            </span>
                          </td>
                          <td>
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

        {/* ═══ FORM VIEW (ADD / EDIT) ═══ */}
        {viewMode === "form" && (
          <div className="orders-form-container">
            <h3 className="orders-form-breadcrumb">Order Details</h3>

            <div className="orders-form-card">
              {/* Row 1: Product + Suppliers */}
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Product Name *</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Enter product name"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Suppliers</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Supplier name"
                    value={formData.suppliers}
                    onChange={(e) => setFormData({ ...formData, suppliers: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Product ID + Category */}
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Product ID</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="#364738"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Category *</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Price + Quantity */}
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Price</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="$.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Quantity</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="orders-form-actions">
                <button className="orders-btn orders-btn-secondary" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="orders-btn orders-btn-primary" onClick={handleSaveClick}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}