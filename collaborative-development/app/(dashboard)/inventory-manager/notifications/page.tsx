"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  ShoppingCart, 
  AlertTriangle, 
  Package,
  Truck,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  XCircle
} from "lucide-react";
import { notificationService, Notification } from "@/lib/services/notificationService";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get the internal user ID from the users table
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (userData) {
          setUserId(userData.id);
          loadNotifications(userData.id);
        }
      } else {
        router.push('/login');
      }
    };
    getUser();
  }, [supabase, router]);

  const loadNotifications = async (uid: string) => {
    setLoading(true);
    const notifs = await notificationService.fetchNotifications(uid);
    setNotifications(notifs);
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    if (userId) {
      const updatedNotifs = await notificationService.fetchNotifications(userId);
      setNotifications(updatedNotifs);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (userId) {
      await notificationService.markAllAsRead(userId);
      const updatedNotifs = await notificationService.fetchNotifications(userId);
      setNotifications(updatedNotifs);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this notification?')) {
      await notificationService.deleteNotification(id);
      if (userId) {
        const updatedNotifs = await notificationService.fetchNotifications(userId);
        setNotifications(updatedNotifs);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'order': return <ShoppingCart size={18} />;
      case 'alert': return <AlertTriangle size={18} />;
      case 'stock': return <Package size={18} />;
      case 'system': return <Bell size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch(type) {
      case 'order': return '#3b82f6';
      case 'alert': return '#f59e0b';
      case 'stock': return '#ef4444';
      case 'system': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    return 'just now';
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notif.is_read) || 
      (filter === 'read' && notif.is_read);
    const matchesType = typeFilter === 'all' || notif.type === typeFilter;
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-left">
          <h1 className="page-title">Notifications</h1>
          <span className="notification-count">{unreadCount} unread</span>
        </div>
        <div className="header-right">
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button 
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read
          </button>
        </div>
        <div className="type-filters">
          <select 
            className="type-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="order">Orders</option>
            <option value="alert">Alerts</option>
            <option value="stock">Stock</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={64} />
            <h3>No notifications</h3>
            <p>You're all caught up! No new notifications to display.</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            >
              <div 
                className="notification-icon-wrapper"
                style={{ background: `${getNotificationColor(notification.type)}15` }}
              >
                <div style={{ color: getNotificationColor(notification.type) }}>
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              <div className="notification-content">
                <div className="notification-header-content">
                  <h4>{notification.title}</h4>
                  {!notification.is_read && <span className="unread-dot"></span>}
                </div>
                <p className="notification-message">{notification.message}</p>
                <div className="notification-footer-content">
                  <span className="notification-time">
                    <Clock size={12} />
                    {getTimeAgo(notification.created_at)}
                  </span>
                  <div className="notification-actions">
                    {!notification.is_read && (
                      <button 
                        className="mark-read-btn"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark as read
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={(e) => handleDelete(notification.id, e)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .notifications-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .notification-count {
          background: #3b82f6;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .mark-all-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mark-all-btn:hover {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .filters-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .search-bar input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .type-select {
          padding: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-item {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          transition: all 0.2s;
          border: 1px solid #e2e8f0;
        }

        .notification-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .notification-item.unread {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
        }

        .notification-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
        }

        .notification-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .notification-header-content h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
        }

        .notification-message {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .notification-footer-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .notification-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #94a3b8;
        }

        .notification-actions {
          display: flex;
          gap: 8px;
        }

        .mark-read-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .mark-read-btn:hover {
          background: #dbeafe;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
        }

        .delete-btn:hover {
          background: #fee2e2;
        }

        .empty-state {
          text-align: center;
          padding: 60px;
          background: white;
          border-radius: 20px;
          color: #94a3b8;
        }

        .empty-state h3 {
          margin: 16px 0 8px;
          color: #1e293b;
        }

        .notifications-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .notifications-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .filters-section {
            flex-direction: column;
          }
          
          .filter-buttons {
            width: 100%;
          }
          
          .filter-btn {
            flex: 1;
            text-align: center;
          }
          
          .type-select {
            width: 100%;
          }
          
          .notification-item {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}