// src/app/supplier/dashboard/page.tsx
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

export default function SupplierDashboard() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();
  const { sendNotification } = useNotifications();
  const escalationTimers = useRef<NodeJS.Timeout[]>([]);

  const computeStats = (ordersData: SupplierOrder[]): SupplierStats => {
    return {
      totalOrders: ordersData.length,
      pendingOrders: ordersData.filter(o => o.status === "pending").length,
      completedOrders: ordersData.filter(o => o.status === "delivered").length,
    };
  };

  const stats = useMemo(() => computeStats(orders), [orders]);

  const checkOrderStatus = useCallback(async (orderId: string) => {
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (order?.status === "pending") {
      toast.error("See your dashboard immediately!", {
        duration: 10000,
        style: { backgroundColor: "red", color: "white" }
      });

      await sendNotification({
        title: "URGENT: Orders Pending",
        message: "See your dashboard immediately. Orders are waiting.",
        type: "alert"
      });

      const timer2 = setTimeout(async () => {
        const { data: updatedOrder } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .single();

        if (updatedOrder?.status === "pending") {
          // Fallback escalation behavior when a dedicated escalation table is not present.
          toast.error("Order is still pending. Please take action as soon as possible.");
        }
      }, 5 * 60 * 1000);
      escalationTimers.current.push(timer2);
    }
  }, [supabase, sendNotification]);

  const startEscalationTimer = useCallback((order: SupplierOrder) => {
    const timer1 = setTimeout(() => {
      checkOrderStatus(order.id);
    }, 2 * 60 * 1000);
    escalationTimers.current.push(timer1);
  }, [checkOrderStatus]);

  // Fetch initial orders
  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
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
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data as SupplierOrder[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]); // supabase is a singleton — stable reference

  // Clean up escalation timers on unmount
  useEffect(() => {
    const timers = escalationTimers.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Memoize the callback to prevent infinite realtime subscription loops
  const handleNewOrder = useCallback((newOrder: SupplierOrder) => {
    // Stage 1: Show notification
    toast.info("You have received new orders. Please check your dashboard.", {
      duration: 5000,
      action: {
        label: "View",
        onClick: () => router.push(`/suppliers/orders`)
      }
    });

    // Save notification to database
    sendNotification({
      title: "New Order Received",
      message: `Order #${newOrder.order_number} - ${newOrder.items_count || 0} items`,
      type: "order"
    });

    // Add to orders list
    setOrders(prev => [newOrder, ...prev]);
    
    // Start escalation timer
    startEscalationTimer(newOrder);
  }, [router, sendNotification, startEscalationTimer]);

  // Real-time order subscription
  useRealtimeOrders({
    onNewOrder: handleNewOrder
  });

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <SupplierLayout>
      <div className={styles.pageStack}>
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>Supplier Dashboard</h1>
          <p className={styles.heroText}>Manage your incoming orders, monitor fulfillment, and stay on top of supplier activity.</p>
        </div>

        <StatsCards stats={stats} />

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Orders</h2>
            <button
              className={styles.ghostButton}
              onClick={() => router.push("/suppliers/orders")}
              type="button"
            >
              View All Orders →
            </button>
          </div>

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
