import { View, Text } from 'react-native';
import { memo } from 'react';

interface IStarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  emptyColor?: string;
  showValue?: boolean;
  reviewCount?: number;
}

const sizeMap = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

function StarRatingComponent({
  rating,
  maxRating = 5,
  size = 'md',
  color = '#facc15', // yellow-400
  emptyColor = '#d1d5db', // gray-300
  showValue = false,
  reviewCount,
}: IStarRatingProps) {
  const starSize = sizeMap[size];
  const textSize = textSizeMap[size];

  const renderStar = (position: number) => {
    const filled = position <= rating;
    const partialFill = position - 0.5 <= rating && position > rating;

    return (
      <View key={position} className="relative">
        {partialFill ? (
          <View className="flex-row">
            <Text
              style={{
                fontSize: starSize,
                color: color,
              }}
            >
              ★
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontSize: starSize,
              color: filled ? color : emptyColor,
            }}
          >
            {filled ? '★' : '☆'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-row items-center">
      <View className="flex-row" style={{ gap: 2 }}>
        {Array.from({ length: maxRating }, (_, i) => renderStar(i + 1))}
      </View>

      {showValue && (
        <Text className={`${textSize} text-gray-700 ml-2 font-medium`}>{rating.toFixed(1)}</Text>
      )}

      {reviewCount !== undefined && reviewCount > 0 && (
        <Text className={`${textSize} text-gray-500 ml-1`}>({reviewCount})</Text>
      )}
    </View>
  );
}

export const StarRating = memo(StarRatingComponent);
