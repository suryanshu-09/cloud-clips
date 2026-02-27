import { memo, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ImageZoomModal } from '@/components/ui/ImageZoomModal';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { RatingStars } from '@/components/shared/RatingStars';
import type { IReview } from '@/features/reviews';

interface IReviewCardProps {
  review: IReview;
  showBarberInfo?: boolean;
  onImagePress?: (imageUrl: string, index: number) => void;
  onMorePress?: () => void;
}

/**
 * ReviewCard - Optimized review card component
 *
 * Performance optimizations:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Memoized date formatting
 * - Memoized callbacks for image press
 * - Uses OptimizedImage for review photos
 */
function ReviewCardComponent({
  review,
  showBarberInfo = false,
  onImagePress,
  onMorePress,
}: IReviewCardProps) {
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Memoized date formatting
  const formattedDate = useMemo(() => {
    const date = new Date(review.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }, [review.createdAt]);

  // Memoized image press handler
  const handleImagePress = useCallback(
    (index: number) => {
      setSelectedImageIndex(index);
      setShowZoomModal(true);
      onImagePress?.(review.photos![index], index);
    },
    [onImagePress, review.photos]
  );

  // Memoized close modal handler
  const handleCloseModal = useCallback(() => {
    setShowZoomModal(false);
  }, []);

  // Memoized fallback character
  const fallbackChar = useMemo(() => review.clientName?.[0] || 'U', [review.clientName]);

  // Memoized display name
  const displayName = useMemo(() => review.clientName || 'Anonymous', [review.clientName]);

  return (
    <Card variant="outlined" padding="md">
      <View className="gap-3">
        {/* Header: User info and rating */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <Avatar source={review.clientAvatar} size="md" fallback={fallbackChar} />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">{displayName}</Text>
              <Text className="text-sm text-gray-500">{formattedDate}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <RatingStars rating={review.rating} size="sm" />
            {onMorePress && (
              <Pressable
                onPress={onMorePress}
                className="p-1"
                accessibilityRole="button"
                accessibilityLabel="More options"
                accessibilityHint="Opens more options for this review"
              >
                <Text className="text-gray-500 text-lg">⋮</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Comment */}
        {review.comment && (
          <Text className="text-base text-gray-700 leading-6">{review.comment}</Text>
        )}

        {/* Photos */}
          {review.photos && review.photos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              accessibilityLabel={`${review.photos.length} review photo${review.photos.length !== 1 ? 's' : ''}`}
            >
              {review.photos.map((photo, index) => (
                <Pressable
                  key={`${review.id}-photo-${index}`}
                  onPress={() => handleImagePress(index)}
                  className="active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel={`Review photo ${index + 1} of ${review.photos!.length}`}
                  accessibilityHint="Tap to view full-size image"
                >
                  <OptimizedImage
                    source={photo}
                    width={96}
                    height={96}
                    className="rounded-lg"
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
      </View>

      {/* Image Zoom Modal */}
      {review.photos && review.photos.length > 0 && (
        <ImageZoomModal
          visible={showZoomModal}
          imageUrls={review.photos}
          initialIndex={selectedImageIndex}
          onClose={handleCloseModal}
        />
      )}
    </Card>
  );
}

export const ReviewCard = memo(ReviewCardComponent);
