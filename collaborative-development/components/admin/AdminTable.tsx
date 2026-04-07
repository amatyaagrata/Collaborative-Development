"use client";

import React from "react";

export interface AdminTableColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface AdminTableProps {
  columns: AdminTableColumn[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
}

export function AdminTable({ columns, data, emptyMessage = "No data available" }: AdminTableProps) {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="admin-table-empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
