/**
 * AR Try-On Component
 * Virtual hair overlay on camera view
 *
 * NOTE: Full AR implementation requires native modules:
 * - iOS: ARKit via react-native-arkit or ViroReact
 * - Android: ARCore via react-native-arcore or ViroReact
 *
 * This component provides:
 * - A placeholder/preview implementation using camera + image overlay
 * - The architecture for full AR integration
 * - Style selection and preview saving functionality
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { IHairstyle } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IARTryOnProps {
  styles: IHairstyle[];
  onSavePreview?: (imageUri: string, style: IHairstyle) => void;
  onClose?: () => void;
}

// Simulated hair overlay positions based on style
const HAIR_OVERLAY_STYLES: Record<string, object> = {
  'Classic Taper': {
    top: '10%',
    width: '70%',
    height: '30%',
    opacity: 0.8,
  },
  'Modern Pompadour': {
    top: '5%',
    width: '75%',
    height: '35%',
    opacity: 0.85,
  },
  'Textured Crop': {
    top: '8%',
    width: '68%',
    height: '28%',
    opacity: 0.8,
  },
  'Buzz Cut': {
    top: '12%',
    width: '65%',
    height: '25%',
    opacity: 0.75,
  },
  'French Crop': {
    top: '6%',
    width: '72%',
    height: '32%',
    opacity: 0.8,
  },
};

export function ARTryOn({ styles, onSavePreview, onClose }: IARTryOnProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<IHairstyle | null>(
    styles.length > 0 ? styles[0] : null
  );
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Request camera and media library permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
    })();
  }, []);

  // Capture preview image
  const capturePreview = useCallback(async () => {
    if (!cameraRef.current || !selectedStyle) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setPreviewImage(photo.uri);
      }
    } catch (error) {
      console.error('Failed to capture:', error);
      Alert.alert('Error', 'Failed to capture preview');
    } finally {
      setIsCapturing(false);
    }
  }, [selectedStyle]);

  // Save preview to gallery
  const saveToGallery = useCallback(async () => {
    if (!previewImage) return;

    try {
      await MediaLibrary.saveToLibraryAsync(previewImage);
      Alert.alert('Saved!', 'Preview saved to your gallery');

      if (selectedStyle && onSavePreview) {
        onSavePreview(previewImage, selectedStyle);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save to gallery');
    }
  }, [previewImage, selectedStyle, onSavePreview]);

  // Discard preview
  const discardPreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setCameraType((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  // Get overlay style for selected hairstyle
  const getOverlayStyle = useCallback(() => {
    if (!selectedStyle) return {};
    return HAIR_OVERLAY_STYLES[selectedStyle.name] || HAIR_OVERLAY_STYLES['Classic Taper'];
  }, [selectedStyle]);

  // Permission states
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Requesting camera access...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>📷</Text>
        <Text style={styles.errorTitle}>Camera Access Required</Text>
        <Text style={styles.errorText}>
          Please enable camera access in settings to use AR Try-On
        </Text>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  // Preview mode
  if (previewImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: previewImage }} style={styles.previewImage} contentFit="cover" />

        {/* Overlay indicator */}
        {selectedStyle && (
          <View style={styles.previewOverlay}>
            <Text style={styles.previewStyleName}>{selectedStyle.name}</Text>
          </View>
        )}

        {/* Preview actions */}
        <View style={styles.previewActions}>
          <Pressable style={styles.actionButton} onPress={discardPreview}>
            <Text style={styles.actionButtonText}>Retake</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.saveButton]} onPress={saveToGallery}>
            <Text style={[styles.actionButtonText, styles.saveButtonText]}>Save</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView ref={cameraRef} style={styles.camera} facing={cameraType}>
        {/* AR Overlay Placeholder */}
        {selectedStyle && (
          <View style={styles.arOverlayContainer}>
            {/* Face guide */}
            <View style={styles.faceGuide}>
              <View style={styles.faceGuideOval} />
              <Text style={styles.faceGuideText}>Position face here</Text>
            </View>

            {/* Hair overlay indicator */}
            <View style={[styles.hairOverlay, getOverlayStyle() as any]}>
              <Text style={styles.hairOverlayText}>{selectedStyle.name}</Text>
            </View>
          </View>
        )}

        {/* Top controls */}
        <View style={styles.topControls}>
          <Pressable style={styles.controlButton} onPress={onClose}>
            <Text style={styles.controlButtonText}>✕</Text>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={toggleCamera}>
            <Text style={styles.controlButtonText}>🔄</Text>
          </Pressable>
        </View>

        {/* Beta badge */}
        <View style={styles.betaBadge}>
          <Text style={styles.betaText}>AR PREVIEW</Text>
        </View>
      </CameraView>

      {/* Style selector */}
      <View style={styles.styleSelector}>
        <Text style={styles.styleSelectorTitle}>Select a Style</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.styleList}
        >
          {styles.map((style) => (
            <Pressable
              key={style.id}
              style={[styles.styleItem, selectedStyle?.id === style.id && styles.styleItemSelected]}
              onPress={() => setSelectedStyle(style)}
            >
              <View style={styles.styleImagePlaceholder}>
                <Text style={styles.styleEmoji}>💇</Text>
              </View>
              <Text
                style={[
                  styles.styleItemName,
                  selectedStyle?.id === style.id && styles.styleItemNameSelected,
                ]}
                numberOfLines={2}
              >
                {style.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Capture button */}
      <View style={styles.captureContainer}>
        <Pressable
          style={styles.captureButton}
          onPress={capturePreview}
          disabled={isCapturing || !selectedStyle}
        >
          {isCapturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </Pressable>
        <Text style={styles.captureHint}>Tap to capture preview</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  closeButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  arOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  faceGuide: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
  },
  faceGuideOval: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.75,
    borderRadius: SCREEN_WIDTH * 0.3,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
  },
  faceGuideText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 8,
  },
  hairOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  hairOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  betaBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  betaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  styleSelector: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingVertical: 16,
  },
  styleSelectorTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  styleList: {
    paddingHorizontal: 12,
  },
  styleItem: {
    width: 80,
    marginHorizontal: 4,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  styleItemSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
  },
  styleImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  styleEmoji: {
    fontSize: 24,
  },
  styleItemName: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  styleItemNameSelected: {
    fontWeight: 'bold',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  captureHint: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
  previewImage: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  previewOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  previewStyleName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#fff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  saveButtonText: {
    color: '#fff',
  },
});

export default ARTryOn;
