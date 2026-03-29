"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  delay?: number;
}

export function StatCard({ label, value, delay = 0 }: StatCardProps) {
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
    </div>
  );
}
