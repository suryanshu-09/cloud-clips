import { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBarberPortfolio } from '@/features/barbers/hooks/useBarberProfile';
import { barberService } from '@/features/barbers/services/barberService';
import { Card, Button } from '@/components/ui';
import {
  mediaService,
  pickImageFromCamera,
  pickImageFromGallery,
  pickMultipleImages,
  showImagePickerOptions,
  IUploadProgress,
} from '@/services/media';
import type { IGalleryItem } from '@/features/barbers/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = (SCREEN_WIDTH - 48 - 16) / 3; // 3 columns with gaps

const GALLERY_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'after', label: 'Finished Cuts' },
  { id: 'before_after', label: 'Before & After' },
  { id: 'space', label: 'Workspace' },
];

// Mock gallery data for demo
const MOCK_GALLERY: IGalleryItem[] = [
  { url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400', type: 'after' },
  { url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400', type: 'after' },
  { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400', type: 'space' },
  { url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400', type: 'space' },
  { url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400', type: 'after' },
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400', type: 'after' },
];

interface IImageViewerProps {
  visible: boolean;
  image: IGalleryItem | null;
  onClose: () => void;
  onDelete: () => void;
}

function ImageViewer({ visible, image, onClose, onDelete }: IImageViewerProps) {
  if (!image) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <View className="absolute top-12 left-0 right-0 z-10 flex-row justify-between px-4">
          <Pressable
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Text className="text-white text-xl">X</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    onDelete();
                    onClose();
                  },
                },
              ]);
            }}
            className="w-10 h-10 rounded-full bg-red-500/80 items-center justify-center"
          >
            <Text className="text-white text-sm">Del</Text>
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          <Image
            source={{ uri: image.url }}
            style={{ width: '100%', height: 384 }}
            contentFit="contain"
            transition={150}
            cachePolicy="memory-disk"
            recyclingKey={image.url}
          />
        </View>
        <View className="absolute bottom-12 left-0 right-0 items-center">
          <View className="bg-black/50 px-4 py-2 rounded-full">
            <Text className="text-white capitalize">{image.type}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function GalleryScreen() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState<IGalleryItem | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [localGallery, setLocalGallery] = useState<IGalleryItem[]>(MOCK_GALLERY);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  // Fetch portfolio data
  const { data: portfolioData, isLoading } = useBarberPortfolio(currentUser?.id || '');

  // Use fetched data if available, otherwise use local state
  const galleryItems = portfolioData?.gallery || localGallery;

  // Filter gallery by category
  const filteredGallery =
    selectedCategory === 'all'
      ? galleryItems
      : galleryItems.filter((item: IGalleryItem) => item.type === selectedCategory);

  // Handle upload progress
  const handleUploadProgress = useCallback((progress: IUploadProgress) => {
    setUploadProgress(progress.progress);
  }, []);

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ uri, imageType }: { uri: string; imageType: string }) => {
      return mediaService.uploadGalleryImage(uri, imageType, {
        onProgress: handleUploadProgress,
      });
    },
    onSuccess: (data) => {
      // Add new image to local gallery
      const newImage: IGalleryItem = {
        url: data.url,
        type: data.type as IGalleryItem['type'],
      };
      setLocalGallery((prev) => [newImage, ...prev]);

      // Invalidate portfolio query
      queryClient.invalidateQueries({ queryKey: ['barber', currentUser?.id, 'portfolio'] });

      setUploadProgress(0);
      Alert.alert('Success', 'Image uploaded successfully!');
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      Alert.alert('Error', error.message || 'Failed to upload image');
    },
  });

  // Batch upload mutation
  const batchUploadMutation = useMutation({
    mutationFn: async (uris: string[]) => {
      return mediaService.uploadGalleryBatch(uris, {
        onProgress: handleUploadProgress,
      });
    },
    onSuccess: (data) => {
      // Add new images to local gallery
      const newImages: IGalleryItem[] = data.uploaded.map((item) => ({
        url: item.url,
        type: 'after' as const,
      }));
      setLocalGallery((prev) => [...newImages, ...prev]);

      // Invalidate portfolio query
      queryClient.invalidateQueries({ queryKey: ['barber', currentUser?.id, 'portfolio'] });

      setUploadProgress(0);

      if (data.failed.length > 0) {
        Alert.alert(
          'Partial Upload',
          `${data.uploaded.length} images uploaded. ${data.failed.length} failed.`
        );
      } else {
        Alert.alert('Success', `${data.uploaded.length} images uploaded successfully!`);
      }
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      Alert.alert('Error', error.message || 'Failed to upload images');
    },
  });

  // Handle camera press
  const handleCameraPress = async () => {
    try {
      const image = await pickImageFromCamera({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.9,
      });
      if (image) {
        setPendingImageUri(image.uri);
        setShowTypeSelector(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to access camera');
    }
  };

  // Handle gallery press
  const handleGalleryPress = async () => {
    try {
      const image = await pickImageFromGallery({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.9,
      });
      if (image) {
        setPendingImageUri(image.uri);
        setShowTypeSelector(true);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to access photo library');
    }
  };

  // Handle multiple images
  const handleMultipleImagesPress = async () => {
    try {
      const images = await pickMultipleImages({
        quality: 0.9,
        selectionLimit: 10,
      });
      if (images.length > 0) {
        const uris = images.map((img) => img.uri);
        batchUploadMutation.mutate(uris);
      }
    } catch (error) {
      console.error('Multiple images error:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  // Handle type selection and upload
  const handleTypeSelect = (imageType: string) => {
    setShowTypeSelector(false);
    if (pendingImageUri) {
      uploadMutation.mutate({ uri: pendingImageUri, imageType });
      setPendingImageUri(null);
    }
  };

  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Choose how to add photos', [
      {
        text: 'Camera',
        onPress: handleCameraPress,
      },
      {
        text: 'Single Photo',
        onPress: handleGalleryPress,
      },
      {
        text: 'Multiple Photos',
        onPress: handleMultipleImagesPress,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteImage = () => {
    if (selectedImage) {
      // Delete from server
      mediaService.deleteImage(selectedImage.url).catch((error) => {
        console.error('Failed to delete from server:', error);
      });

      // Remove from local state
      setLocalGallery((prev) => prev.filter((img) => img.url !== selectedImage.url));
      Alert.alert('Deleted', 'Image has been removed from your portfolio');
    }
  };

  const handleImagePress = (image: IGalleryItem) => {
    setSelectedImage(image);
    setShowViewer(true);
  };

  const isUploadingAny = uploadMutation.isPending || batchUploadMutation.isPending;

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Portfolio Gallery</Text>
            <Text className="text-gray-600">Showcase your best work to attract clients</Text>
          </View>
          <Button variant="primary" size="sm" onPress={handleAddPhoto} disabled={isUploadingAny}>
            {isUploadingAny ? 'Uploading...' : '+ Add'}
          </Button>
        </View>

        {/* Upload Progress */}
        {isUploadingAny && uploadProgress > 0 && (
          <View className="mt-4">
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Uploading... {Math.round(uploadProgress)}%
            </Text>
          </View>
        )}
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-200"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {GALLERY_CATEGORIES.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedCategory === category.id ? 'bg-blue-500' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedCategory === category.id ? 'text-white' : 'text-gray-700'
              }`}
            >
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1">
        <View className="p-6">
          {filteredGallery.length === 0 ? (
            <Card className="p-8 items-center">
              <Text className="text-5xl mb-4">{'📷'}</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">No Photos Yet</Text>
              <Text className="text-gray-500 text-center mb-4">
                {selectedCategory === 'all'
                  ? 'Start building your portfolio by adding photos of your work'
                  : `No photos in the "${GALLERY_CATEGORIES.find((c) => c.id === selectedCategory)?.label}" category`}
              </Text>
              {selectedCategory === 'all' && (
                <Button onPress={handleAddPhoto}>Add Your First Photo</Button>
              )}
            </Card>
          ) : (
            <>
              {/* Stats */}
              <View className="flex-row mb-4">
                <View className="flex-1 bg-white rounded-lg p-3 mr-2">
                  <Text className="text-2xl font-bold text-gray-900">{galleryItems.length}</Text>
                  <Text className="text-sm text-gray-500">Total Photos</Text>
                </View>
                <View className="flex-1 bg-white rounded-lg p-3 ml-2">
                  <Text className="text-2xl font-bold text-gray-900">{filteredGallery.length}</Text>
                  <Text className="text-sm text-gray-500">Showing</Text>
                </View>
              </View>

              {/* Gallery Grid */}
              <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
                {filteredGallery.map((item: IGalleryItem, index: number) => (
                  <Pressable
                    key={`${item.url}-${index}`}
                    onPress={() => handleImagePress(item)}
                    style={{
                      width: IMAGE_SIZE,
                      height: IMAGE_SIZE,
                      margin: 4,
                    }}
                    className="rounded-lg overflow-hidden"
                  >
                    <Image
                      source={{ uri: item.url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={150}
                      cachePolicy="memory-disk"
                      recyclingKey={item.url}
                    />
                    <View className="absolute bottom-1 right-1 bg-black/60 px-2 py-1 rounded">
                      <Text className="text-white text-xs capitalize">{item.type}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Tips Card */}
              <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
                <Text className="text-base font-semibold text-blue-900 mb-2">Portfolio Tips</Text>
                <View className="space-y-2">
                  <Text className="text-sm text-blue-800">- Use high-quality, well-lit photos</Text>
                  <Text className="text-sm text-blue-800">- Show variety in your work styles</Text>
                  <Text className="text-sm text-blue-800">- Include before & after shots</Text>
                  <Text className="text-sm text-blue-800">
                    - Keep your portfolio updated regularly
                  </Text>
                </View>
              </Card>
            </>
          )}
        </View>
      </ScrollView>

      {/* Image Viewer Modal */}
      <ImageViewer
        visible={showViewer}
        image={selectedImage}
        onClose={() => {
          setShowViewer(false);
          setSelectedImage(null);
        }}
        onDelete={handleDeleteImage}
      />

      {/* Image Type Selector Modal */}
      <Modal
        visible={showTypeSelector}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowTypeSelector(false);
          setPendingImageUri(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Select Image Type</Text>
            <Text className="text-gray-600 mb-6">
              Choose a category for this image to help organize your portfolio
            </Text>

            <View className="space-y-3">
              <Pressable
                onPress={() => handleTypeSelect('after')}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <Text className="text-lg font-semibold text-blue-900">Finished Cuts</Text>
                <Text className="text-sm text-blue-700">Show off your completed haircuts</Text>
              </Pressable>

              <Pressable
                onPress={() => handleTypeSelect('before_after')}
                className="bg-purple-50 border border-purple-200 rounded-xl p-4"
              >
                <Text className="text-lg font-semibold text-purple-900">Before & After</Text>
                <Text className="text-sm text-purple-700">Transformation photos</Text>
              </Pressable>

              <Pressable
                onPress={() => handleTypeSelect('space')}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <Text className="text-lg font-semibold text-green-900">Workspace</Text>
                <Text className="text-sm text-green-700">Your shop or setup</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                setShowTypeSelector(false);
                setPendingImageUri(null);
              }}
              className="mt-6 py-4"
            >
              <Text className="text-center text-gray-500 font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
