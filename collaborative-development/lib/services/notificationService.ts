// lib/services/notificationService.ts
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'alert' | 'system' | 'stock';
  is_read: boolean;  // Changed from 'read' to 'is_read'
  data?: any;
  created_at: string;
}

class NotificationService {
  private supabase = createClient();
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private realtimeSubscription: any = null;

  async fetchNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })  // Changed from 'read' to 'is_read'
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    } else {
      toast.success('Notification marked as read');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })  // Changed from 'read' to 'is_read'
      .eq('user_id', userId)
      .eq('is_read', false);  // Changed from 'read' to 'is_read'

    if (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    } else {
      toast.success('All notifications marked as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    } else {
      toast.success('Notification deleted');
    }
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .insert([{
        ...notification,
        is_read: false,  // Changed from 'read' to 'is_read'
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error creating notification:', error);
    } else {
      // Show toast for real-time notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }
  }

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    this.listeners.push(callback);

    // Initial fetch
    this.fetchNotifications(userId).then(callback);

    // Set up real-time subscription
    this.realtimeSubscription = this.supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          const currentNotifications = await this.fetchNotifications(userId);
          this.listeners.forEach(listener => listener(currentNotifications));
          
          // Show toast for new notification
          toast.info(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const currentNotifications = await this.fetchNotifications(userId);
          this.listeners.forEach(listener => listener(currentNotifications));
        }
      )
      .subscribe();

    return () => {
      this.realtimeSubscription?.unsubscribe();
    };
  }

  unsubscribe(callback: (notifications: Notification[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
}

export const notificationService = new NotificationService();