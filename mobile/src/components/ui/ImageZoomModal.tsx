import { useState } from 'react';
import { Modal, View, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface IImageZoomModalProps {
  visible: boolean;
  imageUrls: string[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ImageZoomModal({
  visible,
  imageUrls,
  initialIndex = 0,
  onClose,
}: IImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        {/* Close Button */}
        <View className="absolute top-12 right-4 z-10">
          <Pressable onPress={onClose} className="bg-black/50 rounded-full p-2">
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
        </View>

        {/* Image Counter */}
        {imageUrls.length > 1 && (
          <View className="absolute top-12 left-4 z-10">
            <View className="bg-black/50 rounded-full px-4 py-2">
              <Ionicons name="images-outline" size={20} color="white" />
            </View>
          </View>
        )}

        {/* Image Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        >
          {imageUrls.map((url, index) => (
          <View
            key={index}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            className="items-center justify-center"
          >
            <Image
              source={{ uri: url }}
              style={styles.image}
              contentFit="contain"
              transition={150}
              cachePolicy="memory-disk"
              recyclingKey={url}
            />
          </View>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        {imageUrls.length > 1 && (
          <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-2">
            {imageUrls.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-2'
                }`}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = {
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
} as const;
