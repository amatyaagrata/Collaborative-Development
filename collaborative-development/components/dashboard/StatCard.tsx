"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  delay?: number;
  onClick?: () => void;
  clickable?: boolean;
}

export function StatCard({ label, value, delay = 0, onClick, clickable = false }: StatCardProps) {
  return (
    <div 
      className={`stat-card ${clickable ? 'stat-card-clickable' : ''}`} 
      style={{ animationDelay: `${delay}ms` }}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
      {clickable && (
        <svg 
          className="stat-card-arrow" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );
}