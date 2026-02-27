import { memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/shared/RatingStars';
import type { IReviewSummary } from '@/types/reviews';

interface IReviewSummaryProps {
  summary: IReviewSummary;
  showDistribution?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

const sizeMap = {
  sm: {
    container: 'p-3',
    ratingText: 'text-2xl',
    labelText: 'text-sm',
    countText: 'text-xs',
    barHeight: 2,
  },
  md: {
    container: 'p-4',
    ratingText: 'text-4xl',
    labelText: 'text-base',
    countText: 'text-sm',
    barHeight: 3,
  },
  lg: {
    container: 'p-6',
    ratingText: 'text-5xl',
    labelText: 'text-lg',
    countText: 'text-base',
    barHeight: 4,
  },
};

/**
 * Calculate percentage for a rating count
 */
function calculatePercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

/**
 * RatingDistributionBar - Individual rating bar component
 */
function RatingDistributionBar({
  star,
  count,
  total,
  _barHeight,
}: {
  star: number;
  count: number;
  total: number;
  barHeight: number;
}) {
  const percentage = useMemo(() => calculatePercentage(count, total), [count, total]);

  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm text-gray-600 w-6">{star}</Text>
      <Text className="text-yellow-400 text-sm">★</Text>
      <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <View className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
      </View>
      <Text className="text-xs text-gray-500 w-10 text-right">{count}</Text>
    </View>
  );
}

/**
 * ReviewSummary - Displays average rating and total review count
 *
 * Features:
 * - Displays large average rating with star visual
 * - Shows total review count
 * - Optional rating distribution breakdown
 * - Multiple size variants for different contexts
 *
 * Performance optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Memoized percentage calculations
 * - Memoized distribution data
 */
function ReviewSummaryComponent({
  summary,
  showDistribution = false,
  size = 'md',
  variant = 'default',
}: IReviewSummaryProps) {
  const styles = sizeMap[size];

  // Memoize distribution data
  const distributionData = useMemo(() => {
    const { distribution } = summary;
    return [
      { star: 5, count: distribution.fiveStar },
      { star: 4, count: distribution.fourStar },
      { star: 3, count: distribution.threeStar },
      { star: 2, count: distribution.twoStar },
      { star: 1, count: distribution.oneStar },
    ];
  }, [summary]);

  // Format review count text
  const reviewCountText = useMemo(() => {
    const { totalReviews } = summary;
    if (totalReviews === 0) return 'No reviews yet';
    if (totalReviews === 1) return '1 review';
    return `${totalReviews} reviews`;
  }, [summary.totalReviews]);

  // Compact variant - minimal display
  if (variant === 'compact') {
    return (
      <View className="flex-row items-center gap-2">
        <RatingStars
          rating={summary.averageRating}
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
          showCount
          reviewCount={summary.totalReviews}
        />
      </View>
    );
  }

  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <View className={`${styles.container}`}>
        {/* Main Rating Display */}
        <View className="flex-row items-center gap-4">
          {/* Large Rating Number */}
          <View className="items-center">
            <Text className={`${styles.ratingText} font-bold text-gray-900`}>
              {summary.averageRating.toFixed(1)}
            </Text>
            <RatingStars rating={summary.averageRating} size={size === 'sm' ? 'sm' : 'md'} />
          </View>

          {/* Divider */}
          <View className="w-px h-12 bg-gray-200" />

          {/* Review Count */}
          <View className="flex-1">
            <Text className={`${styles.labelText} font-semibold text-gray-900`}>
              {reviewCountText}
            </Text>
            <Text className={`${styles.countText} text-gray-500`}>
              {summary.totalReviews > 0
                ? 'Based on customer reviews'
                : 'Be the first to leave a review'}
            </Text>
          </View>
        </View>

        {/* Rating Distribution */}
        {showDistribution && summary.totalReviews > 0 && (
          <View className="mt-4 pt-4 border-t border-gray-100">
            <View className="gap-2">
              {distributionData.map((item) => (
                <RatingDistributionBar
                  key={item.star}
                  star={item.star}
                  count={item.count}
                  total={summary.totalReviews}
                  barHeight={styles.barHeight}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

export const ReviewSummary = memo(ReviewSummaryComponent);
