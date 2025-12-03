/**
 * Hairstyle service
 * Provides AI-powered hairstyle recommendations based on face analysis
 *
 * Note: In production, this would integrate with an AI service like
 * Google Cloud Vision, AWS Rekognition, or a custom ML model for face analysis.
 * Currently uses mock data for demonstration.
 */

import {
  FaceShape,
  HairLength,
  HairType,
  IAnalyzeFaceRequest,
  IAnalyzeFaceResponse,
  IFaceAnalysis,
  IGetStylesRequest,
  IGetStylesResponse,
  IHairstyle,
  IHairstyleRecommendation,
  ISavedStyle,
  ISavedStylesResponse,
  StyleCategory,
} from '../types';

// Mock hairstyle database
const MOCK_HAIRSTYLES: IHairstyle[] = [
  {
    id: '1',
    name: 'Classic Taper',
    description:
      'A timeless cut with gradual tapering on the sides and back. Versatile and professional.',
    imageUrl: 'https://example.com/styles/classic-taper.jpg',
    thumbnailUrl: 'https://example.com/styles/classic-taper-thumb.jpg',
    category: StyleCategory.CLASSIC,
    suitableFaceShapes: [FaceShape.OVAL, FaceShape.SQUARE, FaceShape.OBLONG],
    suitableHairTypes: [HairType.STRAIGHT, HairType.WAVY],
    recommendedLength: HairLength.SHORT,
    maintenanceLevel: 'low',
    stylingTime: '5 min',
    popularityScore: 95,
    tags: ['professional', 'clean', 'versatile'],
  },
  {
    id: '2',
    name: 'Modern Pompadour',
    description: 'Volume on top swept back with tight faded sides. A bold, modern look.',
    imageUrl: 'https://example.com/styles/pompadour.jpg',
    thumbnailUrl: 'https://example.com/styles/pompadour-thumb.jpg',
    category: StyleCategory.MODERN,
    suitableFaceShapes: [FaceShape.ROUND, FaceShape.OVAL, FaceShape.HEART],
    suitableHairTypes: [HairType.STRAIGHT, HairType.WAVY],
    recommendedLength: HairLength.MEDIUM,
    maintenanceLevel: 'high',
    stylingTime: '10-15 min',
    popularityScore: 88,
    tags: ['bold', 'statement', 'volume'],
  },
  {
    id: '3',
    name: 'Textured Crop',
    description: 'Short, choppy layers with a natural, effortless look. Great for adding texture.',
    imageUrl: 'https://example.com/styles/textured-crop.jpg',
    thumbnailUrl: 'https://example.com/styles/textured-crop-thumb.jpg',
    category: StyleCategory.TRENDY,
    suitableFaceShapes: [FaceShape.OVAL, FaceShape.SQUARE, FaceShape.DIAMOND],
    suitableHairTypes: [HairType.STRAIGHT, HairType.WAVY, HairType.CURLY],
    recommendedLength: HairLength.SHORT,
    maintenanceLevel: 'low',
    stylingTime: '3-5 min',
    popularityScore: 92,
    tags: ['casual', 'effortless', 'textured'],
  },
  {
    id: '4',
    name: 'Slick Back Undercut',
    description: 'Disconnected undercut with longer hair slicked back. Sharp and sophisticated.',
    imageUrl: 'https://example.com/styles/slick-back.jpg',
    thumbnailUrl: 'https://example.com/styles/slick-back-thumb.jpg',
    category: StyleCategory.MODERN,
    suitableFaceShapes: [FaceShape.OVAL, FaceShape.SQUARE, FaceShape.HEART],
    suitableHairTypes: [HairType.STRAIGHT],
    recommendedLength: HairLength.MEDIUM,
    maintenanceLevel: 'medium',
    stylingTime: '10 min',
    popularityScore: 85,
    tags: ['sleek', 'sophisticated', 'sharp'],
  },
  {
    id: '5',
    name: 'French Crop',
    description: 'Short fringe with textured top and faded sides. Low maintenance and stylish.',
    imageUrl: 'https://example.com/styles/french-crop.jpg',
    thumbnailUrl: 'https://example.com/styles/french-crop-thumb.jpg',
    category: StyleCategory.TRENDY,
    suitableFaceShapes: [FaceShape.OBLONG, FaceShape.DIAMOND, FaceShape.HEART],
    suitableHairTypes: [HairType.STRAIGHT, HairType.WAVY],
    recommendedLength: HairLength.SHORT,
    maintenanceLevel: 'low',
    stylingTime: '3 min',
    popularityScore: 90,
    tags: ['fringe', 'european', 'trendy'],
  },
  {
    id: '6',
    name: 'Buzz Cut',
    description: 'Ultra-short all over for a clean, minimal look. Zero maintenance required.',
    imageUrl: 'https://example.com/styles/buzz-cut.jpg',
    thumbnailUrl: 'https://example.com/styles/buzz-cut-thumb.jpg',
    category: StyleCategory.CLASSIC,
    suitableFaceShapes: [FaceShape.OVAL, FaceShape.SQUARE],
    suitableHairTypes: [HairType.STRAIGHT, HairType.WAVY, HairType.CURLY, HairType.COILY],
    recommendedLength: HairLength.SHORT,
    maintenanceLevel: 'low',
    stylingTime: '0 min',
    popularityScore: 75,
    tags: ['minimal', 'clean', 'easy'],
  },
  {
    id: '7',
    name: 'Curly Fringe',
    description:
      'Embraces natural curls with a defined fringe. Perfect for curly-haired individuals.',
    imageUrl: 'https://example.com/styles/curly-fringe.jpg',
    thumbnailUrl: 'https://example.com/styles/curly-fringe-thumb.jpg',
    category: StyleCategory.CASUAL,
    suitableFaceShapes: [FaceShape.OVAL, FaceShape.OBLONG, FaceShape.SQUARE],
    suitableHairTypes: [HairType.CURLY, HairType.COILY],
    recommendedLength: HairLength.MEDIUM,
    maintenanceLevel: 'medium',
    stylingTime: '5-10 min',
    popularityScore: 82,
    tags: ['curly', 'natural', 'fringe'],
  },
  {
    id: '8',
    name: 'Side Part Executive',
    description: 'Classic side part with clean lines. Perfect for professional settings.',
    imageUrl: 'https://example.com/styles/side-part.jpg',
    thumbnailUrl: 'https://example.com/styles/side-part-thumb.jpg',
    category: StyleCategory.PROFESSIONAL,
    suitableFaceShapes: [FaceShape.OVAL, FaceShape.ROUND, FaceShape.HEART, FaceShape.DIAMOND],
    suitableHairTypes: [HairType.STRAIGHT, HairType.WAVY],
    recommendedLength: HairLength.SHORT,
    maintenanceLevel: 'medium',
    stylingTime: '5 min',
    popularityScore: 87,
    tags: ['professional', 'classic', 'refined'],
  },
  {
    id: '9',
    name: 'Messy Quiff',
    description: 'Relaxed version of the quiff with a natural, tousled finish.',
    imageUrl: 'https://example.com/styles/messy-quiff.jpg',
    thumbnailUrl: 'https://example.com/styles/messy-quiff-thumb.jpg',
    category: StyleCategory.CASUAL,
    suitableFaceShapes: [FaceShape.ROUND, FaceShape.OVAL, FaceShape.SQUARE],
    suitableHairTypes: [HairType.WAVY, HairType.STRAIGHT],
    recommendedLength: HairLength.MEDIUM,
    maintenanceLevel: 'medium',
    stylingTime: '5-10 min',
    popularityScore: 89,
    tags: ['casual', 'messy', 'relaxed'],
  },
  {
    id: '10',
    name: 'Mohawk Fade',
    description: 'Bold mohawk with skin fade on the sides. Statement style for the adventurous.',
    imageUrl: 'https://example.com/styles/mohawk-fade.jpg',
    thumbnailUrl: 'https://example.com/styles/mohawk-fade-thumb.jpg',
    category: StyleCategory.BOLD,
    suitableFaceShapes: [FaceShape.OVAL, FaceShape.SQUARE, FaceShape.DIAMOND],
    suitableHairTypes: [HairType.STRAIGHT, HairType.WAVY, HairType.CURLY],
    recommendedLength: HairLength.SHORT,
    maintenanceLevel: 'high',
    stylingTime: '10 min',
    popularityScore: 70,
    tags: ['bold', 'edgy', 'statement'],
  },
];

