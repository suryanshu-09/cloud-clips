import React, { useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery as useConvexQuery } from 'convex/react';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Card, Button, Avatar, SafeView, Header } from '@/components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IReceiptItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface IReceipt {
  _id: Id<'receipts'>;
  receiptNumber: string;
  items: IReceiptItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  discountCode?: string;
  tip?: number;
  total: number;
  status: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  refundedAmount?: number;
  paymentMethod?: {
    type: string;
    brand?: string;
    last4?: string;
  };
  paidAt?: number;
  createdAt: number;
  location?: {
    type: 'in_salon' | 'in_home';
    address?: string;
  };
  barber: {
    name?: string;
    businessName?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    businessDescription?: string;
    location?: {
      address: string;
    };
  };
  client: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  appointment?: {
    scheduledFor: number;
    duration: number;
    status: string;
  };
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------
const formatCurrency = (amount: number): string => {
  return `$${(amount / 100).toFixed(2)}`;
};

const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMMM d, yyyy');
};

const formatTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'h:mm a');
};

const formatDateTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMMM d, yyyy at h:mm a');
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        color: '#10B981',
        bgColor: '#D1FAE5',
        icon: 'checkmark-circle',
      };
    case 'refunded':
      return {
        label: 'Refunded',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: 'return-up-back',
      };
    case 'partially_refunded':
      return {
        label: 'Partially Refunded',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: 'return-up-back',
      };
    default:
      return {
        label: 'Pending',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        icon: 'time',
      };
  }
};

const getCardBrandIcon = (brand?: string): string => {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return 'card';
    case 'mastercard':
      return 'card';
    case 'amex':
      return 'card';
    case 'discover':
      return 'card';
    default:
      return 'card';
  }
};

