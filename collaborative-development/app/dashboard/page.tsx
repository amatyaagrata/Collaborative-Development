"use client";

import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProductSummaryChart } from "@/components/dashboard/ProductSummaryChart";
import { TrendingProductsTable } from "@/components/dashboard/TrendingProductsTable";
import { SalesPurchaseChart } from "@/components/dashboard/SalesPurchaseChart";
import {
  dashboardStats, productSummary,
  trendingProducts, salesData,
} from "@/lib/data/dashboardData";
import "./dashboard.css";

export default function Dashboard() {
  const stats = dashboardStats;
  const summary = productSummary;
  const trending = trendingProducts;
  const sales = salesData;

  return (
    <AppLayout title="Dashboard">
      <div className="dashboard-content">
        <h2 className="activity-header">Activity</h2>

        <div className="stat-cards-grid">
          <StatCard label="Inventory Value" value={`Rs. ${stats.inventoryValue}`} delay={0} />
          <StatCard label="Total Stocks" value={stats.totalStocks.toLocaleString()} delay={50} />
          <StatCard label="New Orders" value={stats.newOrders.toString()} delay={100} />
          <StatCard label="Delivered" value={stats.delivered.toString()} delay={150} />
        </div>

        <div className="charts-row">
          <ProductSummaryChart quantityInHand={summary.quantityInHand} toBeReceived={summary.toBeReceived} />
          <TrendingProductsTable products={trending} />
        </div>

        <SalesPurchaseChart data={sales} />
      </div>
    </AppLayout>
  );
}
