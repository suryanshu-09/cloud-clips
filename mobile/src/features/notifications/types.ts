export enum NotificationType {
  APPOINTMENT = 'appointment',
  CHAT = 'chat',
  PROMO = 'promo',
  SYSTEM = 'system',
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface INotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    allowsAlert: boolean | null;
    allowsBadge: boolean | null;
    allowsSound: boolean | null;
  };
}

export interface INotificationSettings {
  enabled: boolean;
  appointments: boolean;
  chat: boolean;
  promotions: boolean;
  system: boolean;
}

export interface IPushTokens {
  expoPushToken: string | null;
  devicePushToken: string | null;
}

export interface INotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: NotificationType;
}

export interface IScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledTime: Date;
}
