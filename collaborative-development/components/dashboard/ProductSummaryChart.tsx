"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const PIE_COLORS = ["hsl(270, 70%, 45%)", "hsl(260, 20%, 92%)"];

interface ProductSummaryChartProps {
  quantityInHand: number;
  toBeReceived: number;
}

export function ProductSummaryChart({ quantityInHand, toBeReceived }: ProductSummaryChartProps) {
  const total = quantityInHand + toBeReceived;
  const percentage = total > 0 ? Math.round((quantityInHand / total) * 100) : 0;

  const pieData = [
    { name: "In Hand", value: quantityInHand },
    { name: "To Receive", value: toBeReceived },
  ];

  return (
    <div className="chart-card" style={{ animationDelay: "200ms" }}>
      <h3 className="chart-card-title">Product Summary</h3>
      <div className="product-summary-content">
        <div className="donut-chart-container">
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
          <div className="donut-center-label">
            <span>{percentage}%</span>
          </div>
        </div>

        <div className="product-summary-stats">
          <div className="summary-stat">
            <p className="summary-stat-value">{quantityInHand.toLocaleString()}</p>
            <p className="summary-stat-label">Quantity in hand</p>
          </div>
          <div className="summary-stat">
            <p className="summary-stat-value">{toBeReceived.toLocaleString()}</p>
            <p className="summary-stat-label">To be received</p>
          </div>
        </div>
      </div>
    </div>
  );
}
