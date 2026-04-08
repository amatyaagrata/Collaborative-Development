// src/app/supplier/dashboard/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useNotifications } from "@/hooks/useNotifications";
import SupplierLayout from "@/components/layout/SupplierLayout";
import OrderCard from "@/components/supplier/orders/OrderCard";
import StatsCards from "@/components/supplier/dashboard/StatsCards";
import { toast } from "sonner";

interface SupplierOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  delivery_address: string;
  total_amount: number;
  organizations: {
    name: string;
    address: string;
    phone: string;
  };
  order_items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  supplier_id: string;
  items_count?: number;
}

interface SupplierStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function SupplierDashboard() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();
  const { sendNotification } = useNotifications();

  const computeStats = (ordersData: SupplierOrder[]): SupplierStats => {
    return {
      totalOrders: ordersData.length,
      pendingOrders: ordersData.filter(o => o.status === "pending").length,
      completedOrders: ordersData.filter(o => o.status === "delivered").length,
    };
  };

  const stats = useMemo(() => computeStats(orders), [orders]);

  function startEscalationTimer(order: SupplierOrder) {
    setTimeout(() => {
      checkOrderStatus(order.id, order.supplier_id as string);
    }, 2 * 60 * 1000);
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

      setTimeout(async () => {
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
          order_items (quantity, product_name),
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
  }, [supabase]);

  // Real-time order subscription
  useRealtimeOrders({
    onNewOrder: (newOrder) => {
      // Stage 1: Show notification
      toast.info("You have received new orders. Please check your dashboard.", {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => router.push(`/supplier/orders/${newOrder.id}`)
        }
      });

      // Save notification to database
      sendNotification({
        title: "New Order Received",
        message: `Order #${newOrder.order_number} - ${newOrder.items_count} items`,
        type: "order"
      });

      // Add to orders list
      setOrders(prev => [newOrder as SupplierOrder, ...prev]);
      
      // Start escalation timer
      startEscalationTimer(newOrder as SupplierOrder);
    }
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
            <button onClick={() => router.push("/supplier/orders")}>
              View All Orders →
            </button>
          </div>

          <div className="orders-grid">
            {orders.slice(0, 5).map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                onView={() => router.push(`/supplier/orders/${order.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </SupplierLayout>
  );
}