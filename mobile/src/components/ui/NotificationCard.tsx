import { View, Text, Pressable } from 'react-native';
import { format } from 'date-fns';
import type { INotification, NotificationType } from '@/features/notifications/types';

interface INotificationCardProps {
  notification: INotification;
  onPress?: (notification: INotification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
}

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'appointment':
      return '📅';
    case 'chat':
      return '💬';
    case 'promo':
      return '🎉';
    case 'system':
      return '⚙️';
    default:
      return '🔔';
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'appointment':
      return 'bg-blue-50 border-blue-200';
    case 'chat':
      return 'bg-green-50 border-green-200';
    case 'promo':
      return 'bg-purple-50 border-purple-200';
    case 'system':
      return 'bg-gray-50 border-gray-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export function NotificationCard({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}: INotificationCardProps) {
  const handlePress = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    onPress?.(notification);
  };

  const formattedDate = format(new Date(notification.createdAt), 'MMM dd, yyyy • hh:mm a');

  return (
    <Pressable
      onPress={handlePress}
      className={`p-4 mb-3 rounded-lg border ${getNotificationColor(notification.type)} ${
        !notification.isRead ? 'border-l-4' : 'border-l-0'
      }`}
    >
      <View className="flex-row items-start">
        <View className="mr-3">
          <Text className="text-2xl">{getNotificationIcon(notification.type)}</Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className={`text-base ${!notification.isRead ? 'font-bold' : 'font-semibold'}`}>
              {notification.title}
            </Text>
            {!notification.isRead && <View className="w-2 h-2 bg-blue-500 rounded-full ml-2" />}
          </View>

          <Text className="text-sm text-gray-600 mb-2">{notification.body}</Text>

          <Text className="text-xs text-gray-400">{formattedDate}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row justify-end mt-2 space-x-2">
        {!notification.isRead && onMarkAsRead && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="px-3 py-1 bg-blue-100 rounded-md"
          >
            <Text className="text-xs text-blue-700 font-medium">Mark as Read</Text>
          </Pressable>
        )}

        {onDelete && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="px-3 py-1 bg-red-100 rounded-md ml-2"
          >
            <Text className="text-xs text-red-700 font-medium">Delete</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
