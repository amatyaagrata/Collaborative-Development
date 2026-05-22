"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  ClipboardList, 
  AlertTriangle, 
  Users,
  Building2,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  XCircle,
  Package,
  Truck,
  Settings as SettingsIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'request' | 'user' | 'system' | 'order' | 'delivery' | 'supplier';
  is_read: boolean;
  data?: any;
  created_at: string;
}

export default function AdminNotificationsPage() {
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
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (userData) {
          setUserId(userData.id);
          fetchNotifications(userData.id);
        }
      } else {
        router.push('/login');
      }
    };
    getUser();
  }, [supabase, router]);

  const fetchNotifications = async (uid: string) => {
    setLoading(true);
    try {
      // For demo purposes, using mock data
      // Replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          user_id: uid,
          title: 'New Organization Registration',
          message: 'ABC Corp has requested to join the platform',
          type: 'request',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          user_id: uid,
          title: 'User Registration Approved',
          message: '5 new users have been approved and added to system',
          type: 'user',
          is_read: false,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          user_id: uid,
          title: 'System Update Available',
          message: 'Version 2.0.0 is ready for deployment',
          type: 'system',
          is_read: true,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          user_id: uid,
          title: 'New Product Added',
          message: 'Product "Wireless Keyboard" was added to catalog',
          type: 'order',
          is_read: false,
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          user_id: uid,
          title: 'Delivery Completed',
          message: 'Order #PO-12345 has been delivered successfully',
          type: 'delivery',
          is_read: true,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '6',
          user_id: uid,
          title: 'Supplier Registration',
          message: 'New supplier "Tech Supplies Ltd" registered',
          type: 'supplier',
          is_read: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ));
    toast.success('Notification marked as read');
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this notification?')) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'request': return <Building2 size={18} />;
      case 'user': return <Users size={18} />;
      case 'system': return <SettingsIcon size={18} />;
      case 'order': return <Package size={18} />;
      case 'delivery': return <Truck size={18} />;
      case 'supplier': return <ClipboardList size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch(type) {
      case 'request': return '#3b82f6';
      case 'user': return '#10b981';
      case 'system': return '#8b5cf6';
      case 'order': return '#f59e0b';
      case 'delivery': return '#059669';
      case 'supplier': return '#ec4899';
      default: return '#64748b';
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'request': return 'Request';
      case 'user': return 'User';
      case 'system': return 'System';
      case 'order': return 'Order';
      case 'delivery': return 'Delivery';
      case 'supplier': return 'Supplier';
      default: return 'General';
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

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    requests: notifications.filter(n => n.type === 'request').length,
    users: notifications.filter(n => n.type === 'user').length,
    system: notifications.filter(n => n.type === 'system').length,
  };

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

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon total">
            <Bell size={20} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{stats.total}</p>
            <p className="stat-label">Total</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon unread">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{stats.unread}</p>
            <p className="stat-label">Unread</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon read">
            <CheckCircle size={20} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{stats.read}</p>
            <p className="stat-label">Read</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon requests">
            <Building2 size={20} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{stats.requests}</p>
            <p className="stat-label">Requests</p>
          </div>
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
            <option value="request">Requests</option>
            <option value="user">Users</option>
            <option value="order">Orders</option>
            <option value="delivery">Deliveries</option>
            <option value="supplier">Suppliers</option>
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
                  <div className="notification-title-section">
                    <h4>{notification.title}</h4>
                    <span 
                      className="notification-type-badge"
                      style={{ background: `${getNotificationColor(notification.type)}15`, color: getNotificationColor(notification.type) }}
                    >
                      {getTypeLabel(notification.type)}
                    </span>
                  </div>
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
          max-width: 1000px;
          margin: 0 auto;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
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

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.total {
          background: #e0e7ff;
          color: #4f46e5;
        }

        .stat-icon.unread {
          background: #fee2e2;
          color: #dc2626;
        }

        .stat-icon.read {
          background: #d1fae5;
          color: #059669;
        }

        .stat-icon.requests {
          background: #fef3c7;
          color: #d97706;
        }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
          margin: 0;
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
          border: 1px solid #e2e8f0;
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
          flex-wrap: wrap;
          gap: 8px;
        }

        .notification-title-section {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .notification-header-content h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .notification-type-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
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
          border: 1px solid #e2e8f0;
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
          
          .stats-cards {
            grid-template-columns: repeat(2, 1fr);
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
          
          .notification-header-content {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}