"use client";

import React from "react";

interface AdminStatCardProps {
  label: string;
  value: string;
  delay?: number;
}

export function AdminStatCard({ label, value, delay = 0 }: AdminStatCardProps) {
  return (
    <div
      className="admin-stat-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="admin-stat-card-label">{label}</span>
      <span className="admin-stat-card-value">{value}</span>
    </div>
  );
}
