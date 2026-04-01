"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProductSummaryChart } from "@/components/dashboard/ProductSummaryChart";
import { TrendingProductsTable } from "@/components/dashboard/TrendingProductsTable";
import { SalesPurchaseChart } from "@/components/dashboard/SalesPurchaseChart";
import {
  dashboardStats, productSummary,
  trendingProducts, salesData,
} from "@/lib/data/dashboardData";
import { Building2, LogOut, User, ChevronDown, Store } from "lucide-react";
import "./dashboard.css";

export default function Dashboard() {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [organizationName, setOrganizationName] = useState("GoGodam");
  const [userData, setUserData] = useState({
    email: "",
    fullName: "",
    loginTime: ""
  });
  
  const stats = dashboardStats;
  const summary = productSummary;
  const trending = trendingProducts;
  const sales = salesData;

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData");
    const storedOrgName = localStorage.getItem("organizationName");
    
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData({
        email: parsedUserData.email || "user@example.com",
        fullName: parsedUserData.fullName || parsedUserData.email?.split('@')[0] || "User",
        loginTime: parsedUserData.loginTime || new Date().toISOString()
      });
    } else {
      // Fallback for demo
      setUserData({
        email: "guest@example.com",
        fullName: "Guest User",
        loginTime: new Date().toISOString()
      });
    }
    
    if (storedOrgName) {
      setOrganizationName(storedOrgName);
    }
  }, []);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("userData");
    localStorage.removeItem("organizationName");
    router.push("/login");
  };

  // Get display name (first part of email)
  const getDisplayName = () => {
    if (userData.fullName && userData.fullName !== "User") {
      return userData.fullName;
    }
    return userData.email.split('@')[0];
  };

  return (
    <AppLayout title={`Dashboard - ${organizationName}`}>
      <div className="dashboard-content">
        
        {/* Top Bar with Organization Badge and User Menu */}
        <div className="dashboard-top-bar">
          {/* Organization Badge */}
          <div className="organization-badge">
            <div className="org-badge-icon">
              <Store size={18} />
            </div>
            <div className="org-badge-info">
              <span className="org-badge-label">Current Organization</span>
              <span className="org-badge-name">{organizationName}</span>
            </div>
          </div>

          {/* User Menu */}
          <div className="user-menu-container">
            <div 
              className="user-menu-trigger" 
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">{getDisplayName()}</span>
                <span className="user-email">{userData.email}</span>
              </div>
              <ChevronDown size={18} className={`chevron-icon ${showUserMenu ? 'rotated' : ''}`} />
            </div>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    <User size={20} />
                  </div>
                  <div className="dropdown-info">
                    <div className="dropdown-name">{getDisplayName()}</div>
                    <div className="dropdown-email">{userData.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item">
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Welcome Section - Cleaner Version */}
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome back, {getDisplayName()}! 👋</h1>
          <p className="welcome-subtitle">
            You're logged in to <strong className="org-highlight">{organizationName}</strong>
          </p>
        </div>

        <h2 className="activity-header">Activity Overview</h2>

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