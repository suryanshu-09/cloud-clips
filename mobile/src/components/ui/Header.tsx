import { View, Text, Pressable, type ViewProps } from 'react-native';
import { useRouter } from 'expo-router';

interface IHeaderProps extends ViewProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function Header({
  title,
  showBack = false,
  onBackPress,
  leftAction,
  rightAction,
  ...props
}: IHeaderProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      {...props}
      className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200"
    >
      <View className="flex-1 flex-row items-center">
        {showBack && !leftAction && (
          <Pressable onPress={handleBackPress} className="mr-3">
            <Text className="text-2xl text-gray-700">←</Text>
          </Pressable>
        )}
        {leftAction}
        {title && <Text className="text-lg font-semibold text-gray-900">{title}</Text>}
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}
