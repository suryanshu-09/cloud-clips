/**
 * Hairstyles feature types
 * Types for AI hairstyle recommendations and saved styles
 */

// Face shape types detected by AI
export enum FaceShape {
  OVAL = 'oval',
  ROUND = 'round',
  SQUARE = 'square',
  HEART = 'heart',
  OBLONG = 'oblong',
  DIAMOND = 'diamond',
}

// Hair types
export enum HairType {
  STRAIGHT = 'straight',
  WAVY = 'wavy',
  CURLY = 'curly',
  COILY = 'coily',
}

// Hair length categories
export enum HairLength {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}

// Hairstyle categories
export enum StyleCategory {
  CLASSIC = 'classic',
  MODERN = 'modern',
  TRENDY = 'trendy',
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  BOLD = 'bold',
}

// Hairstyle definition
export interface IHairstyle {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  category: StyleCategory;
  suitableFaceShapes: FaceShape[];
  suitableHairTypes: HairType[];
  recommendedLength: HairLength;
  maintenanceLevel: 'low' | 'medium' | 'high';
  stylingTime: string; // e.g., "5-10 min"
  popularityScore: number;
  tags: string[];
}

// Face analysis result
export interface IFaceAnalysis {
  faceShape: FaceShape;
  confidence: number;
  faceWidth: number;
  faceLength: number;
  jawWidth: number;
  foreheadWidth: number;
  cheekboneWidth: number;
  features: {
    strongJaw: boolean;
    highCheekbones: boolean;
    wideForehand: boolean;
    narrowChin: boolean;
  };
}

// Hairstyle recommendation with match score
export interface IHairstyleRecommendation {
  hairstyle: IHairstyle;
  matchScore: number; // 0-100
  reasons: string[];
  considerations?: string[];
}

// Saved favorite style
export interface ISavedStyle {
  id: string;
  userId: string;
  hairstyleId: string;
  hairstyle: IHairstyle;
  note?: string;
  savedAt: string;
}

// Analysis session
export interface IAnalysisSession {
  id: string;
  userId: string;
  imageUrl: string;
  faceAnalysis: IFaceAnalysis;
  recommendations: IHairstyleRecommendation[];
  createdAt: string;
}

// Request/Response types
export interface IAnalyzeFaceRequest {
  imageBase64: string;
  hairType?: HairType;
  preferences?: {
    categories?: StyleCategory[];
    maintenanceLevel?: 'low' | 'medium' | 'high';
    length?: HairLength;
  };
}

export interface IAnalyzeFaceResponse {
  sessionId: string;
  faceAnalysis: IFaceAnalysis;
  recommendations: IHairstyleRecommendation[];
}

export interface IGetStylesRequest {
  faceShape?: FaceShape;
  hairType?: HairType;
  category?: StyleCategory;
  page?: number;
  limit?: number;
}

export interface IGetStylesResponse {
  styles: IHairstyle[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ISavedStylesResponse {
  savedStyles: ISavedStyle[];
  total: number;
}

// Tips based on face shape
export interface IFaceShapeTips {
  faceShape: FaceShape;
  description: string;
  bestFeaturesToHighlight: string[];
  stylestoAvoid: string[];
  recommendedStyles: string[];
  celebrityExamples: string[];
}

// Face shape tips data
export const FACE_SHAPE_TIPS: Record<FaceShape, IFaceShapeTips> = {
  [FaceShape.OVAL]: {
    faceShape: FaceShape.OVAL,
    description:
      'Oval faces are well-balanced with gently rounded features. The forehead is slightly wider than the jaw.',
    bestFeaturesToHighlight: ['Balanced proportions', 'Versatile face shape'],
    stylestoAvoid: ['Styles that add too much height', 'Very long face-framing layers'],
    recommendedStyles: ['Most styles work well', 'Side parts', 'Textured crops', 'Pompadours'],
    celebrityExamples: ['George Clooney', 'Ryan Gosling', 'Brad Pitt'],
  },
  [FaceShape.ROUND]: {
    faceShape: FaceShape.ROUND,
    description:
      'Round faces have similar width and length with soft angles. Full cheeks and a rounded chin.',
    bestFeaturesToHighlight: ['Full cheeks', 'Youthful appearance'],
    stylestoAvoid: ['Bowl cuts', 'Rounded bangs', 'Styles without height'],
    recommendedStyles: ['Styles with height on top', 'Undercuts', 'Fades', 'Angular styles'],
    celebrityExamples: ['Leonardo DiCaprio', 'Jack Black', 'Elijah Wood'],
  },
  [FaceShape.SQUARE]: {
    faceShape: FaceShape.SQUARE,
    description: 'Square faces have a strong jawline with forehead and jaw of similar width.',
    bestFeaturesToHighlight: ['Strong jawline', 'Masculine features'],
    stylestoAvoid: ['Very short sides', 'Boxy cuts', 'Styles that emphasize jaw width'],
    recommendedStyles: ['Textured styles', 'Messy looks', 'Side parts', 'Longer tops'],
    celebrityExamples: ['Brad Pitt', 'Henry Cavill', 'David Beckham'],
  },
  [FaceShape.HEART]: {
    faceShape: FaceShape.HEART,
    description: 'Heart-shaped faces have a wider forehead that tapers to a narrow, pointed chin.',
    bestFeaturesToHighlight: ['Cheekbones', 'Forehead'],
    stylestoAvoid: ['Styles with too much volume on sides', 'Very short crops'],
    recommendedStyles: ['Medium length styles', 'Side-swept bangs', 'Layered cuts'],
    celebrityExamples: ['Ryan Gosling', 'Justin Timberlake', 'Kourtney Kardashian'],
  },
  [FaceShape.OBLONG]: {
    faceShape: FaceShape.OBLONG,
    description: 'Oblong faces are longer than they are wide with a long straight cheek line.',
    bestFeaturesToHighlight: ['Strong features', 'Elegant proportions'],
    stylestoAvoid: ['Styles that add height', 'Very long hair', 'Slicked back looks'],
    recommendedStyles: ['Bangs or fringe', 'Layered cuts', 'Styles with side volume'],
    celebrityExamples: ['Ben Affleck', 'Adam Levine', 'Keanu Reeves'],
  },
  [FaceShape.DIAMOND]: {
    faceShape: FaceShape.DIAMOND,
    description: 'Diamond faces have narrow forehead and jawline with wide cheekbones.',
    bestFeaturesToHighlight: ['Cheekbones', 'Unique shape'],
    stylestoAvoid: ['Slicked back styles', 'Styles that are too short on sides'],
    recommendedStyles: ['Fringes', 'Side parts', 'Textured tops', 'Chin-length styles'],
    celebrityExamples: ['Johnny Depp', 'Robert Pattinson', 'Orlando Bloom'],
  },
};
