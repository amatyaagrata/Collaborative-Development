"use client";

import React from "react";
import type { TrendingProduct } from "@/lib/data/dashboardData";

interface TrendingProductsTableProps {
  products: TrendingProduct[];
}

export function TrendingProductsTable({ products }: TrendingProductsTableProps) {
  return (
    <div className="chart-card trending-card" style={{ animationDelay: "250ms" }}>
      <div className="trending-header">
        <h3 className="chart-card-title">Trending Product</h3>
      </div>
      <div className="trending-table-wrapper">
        <table className="trending-table">
          <thead>
            <tr>
              <th></th>
              <th>Product</th>
              <th>Suppliers</th>
              <th>Product Id</th>
              <th>Category</th>
              <th>Price</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
              <tr key={item.id}>
                <td><div className="product-avatar"></div></td>
                <td className="font-medium">{item.product}</td>
                <td>{item.suppliers}</td>
                <td className="text-muted">{item.productId}</td>
                <td>{item.category}</td>
                <td>{item.price}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">No products yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
