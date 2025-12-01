import { View, Text, type ViewProps } from 'react-native';
import { Button } from './Button';

interface IEmptyStateProps extends ViewProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  ...props
}: IEmptyStateProps) {
  return (
    <View {...props} className="flex-1 items-center justify-center p-8">
      <Text className="text-6xl mb-4">{icon}</Text>
      <Text className="text-xl font-bold text-gray-900 text-center mb-2">{title}</Text>
      {description && (
        <Text className="text-base text-gray-600 text-center mb-6">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button onPress={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
