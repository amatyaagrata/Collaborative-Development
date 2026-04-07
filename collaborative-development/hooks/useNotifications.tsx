// src/hooks/useNotifications.ts
"use client";

import { createClient } from "@/lib/supabase/client";

interface SendNotificationParams {
  userId?: string;
  title: string;
  message: string;
  type: "order" | "alert" | "system";
}

export function useNotifications() {
  const supabase = createClient();

  const sendNotification = async ({ userId, title, message, type }: SendNotificationParams) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const targetUserId = userId || userData.user?.id;

      if (!targetUserId) {
        console.error("No user ID found for notification");
        return;
      }

      const { error } = await supabase.from("notifications").insert({
        user_id: targetUserId,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error sending notification:", error);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userData.user.id)
        .eq("is_read", false);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getUnreadCount = async (): Promise<number> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.user.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  };

  return {
    sendNotification,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
  };
}