// src/components/supplier/notifications/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const subscribeToNotifications = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const channel = supabase
        .channel("notifications-channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    subscribeToNotifications();

    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function fetchNotifications() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }

  async function markAsRead(notificationId: string) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    for (const id of unreadIds) {
      await markAsRead(id);
    }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id);
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.type === "order") {
      router.push("/supplier/orders");
    } else if (notification.type === "alert") {
      router.push("/supplier/dashboard");
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return "📦";
      case "alert":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        className="bell-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all">
                <CheckCheck size={14} />
                Mark all as read
              </button>
            )}
          </div>
          <div className="dropdown-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={32} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">
                      {formatTime(notif.created_at)}
                    </div>
                  </div>
                  {!notif.is_read && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-bell {
          position: relative;
        }
        .bell-button {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s;
          color: #4b5563;
        }
        .bell-button:hover {
          background: #f3f4f6;
        }
        .badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 5px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }
        .dropdown {
          position: absolute;
          right: 0;
          top: 40px;
          width: 360px;
          max-width: 90vw;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02);
          z-index: 1000;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .dropdown-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
        }
        .dropdown-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        .mark-all {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .mark-all:hover {
          background: #f3f4f6;
          color: #374151;
        }
        .dropdown-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          gap: 12px;
          position: relative;
        }
        .notification-item:hover {
          background: #f9fafb;
        }
        .notification-item.unread {
          background: #eff6ff;
        }
        .notification-item.unread:hover {
          background: #dbeafe;
        }
        .notification-icon {
          font-size: 20px;
          min-width: 32px;
        }
        .notification-content {
          flex: 1;
        }
        .notification-title {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        .notification-message {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .notification-time {
          font-size: 10px;
          color: #9ca3af;
        }
        .unread-dot {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
        }
        .empty-state {
          padding: 48px 24px;
          text-align: center;
          color: #9ca3af;
        }
        .empty-state svg {
          margin-bottom: 12px;
          opacity: 0.5;
        }
        .empty-state p {
          font-size: 14px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}