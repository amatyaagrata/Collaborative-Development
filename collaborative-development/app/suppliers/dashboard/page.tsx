"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useNotifications } from "@/hooks/useNotifications";
import SupplierLayout from "@/components/layout/SupplierLayout";
import OrderCard from "@/components/supplier/orders/OrderCard";
import StatsCards from "@/components/supplier/dashboard/StatsCards";
import { toast } from "sonner";
import type { SupplierOrder, SupplierStats } from "@/types/models";
import styles from "@/components/layout/PortalLayout.module.css";

/**
 * Supplier Dashboard Component
 * 
 * Main dashboard for suppliers to manage and monitor incoming orders.
 * Features:
 * - Real-time order updates via Supabase subscription
 * - Order statistics display (total, pending, completed)
 * - Escalation timers for pending orders (2 min warning, 5 min escalation)
 * - Notification system for urgent actions
 * - Recent orders list with quick navigation
 */
export default function SupplierDashboard() {
  // State Management
  const [orders, setOrders] = useState<SupplierOrder[]>([]); // List of supplier orders
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch
  
  // Supabase client instance for database operations
  const supabase = createClient();
  
  // Next.js router for navigation
  const router = useRouter();
  
  // Custom hook for sending notifications to users
  const { sendNotification } = useNotifications();
  
  // Reference to store escalation timers for cleanup on unmount
  const escalationTimers = useRef<NodeJS.Timeout[]>([]);

  /**
   * Calculate statistics from orders data
   * @param ordersData - Array of supplier orders
   * @returns SupplierStats object with counts for total, pending, and completed orders
   */
  const computeStats = (ordersData: SupplierOrder[]): SupplierStats => {
    return {
      totalOrders: ordersData.length,
      pendingOrders: ordersData.filter(o => o.status === "pending").length,
      completedOrders: ordersData.filter(o => o.status === "delivered").length,
    };
  };

  /**
   * Memoized stats calculation to prevent unnecessary recalculations
   * Only recomputes when orders array changes
   */
  const stats = useMemo(() => computeStats(orders), [orders]);

  /**
   * Check order status and trigger escalation if still pending
   * Called after the initial 2-minute warning timer
   * 
   * @param orderId - ID of the order to check
   */
  const checkOrderStatus = useCallback(async (orderId: string) => {
    // Fetch current order status from database
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    // If order is still pending after warning, trigger escalation
    if (order?.status === "pending") {
      // Show critical error toast
      toast.error("See your dashboard immediately!", {
        duration: 10000,
        style: { backgroundColor: "red", color: "white" }
      });

      // Send urgent notification
      await sendNotification({
        title: "URGENT: Orders Pending",
        message: "See your dashboard immediately. Orders are waiting.",
        type: "alert"
      });

      // Set second escalation timer (5 minutes after first warning)
      const timer2 = setTimeout(async () => {
        const { data: updatedOrder } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .single();

        // Final check - if still pending, show final escalation message
        if (updatedOrder?.status === "pending") {
          // Fallback escalation behavior when a dedicated escalation table is not present
          toast.error("Order is still pending. Please take action as soon as possible.");
        }
      }, 5 * 60 * 1000); // 5 minutes
      
      // Store timer for cleanup
      escalationTimers.current.push(timer2);
    }
  }, [supabase, sendNotification]);

  /**
   * Start the escalation timer chain for a new order
   * First warning appears after 2 minutes, then escalation after 5 more minutes
   * 
   * @param order - The order to monitor for escalation
   */
  const startEscalationTimer = useCallback((order: SupplierOrder) => {
    // First timer: Show warning after 2 minutes
    const timer1 = setTimeout(() => {
      checkOrderStatus(order.id);
    }, 2 * 60 * 1000); // 2 minutes
    
    // Store timer for cleanup
    escalationTimers.current.push(timer1);
  }, [checkOrderStatus]);

  /**
   * Initial data fetch on component mount
   * Retrieves orders for the authenticated supplier with related data
   */
  useEffect(() => {
    const fetchData = async () => {
      // Get current authenticated user
      const { data: userData } = await supabase.auth.getUser();
      
      // Fetch orders with joined data:
      // - order_items: quantity, unit price, and product details
      // - organizations: supplier organization info (name, address, phone)
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            products:product_id (
              name
            )
          ),
          organizations (name, address, phone)
        `)
        .eq("supplier_id", userData.user?.id)
        .order("created_at", { ascending: false }); // Newest orders first

      if (!error && data) {
        setOrders(data as SupplierOrder[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]); // supabase is a singleton — stable reference, no re-fetch needed

  /**
   * Cleanup escalation timers on component unmount
   * Prevents memory leaks and ensures timers don't fire after component is destroyed
   */
  useEffect(() => {
    const timers = escalationTimers.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  /**
   * Handle new incoming orders from real-time subscription
   * 
   * @param newOrder - The newly received order
   */
  const handleNewOrder = useCallback((newOrder: SupplierOrder) => {
    // Stage 1: Show interactive toast notification with View action
    toast.info("You have received new orders. Please check your dashboard.", {
      duration: 5000,
      action: {
        label: "View",
        onClick: () => router.push(`/suppliers/orders`) // Navigate to orders page
      }
    });

    // Stage 2: Save notification to database for historical record
    sendNotification({
      title: "New Order Received",
      message: `Order #${newOrder.order_number} - ${newOrder.items_count || 0} items`,
      type: "order"
    });

    // Stage 3: Add order to the beginning of the list (newest first)
    setOrders(prev => [newOrder, ...prev]);
    
    // Stage 4: Start escalation timer for this order
    startEscalationTimer(newOrder);
  }, [router, sendNotification, startEscalationTimer]);

  /**
   * Real-time order subscription hook
   * Listens for new orders and triggers handleNewOrder callback
   */
  useRealtimeOrders({
    onNewOrder: handleNewOrder
  });

  // Loading state UI
  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <SupplierLayout>
      <div className={styles.pageStack}>
        {/* Hero Section - Welcome and description */}
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>Supplier Dashboard</h1>
          <p className={styles.heroText}>
            Manage your incoming orders, monitor fulfillment, and stay on top of supplier activity.
          </p>
        </div>

        {/* Statistics Cards - Display key metrics */}
        <StatsCards stats={stats} />

        {/* Recent Orders Section */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            {/* View All button - Navigates to full orders list */}
            <button
              className={styles.ghostButton}
              onClick={() => router.push("/suppliers/orders")}
              type="button"
            >
              View All Orders →
            </button>
          </div>

          {/* Orders List - Display only the 5 most recent orders */}
          <div className={styles.cardList}>
            {orders.slice(0, 5).map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                onView={() => router.push(`/suppliers/orders`)}
              />
            ))}
          </div>
        </div>
      </div>
    </SupplierLayout>
  );
}