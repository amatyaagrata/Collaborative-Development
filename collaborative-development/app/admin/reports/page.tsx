"use client";

import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import "./reports.css";

export default function AdminReportsPage() {
  return (
    <AdminLayout title="Report">
      <div className="admin-reports-container">
        <div className="admin-reports-card">
          {/* TODO: Add reports content — charts, tables, export functionality */}
          <div className="admin-reports-placeholder">
            <p>Reports will be displayed here</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
