import { View, Text, FlatList, Dimensions, Pressable } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/ui/SafeView';
import { Button } from '@/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IOnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const onboardingSlides: IOnboardingSlide[] = [
  {
    id: '1',
    title: 'Find Top Barbers',
    description: 'Discover skilled barbers and stylists near you with just a few taps',
    emoji: '💈',
  },
  {
    id: '2',
    title: 'Book Instantly',
    description: 'Schedule appointments at your convenience with real-time availability',
    emoji: '📅',
  },
  {
    id: '3',
    title: 'Quality Service',
    description: 'Get premium grooming services from verified professionals',
    emoji: '✂️',
  },
  {
    id: '4',
    title: 'Shop Products',
    description: 'Browse and buy professional grooming products from your favorite barbers',
    emoji: '🛒',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item }: { item: IOnboardingSlide }) => (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
      <View className="items-center mb-12">
        <Text className="text-8xl mb-8">{item.emoji}</Text>
        <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">{item.title}</Text>
        <Text className="text-lg text-gray-600 text-center leading-relaxed">
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeView>
      <View className="flex-1 bg-white">
        {/* Skip Button */}
        {currentIndex < onboardingSlides.length - 1 && (
          <View className="absolute top-4 right-4 z-10">
            <Pressable onPress={handleSkip}>
              <Text className="text-blue-600 font-semibold text-base">Skip</Text>
            </Pressable>
          </View>
        )}

        {/* Slides */}
        <View className="flex-1">
          <FlatList
            ref={flatListRef}
            data={onboardingSlides}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            bounces={false}
          />
        </View>

        {/* Pagination Dots */}
        <View className="flex-row justify-center items-center mb-8">
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                index === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </View>

        {/* Bottom Actions */}
        <View className="px-8 pb-8">
          <Button variant="primary" size="lg" fullWidth onPress={handleNext}>
            {currentIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
          </Button>

          {currentIndex === onboardingSlides.length - 1 && (
            <View className="mt-4 flex-row justify-center items-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <Pressable onPress={() => router.replace('/(auth)/login')}>
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeView>
  );
}
