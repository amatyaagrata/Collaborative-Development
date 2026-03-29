import { AppLayout } from "@/components/AppLayout";
import { Package, ShoppingCart, Truck, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const PIE_COLORS = ["hsl(270,70%,45%)", "hsl(260,20%,92%)"];

const salesData = [
  { name: "Mon", Sales: 10200, Purchase: 8400 },
  { name: "Tue", Sales: 8800, Purchase: 7200 },
  { name: "Wed", Sales: 12400, Purchase: 9600 },
  { name: "Thu", Sales: 9600, Purchase: 10800 },
  { name: "Fri", Sales: 11200, Purchase: 8000 },
  { name: "Sat", Sales: 7400, Purchase: 6200 },
  { name: "Sun", Sales: 6800, Purchase: 5400 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ totalSKUs: 0, totalStock: 0, newOrders: 0, delivered: 0 });
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [invRes, ordRes, delRes] = await Promise.all([
        supabase.from("inventory").select("*"),
        supabase.from("orders").select("*").eq("status", "Processing"),
        supabase.from("orders").select("*").eq("status", "Delivered"),
      ]);
      const inv = invRes.data || [];
      setStats({
        totalSKUs: inv.length,
        totalStock: inv.reduce((s, i) => s + (i.quantity || 0), 0),
        newOrders: (ordRes.data || []).length,
        delivered: (delRes.data || []).length,
      });
      setTrendingProducts(inv.slice(0, 4));
    }
    load();
  }, []);

  const inHand = stats.totalStock;
  const toReceive = Math.round(inHand * 0.33);
  const total = inHand + toReceive;
  const pct = total > 0 ? Math.round((inHand / total) * 100) : 0;
  const pieData = [
    { name: "In Hand", value: inHand },
    { name: "To Receive", value: toReceive },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Activity Header */}
        <h2 className="text-sm font-semibold text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Activity
        </h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card animate-fade-in">
            <span className="text-xs font-medium text-muted-foreground">Inventory Value</span>
            <span className="text-2xl font-bold tracking-tight flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />
              {(stats.totalStock * 95).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: "50ms" }}>
            <span className="text-xs font-medium text-muted-foreground">Total Stocks</span>
            <span className="text-2xl font-bold tracking-tight font-mono-data">
              {stats.totalStock.toLocaleString()}
            </span>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: "100ms" }}>
            <span className="text-xs font-medium text-muted-foreground">New Orders</span>
            <span className="text-2xl font-bold tracking-tight font-mono-data">
              {stats.newOrders}
            </span>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: "150ms" }}>
            <span className="text-xs font-medium text-muted-foreground">Delivered</span>
            <span className="text-2xl font-bold tracking-tight font-mono-data">
              {stats.delivered}
            </span>
          </div>
        </div>

        {/* Product Summary + Trending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Summary Donut */}
          <div className="bg-card border rounded-lg p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="text-sm font-semibold mb-4">Product Summary</h3>
            <div className="flex items-center justify-center gap-8">
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{pct}%</span>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono-data">{inHand.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Quantity in hand</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono-data">{toReceive.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">To be received</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trending Products */}
          <div className="bg-card border rounded-lg animate-fade-in" style={{ animationDelay: "250ms" }}>
            <div className="px-5 py-3 border-b">
              <h3 className="text-sm font-semibold">Trending Product</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-2 font-medium">Product</th>
                    <th className="text-left px-4 py-2 font-medium">Product Id</th>
                    <th className="text-left px-4 py-2 font-medium">Category</th>
                    <th className="text-right px-4 py-2 font-medium">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {trendingProducts.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 table-row-hover">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 font-mono-data text-muted-foreground">{item.sku}</td>
                      <td className="px-4 py-2.5">{item.category}</td>
                      <td className="px-4 py-2.5 text-right font-mono-data">{item.quantity}</td>
                    </tr>
                  ))}
                  {trendingProducts.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No products yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sales & Purchase Chart */}
        <div className="bg-card border rounded-lg p-5 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Sales & Purchase</h3>
              <p className="text-xs text-muted-foreground">Total sales and purchases statistics on week</p>
            </div>
            <span className="text-xs border rounded-full px-3 py-1 text-primary font-medium">Week</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(260,15%,90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(250,10%,45%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(250,10%,45%)" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Sales" fill="hsl(270,70%,45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Purchase" fill="hsl(260,20%,85%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
}
