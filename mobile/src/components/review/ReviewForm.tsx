import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/shared/RatingStars';
import { useSubmitReview, useUpdateReview } from '@/features/reviews';
import {
  mediaService,
  pickImageFromCamera,
  pickImageFromGallery,
  pickMultipleImages,
  showImagePickerOptions,
  IUploadProgress,
} from '@/services/media';
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
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const submitReviewMutation = useSubmitReview();
  const updateReviewMutation = useUpdateReview();

  const isEditing = !!existingReview;
  const isLoading =
    submitReviewMutation.isPending || updateReviewMutation.isPending || isUploadingPhotos;

  // Handle upload progress
  const handleUploadProgress = useCallback((progress: IUploadProgress) => {
    setUploadProgress(progress.progress);
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    try {
      // Upload any pending photos first
      let allPhotos = [...photos];

      if (pendingPhotos.length > 0) {
        setIsUploadingPhotos(true);
        setUploadProgress(0);

        try {
          const uploadResult = await mediaService.uploadReviewPhotos(pendingPhotos, {
            onProgress: handleUploadProgress,
          });

          allPhotos = [...photos, ...uploadResult.photos];

          if (uploadResult.failed.length > 0) {
            Alert.alert(
              'Some Photos Failed',
              `${uploadResult.failed.length} photo(s) couldn't be uploaded. Continuing with ${uploadResult.photos.length} photos.`
            );
          }
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload photos. Submit without photos?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => submitWithPhotos([]) },
          ]);
          setIsUploadingPhotos(false);
          return;
        }

        setIsUploadingPhotos(false);
      }

      await submitWithPhotos(allPhotos);
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${isEditing ? 'update' : 'submit'} review`);
    }
  };

  const submitWithPhotos = async (finalPhotos: string[]) => {
    try {
      if (isEditing && existingReview) {
        const updatedReview = await updateReviewMutation.mutateAsync({
          reviewId: existingReview.id,
          updates: {
            rating,
            comment: comment.trim() || undefined,
            photos: finalPhotos.length > 0 ? finalPhotos : undefined,
          },
        });
        onSuccess?.(updatedReview);
      } else {
        const reviewData: IReviewSubmission = {
          appointmentId,
          barberId,
          rating,
          comment: comment.trim() || undefined,
          photos: finalPhotos.length > 0 ? finalPhotos : undefined,
        };
        const newReview = await submitReviewMutation.mutateAsync(reviewData);
        onSuccess?.(newReview);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${isEditing ? 'update' : 'submit'} review`);
    }
  };

  const handleRemovePhoto = (index: number) => {
    // Check if it's a pending photo (local URI) or an uploaded photo (URL)
    const totalExistingPhotos = photos.length;
    if (index < totalExistingPhotos) {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      const pendingIndex = index - totalExistingPhotos;
      setPendingPhotos((prev) => prev.filter((_, i) => i !== pendingIndex));
    }
  };

  // Handle camera press
  const handleCameraPress = async () => {
    const totalPhotos = photos.length + pendingPhotos.length;
    if (totalPhotos >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 photos per review.');
      return;
    }

    try {
      const image = await pickImageFromCamera({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (image) {
        setPendingPhotos((prev) => [...prev, image.uri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to access camera');
    }
  };

  // Handle gallery press
  const handleGalleryPress = async () => {
    const totalPhotos = photos.length + pendingPhotos.length;
    if (totalPhotos >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 photos per review.');
      return;
    }

    try {
      const image = await pickImageFromGallery({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (image) {
        setPendingPhotos((prev) => [...prev, image.uri]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to access photo library');
    }
  };

  // Handle multiple images
  const handleMultiplePress = async () => {
    const totalPhotos = photos.length + pendingPhotos.length;
    const remaining = 3 - totalPhotos;

    if (remaining <= 0) {
      Alert.alert('Limit Reached', 'You can only add up to 3 photos per review.');
      return;
    }

    try {
      const images = await pickMultipleImages({
        quality: 0.8,
        selectionLimit: remaining,
      });
      if (images.length > 0) {
        const uris = images.map((img) => img.uri);
        setPendingPhotos((prev) => [...prev, ...uris].slice(0, 3 - photos.length));
      }
    } catch (error) {
      console.error('Multiple images error:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const handleAddPhoto = () => {
    const totalPhotos = photos.length + pendingPhotos.length;
    if (totalPhotos >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 photos per review.');
      return;
    }

    Alert.alert('Add Photo', 'Choose how to add photos', [
      { text: 'Camera', onPress: handleCameraPress },
      { text: 'Single Photo', onPress: handleGalleryPress },
      { text: 'Multiple Photos', onPress: handleMultiplePress },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Combine existing photos and pending photos for display
  const allDisplayPhotos = [...photos, ...pendingPhotos];
  const totalPhotoCount = allDisplayPhotos.length;

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
            <Text className="text-xs text-gray-500 mb-3">Add up to 3 photos of your haircut</Text>

            {/* Upload Progress */}
            {isUploadingPhotos && (
              <View className="mb-3">
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </View>
                <Text className="text-xs text-gray-500 text-center mt-1">
                  Uploading photos... {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="gap-2"
              contentContainerClassName="gap-2"
            >
              {allDisplayPhotos.map((photo, index) => (
                <View key={`photo-${index}`} className="relative">
                  <Image
                    source={{ uri: photo }}
                    className="w-24 h-24 rounded-lg"
                    resizeMode="cover"
                  />
                  {/* Show badge for pending photos */}
                  {index >= photos.length && (
                    <View className="absolute top-1 left-1 bg-yellow-500 px-1.5 py-0.5 rounded">
                      <Text className="text-white text-[10px] font-medium">New</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => handleRemovePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                    disabled={isLoading}
                  >
                    <Text className="text-white text-xs font-bold">X</Text>
                  </Pressable>
                </View>
              ))}

              {totalPhotoCount < 3 && (
                <Pressable
                  onPress={handleAddPhoto}
                  disabled={isLoading}
                  className={`w-24 h-24 border-2 border-dashed rounded-lg items-center justify-center ${
                    isLoading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <Text className={`text-3xl ${isLoading ? 'text-gray-300' : 'text-gray-400'}`}>
                    +
                  </Text>
                  <Text className={`text-xs mt-1 ${isLoading ? 'text-gray-300' : 'text-gray-500'}`}>
                    Add Photo
                  </Text>
                </Pressable>
              )}
            </ScrollView>
            {totalPhotoCount > 0 && (
              <Text className="text-xs text-gray-500 mt-2">
                {totalPhotoCount}/3 photos
                {pendingPhotos.length > 0 && ` (${pendingPhotos.length} pending upload)`}
              </Text>
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
