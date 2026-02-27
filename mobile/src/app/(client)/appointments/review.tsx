/**
 * Review Submission Screen
 * Allows clients to submit reviews for completed appointments
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery as useConvexQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

import { SafeView } from '@/components/ui/SafeView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { ReviewForm } from '@/components/review/ReviewForm';

export default function ReviewSubmissionScreen() {
  const router = useRouter();
  const { appointmentId, barberId } = useLocalSearchParams<{
    appointmentId: string;
    barberId: string;
  }>();

  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch appointment details
  const appointment = useConvexQuery(
    api.appointments.queries.getAppointmentById,
    appointmentId ? { appointmentId: appointmentId as Id<'appointments'> } : 'skip'
  );

  // Fetch barber profile
  const barberProfile = useConvexQuery(
    api.barbers.queries.getBarberProfile,
    barberId ? { userId: barberId as Id<'users'> } : 'skip'
  );

  // Check if review already exists
  const existingReview = useConvexQuery(
    api.reviews.queries.getReviewByAppointment,
    appointmentId ? { appointmentId: appointmentId as Id<'appointments'> } : 'skip'
  );

  // Submit review mutation
  const submitReviewMutation = useMutation(api.reviews.mutations.submitReview);

  const _handleSubmitReview = useCallback(
    async (rating: number, comment?: string, photos?: string[]) => {
      if (!appointmentId) return;

      try {
        await submitReviewMutation({
          appointmentId: appointmentId as Id<'appointments'>,
          rating,
          comment,
          photos,
        });

        Alert.alert(
          'Review Submitted!',
          'Thank you for sharing your experience. Your review helps other clients make informed decisions.',
          [
            {
              text: 'View My Reviews',
              onPress: () => router.replace('/profile/reviews'),
            },
            {
              text: 'Back to Appointments',
              onPress: () => router.replace('/appointments'),
            },
          ]
        );
      } catch (error: any) {
        console.error('Review submission error:', error);
        Alert.alert('Error', error.message || 'Failed to submit review. Please try again.');
      }
    },
    [appointmentId, submitReviewMutation, router]
  );

  const handleCancel = useCallback(() => {
    Alert.alert('Discard Review?', 'Your review will not be saved if you leave this screen.', [
      { text: 'Keep Writing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => router.replace('/appointments'),
      },
    ]);
  }, [router]);

  // Show loading state
  if (!appointment || !barberProfile) {
    return (
      <SafeView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Loading...</Text>
        </View>
      </SafeView>
    );
  }

  // Check if review already exists
  if (existingReview) {
    return (
      <SafeView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-4xl mb-4">⭐</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">Review Already Submitted</Text>
          <Text className="text-gray-600 text-center mb-6">
            You have already submitted a review for this appointment.
          </Text>
          <Button onPress={() => router.replace('/appointments')} fullWidth>
            Back to Appointments
          </Button>
        </View>
      </SafeView>
    );
  }

  // Check if appointment is completed
  if (appointment.status !== 'completed') {
    return (
      <SafeView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-4xl mb-4">⏳</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">Appointment Not Completed</Text>
          <Text className="text-gray-600 text-center mb-6">
            You can only submit a review after your appointment has been completed.
          </Text>
          <Button onPress={() => router.replace('/appointments')} fullWidth>
            Back to Appointments
          </Button>
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">How was your experience?</Text>
            <Text className="text-gray-600">
              Your feedback helps {barberProfile.businessName} improve and helps other clients make
              informed decisions.
            </Text>
          </View>

          {/* Barber Info Card */}
          <Card variant="outlined" padding="md" className="mb-6">
            <View className="flex-row items-center gap-3">
              <Avatar
                source={appointment.barber?.avatar}
                size="lg"
                fallback={barberProfile.businessName?.charAt(0) || 'B'}
              />
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">
                  {barberProfile.businessName}
                </Text>
                <Text className="text-sm text-gray-500">{appointment.serviceName}</Text>
                <Text className="text-xs text-gray-400">
                  {new Date(appointment.scheduledFor).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </Card>

          {/* Review Form */}
          {showReviewForm ? (
            <ReviewForm
              appointmentId={appointmentId as string}
              barberId={barberId as string}
              onSuccess={() => {
                Alert.alert('Review Submitted!', 'Thank you for your feedback!', [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/appointments'),
                  },
                ]);
              }}
              onCancel={handleCancel}
            />
          ) : (
            <Card variant="elevated" padding="lg">
              <View className="items-center gap-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Tap a star to rate your experience
                </Text>
                <StarRating rating={0} size="xl" color="#facc15" showValue={false} />
                <Text className="text-sm text-gray-500">Select a rating to continue</Text>
                <Button onPress={() => setShowReviewForm(true)} fullWidth className="mt-4">
                  Write a Review
                </Button>
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}