// Simulate AI face analysis
function simulateFaceAnalysis(_imageBase64: string): IFaceAnalysis {
  // In production, this would call an AI service
  // For now, return mock analysis with random face shape
  const faceShapes = Object.values(FaceShape);
  const randomShape = faceShapes[Math.floor(Math.random() * faceShapes.length)];

  return {
    faceShape: randomShape,
    confidence: 0.75 + Math.random() * 0.2, // 75-95%
    faceWidth: 140 + Math.random() * 30,
    faceLength: 180 + Math.random() * 40,
    jawWidth: 120 + Math.random() * 25,
    foreheadWidth: 130 + Math.random() * 25,
    cheekboneWidth: 135 + Math.random() * 20,
    features: {
      strongJaw: Math.random() > 0.5,
      highCheekbones: Math.random() > 0.5,
      wideForehand: Math.random() > 0.5,
      narrowChin: Math.random() > 0.5,
    },
  };
}

// Generate recommendations based on face analysis
function generateRecommendations(
  analysis: IFaceAnalysis,
  hairType?: HairType,
  preferences?: IAnalyzeFaceRequest['preferences']
): IHairstyleRecommendation[] {
  let filteredStyles = [...MOCK_HAIRSTYLES];

  // Filter by hair type if provided
  if (hairType) {
    filteredStyles = filteredStyles.filter((style) => style.suitableHairTypes.includes(hairType));
  }

  // Filter by preferences
  if (preferences?.categories?.length) {
    filteredStyles = filteredStyles.filter((style) =>
      preferences.categories!.includes(style.category)
    );
  }

  if (preferences?.maintenanceLevel) {
    filteredStyles = filteredStyles.filter(
      (style) => style.maintenanceLevel === preferences.maintenanceLevel
    );
  }

  if (preferences?.length) {
    filteredStyles = filteredStyles.filter(
      (style) => style.recommendedLength === preferences.length
    );
  }

  // Score each style based on face shape compatibility
  const recommendations: IHairstyleRecommendation[] = filteredStyles.map((style) => {
    let matchScore = 50; // Base score
    const reasons: string[] = [];
    const considerations: string[] = [];

    // Face shape match
    if (style.suitableFaceShapes.includes(analysis.faceShape)) {
      matchScore += 35;
      reasons.push(`Great match for ${analysis.faceShape} face shape`);
    } else {
      considerations.push(`May require adaptation for ${analysis.faceShape} face shape`);
    }

    // Feature-based adjustments
    if (analysis.features.strongJaw) {
      if (['Textured Crop', 'Messy Quiff'].includes(style.name)) {
        matchScore += 5;
        reasons.push('Complements strong jawline');
      }
    }

    if (analysis.features.highCheekbones) {
      if (style.category === StyleCategory.MODERN) {
        matchScore += 5;
        reasons.push('Highlights your cheekbones');
      }
    }

    // Popularity bonus
    matchScore += Math.floor(style.popularityScore / 20);

    // Add default reason if none
    if (reasons.length === 0) {
      reasons.push(`Popular style with ${style.maintenanceLevel} maintenance`);
    }

    return {
      hairstyle: style,
      matchScore: Math.min(matchScore, 100),
      reasons,
      considerations: considerations.length > 0 ? considerations : undefined,
    };
  });

  // Sort by match score descending
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  // Return top 6 recommendations
  return recommendations.slice(0, 6);
}

