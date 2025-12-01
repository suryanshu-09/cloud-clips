import { useState } from 'react';
import { Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCart } from '@/features/products';
import { CartItem } from '@/components/product';
import { SafeView } from '@/components/ui/SafeView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CouponInput } from '@/components/product';

export default function CartScreen() {
  const {
    items,
    total,
    itemCount,
    isEmpty,
    incrementQuantity,
    decrementQuantity,
    removeProduct,
    clearCart,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert('Remove Item', `Are you sure you want to remove "${productName}" from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeProduct(productId),
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => clearCart(),
      },
    ]);
  };

  const handleCheckout = () => {
    // TODO: Navigate to checkout screen
    Alert.alert('Checkout', 'Checkout functionality will be implemented soon!');
  };

  const subtotal = total;
  const tax = subtotal * 0.1; // 10% tax
  const finalTotal = subtotal - discount + tax;

  if (isEmpty) {
    return (
      <SafeView>
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()}>
              <Text className="text-2xl">←</Text>
            </Pressable>
            <Text className="text-2xl font-bold text-gray-900">Shopping Cart</Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center">
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            message="Add some products to get started"
          />
          <Button onPress={() => router.push('/(client)/store')} variant="primary" className="mt-4">
            Browse Products
          </Button>
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()}>
              <Text className="text-2xl">←</Text>
            </Pressable>
            <Text className="text-2xl font-bold text-gray-900">Cart ({itemCount})</Text>
          </View>

          <Pressable onPress={handleClearCart}>
            <Text className="text-sm text-red-500 font-semibold">Clear All</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 bg-gray-50">
        {/* Cart Items */}
        <View className="p-4">
          {items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onIncrement={() => incrementQuantity(item.productId)}
              onDecrement={() => decrementQuantity(item.productId)}
              onRemove={() => handleRemoveItem(item.productId, item.name)}
            />
          ))}
        </View>

        {/* Coupon Section */}
        <View className="px-4 pb-4">
          <CouponInput
            value={couponCode}
            onChangeText={setCouponCode}
            onApply={(validatedCoupon) => {
              if (validatedCoupon?.discountAmount) {
                setDiscount(validatedCoupon.discountAmount);
              }
            }}
            totalAmount={total}
          />
        </View>

        {/* Order Summary */}
        <View className="px-4 pb-4">
          <Card variant="elevated" padding="md">
            <Text className="text-lg font-bold text-gray-900 mb-4">Order Summary</Text>

            {/* Subtotal */}
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="text-gray-900 font-medium">${subtotal.toFixed(2)}</Text>
            </View>

            {/* Discount */}
            {discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-green-600">Discount</Text>
                <Text className="text-green-600 font-medium">-${discount.toFixed(2)}</Text>
              </View>
            )}

            {/* Tax */}
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Tax (10%)</Text>
              <Text className="text-gray-900 font-medium">${tax.toFixed(2)}</Text>
            </View>

            {/* Divider */}
            <View className="border-t border-gray-200 my-3" />

            {/* Total */}
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-gray-900">Total</Text>
              <Text className="text-lg font-bold text-gray-900">${finalTotal.toFixed(2)}</Text>
            </View>
          </Card>
        </View>

        {/* Spacer for bottom button */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Bar - Checkout Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <Button onPress={handleCheckout} variant="primary" size="lg">
          Proceed to Checkout - ${finalTotal.toFixed(2)}
        </Button>
      </View>
    </SafeView>
  );
}
