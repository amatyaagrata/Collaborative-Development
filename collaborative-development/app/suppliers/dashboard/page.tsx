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

  function startEscalationTimer(order: SupplierOrder) {
    const timer1 = setTimeout(() => {
      checkOrderStatus(order.id, order.supplier_id as string);
    }, 2 * 60 * 1000);
    escalationTimers.current.push(timer1);
  }

  async function checkOrderStatus(orderId: string, supplierId: string) {
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
        userId: supplierId,
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
          await supabase.from("order_escalations").insert({
            order_id: orderId,
            supplier_id: supplierId,
            admin_notified: true,
            status: "escalated"
          });

          toast.error("Admin has been notified. They will contact you shortly.");
        }
      }, 5 * 60 * 1000);
      escalationTimers.current.push(timer2);
    }
  }

  // Fetch initial orders
  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (quantity, product_name, unit_price),
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
  }, []); // supabase is a singleton — stable reference

  // Clean up escalation timers on unmount
  useEffect(() => {
    return () => {
      escalationTimers.current.forEach(timer => clearTimeout(timer));
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
  }, [router, sendNotification]);

  // Real-time order subscription
  useRealtimeOrders({
    onNewOrder: handleNewOrder
  });

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <SupplierLayout>
      <div className="supplier-dashboard">
        <div className="dashboard-header">
          <h1>Supplier Dashboard</h1>
          <p>Manage your orders and inventory</p>
        </div>

        <StatsCards stats={stats} />

        <div className="orders-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <button onClick={() => router.push("/suppliers/orders")}>
              View All Orders →
            </button>
          </div>

          <div className="orders-grid">
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