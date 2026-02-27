import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Button, Card } from '@/components/ui';

// Card brand display mapping
const _CARD_BRAND_DISPLAY: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: 'Card',
};

export default function ConfirmationScreen() {
  const router = useRouter();
  const { appointmentId, paymentStatus } = useLocalSearchParams<{
    appointmentId: string;
    paymentStatus?: string;
  }>();

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  // Fetch appointment details
  const appointment = useConvexQuery(
    api.appointments.queries.getAppointmentById,
    appointmentId ? { appointmentId: appointmentId as Id<'appointments'> } : 'skip'
  );

  // Run entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleViewAppointments = () => {
    router.replace('/(client)/appointments');
  };

  const handleBackToHome = () => {
    router.replace('/(client)');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Determine status color and icon
  const getStatusInfo = () => {
    switch (paymentStatus) {
      case 'paid':
        return {
          icon: '✓',
          color: '#10B981',
          bgColor: '#D1FAE5',
          title: 'Payment Successful!',
          message: 'Your booking has been confirmed and payment received.',
        };
      case 'pending':
        return {
          icon: '⏳',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          title: 'Booking Confirmed',
          message: 'Your booking is confirmed. Please complete payment soon.',
        };
      case 'failed':
        return {
          icon: '⚠️',
          color: '#EF4444',
          bgColor: '#FEE2E2',
          title: 'Payment Failed',
          message: 'Your booking is reserved. Please retry payment.',
        };
      default:
        return {
          icon: '✓',
          color: '#10B981',
          bgColor: '#D1FAE5',
          title: 'Booking Confirmed!',
          message: 'Your appointment has been successfully booked.',
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (!appointment) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading confirmation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Animation Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.successIcon, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.successIconText, { color: statusInfo.color }]}>
              {statusInfo.icon}
            </Text>
          </View>
          <Text style={styles.title}>{statusInfo.title}</Text>
          <Text style={styles.subtitle}>{statusInfo.message}</Text>
        </Animated.View>

        {/* Appointment Details Card */}
        <Card style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Appointment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{appointment.serviceName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(appointment.scheduledFor)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{formatTime(appointment.scheduledFor)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{appointment.duration} minutes</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {appointment.locationType === 'in_salon' ? 'In-Salon' : 'In-Home'}
            </Text>
          </View>

          {appointment.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={[styles.detailValue, styles.addressValue]}>{appointment.address}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Appointment ID</Text>
            <Text style={[styles.detailValue, styles.idValue]}>
              {appointmentId?.slice(-8).toUpperCase()}
            </Text>
          </View>
        </Card>

        {/* Payment Details Card */}
        {appointment.price !== undefined && (
          <Card style={styles.paymentCard}>
            <Text style={styles.cardTitle}>Payment Summary</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Price</Text>
              <Text style={styles.priceValue}>{formatCurrency(appointment.price)}</Text>
            </View>

            {appointment.discountAmount && appointment.discountAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, styles.discountLabel]}>Discount</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>
                  -{formatCurrency(appointment.discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(appointment.finalPrice || appointment.price)}
              </Text>
            </View>

            {/* Payment Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    appointment.paymentStatus === 'paid'
                      ? '#D1FAE5'
                      : appointment.paymentStatus === 'pending'
                        ? '#FEF3C7'
                        : '#FEE2E2',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      appointment.paymentStatus === 'paid'
                        ? '#065F46'
                        : appointment.paymentStatus === 'pending'
                          ? '#92400E'
                          : '#991B1B',
                  },
                ]}
              >
                Payment {appointment.paymentStatus}
              </Text>
            </View>
          </Card>
        )}

        {/* What's Next Section */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>1.</Text>
              <Text style={styles.infoText}>You'll receive a confirmation email shortly</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>2.</Text>
              <Text style={styles.infoText}>The barber will be notified of your booking</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>3.</Text>
              <Text style={styles.infoText}>
                You can reschedule or cancel up to 24 hours before
              </Text>
            </View>
          </View>
        </Card>

        {/* Questions Section */}
        <View style={styles.questionsContainer}>
          <Text style={styles.questionsText}>Have questions?</Text>
          <Text style={styles.questionsSubtext}>Contact us at support@cloudclips.app</Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button onPress={handleViewAppointments} size="lg" style={styles.primaryButton}>
          View My Appointments
        </Button>
        <Button
          variant="outline"
          onPress={handleBackToHome}
          size="lg"
          style={styles.secondaryButton}
        >
          Back to Home
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 36,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  detailsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1.5,
    textAlign: 'right',
  },
  addressValue: {
    flex: 1.5,
    textAlign: 'right',
    fontSize: 13,
  },
  idValue: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  paymentCard: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#111827',
  },
  discountLabel: {
    color: '#059669',
  },
  discountValue: {
    color: '#059669',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoCard: {
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 8,
  },
  infoBullet: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    width: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 18,
  },
  questionsContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  questionsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  questionsSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});
