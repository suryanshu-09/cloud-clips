import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/convex/_generated/api';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = (SCREEN_WIDTH - 48 - 16) / 3;

interface IPortfolioItem {
  storageId: string;
  url: string | null;
}

interface IImageViewerProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onDelete: () => void;
}

function ImageViewer({ visible, imageUrl, onClose, onDelete }: IImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <View className="absolute top-12 left-0 right-0 z-10 flex-row justify-between px-4">
          <Pressable
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Ionicons name="close" size={22} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert('Delete Image', 'Remove this image from your portfolio?', [
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
            <Ionicons name="trash-outline" size={18} color="#ffffff" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          <Image source={{ uri: imageUrl }} className="w-full h-96" resizeMode="contain" />
        </View>
      </View>
    </Modal>
  );
}

export default function GalleryScreen() {
  const portfolioItems = useQuery(api.barbers.queries.getBarberPortfolioImages) as
    | IPortfolioItem[]
    | undefined;

  const generateUploadUrl = useMutation(api.barbers.mutations.generatePortfolioUploadUrl);
  const addImage = useMutation(api.barbers.mutations.addPortfolioImage);
  const removeImage = useMutation(api.barbers.mutations.removePortfolioImage);

  const [selectedItem, setSelectedItem] = useState<IPortfolioItem | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const items = portfolioItems ?? [];

  const pickAndUpload = async (useCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Camera access is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 5],
          quality: 0.85,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Photo library access is needed to select images.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 5],
          quality: 0.85,
          allowsMultipleSelection: false,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      await uploadImage(asset.uri, asset.mimeType || 'image/jpeg');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick image.');
    }
  };

  const uploadImage = async (uri: string, mimeType: string) => {
    try {
      setIsUploading(true);
      setUploadProgress(10);

      const uploadUrl = await generateUploadUrl();
      setUploadProgress(30);

      const fetchResponse = await fetch(uri);
      const blob = await fetchResponse.blob();
      setUploadProgress(50);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      setUploadProgress(80);
      const { storageId } = (await uploadResponse.json()) as { storageId: string };

      await addImage({ imageUrl: storageId });
      setUploadProgress(100);

      Alert.alert('Uploaded', 'Photo added to your portfolio!');
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Choose source', [
      { text: 'Camera', onPress: () => pickAndUpload(true) },
      { text: 'Photo Library', onPress: () => pickAndUpload(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteImage = async (storageId: string) => {
    try {
      await removeImage({ imageUrl: storageId });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove image.');
    }
  };

  if (portfolioItems === undefined) {
    return (
      <SafeView>
        <Header title="Portfolio Gallery" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView>
      <Header title="Portfolio Gallery" showBack />

      <ScrollView className="flex-1 bg-gray-50">
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-gray-600 text-sm">
                Showcase your best work. Clients see these photos on your profile.
              </Text>
            </View>
            <Button
              variant="primary"
              size="sm"
              onPress={handleAddPhoto}
              disabled={isUploading}
              loading={isUploading}
            >
              + Add
            </Button>
          </View>

          {isUploading && uploadProgress > 0 && (
            <View className="mt-3">
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </View>
              <Text className="text-xs text-gray-500 text-center mt-1">
                Uploading... {Math.round(uploadProgress)}%
              </Text>
            </View>
          )}
        </View>

        <View className="p-4">
          {items.length === 0 ? (
            <Card variant="outlined" padding="lg">
              <View className="items-center py-10">
                <Ionicons name="images-outline" size={48} color="#d1d5db" />
                <Text className="text-lg font-bold text-gray-900 mt-4 mb-2">No Photos Yet</Text>
                <Text className="text-gray-500 text-center mb-6 px-4">
                  Add photos of your haircuts and workspace to attract more clients.
                </Text>
                <Button onPress={handleAddPhoto} disabled={isUploading}>
                  Add Your First Photo
                </Button>
              </View>
            </Card>
          ) : (
            <>
              <View className="flex-row mb-4 gap-3">
                <View className="flex-1 bg-white rounded-xl p-3 border border-gray-100">
                  <Text className="text-2xl font-bold text-gray-900">{items.length}</Text>
                  <Text className="text-xs text-gray-500">Portfolio Photos</Text>
                </View>
                <View className="flex-1 bg-indigo-50 rounded-xl p-3 border border-indigo-100 justify-center">
                  <Ionicons name="eye-outline" size={20} color="#6366f1" />
                  <Text className="text-xs text-indigo-600 mt-1 font-medium">
                    Visible to clients
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
                {items.map((item, index) => (
                  <Pressable
                    key={`${item.storageId}-${index}`}
                    onPress={() => {
                      setSelectedItem(item);
                      setShowViewer(true);
                    }}
                    style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, margin: 4 }}
                    className="rounded-xl overflow-hidden bg-gray-100"
                  >
                    {item.url ? (
                      <Image
                        source={{ uri: item.url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Ionicons name="image-outline" size={24} color="#9ca3af" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>

              <View className="bg-indigo-50 rounded-xl p-4 mt-4 flex-row">
                <Ionicons name="bulb-outline" size={20} color="#6366f1" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-indigo-900 mb-1">Portfolio Tips</Text>
                  <Text className="text-xs text-indigo-700 leading-4">
                    Use well-lit photos, show variety in styles, and include before &amp; after
                    shots for best results.
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <ImageViewer
        visible={showViewer}
        imageUrl={selectedItem?.url ?? null}
        onClose={() => {
          setShowViewer(false);
          setSelectedItem(null);
        }}
        onDelete={() => {
          if (selectedItem) {
            handleDeleteImage(selectedItem.storageId);
          }
        }}
      />
    </SafeView>
  );
}
