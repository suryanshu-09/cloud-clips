import { View, Pressable, Text } from 'react-native';
import { useState } from 'react';

interface IRatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showCount?: boolean;
  reviewCount?: number;
  onRatingChange?: (rating: number) => void;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  showCount = false,
  reviewCount,
  onRatingChange,
}: IRatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeStyles = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl',
  };

  const starSize = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  const handlePress = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const renderStar = (position: number) => {
    const filled = position <= displayRating;
    const partialFill = position - 0.5 <= displayRating && position > displayRating;

    return (
      <Pressable
        key={position}
        onPress={() => handlePress(position)}
        disabled={!interactive}
        className={`${interactive ? 'active:scale-110' : ''}`}
      >
        <View className="relative">
          {partialFill ? (
            // Half star
            <View className="flex-row">
              <Text style={{ fontSize: starSize[size] }} className="text-yellow-400">
                ★
              </Text>
            </View>
          ) : (
            // Full or empty star
            <Text
              style={{ fontSize: starSize[size] }}
              className={filled ? 'text-yellow-400' : 'text-gray-300'}
            >
              {filled ? '★' : '☆'}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-row items-center gap-1">
      <View className="flex-row gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => renderStar(i + 1))}
      </View>

      {showCount && reviewCount !== undefined && (
        <Text className={`${sizeStyles[size]} text-gray-600 ml-1`}>({reviewCount})</Text>
      )}

      {!showCount && rating > 0 && (
        <Text className={`${sizeStyles[size]} text-gray-700 ml-1 font-medium`}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}
