/**
 * useHairstyles hook
 * React Query hooks for AI hairstyle recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

import { hairstyleService } from '../services/hairstyleService';
import {
  FaceShape,
  HairLength,
  HairType,
  IAnalyzeFaceRequest,
  IFaceAnalysis,
  IGetStylesRequest,
  IHairstyle,
  IHairstyleRecommendation,
  StyleCategory,
} from '../types';

// Query keys
export const HAIRSTYLE_QUERY_KEYS = {
  all: ['hairstyles'] as const,
  styles: (params?: IGetStylesRequest) => [...HAIRSTYLE_QUERY_KEYS.all, 'list', params] as const,
  style: (id: string) => [...HAIRSTYLE_QUERY_KEYS.all, 'detail', id] as const,
  popular: () => [...HAIRSTYLE_QUERY_KEYS.all, 'popular'] as const,
  saved: (userId: string) => [...HAIRSTYLE_QUERY_KEYS.all, 'saved', userId] as const,
  analysis: (sessionId: string) => [...HAIRSTYLE_QUERY_KEYS.all, 'analysis', sessionId] as const,
};

/**
 * Hook to get hairstyles with filters
 */
export function useHairstyles(params?: IGetStylesRequest) {
  return useQuery({
    queryKey: HAIRSTYLE_QUERY_KEYS.styles(params),
    queryFn: () => hairstyleService.getStyles(params),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to get single style details
 */
export function useHairstyle(styleId: string) {
  return useQuery({
    queryKey: HAIRSTYLE_QUERY_KEYS.style(styleId),
    queryFn: () => hairstyleService.getStyle(styleId),
    enabled: !!styleId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to get popular styles
 */
export function usePopularStyles(limit: number = 5) {
  return useQuery({
    queryKey: HAIRSTYLE_QUERY_KEYS.popular(),
    queryFn: () => hairstyleService.getPopularStyles(limit),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to get saved styles
 */
export function useSavedStyles(userId: string) {
  return useQuery({
    queryKey: HAIRSTYLE_QUERY_KEYS.saved(userId),
    queryFn: () => hairstyleService.getSavedStyles(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to save a style
 */
export function useSaveStyle(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ styleId, note }: { styleId: string; note?: string }) =>
      hairstyleService.saveStyle(styleId, userId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HAIRSTYLE_QUERY_KEYS.saved(userId) });
    },
  });
}

/**
 * Hook to remove saved style
 */
export function useRemoveSavedStyle(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (savedStyleId: string) => hairstyleService.removeSavedStyle(savedStyleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HAIRSTYLE_QUERY_KEYS.saved(userId) });
    },
  });
}

/**
 * Main hook for AI face analysis and recommendations
 */
export function useHairstyleAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<IFaceAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<IHairstyleRecommendation[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Preferences state
  const [hairType, setHairType] = useState<HairType | undefined>();
  const [preferredCategories, setPreferredCategories] = useState<StyleCategory[]>([]);
  const [maintenanceLevel, setMaintenanceLevel] = useState<'low' | 'medium' | 'high' | undefined>();
  const [preferredLength, setPreferredLength] = useState<HairLength | undefined>();

  // Pick image from gallery
  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll access to select photos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      return result.assets[0].uri;
    }
    return null;
  }, []);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant camera access to take photos.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      return result.assets[0].uri;
    }
    return null;
  }, []);

  // Analyze the selected image
  const analyzeImage = useCallback(
    async (imageUri?: string) => {
      const uri = imageUri || selectedImage;
      if (!uri) {
        Alert.alert('No Image', 'Please select or take a photo first.');
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        // Convert image to base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const request: IAnalyzeFaceRequest = {
          imageBase64: base64,
          hairType,
          preferences: {
            categories: preferredCategories.length > 0 ? preferredCategories : undefined,
            maintenanceLevel,
            length: preferredLength,
          },
        };

        const response = await hairstyleService.analyzeFace(request);

        setFaceAnalysis(response.faceAnalysis);
        setRecommendations(response.recommendations);

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Analysis failed');
        setError(error);
        Alert.alert('Analysis Failed', error.message);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [selectedImage, hairType, preferredCategories, maintenanceLevel, preferredLength]
  );

  // Reset analysis
  const resetAnalysis = useCallback(() => {
    setSelectedImage(null);
    setFaceAnalysis(null);
    setRecommendations([]);
    setError(null);
  }, []);

  return {
    // Image selection
    selectedImage,
    pickImage,
    takePhoto,
    setSelectedImage,

    // Preferences
    hairType,
    setHairType,
    preferredCategories,
    setPreferredCategories,
    maintenanceLevel,
    setMaintenanceLevel,
    preferredLength,
    setPreferredLength,

    // Analysis
    analyzeImage,
    isAnalyzing,
    error,

    // Results
    faceAnalysis,
    recommendations,

    // Actions
    resetAnalysis,
  };
}

