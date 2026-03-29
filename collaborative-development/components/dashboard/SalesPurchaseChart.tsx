"use client";

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { SalesDataPoint } from "@/lib/data/dashboardData";

interface SalesPurchaseChartProps {
  data: SalesDataPoint[];
}

export function SalesPurchaseChart({ data }: SalesPurchaseChartProps) {
  return (
    <div className="chart-card sales-chart-card" style={{ animationDelay: "300ms" }}>
      <div className="sales-chart-header">
        <div>
          <h3 className="chart-card-title">Sales &amp; Purchase</h3>
          <div className="sales-chart-legend-row">
            <span className="sales-legend-dot"></span>
            <span className="sales-legend-label">Sales</span>
            <span className="sales-chart-subtitle">
              Total sales and purchases statistics on week
            </span>
          </div>
        </div>
        <span className="period-badge">Week ▾</span>
      </div>

      <div className="sales-chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(260, 15%, 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(250, 10%, 45%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(250, 10%, 45%)" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value.toLocaleString()}`} />
            <Tooltip
              formatter={(value) => [`₹${Number(value).toLocaleString()}`]}
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(260, 15%, 90%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Sales" fill="hsl(270, 70%, 45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Purchase" fill="hsl(260, 20%, 85%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
