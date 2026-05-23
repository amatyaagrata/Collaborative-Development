"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Download, 
  Loader2, 
  History, 
  Tag, 
  Phone, 
  Building,
  AlertCircle,
  TrendingDown,
  DollarSign,
  Search,
  Filter
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
  notes: string | null; // Used for organization name
  total_amount: number;
  created_at: string;
  sale_items: SaleItem[];
}

export default function AdminReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

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

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProduct, setFilterProduct] = useState("");

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
        .select("id, org_id, organizations(name)")
        .eq("auth_user_id", user.id)
        .single();

      const finalOrgId = userRow?.org_id;
      if (!finalOrgId) {
        console.error("No organization found for current admin user.");
        setLoading(false);
        return;
      }

      setOrgId(finalOrgId);
      if (userRow?.organizations) {
        setOrgName((userRow.organizations as any).name);
      }

      // Parallel queries to fetch products, sales history, and purchase orders status
      const [prodRes, salesRes, poRes] = await Promise.all([
        supabase
          .from("products")
          .select(`
            id,
            name,
            selling_price,
            current_stock
          `)
          .eq("org_id", finalOrgId)
          .order("name"),
        supabase
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
          .eq("org_id", finalOrgId)
          .order("created_at", { ascending: false }),
        supabase
          .from("purchase_orders")
          .select("status")
          .eq("org_id", finalOrgId)
      ]);

      // Filter and de-duplicate products
      const rawProducts = prodRes.data || [];
      const uniqueProducts: Record<string, Product> = {};
      rawProducts.forEach((p: any) => {
        if (!uniqueProducts[p.id]) {
          uniqueProducts[p.id] = {
            id: p.id,
            name: p.name,
            selling_price: Number(p.selling_price || 0),
            current_stock: Number(p.current_stock || 0)
          };
        }
      });
      const fetchedProducts = Object.values(uniqueProducts);
      const fetchedSales = (salesRes.data || []).map((sale: any) => {
        const items = (sale.sale_items || []).map((item: any) => ({
          ...item,
          products: Array.isArray(item.products) ? item.products[0] : item.products
        }));
        return {
          ...sale,
          sale_items: items
        };
      });

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
      const orders = poRes.data || [];
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
      console.error("Admin Report data fetch error:", err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export reports function
  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ stats, sales }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `GoGodam_Admin_Report_${orgName || "Org"}_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Reports exported successfully as JSON!");
    } catch (e) {
      toast.error("Export failed.");
    }
  };

  // Filter sales based on search term and selected product filter
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchSearch = 
        !searchTerm.trim() || 
        (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.customer_phone && sale.customer_phone.includes(searchTerm)) ||
        (sale.sale_number && sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sale.notes && sale.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchProduct = 
        !filterProduct || 
        sale.sale_items.some(item => item.product_id === filterProduct);

      return matchSearch && matchProduct;
    });
  }, [sales, searchTerm, filterProduct]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 120, gap: 16 }}>
        <Loader2 className="animate-spin" size={40} color="#6008f8" />
        <p style={{ color: "#6b7280", fontWeight: 600 }}>Loading organization reports and sales log...</p>
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
          <h2 className="reports-title">Reports & Live Sales {orgName ? `(${orgName})` : ""}</h2>
          <p className="reports-subtitle">Track organization product sales, buyer histories, and automatic stock depletion.</p>
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
      <div className="reports-layout-grid" style={{ gridTemplateColumns: '1fr' }}>
        
        {/* Full Width: Recent Sales Log / Customer Purchases */}
        <div className="premium-card">
          <div className="card-title-row">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 className="card-title"><History size={18} color="#6008f8" /> Sales & Customer Log</h3>
              <span className="card-subtitle">{filteredSales.length} transactions match filters</span>
            </div>
            
            {/* Search & Filter Controls */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={14} style={{ position: "absolute", left: 10, color: "#8b8994" }} />
                <input
                  type="text"
                  placeholder="Search buyer/phone/sale #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    height: 34,
                    width: 200,
                    borderRadius: 8,
                    border: "1px solid #ece8f4",
                    paddingLeft: 30,
                    paddingRight: 10,
                    fontSize: "12px",
                    color: "#1e004b",
                  }}
                />
              </div>

              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Filter size={14} style={{ position: "absolute", left: 10, color: "#8b8994" }} />
                <select
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  style={{
                    height: 34,
                    width: 150,
                    borderRadius: 8,
                    border: "1px solid #ece8f4",
                    paddingLeft: 30,
                    paddingRight: 20,
                    fontSize: "12px",
                    color: "#1e004b",
                    appearance: "none",
                    background: "white",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236008f8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                  }}
                >
                  <option value="">All Products</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
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
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-table-state">
                      <ShoppingCart size={32} color="#b5b3bb" style={{ marginBottom: 8 }} />
                      <p>No sales matches the criteria.</p>
                      <p>Clear search or filters, or use the form to record a new sale.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
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
      </div>

      {/* Supply Purchase Orders Breakdown */}
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
