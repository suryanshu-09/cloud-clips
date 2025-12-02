import { View, Text, TextInput, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/shared/RatingStars';
import { useSubmitReview, useUpdateReview } from '@/features/reviews';
import type { IReview, IReviewSubmission } from '@/features/reviews';

interface IReviewFormProps {
  appointmentId: string;
  barberId: string;
  existingReview?: IReview;
  onSuccess?: (review: IReview) => void;
  onCancel?: () => void;
}

export function ReviewForm({
  appointmentId,
  barberId,
  existingReview,
  onSuccess,
  onCancel,
}: IReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [photos, setPhotos] = useState<string[]>(existingReview?.photos || []);

  const submitReviewMutation = useSubmitReview();
  const updateReviewMutation = useUpdateReview();

  const isEditing = !!existingReview;
  const isLoading = submitReviewMutation.isPending || updateReviewMutation.isPending;

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    try {
      if (isEditing && existingReview) {
        const updatedReview = await updateReviewMutation.mutateAsync({
          reviewId: existingReview.id,
          updates: {
            rating,
            comment: comment.trim() || undefined,
            photos: photos.length > 0 ? photos : undefined,
          },
        });
        onSuccess?.(updatedReview);
      } else {
        const reviewData: IReviewSubmission = {
          appointmentId,
          barberId,
          rating,
          comment: comment.trim() || undefined,
          photos: photos.length > 0 ? photos : undefined,
        };
        const newReview = await submitReviewMutation.mutateAsync(reviewData);
        onSuccess?.(newReview);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${isEditing ? 'update' : 'submit'} review`);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPhoto = () => {
    // In a real app, this would open image picker
    Alert.alert(
      'Photo Upload',
      'Image picker would open here. For demo purposes, this feature is not implemented.'
    );
  };

  return (
    <Card variant="elevated" padding="lg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Title */}
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Review' : 'Write a Review'}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Share your experience with this barber
            </Text>
          </View>

          {/* Rating */}
          <View>
            <Text className="text-base font-semibold text-gray-900 mb-3">Rating *</Text>
            <View className="items-center py-4">
              <RatingStars rating={rating} size="lg" interactive onRatingChange={setRating} />
              <Text className="text-sm text-gray-600 mt-2">
                {rating === 0 && 'Tap to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            </View>
          </View>

          {/* Comment */}
          <View>
            <Text className="text-base font-semibold text-gray-900 mb-2">Your Review</Text>
            <View className="border border-gray-300 rounded-lg bg-white">
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Tell us about your experience..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="p-3 text-base text-gray-900 min-h-[120px]"
                maxLength={500}
              />
              <View className="px-3 pb-2">
                <Text className="text-xs text-gray-500 text-right">{comment.length}/500</Text>
              </View>
            </View>
          </View>

          {/* Photos */}
          <View>
            <Text className="text-base font-semibold text-gray-900 mb-2">Photos (Optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="gap-2"
              contentContainerClassName="gap-2"
            >
              {photos.map((photo, index) => (
                <View key={`photo-${index}`} className="relative">
                  <Image
                    source={{ uri: photo }}
                    className="w-24 h-24 rounded-lg"
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => handleRemovePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                  >
                    <Text className="text-white text-xs font-bold">×</Text>
                  </Pressable>
                </View>
              ))}

              {photos.length < 5 && (
                <Pressable
                  onPress={handleAddPhoto}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-50"
                >
                  <Text className="text-gray-400 text-3xl">+</Text>
                  <Text className="text-xs text-gray-500 mt-1">Add Photo</Text>
                </Pressable>
              )}
            </ScrollView>
            {photos.length > 0 && (
              <Text className="text-xs text-gray-500 mt-2">{photos.length}/5 photos</Text>
            )}
          </View>

          {/* Actions */}
          <View className="gap-3 mt-4">
            <Button
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading || rating === 0}
              fullWidth
            >
              {isEditing ? 'Update Review' : 'Submit Review'}
            </Button>

            {onCancel && (
              <Button variant="outline" onPress={onCancel} disabled={isLoading} fullWidth>
                Cancel
              </Button>
            )}
          </View>

          {submitReviewMutation.isError && (
            <Text className="text-sm text-red-500 text-center">
              {submitReviewMutation.error?.message || 'Failed to submit review'}
            </Text>
          )}
          {updateReviewMutation.isError && (
            <Text className="text-sm text-red-500 text-center">
              {updateReviewMutation.error?.message || 'Failed to update review'}
            </Text>
          )}
        </View>
      </ScrollView>
    </Card>
  );
}
