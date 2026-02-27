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
    const starLabel = interactive
      ? `${position} star${position !== 1 ? 's' : ''}`
      : undefined;

    return (
      <Pressable
        key={position}
        onPress={() => handlePress(position)}
        disabled={!interactive}
        className={`${interactive ? 'active:scale-110' : ''}`}
        accessibilityRole={interactive ? 'radio' : 'none'}
        accessibilityLabel={starLabel}
        accessibilityState={interactive ? { selected: position <= displayRating } : undefined}
        accessibilityHint={interactive ? `Set rating to ${position}` : undefined}
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

  const reviewCountLabel = showCount && reviewCount !== undefined ? `, ${reviewCount} reviews` : '';
  const displayRatingValue = !showCount && rating > 0 ? `, ${rating.toFixed(1)}` : '';
  const groupLabel = interactive
    ? `Star rating selector, currently ${displayRating} out of ${maxRating}`
    : `Rating: ${rating.toFixed(1)} out of ${maxRating} stars${reviewCountLabel}`;

  return (
    <View
      className="flex-row items-center gap-1"
      accessibilityRole={interactive ? 'radiogroup' : 'none'}
      accessibilityLabel={groupLabel}
    >
      <View className="flex-row gap-0.5" importantForAccessibility="no-hide-descendants">
        {Array.from({ length: maxRating }, (_, i) => renderStar(i + 1))}
      </View>

      {showCount && reviewCount !== undefined && (
        <Text
          className={`${sizeStyles[size]} text-gray-600 ml-1`}
          importantForAccessibility="no"
        >
          ({reviewCount})
        </Text>
      )}

      {!showCount && rating > 0 && (
        <Text
          className={`${sizeStyles[size]} text-gray-700 ml-1 font-medium`}
          importantForAccessibility="no"
        >
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}