// ---------------------------------------------------------------------------
// HTML Template for PDF Generation
// ---------------------------------------------------------------------------
const generateReceiptHTML = (receipt: IReceipt): string => {
  const statusConfig = getStatusConfig(receipt.status);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt ${receipt.receiptNumber}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 40px;
          color: #111827;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #E5E7EB;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #4F46E5;
          margin-bottom: 8px;
        }
        .receipt-number {
          font-size: 14px;
          color: #6B7280;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          background-color: ${statusConfig.bgColor};
          color: ${statusConfig.color};
          font-weight: 600;
          font-size: 14px;
          margin-top: 8px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 12px;
          text-transform: uppercase;
          color: #6B7280;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .business-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .info-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          text-align: left;
          padding: 12px 8px;
          border-bottom: 2px solid #E5E7EB;
          font-size: 12px;
          text-transform: uppercase;
          color: #6B7280;
          font-weight: 600;
        }
        td {
          padding: 12px 8px;
          border-bottom: 1px solid #E5E7EB;
          font-size: 14px;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          margin-top: 20px;
          border-top: 2px solid #E5E7EB;
          padding-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .total-row.total {
          font-size: 18px;
          font-weight: 700;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #E5E7EB;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #E5E7EB;
          text-align: center;
          font-size: 12px;
          color: #6B7280;
        }
        .payment-method {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        .refund-notice {
          background-color: #FEF3C7;
          padding: 12px;
          border-radius: 4px;
          margin-top: 20px;
          font-size: 14px;
          color: #92400E;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Cloud Clips</div>
        <div class="receipt-number">Receipt #${receipt.receiptNumber}</div>
        <div class="status">${statusConfig.label}</div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div class="section">
          <div class="section-title">From</div>
          <div class="business-name">${receipt.barber.businessName || receipt.barber.name || 'Barber'}</div>
          ${receipt.barber.location ? `<div class="info-text">${receipt.barber.location.address}</div>` : ''}
          ${receipt.barber.email ? `<div class="info-text">${receipt.barber.email}</div>` : ''}
        </div>

        <div class="section" style="text-align: right;">
          <div class="section-title">Billed To</div>
          <div class="business-name">${receipt.client.name || 'Client'}</div>
          ${receipt.client.email ? `<div class="info-text">${receipt.client.email}</div>` : ''}
          ${receipt.client.phone ? `<div class="info-text">${receipt.client.phone}</div>` : ''}
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <div class="section-title">Appointment Details</div>
        ${
          receipt.appointment
            ? `
          <div class="info-text">
            Date: ${formatDateTime(receipt.appointment.scheduledFor)}<br>
            Duration: ${receipt.appointment.duration} minutes<br>
            Location: ${receipt.location?.type === 'in_salon' ? 'In-Salon' : 'In-Home'}
            ${receipt.location?.address ? `<br>Address: ${receipt.location.address}` : ''}
          </div>
        `
            : '<div class="info-text">Product Order</div>'
        }
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${receipt.items
            .map(
              (item) => `
            <tr>
              <td>
                <strong>${item.name}</strong>
                ${item.description ? `<br><small>${item.description}</small>` : ''}
              </td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatCurrency(item.unitPrice)}</td>
              <td class="text-right">${formatCurrency(item.total)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(receipt.subtotal)}</span>
        </div>
        ${
          receipt.tax
            ? `
          <div class="total-row">
            <span>Tax</span>
            <span>${formatCurrency(receipt.tax)}</span>
          </div>
        `
            : ''
        }
        ${
          receipt.discount
            ? `
          <div class="total-row">
            <span>Discount ${receipt.discountCode ? `(${receipt.discountCode})` : ''}</span>
            <span style="color: #059669;">-${formatCurrency(receipt.discount)}</span>
          </div>
        `
            : ''
        }
        ${
          receipt.tip
            ? `
          <div class="total-row">
            <span>Tip</span>
            <span>${formatCurrency(receipt.tip)}</span>
          </div>
        `
            : ''
        }
        <div class="total-row total">
          <span>Total</span>
          <span>${formatCurrency(receipt.total)}</span>
        </div>
      </div>

      ${
        receipt.status === 'refunded' || receipt.status === 'partially_refunded'
          ? `
        <div class="refund-notice">
          <strong>Refund Processed:</strong> ${formatCurrency(receipt.refundedAmount || 0)} has been refunded to your original payment method.
        </div>
      `
          : ''
      }

      <div style="margin-top: 30px;">
        <div class="section-title">Payment Method</div>
        <div class="info-text">
          ${receipt.paymentMethod?.brand ? `${receipt.paymentMethod.brand.charAt(0).toUpperCase() + receipt.paymentMethod.brand.slice(1)}` : 'Card'}
          ${receipt.paymentMethod?.last4 ? `ending in ${receipt.paymentMethod.last4}` : ''}
        </div>
        <div class="info-text" style="margin-top: 8px; color: #6B7280;">
          Paid on ${receipt.paidAt ? formatDateTime(receipt.paidAt) : 'N/A'}
        </div>
      </div>

      <div class="footer">
        <p>Thank you for using Cloud Clips!</p>
        <p>For questions or support, contact us at support@cloudclips.app</p>
      </div>
    </body>
    </html>
  `;
};

// ---------------------------------------------------------------------------
// Main Screen Component
// ---------------------------------------------------------------------------
export default function ReceiptScreen() {
  const _router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch receipt data
  const receipt = useConvexQuery(
    api.receipts.queries.getReceiptById,
    id ? { receiptId: id as Id<'receipts'> } : 'skip'
  ) as IReceipt | undefined;

  // Handle PDF generation
  const handleDownloadPDF = useCallback(async () => {
    if (!receipt) return;

    setIsGeneratingPDF(true);
    try {
      const html = generateReceiptHTML(receipt);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const fileName = `receipt-${receipt.receiptNumber}.pdf`;

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Download ${fileName}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
      console.error('PDF generation error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [receipt]);

  // Handle sharing
  const handleShare = useCallback(async () => {
    if (!receipt) return;

    setIsSharing(true);
    try {
      const message = `Receipt from ${receipt.barber.businessName || receipt.barber.name} for ${formatCurrency(receipt.total)}\n\nReceipt #: ${receipt.receiptNumber}\nDate: ${receipt.paidAt ? formatDate(receipt.paidAt) : 'N/A'}`;

      await Share.share({
        message,
        title: `Receipt ${receipt.receiptNumber}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  }, [receipt]);

  // Loading state
  if (!receipt) {
    return (
      <SafeView>
        <Header title="Receipt" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-600 mt-4">Loading receipt...</Text>
        </View>
      </SafeView>
    );
  }

  const statusConfig = getStatusConfig(receipt.status);

  return (
    <SafeView>
      <Header title="Receipt" showBackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="p-4"
        >
          {/* Receipt Header */}
          <View className="bg-indigo-600 rounded-t-2xl p-6 items-center">
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={32} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold mb-1">Receipt</Text>
            <Text className="text-indigo-200 text-sm">#{receipt.receiptNumber}</Text>
            <View
              className="mt-3 px-4 py-1.5 rounded-full"
              style={{ backgroundColor: statusConfig.bgColor }}
            >
              <Text className="text-sm font-semibold" style={{ color: statusConfig.color }}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Main Receipt Content */}
          <Card className="rounded-t-none -mt-4">
            {/* Business Info */}
            <View className="flex-row items-center mb-6 pb-6 border-b border-gray-100">
              <Avatar
                source={receipt.barber.avatar}
                size="lg"
                fallback={receipt.barber.businessName?.charAt(0) || 'B'}
              />
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-900">
                  {receipt.barber.businessName || receipt.barber.name}
                </Text>
                {receipt.barber.businessDescription && (
                  <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                    {receipt.barber.businessDescription}
                  </Text>
                )}
                {receipt.barber.location && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-1">
                      {receipt.barber.location.address}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Client Info */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Billed To
              </Text>
              <View className="flex-row items-center">
                <Avatar
                  source={receipt.client.avatar}
                  size="md"
                  fallback={receipt.client.name?.charAt(0) || 'C'}
                />
                <View className="ml-3">
                  <Text className="font-semibold text-gray-900">{receipt.client.name}</Text>
                  {receipt.client.email && (
                    <Text className="text-gray-500 text-sm">{receipt.client.email}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Appointment Details */}
            {receipt.appointment && (
              <View className="mb-6 p-4 bg-gray-50 rounded-xl">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Appointment Details
                </Text>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text className="text-gray-700 ml-2">
                    {formatDate(receipt.appointment.scheduledFor)}
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text className="text-gray-700 ml-2">
                    {formatTime(receipt.appointment.scheduledFor)}
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="timer-outline" size={16} color="#6B7280" />
                  <Text className="text-gray-700 ml-2">{receipt.appointment.duration} minutes</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons
                    name={
                      receipt.location?.type === 'in_salon' ? 'business-outline' : 'home-outline'
                    }
                    size={16}
                    color="#6B7280"
                  />
                  <Text className="text-gray-700 ml-2">
                    {receipt.location?.type === 'in_salon' ? 'In-Salon Service' : 'In-Home Service'}
                  </Text>
                </View>
                {receipt.location?.address && (
                  <Text className="text-gray-500 text-sm mt-2 ml-6">
                    {receipt.location.address}
                  </Text>
                )}
              </View>
            )}

            {/* Items */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Items
              </Text>
              {receipt.items.map((item, index) => (
                <View
                  key={index}
                  className={`flex-row justify-between py-3 ${index !== receipt.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{item.name}</Text>
                    {item.description && (
                      <Text className="text-gray-500 text-sm mt-0.5">{item.description}</Text>
                    )}
                    <Text className="text-gray-500 text-sm mt-1">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                  <Text className="font-semibold text-gray-900">{formatCurrency(item.total)}</Text>
                </View>
              ))}
            </View>

            {/* Divider */}
            <View className="h-px bg-gray-200 mb-6" />

            {/* Totals */}
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-900">{formatCurrency(receipt.subtotal)}</Text>
              </View>

              {receipt.tax !== undefined && receipt.tax > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Tax</Text>
                  <Text className="text-gray-900">{formatCurrency(receipt.tax)}</Text>
                </View>
              )}

              {receipt.discount !== undefined && receipt.discount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-emerald-600">
                    Discount {receipt.discountCode && `(${receipt.discountCode})`}
                  </Text>
                  <Text className="text-emerald-600">-{formatCurrency(receipt.discount)}</Text>
                </View>
              )}

              {receipt.tip !== undefined && receipt.tip > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Tip</Text>
                  <Text className="text-gray-900">{formatCurrency(receipt.tip)}</Text>
                </View>
              )}

              <View className="flex-row justify-between pt-4 mt-2 border-t border-gray-200">
                <Text className="text-lg font-bold text-gray-900">Total</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {formatCurrency(receipt.total)}
                </Text>
              </View>

              {(receipt.status === 'refunded' || receipt.status === 'partially_refunded') && (
                <View className="flex-row justify-between mt-2">
                  <Text className="text-amber-600 font-medium">Refunded</Text>
                  <Text className="text-amber-600 font-medium">
                    -{formatCurrency(receipt.refundedAmount || 0)}
                  </Text>
                </View>
              )}
            </View>

            {/* Payment Method */}
            {receipt.paymentMethod && (
              <View className="mt-6 pt-6 border-t border-gray-200">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Payment Method
                </Text>
                <View className="flex-row items-center">
                  <View className="w-10 h-6 bg-gray-100 rounded items-center justify-center">
                    <Ionicons
                      name={getCardBrandIcon(receipt.paymentMethod.brand)}
                      size={20}
                      color="#6B7280"
                    />
                  </View>
                  <Text className="text-gray-700 ml-3 capitalize">
                    {receipt.paymentMethod.brand || 'Card'}
                    {receipt.paymentMethod.last4 && ` •••• ${receipt.paymentMethod.last4}`}
                  </Text>
                </View>
                {receipt.paidAt && (
                  <Text className="text-gray-500 text-sm mt-2">
                    Paid on {formatDateTime(receipt.paidAt)}
                  </Text>
                )}
              </View>
            )}
          </Card>

          {/* Actions */}
          <View className="mt-4 space-y-3">
            <Button
              onPress={handleDownloadPDF}
              loading={isGeneratingPDF}
              disabled={isGeneratingPDF}
              fullWidth
              leftIcon={<Ionicons name="download-outline" size={20} color="white" />}
            >
              Download PDF
            </Button>

            <Button
              variant="outline"
              onPress={handleShare}
              disabled={isSharing}
              fullWidth
              leftIcon={<Ionicons name="share-outline" size={20} color="#4F46E5" />}
            >
              Share Receipt
            </Button>
          </View>

          {/* Footer */}
          <View className="mt-8 items-center">
            <Text className="text-gray-400 text-sm">Thank you for using Cloud Clips!</Text>
            <Text className="text-gray-400 text-xs mt-1">support@cloudclips.app</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeView>
  );
}
