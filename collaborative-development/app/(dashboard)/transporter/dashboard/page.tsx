"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Truck, CheckCircle, Navigation, Clock, X } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";

/**
 * OrderRecord Interface
 * Maps the database schema for the 'orders' table.
 * Includes optional fields for vehicle details and custom column names.
 */
interface OrderRecord {
  id: string;
  delivery_status: 'not_assigned' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  "Total Miles"?: number | null; 
  is_on_time?: boolean | null;  
  destination?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
}

export default function TransporterDashboard() {
  /**
   * STATE MANAGEMENT
   * orders: Raw list fetched from Supabase
   * loading: Prevents UI flickering during initial fetch
   * modalType: Controls which category list is being viewed in the popup
   */
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'active' | 'completed' | null>(null);
  
  const supabase = createClient();

  /**
   * DATA FETCHING
   * Memoized fetcher to retrieve orders for the logged-in transporter.
   * Uses useCallback to prevent unnecessary re-renders of the effect hook.
   */
  const fetchDashboardData = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*") 
      .eq("transporter_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as OrderRecord[]);
    }
    setLoading(false);
  }, [supabase]);

  /**
   * REALTIME SUBSCRIPTION
   * Sets up a live listener to the 'orders' table.
   * Automatically refreshes metrics when database rows change.
   */
  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel("realtime_dashboard_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchDashboardData]);

  /**
   * BUSINESS LOGIC & METRICS
   * useMemo ensures these calculations only run when 'orders' data changes.
   * Calculations include mileage aggregation and on-time performance percentage.
   */
  const stats = useMemo(() => {
    const inTransitOrders = orders.filter((o) => o.delivery_status === "in_transit");
    const deliveredOrders = orders.filter((o) => o.delivery_status === "delivered");
    
    const completedTodayOrders = deliveredOrders.filter((o) => {
      const completionDate = new Date(o.updated_at || o.created_at).toDateString();
      return completionDate === new Date().toDateString();
    });

    const totalMiles = orders
      .filter(o => o.delivery_status === "delivered" || o.delivery_status === "in_transit")
      .reduce((acc, curr) => acc + Number(curr["Total Miles"] ?? 0), 0);

    const onTimeRate = deliveredOrders.length > 0 
      ? ((deliveredOrders.filter(o => o.is_on_time !== false).length / deliveredOrders.length) * 100).toFixed(1) 
      : "100.0";

    return { 
      activeList: inTransitOrders,
      completedTodayList: completedTodayOrders,
      totalMiles: Math.round(totalMiles).toLocaleString(),
      onTimeRate 
    };
  }, [orders]);

  const modalData = modalType === 'active' ? stats.activeList : stats.completedTodayList;

  if (loading) return <div className={styles.loadingState}>Refreshing metrics...</div>;

  return (
    <>
      <WelcomeMessage roleOverride="Driver/Transporter" />
      
      <div className={styles.pageStack}>
        <div className={styles.statsGrid}>
          
          <div 
            onClick={() => setModalType('active')} 
            className={`${styles.metricCard} ${styles.clickableCard}`}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Truck size={18} color="#7c3aed" />
              <h3 className={styles.metricLabel}>Active Deliveries</h3>
            </div>
            <p className={styles.metricValue}>{stats.activeList.length}</p>
          </div>

          <div 
            onClick={() => setModalType('completed')} 
            className={`${styles.metricCard} ${styles.clickableCard}`}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} color="#10b981" />
              <h3 className={styles.metricLabel}>Completed Today</h3>
            </div>
            <p className={styles.metricValue}>{stats.completedTodayList.length}</p>
          </div>

          <div className={styles.metricCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Navigation size={18} color="#3b82f6" />
              <h3 className={styles.metricLabel}>Total Miles</h3>
            </div>
            <p className={styles.metricValue}>{stats.totalMiles}</p>
          </div>

          <div className={styles.metricCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#f59e0b" />
              <h3 className={styles.metricLabel}>On-Time Rate</h3>
            </div>
            <p className={styles.metricValue}>{stats.onTimeRate}%</p>
          </div>
        </div>

        {/**
         * MODAL UI COMPONENT
         * Includes an overlay that closes the modal on background click.
         * StopPropagation ensures clicks inside the white box don't trigger the close.
         */}
        {modalType && (
          <div 
            onClick={() => setModalType(null)}
            style={{
              position: 'fixed',
              top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 9999
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '800px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e1b4b" }}>
                  {modalType === 'active' ? 'Active Deliveries' : 'Completed Today'}
                </h2>
                <button onClick={() => setModalType(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <X size={24} color="#64748b" />
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px', color: '#64748b' }}>Order ID</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Plate</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Model</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Destination</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>#{order.id.slice(0, 8)}</td>
                      <td style={{ padding: '12px' }}>{order.vehicle_plate || "N/A"}</td>
                      <td style={{ padding: '12px' }}>{order.vehicle_model || "Standard"}</td>
                      <td style={{ padding: '12px' }}>{order.destination || "TBD"}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          backgroundColor: order.delivery_status === 'in_transit' ? '#f5f3ff' : '#ecfdf5',
                          color: order.delivery_status === 'in_transit' ? '#7c3aed' : '#10b981',
                          textTransform: 'capitalize'
                        }}>
                          {order.delivery_status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {modalData.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No records found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}