// In-memory saved styles (mock)
let savedStyles: ISavedStyle[] = [];

export const hairstyleService = {
  /**
   * Analyze face from image and get hairstyle recommendations
   */
  analyzeFace: async (request: IAnalyzeFaceRequest): Promise<IAnalyzeFaceResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const faceAnalysis = simulateFaceAnalysis(request.imageBase64);
    const recommendations = generateRecommendations(
      faceAnalysis,
      request.hairType,
      request.preferences
    );

    return {
      sessionId: `session_${Date.now()}`,
      faceAnalysis,
      recommendations,
    };
  },

  /**
   * Get all hairstyles with optional filters
   */
  getStyles: async (params?: IGetStylesRequest): Promise<IGetStylesResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filtered = [...MOCK_HAIRSTYLES];

    if (params?.faceShape) {
      filtered = filtered.filter((s) => s.suitableFaceShapes.includes(params.faceShape!));
    }

    if (params?.hairType) {
      filtered = filtered.filter((s) => s.suitableHairTypes.includes(params.hairType!));
    }

    if (params?.category) {
      filtered = filtered.filter((s) => s.category === params.category);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      styles: paged,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
    };
  },

  /**
   * Get single style details
   */
  getStyle: async (styleId: string): Promise<IHairstyle | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_HAIRSTYLES.find((s) => s.id === styleId) || null;
  },

  /**
   * Save a style to favorites
   */
  saveStyle: async (styleId: string, userId: string, note?: string): Promise<ISavedStyle> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const hairstyle = MOCK_HAIRSTYLES.find((s) => s.id === styleId);
    if (!hairstyle) {
      throw new Error('Style not found');
    }

    const savedStyle: ISavedStyle = {
      id: `saved_${Date.now()}`,
      userId,
      hairstyleId: styleId,
      hairstyle,
      note,
      savedAt: new Date().toISOString(),
    };

    savedStyles.push(savedStyle);
    return savedStyle;
  },

  /**
   * Get saved styles for user
   */
  getSavedStyles: async (userId: string): Promise<ISavedStylesResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const userSaved = savedStyles.filter((s) => s.userId === userId);
    return {
      savedStyles: userSaved,
      total: userSaved.length,
    };
  },

  /**
   * Remove saved style
   */
  removeSavedStyle: async (savedStyleId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    savedStyles = savedStyles.filter((s) => s.id !== savedStyleId);
  },

  /**
   * Get popular styles
   */
  getPopularStyles: async (limit: number = 5): Promise<IHairstyle[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...MOCK_HAIRSTYLES]
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
  },
};

export default hairstyleService;
