"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Download, 
  Loader2, 
  UserPlus, 
  History, 
  Tag, 
  Phone, 
  Building,
  AlertCircle,
  TrendingDown,
  DollarSign
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import "./reports.css";

// Interface definitions
interface Product {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
  products?: {
    name: string;
    selling_price: number;
  };
}

interface Sale {
  id: string;
  sale_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  total_amount: number;
  created_at: string;
  sale_items: SaleItem[];
}

export default function IMReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState({
    totalInventoryValue: 0,
    totalProducts: 0,
    totalSalesVal: 0,
    totalOrders: 0,
    totalQtySold: 0,
    orderStatusCounts: {} as Record<string, number>
  });

  // Form state
  const [formData, setFormData] = useState({
    buyerName: "",
    phoneNumber: "",
    orgName: "",
    productId: "",
    quantity: ""
  });

  // Fetch all necessary data for reports & sales
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first.");
        return;
      }

      // Get user organization details
      const { data: userRow } = await supabase
        .from("users")
        .select("id, org_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userRow?.org_id) {
        console.error("No organization found for current user.");
        setLoading(false);
        return;
      }

      setOrgId(userRow.org_id);

      // FIXED: Fetch ALL products without requiring delivered purchase orders
      const { data: allProducts, error: prodError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          selling_price,
          current_stock
        `)
        .eq("org_id", userRow.org_id)
        .order("name");

      if (prodError) {
        console.error("Products fetch error:", prodError);
        toast.error("Failed to load products");
      }

      // Filter products to only show those with stock > 0 for selling
      const fetchedProducts = (allProducts || [])
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          selling_price: Number(p.selling_price || 0),
          current_stock: Number(p.current_stock || 0)
        }))
        .filter(p => p.current_stock > 0); // Only show products with stock

      // Fetch sales data
      const { data: salesRes, error: salesError } = await supabase
        .from("sales")
        .select(`
          id,
          sale_number,
          customer_name,
          customer_phone,
          notes,
          total_amount,
          created_at,
          sale_items (
            id,
            quantity,
            unit_price,
            total_price,
            product_id,
            products (
              name,
              selling_price
            )
          )
        `)
        .eq("org_id", userRow.org_id)
        .order("created_at", { ascending: false });

      if (salesError) {
        console.error("Sales fetch error:", salesError);
      }

      const fetchedSales = (salesRes || []).map((sale: any) => {
        const items = (sale.sale_items || []).map((item: any) => ({
          ...item,
          products: Array.isArray(item.products) ? item.products[0] : item.products
        }));
        return {
          ...sale,
          sale_items: items
        };
      });

      // Fetch purchase orders for stats
      const { data: poRes } = await supabase
        .from("purchase_orders")
        .select("status")
        .eq("org_id", userRow.org_id);

      setProducts(fetchedProducts);
      setSales(fetchedSales);

      // Calculations for metrics
      const totalInventoryVal = fetchedProducts.reduce(
        (sum, p) => sum + (p.selling_price * p.current_stock), 
        0
      );

      const totalSalesRevenue = fetchedSales.reduce(
        (sum, s) => sum + Number(s.total_amount || 0), 
        0
      );

      const totalQtySold = fetchedSales.reduce(
        (sum, s) => sum + (s.sale_items?.reduce((iSum: number, item: SaleItem) => iSum + (item.quantity || 0), 0) || 0),
        0
      );

      // Purchase orders status count breakdown
      const orders = poRes || [];
      const statusCounts = orders.reduce((acc, o) => {
        const status = o.status || "pending";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({
        totalInventoryValue: totalInventoryVal,
        totalProducts: fetchedProducts.length,
        totalSalesVal: totalSalesRevenue,
        totalOrders: orders.length,
        totalQtySold: totalQtySold,
        orderStatusCounts: statusCounts
      });

    } catch (err) {
      console.error("Report data fetch error:", err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selected product details for preview in form
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === formData.productId) || null;
  }, [products, formData.productId]);

  // Real-time calculation of sale values
  const saleCalculation = useMemo(() => {
    if (!selectedProduct) return { subtotal: 0, tax: 0, total: 0 };
    const qty = parseInt(formData.quantity, 10) || 0;
    const subtotal = selectedProduct.selling_price * qty;
    const tax = subtotal * 0.13; // 13% tax/VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [selectedProduct, formData.quantity]);

  // Input changes handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form submission to insert sales and automatically update stock
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgId) {
      toast.error("Organization context not loaded. Please try again.");
      return;
    }

    if (!formData.buyerName.trim()) {
      toast.error("Buyer Name is required.");
      return;
    }

    if (!formData.productId) {
      toast.error("Please select a product to sell.");
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity greater than 0.");
      return;
    }

    if (!selectedProduct) {
      toast.error("Selected product not found.");
      return;
    }

    if (qty > selectedProduct.current_stock) {
      toast.error(`Not enough stock. Available: ${selectedProduct.current_stock} units.`);
      return;
    }

    setSubmitting(true);

    try {
      const finalAmount = selectedProduct.selling_price * qty;
      const totalWithTax = finalAmount * 1.13;

      // 1. Insert sale record
      const { data: newSale, error: saleError } = await supabase
        .from("sales")
        .insert({
          org_id: orgId,
          customer_name: formData.buyerName.trim(),
          customer_phone: formData.phoneNumber.trim() || null,
          notes: formData.orgName.trim() || null,
          subtotal: finalAmount,
          tax_amount: finalAmount * 0.13,
          discount_amount: 0,
          total_amount: totalWithTax,
          payment_status: "paid",
          payment_method: "cash"
        })
        .select()
        .single();

      if (saleError || !newSale) {
        throw new Error(saleError?.message || "Failed to create sale record");
      }

      // 2. Insert sale item record
      const { error: itemError } = await supabase
        .from("sale_items")
        .insert({
          sale_id: newSale.id,
          product_id: selectedProduct.id,
          quantity: qty,
          unit_price: selectedProduct.selling_price,
          total_price: finalAmount
        });

      if (itemError) {
        throw new Error(itemError.message || "Failed to log sale item");
      }

      // 3. Update product stock manually (as fallback if trigger doesn't exist)
      const { error: updateStockError } = await supabase
        .from("products")
        .update({ 
          current_stock: selectedProduct.current_stock - qty,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedProduct.id);

      if (updateStockError) {
        console.error("Stock update error:", updateStockError);
        // Don't throw here as sale was recorded
        toast.warning("Sale recorded but stock update failed. Please check inventory.");
      } else {
        toast.success(`Sale recorded successfully! Stock for ${selectedProduct.name} updated.`);
      }

      // Reset form
      setFormData({
        buyerName: "",
        phoneNumber: "",
        orgName: "",
        productId: "",
        quantity: ""
      });

      // Refresh data
      await fetchData();

    } catch (err: any) {
      console.error("Sale submission error:", err);
      toast.error(err.message || "Failed to submit sale.");
    } finally {
      setSubmitting(false);
    }
  };

  // Mock export reports function
  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ stats, sales }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `GoGodam_Report_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Reports exported successfully as JSON!");
    } catch (e) {
      toast.error("Export failed.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 120, gap: 16 }}>
        <Loader2 className="animate-spin" size={40} color="#6008f8" />
        <p style={{ color: "#6b7280", fontWeight: 600 }}>Loading live reports and sales log...</p>
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

  return (
    <div className="reports-container">
      {/* Header Row */}
      <div className="reports-header-row">
        <div>
          <h2 className="reports-title">Reports & Live Sales</h2>
          <p className="reports-subtitle">Track products sold, buyers history, and automatic stock depletion.</p>
        </div>
        <div className="reports-actions">
          <button className="btn-export" onClick={handleExportData}>
            <Download size={16} /> Export Reports
          </button>
        </div>
      </div>

      {/* Premium Statistics Metrics Grid */}
      <div className="reports-stats-grid">
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper purple">
            <TrendingUp size={22} />
          </div>
          <div className="stat-text">
            <h3>₹{stats.totalInventoryValue.toLocaleString()}</h3>
            <p>Inventory Value</p>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper blue">
            <Package size={22} />
          </div>
          <div className="stat-text">
            <h3>{stats.totalProducts}</h3>
            <p>Total SKUs</p>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper green">
            <DollarSign size={22} />
          </div>
          <div className="stat-text">
            <h3>₹{stats.totalSalesVal.toLocaleString()}</h3>
            <p>Total Sales Rev</p>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper indigo">
            <ShoppingCart size={22} />
          </div>
          <div className="stat-text">
            <h3>{stats.totalQtySold} units</h3>
            <p>Total Qty Sold</p>
          </div>
        </div>
      </div>

      {/* Main Split Grid (Form vs Sales Log) */}
      <div className="reports-layout-grid">
        
        {/* Left Side: Recent Sales Log / Customer Purchases */}
        <div className="premium-card">
          <div className="card-title-row">
            <h3 className="card-title"><History size={18} color="#6008f8" /> Sales & Customer Log</h3>
            <span className="card-subtitle">{sales.length} transactions recorded</span>
          </div>

          <div className="sales-log-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Sale #</th>
                  <th>Buyer details</th>
                  <th>Product Sold</th>
                  <th>Total Paid</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-table-state">
                      <ShoppingCart size={32} color="#b5b3bb" style={{ marginBottom: 8 }} />
                      <p>No sales logged yet.</p>
                      <p>Use the form on the right to sell products and decrease stock.</p>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => {
                    const item = sale.sale_items?.[0];
                    return (
                      <tr key={sale.id}>
                        <td>
                          <span className="sale-badge">{sale.sale_number}</span>
                        </td>
                        <td>
                          <div className="buyer-info-col">
                            <span className="buyer-name">{sale.customer_name || "Walk-in Customer"}</span>
                            {sale.customer_phone && <span className="buyer-phone"><Phone size={10} style={{ display: "inline", marginRight: 4 }} />{sale.customer_phone}</span>}
                            {sale.notes && <span className="buyer-org-badge"><Building size={9} style={{ display: "inline", marginRight: 3 }} /> {sale.notes}</span>}
                          </div>
                        </td>
                        <td>
                          {item ? (
                            <div className="product-sold-info">
                              <span className="product-sold-name">{item.products?.name || "Unknown Product"}</span>
                              <span className="product-sold-qty">{item.quantity} unit{item.quantity > 1 ? "s" : ""} @ ₹{item.unit_price.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span style={{ color: "#8b8994" }}>No items listed</span>
                          )}
                        </td>
                        <td>
                          <span className="amount-col">₹{sale.total_amount.toLocaleString()}</span>
                        </td>
                        <td>
                          <span className="date-col">{new Date(sale.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Sell Product Form */}
        <div className="premium-card" style={{ alignSelf: "start" }}>
          <div className="card-title-row">
            <h3 className="card-title"><UserPlus size={18} color="#6008f8" /> Record New Sale</h3>
            <span className="card-subtitle">Depletes stock immediately</span>
          </div>

          <form className="sell-form" onSubmit={handleRecordSale}>
            
            <div className="form-group-premium">
              <label className="form-label-premium">Buyer / Customer Name *</label>
              <input 
                type="text" 
                name="buyerName"
                className="input-premium"
                placeholder="e.g. John Doe"
                required
                value={formData.buyerName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group-premium">
                <label className="form-label-premium">Phone Number</label>
                <input 
                  type="tel" 
                  name="phoneNumber"
                  className="input-premium"
                  placeholder="e.g. 9841234567"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group-premium">
                <label className="form-label-premium">Buyer Organization</label>
                <input 
                  type="text" 
                  name="orgName"
                  className="input-premium"
                  placeholder="e.g. Acme Corp (optional)"
                  value={formData.orgName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group-premium">
              <label className="form-label-premium">Select Product *</label>
              <select 
                name="productId"
                className="select-premium"
                required
                value={formData.productId}
                onChange={handleInputChange}
              >
                <option value="">-- Choose in-stock product --</option>
                {products.length === 0 ? (
                  <option value="" disabled>No products with stock available</option>
                ) : (
                  products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} (Stock: {prod.current_stock} units) - ₹{prod.selling_price.toLocaleString()}
                    </option>
                  ))
                )}
              </select>
              {products.length === 0 && (
                <p style={{ fontSize: "12px", color: "#f59e0b", marginTop: "4px" }}>
                  No products with available stock. Please add products or receive inventory first.
                </p>
              )}
            </div>

            <div className="form-group-premium">
              <label className="form-label-premium">Quantity to Sell *</label>
              <input 
                type="number" 
                name="quantity"
                className="input-premium"
                placeholder="Enter quantity"
                required
                min="1"
                max={selectedProduct ? selectedProduct.current_stock : undefined}
                value={formData.quantity}
                onChange={handleInputChange}
                disabled={!formData.productId}
              />
              {selectedProduct && (
                <span style={{ fontSize: "11px", color: "#6b7280", marginTop: 2, fontWeight: 500 }}>
                  Max allowed: {selectedProduct.current_stock} units
                </span>
              )}
            </div>

            {/* Live Transaction Preview */}
            {selectedProduct && formData.quantity && (
              <div className="sale-preview-box">
                <div className="preview-title">Transaction Receipt</div>
                <div className="preview-row">
                  <span>Product:</span>
                  <span style={{ fontWeight: 600 }}>{selectedProduct.name}</span>
                </div>
                <div className="preview-row">
                  <span>Price per Unit:</span>
                  <span>₹{selectedProduct.selling_price.toLocaleString()}</span>
                </div>
                <div className="preview-row">
                  <span>Subtotal:</span>
                  <span>₹{saleCalculation.subtotal.toLocaleString()}</span>
                </div>
                <div className="preview-row">
                  <span>VAT / Tax (13%):</span>
                  <span>₹{saleCalculation.tax.toLocaleString()}</span>
                </div>
                <div className="preview-row">
                  <span>Stock Depletion:</span>
                  <div className="stock-change-indicator">
                    <span className="stock-before">{selectedProduct.current_stock}</span>
                    <span>→</span>
                    <span className={`stock-after ${(selectedProduct.current_stock - (parseInt(formData.quantity, 10) || 0)) <= 10 ? "warning" : ""}`}>
                      {selectedProduct.current_stock - (parseInt(formData.quantity, 10) || 0)} units
                    </span>
                  </div>
                </div>
                <div className="preview-row total">
                  <span>Total Amount:</span>
                  <span>₹{saleCalculation.total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-submit-sale"
              disabled={submitting || !formData.buyerName || !formData.productId || !formData.quantity || products.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Recording Sale...
                </>
              ) : (
                "Finalize & Record Sale"
              )}
            </button>

          </form>
        </div>

      </div>

      {/* Retained Feature: Purchase Order Status breakdown */}
      <div className="premium-card" style={{ marginTop: 8 }}>
        <div className="card-title-row">
          <h3 className="card-title"><Building size={18} color="#6008f8" /> Supply Purchase Orders Breakdown</h3>
          <span className="card-subtitle">{stats.totalOrders} total supply orders</span>
        </div>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.orderStatusCounts).map(([status, count]) => (
              <tr key={status}>
                <td style={{ fontWeight: 700, color: "#1e004b", textTransform: "capitalize" }}>
                  {status.replace(/_/g, " ")}
                </td>
                <td>{count}</td>
                <td style={{ color: "#6b7280", fontWeight: 500 }}>
                  {((count / stats.totalOrders) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats.totalOrders === 0 && (
          <p style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>
            No purchase order data available.
          </p>
        )}
      </div>

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