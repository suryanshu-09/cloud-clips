import { useState } from 'react';
import { Text, View, ScrollView, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useProduct, useCart } from '@/features/products';
import { SafeView } from '@/components/ui/SafeView';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ImageZoomModal } from '@/components/ui/ImageZoomModal';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showImageZoom, setShowImageZoom] = useState(false);

  const { data: product, isLoading } = useProduct(productId);
  const { addProduct, isInCart, getProductQuantity } = useCart();

  if (isLoading) {
    return (
      <SafeView>
        <ScrollView className="flex-1">
          <Skeleton height={400} />
          <View className="p-4">
            <Skeleton height={30} className="mb-2" />
            <Skeleton height={20} className="mb-4" />
            <Skeleton height={100} />
          </View>
        </ScrollView>
      </SafeView>
    );
  }

  if (!product) {
    return (
      <SafeView>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl font-bold text-gray-900 mb-2">Product Not Found</Text>
          <Text className="text-gray-600 text-center mb-4">
            The product you're looking for doesn't exist or has been removed.
          </Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeView>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const inCart = isInCart(product.id);
  const cartQuantity = getProductQuantity(product.id);

  const handleAddToCart = () => {
    addProduct(product, quantity);
    setQuantity(1);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <SafeView>
      <ScrollView className="flex-1 bg-white">
        {/* Image Gallery */}
        <View className="relative">
          {product.images && product.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setSelectedImage(index);
                }}
              >
                {product.images.map((image, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      setSelectedImage(index);
                      setShowImageZoom(true);
                    }}
                    className="active:opacity-90"
                  >
                    <Image
                      source={{ uri: image }}
                      style={{ width, height: 400 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      recyclingKey={image}
                      transition={200}
                    />
                  </Pressable>
                ))}
              </ScrollView>

              {/* Image Indicators */}
              {product.images.length > 1 && (
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                  {product.images.map((_, index) => (
                    <View
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === selectedImage ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View className="w-full h-96 bg-gray-100 items-center justify-center">
              <Text className="text-6xl">📦</Text>
            </View>
          )}

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-4 bg-white/90 rounded-full p-2 px-3"
          >
            <Text className="text-lg">←</Text>
          </Pressable>

          {/* Stock Badge */}
          {isOutOfStock && (
            <View className="absolute top-4 right-4">
              <Badge variant="danger" size="lg">
                Out of Stock
              </Badge>
            </View>
          )}
          {isLowStock && (
            <View className="absolute top-4 right-4">
              <Badge variant="warning" size="md">
                Only {product.stock} left
              </Badge>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="p-4">
          {/* Category */}
          {product.category && (
            <Text className="text-sm text-gray-500 uppercase mb-2">
              {product.category.replace('_', ' ')}
            </Text>
          )}

          {/* Name and Price */}
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 pr-4">
              <Text className="text-2xl font-bold text-gray-900 mb-1">{product.name}</Text>
              {product.barberName && (
                <Text className="text-sm text-gray-600">Sold by {product.barberName}</Text>
              )}
            </View>
            <Text className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</Text>
          </View>

          {/* Rating */}
          {product.rating > 0 && (
            <View className="flex-row items-center gap-2 mb-4">
              <View className="flex-row items-center gap-1">
                <Text className="text-yellow-500 text-lg">⭐</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {product.rating.toFixed(1)}
                </Text>
              </View>
              <Text className="text-sm text-gray-500">({product.totalReviews} reviews)</Text>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <Card variant="outlined" padding="md" className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">Description</Text>
              <Text className="text-sm text-gray-700 leading-6">{product.description}</Text>
            </Card>
          )}

          {/* Specifications */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <Card variant="outlined" padding="md" className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-3">Specifications</Text>
              {Object.entries(product.specs).map(([key, value]) => (
                <View key={key} className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</Text>
                  <Text className="text-sm text-gray-900 font-medium">{value}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Cart Status */}
          {inCart && (
            <Card variant="outlined" padding="md" className="mb-4 bg-blue-50">
              <Text className="text-sm text-blue-900">
                Already in cart ({cartQuantity} {cartQuantity === 1 ? 'item' : 'items'})
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar - Quantity and Add to Cart */}
      {!isOutOfStock && (
        <View className="bg-white border-t border-gray-200 p-4">
          <View className="flex-row items-center gap-3">
            {/* Quantity Selector */}
            <View className="flex-row items-center bg-gray-100 rounded-lg">
              <Pressable
                onPress={decrementQuantity}
                disabled={quantity <= 1}
                className="px-4 py-3 active:bg-gray-200 rounded-l-lg"
              >
                <Text className="text-gray-700 font-bold text-lg">−</Text>
              </Pressable>
              <View className="px-4 py-3 border-x border-gray-200 min-w-[50px] items-center">
                <Text className="text-gray-900 font-semibold text-base">{quantity}</Text>
              </View>
              <Pressable
                onPress={incrementQuantity}
                disabled={quantity >= product.stock}
                className="px-4 py-3 active:bg-gray-200 rounded-r-lg"
              >
                <Text className="text-gray-700 font-bold text-lg">+</Text>
              </Pressable>
            </View>

            {/* Add to Cart Button */}
            <Button onPress={handleAddToCart} variant="primary" className="flex-1">
              Add to Cart - ${(product.price * quantity).toFixed(2)}
            </Button>
          </View>
        </View>
      )}

      {/* Image Zoom Modal */}
      {product?.images && product.images.length > 0 && (
        <ImageZoomModal
          visible={showImageZoom}
          imageUrls={product.images}
          initialIndex={selectedImage}
          onClose={() => setShowImageZoom(false)}
        />
      )}
    </SafeView>
  );
}