/**
 * Hook for browsing styles by category
 */
export function useStyleBrowser() {
  const [selectedCategory, setSelectedCategory] = useState<StyleCategory | undefined>();
  const [selectedFaceShape, setSelectedFaceShape] = useState<FaceShape | undefined>();
  const [selectedHairType, setSelectedHairType] = useState<HairType | undefined>();
  const [page, setPage] = useState(1);

  const stylesQuery = useHairstyles({
    category: selectedCategory,
    faceShape: selectedFaceShape,
    hairType: selectedHairType,
    page,
    limit: 10,
  });

  const loadMore = useCallback(() => {
    if (stylesQuery.data && page < stylesQuery.data.totalPages) {
      setPage((p) => p + 1);
    }
  }, [stylesQuery.data, page]);

  const resetFilters = useCallback(() => {
    setSelectedCategory(undefined);
    setSelectedFaceShape(undefined);
    setSelectedHairType(undefined);
    setPage(1);
  }, []);

  return {
    // Data
    styles: stylesQuery.data?.styles || [],
    total: stylesQuery.data?.total || 0,
    isLoading: stylesQuery.isLoading,
    isFetching: stylesQuery.isFetching,

    // Filters
    selectedCategory,
    setSelectedCategory,
    selectedFaceShape,
    setSelectedFaceShape,
    selectedHairType,
    setSelectedHairType,

    // Pagination
    page,
    totalPages: stylesQuery.data?.totalPages || 1,
    loadMore,
    hasMore: stylesQuery.data ? page < stylesQuery.data.totalPages : false,

    // Actions
    resetFilters,
  };
}

/**
 * Combined hook for the hairstyle discovery page
 */
export function useHairstyleDiscovery(userId: string) {
  const analysis = useHairstyleAnalysis();
  const browser = useStyleBrowser();
  const popularQuery = usePopularStyles(5);
  const savedQuery = useSavedStyles(userId);
  const saveMutation = useSaveStyle(userId);
  const removeMutation = useRemoveSavedStyle(userId);

  const isStyleSaved = useCallback(
    (styleId: string) => {
      return savedQuery.data?.savedStyles.some((s) => s.hairstyleId === styleId) || false;
    },
    [savedQuery.data]
  );

  const toggleSaveStyle = useCallback(
    async (style: IHairstyle) => {
      const saved = savedQuery.data?.savedStyles.find((s) => s.hairstyleId === style.id);
      if (saved) {
        await removeMutation.mutateAsync(saved.id);
      } else {
        await saveMutation.mutateAsync({ styleId: style.id });
      }
    },
    [savedQuery.data, saveMutation, removeMutation]
  );

  return {
    // Analysis
    ...analysis,

    // Browser
    browser,

    // Popular styles
    popularStyles: popularQuery.data || [],
    isLoadingPopular: popularQuery.isLoading,

    // Saved styles
    savedStyles: savedQuery.data?.savedStyles || [],
    savedCount: savedQuery.data?.total || 0,
    isLoadingSaved: savedQuery.isLoading,

    // Save actions
    isStyleSaved,
    toggleSaveStyle,
    isSaving: saveMutation.isPending || removeMutation.isPending,
  };
}
