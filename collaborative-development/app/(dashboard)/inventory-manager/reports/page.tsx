"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Download, 
  Loader2, 
  History, 
  Building,
  DollarSign,
  MapPin,
  Filter,
  Layers
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import "./reports.css";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
  location: string;
}

interface PurchaseOrder {
  id: string;
  status: string;
  location: string;
  total_amount?: number;
}

interface LocationReportSummary {
  locationName: string;
  totalSKUs: number;
  totalStockVolume: number;
  estimatedValue: number;
  associatedOrdersCount: number;
}

export default function LocationReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first.");
        return;
      }

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

      const { data: allProducts, error: prodError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          selling_price,
          current_stock,
          location
        `)
        .eq("org_id", userRow.org_id)
        .order("name");

      if (prodError) {
        console.error("Products fetch error:", prodError);
        toast.error("Failed to load products database records");
      }

      const fetchedProducts = (allProducts || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        selling_price: Number(p.selling_price || 0),
        current_stock: Number(p.current_stock || 0),
        location: p.location || "Primary Hub Warehouse"
      }));

      const { data: poRes, error: poError } = await supabase
        .from("purchase_orders")
        .select("id, status, location, total_amount")
        .eq("org_id", userRow.org_id);

      if (poError) {
        console.error("Purchase orders fetch error:", poError);
      }

      const fetchedOrders = (poRes || []).map((o: any) => ({
        id: o.id,
        status: o.status || "pending",
        location: o.location || "Primary Hub Warehouse",
        total_amount: Number(o.total_amount || 0)
      }));

      setProducts(fetchedProducts);
      setPurchaseOrders(fetchedOrders);

    } catch (err) {
      console.error("Location report metrics aggregation failed:", err);
      toast.error("System error loading location distributed data assets");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const locationMetricsList = useMemo(() => {
    const trackingMap: Record<string, LocationReportSummary> = {};

    products.forEach(p => {
      const loc = p.location;
      if (!trackingMap[loc]) {
        trackingMap[loc] = {
          locationName: loc,
          totalSKUs: 0,
          totalStockVolume: 0,
          estimatedValue: 0,
          associatedOrdersCount: 0
        };
      }
      trackingMap[loc].totalSKUs += 1;
      trackingMap[loc].totalStockVolume += p.current_stock;
      trackingMap[loc].estimatedValue += (p.selling_price * p.current_stock);
    });

    purchaseOrders.forEach(o => {
      const loc = o.location;
      if (!trackingMap[loc]) {
        trackingMap[loc] = {
          locationName: loc,
          totalSKUs: 0,
          totalStockVolume: 0,
          estimatedValue: 0,
          associatedOrdersCount: 0
        };
      }
      trackingMap[loc].associatedOrdersCount += 1;
    });

    return Object.values(trackingMap);
  }, [products, purchaseOrders]);

  const localFilteredMetrics = useMemo(() => {
    const targets = selectedLocation 
      ? products.filter(p => p.location === selectedLocation)
      : products;
      
    const targetedOrders = selectedLocation
      ? purchaseOrders.filter(o => o.location === selectedLocation)
      : purchaseOrders;

    const totalVal = targets.reduce((sum, p) => sum + (p.selling_price * p.current_stock), 0);
    const totalItems = targets.reduce((sum, p) => sum + p.current_stock, 0);
    
    return {
      totalInventoryValue: totalVal,
      totalSKUsCount: targets.length,
      totalStockVolume: totalItems,
      ordersCount: targetedOrders.length
    };
  }, [products, purchaseOrders, selectedLocation]);

  const handleExportData = () => {
    try {
      const payload = JSON.stringify({ locationMetricsList, localFilteredMetrics }, null, 2);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(payload);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Location_Report_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Location breakdown matrix metrics saved safely to files");
    } catch (e) {
      toast.error("Export generation task terminal break exception triggered");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 120, gap: 16 }}>
        <Loader2 className="animate-spin" size={40} color="#6008f8" />
        <p style={{ color: "#6b7280", fontWeight: 600 }}>{"Loading secure location reports metrics ledger..."}</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header-row">
        <div>
          <h2 className="reports-title">{"Location Stock & Operations Analytics"}</h2>
          <p className="reports-subtitle">{"Track product deployment values, item counts, and incoming orders grouped by facility layout."}</p>
        </div>
        <div className="reports-actions">
          <button className="btn-export" onClick={handleExportData}>
            <Download size={16} /> {"Export Location Reports"}
          </button>
        </div>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 20px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <Filter size={18} color="#6008f8" />
        <span style={{ fontWeight: 600, fontSize: "14px", color: "#334155" }}>{"Active Scope Filter:"}</span>
        <button 
          style={{ padding: "6px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: selectedLocation === null ? "#6008f8" : "#e2e8f0", color: selectedLocation === null ? "#ffffff" : "#475569", transition: "all 0.2s" }}
          onClick={() => setSelectedLocation(null)}
        >
          {"Global System Combined Metrics"}
        </button>
        {locationMetricsList.map(m => (
          <button
            key={m.locationName}
            style={{ padding: "6px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: selectedLocation === m.locationName ? "#6008f8" : "#e2e8f0", color: selectedLocation === m.locationName ? "#ffffff" : "#475569", transition: "all 0.2s" }}
            onClick={() => setSelectedLocation(m.locationName)}
          >
            {m.locationName}
          </button>
        ))}
      </div>

      <div className="reports-stats-grid">
        <div className="stat-card-premium">
          <div className="stat-icon-wrapper purple">
            <TrendingUp size={22} />
          </div>
          <div className="stat-text">
            <h3>{"₹"}{localFilteredMetrics.totalInventoryValue.toLocaleString()}</h3>
            <p>{selectedLocation ? `${selectedLocation} Asset Worth` : "Global Vault Stock Value"}</p>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper blue">
            <Package size={22} />
          </div>
          <div className="stat-text">
            <h3>{localFilteredMetrics.totalSKUsCount} {"SKUs"}</h3>
            <p>{"Unique Registered Items"}</p>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper green">
            <Layers size={22} />
          </div>
          <div className="stat-text">
            <h3>{localFilteredMetrics.totalStockVolume.toLocaleString()} {"units"}</h3>
            <p>{"Accumulated Physical Units"}</p>
          </div>
        </div>

        <div className="stat-card-premium">
          <div className="stat-icon-wrapper indigo">
            <ShoppingCart size={22} />
          </div>
          <div className="stat-text">
            <h3>{localFilteredMetrics.ordersCount} {"Orders"}</h3>
            <p>{"Supply Pipeline Operations"}</p>
          </div>
        </div>
      </div>

      <div className="reports-layout-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="premium-card">
          <div className="card-title-row">
            <h3 className="card-title"><MapPin size={18} color="#6008f8" /> {"Regional Location Matrix Audit"}</h3>
            <span className="card-subtitle">{locationMetricsList.length} {"active nodes online"}</span>
          </div>

          <div className="sales-log-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>{"Target Facility Location"}</th>
                  <th>{"Unique Profiles (SKUs)"}</th>
                  <th>{"Units Stock Count"}</th>
                  <th>{"Financial Asset Value"}</th>
                  <th>{"Operational Orders"}</th>
                </tr>
              </thead>
              <tbody>
                {locationMetricsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-table-state">
                      <Building size={32} color="#b5b3bb" style={{ marginBottom: 8 }} />
                      <p>{"No location metadata tracks mapped to inventory yet."}</p>
                    </td>
                  </tr>
                ) : (
                  locationMetricsList.map((metric) => (
                    <tr 
                      key={metric.locationName}
                      style={{ cursor: "pointer", background: selectedLocation === metric.locationName ? "#f5f3ff" : "transparent" }}
                      onClick={() => setSelectedLocation(metric.locationName)}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#1e1b4b" }}>
                          <MapPin size={14} color="#6008f8" />
                          {metric.locationName}
                        </div>
                      </td>
                      <td><span className="sale-badge" style={{ background: "#eff6ff", color: "#1e40af" }}>{metric.totalSKUs}</span></td>
                      <td><span style={{ fontWeight: 600 }}>{metric.totalStockVolume.toLocaleString()}</span></td>
                      <td><span className="amount-col" style={{ color: "#16a34a", fontWeight: 700 }}>{"₹"}{metric.estimatedValue.toLocaleString()}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <History size={12} color="#64748b" />
                          <span style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>{metric.associatedOrdersCount} {"records"}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="premium-card">
          <div className="card-title-row">
            <h3 className="card-title"><Building size={18} color="#6008f8" /> {"Context Specific Manifest"}</h3>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", marginBottom: "16px" }}>
            {selectedLocation 
              ? `Displaying catalog list filtered explicitly down to items located within ${selectedLocation}.` 
              : "Showing all catalog products across the entire corporate supply grid ecosystem."}
          </p>

          <div style={{ maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
            {products
              .filter(p => !selectedLocation || p.location === selectedLocation)
              .map(p => (
                <div key={p.id} style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{p.name}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}><MapPin size={10} style={{ display: "inline", marginRight: 2 }} /> {p.location}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569" }}>{p.current_stock} {"units left"}</span>
                    <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>{"₹"}{p.selling_price}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}