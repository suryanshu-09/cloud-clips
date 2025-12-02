import type { IReview, IReviewSubmission, IReviewsResponse, IReviewStats } from '../types';

// Mock data - Reviews for different barbers
const mockReviews: IReview[] = [
  // Reviews for barber-1 (Mike's Barbershop)
  {
    id: 'review1',
    appointmentId: 'appt1',
    clientId: 'client1',
    barberId: 'barber-1',
    rating: 5,
    comment:
      'Amazing haircut! Mike is very professional and friendly. The fade was perfect and he really listened to what I wanted. Highly recommend!',
    photos: ['https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'John Doe',
    clientAvatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: 'review2',
    appointmentId: 'appt2',
    clientId: 'client2',
    barberId: 'barber-1',
    rating: 4,
    comment:
      'Great service, very skilled barber. Only minor wait time but worth it. Will definitely come back!',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Mike Smith',
    clientAvatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: 'review3',
    appointmentId: 'appt3',
    clientId: 'client3',
    barberId: 'barber-1',
    rating: 5,
    comment:
      "Best haircut I've had in years! The attention to detail is incredible. Mike took his time and made sure everything was perfect.",
    photos: [
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
      'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400',
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Sarah Johnson',
    clientAvatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 'review4',
    appointmentId: 'appt4',
    clientId: 'client4',
    barberId: 'barber-1',
    rating: 4,
    comment: 'Good haircut, very clean lines. Slightly rushed but still a great result.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'David Brown',
    clientAvatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: 'review5',
    appointmentId: 'appt5',
    clientId: 'client5',
    barberId: 'barber-1',
    rating: 5,
    comment:
      'Excellent experience from start to finish. Great conversation and even better haircut. Will be back!',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Emily Wilson',
    clientAvatar: 'https://i.pravatar.cc/150?img=9',
  },
  {
    id: 'review6',
    appointmentId: 'appt6',
    clientId: 'client6',
    barberId: 'barber-1',
    rating: 5,
    comment:
      'Mike is a master at his craft! Been coming here for 2 years now and never disappointed.',
    photos: ['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400'],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'James Wilson',
    clientAvatar: 'https://i.pravatar.cc/150?img=8',
  },
  {
    id: 'review7',
    appointmentId: 'appt7',
    clientId: 'client7',
    barberId: 'barber-1',
    rating: 3,
    comment:
      'Decent haircut but had to wait 30 minutes past my appointment time. The cut itself was good though.',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Robert Taylor',
    clientAvatar: 'https://i.pravatar.cc/150?img=7',
  },

  // Reviews for barber-2 (Sarah's Salon)
  {
    id: 'review8',
    appointmentId: 'appt8',
    clientId: 'client8',
    barberId: 'barber-2',
    rating: 5,
    comment:
      'Sarah is absolutely amazing! She understood exactly what I wanted and delivered perfectly. The salon is also very clean and welcoming.',
    photos: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Jessica Martinez',
    clientAvatar: 'https://i.pravatar.cc/150?img=10',
  },
  {
    id: 'review9',
    appointmentId: 'appt9',
    clientId: 'client9',
    barberId: 'barber-2',
    rating: 5,
    comment:
      "Best stylist I've ever been to! Sarah really knows her stuff. My hair has never looked better.",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Amanda Lee',
    clientAvatar: 'https://i.pravatar.cc/150?img=20',
  },
  {
    id: 'review10',
    appointmentId: 'appt10',
    clientId: 'client10',
    barberId: 'barber-2',
    rating: 4,
    comment: 'Great cut and styling. Sarah is very professional and the atmosphere is relaxing.',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Lisa Anderson',
    clientAvatar: 'https://i.pravatar.cc/150?img=15',
  },
  {
    id: 'review11',
    appointmentId: 'appt11',
    clientId: 'client11',
    barberId: 'barber-2',
    rating: 5,
    comment:
      'Amazing service! Sarah is so talented and friendly. I always leave feeling like a million bucks!',
    photos: ['https://images.unsplash.com/photo-1595475884562-073c5210ac23?w=400'],
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Michelle Brown',
    clientAvatar: 'https://i.pravatar.cc/150?img=25',
  },

  // Reviews for barber-3 (Elite Cuts)
  {
    id: 'review12',
    appointmentId: 'appt12',
    clientId: 'client12',
    barberId: 'barber-3',
    rating: 5,
    comment: 'Absolutely fantastic! The attention to detail is unmatched. Worth every penny.',
    photos: ['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400'],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Christopher Davis',
    clientAvatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 'review13',
    appointmentId: 'appt13',
    clientId: 'client13',
    barberId: 'barber-3',
    rating: 4,
    comment: 'Very professional service. Great fade and lineup. Slightly pricey but quality work.',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Daniel Wilson',
    clientAvatar: 'https://i.pravatar.cc/150?img=13',
  },
  {
    id: 'review14',
    appointmentId: 'appt14',
    clientId: 'client14',
    barberId: 'barber-3',
    rating: 5,
    comment: 'Elite Cuts lives up to its name! Premium service all around. My go-to barber now.',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Matthew Thomas',
    clientAvatar: 'https://i.pravatar.cc/150?img=14',
  },

  // Reviews for barber-4 (Classic Barber)
  {
    id: 'review15',
    appointmentId: 'appt15',
    clientId: 'client15',
    barberId: 'barber-4',
    rating: 4,
    comment: 'Good traditional barbershop experience. Clean cuts and friendly service.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'William Garcia',
    clientAvatar: 'https://i.pravatar.cc/150?img=16',
  },
  {
    id: 'review16',
    appointmentId: 'appt16',
    clientId: 'client16',
    barberId: 'barber-4',
    rating: 5,
    comment: 'Love this place! Old school vibes with modern techniques. Always consistent quality.',
    photos: ['https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400'],
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Joseph Martinez',
    clientAvatar: 'https://i.pravatar.cc/150?img=17',
  },
  {
    id: 'review17',
    appointmentId: 'appt17',
    clientId: 'client17',
    barberId: 'barber-4',
    rating: 4,
    comment:
      'Solid haircut every time. Fair prices and great atmosphere. Been coming here for months.',
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Charles Rodriguez',
    clientAvatar: 'https://i.pravatar.cc/150?img=18',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockReviewService = {
  async getBarberReviews(
    barberId: string,
    params?: {
      limit?: number;
      cursor?: string;
      minRating?: number;
    }
  ): Promise<IReviewsResponse> {
    await delay(500);

    let filteredReviews = mockReviews.filter((r) => r.barberId === barberId);

    if (params?.minRating) {
      filteredReviews = filteredReviews.filter((r) => r.rating >= params.minRating!);
    }

    const limit = params?.limit || 10;
    const reviews = filteredReviews.slice(0, limit);

    const stats = calculateStats(filteredReviews);

    return {
      reviews,
      stats,
      hasMore: filteredReviews.length > limit,
      nextCursor: filteredReviews.length > limit ? `cursor_${limit}` : undefined,
    };
  },

  async getClientReviews(
    clientId: string,
    params?: {
      limit?: number;
      cursor?: string;
    }
  ): Promise<IReview[]> {
    await delay(300);
    return mockReviews.filter((r) => r.clientId === clientId);
  },

  async getAppointmentReview(appointmentId: string): Promise<IReview | null> {
    await delay(200);
    return mockReviews.find((r) => r.appointmentId === appointmentId) || null;
  },

  async submitReview(review: IReviewSubmission): Promise<IReview> {
    await delay(800);

    const newReview: IReview = {
      id: `review${Date.now()}`,
      ...review,
      clientId: review.clientId || 'current-user',
      createdAt: new Date().toISOString(),
      clientName: 'Current User',
      clientAvatar: 'https://i.pravatar.cc/150?img=10',
    };

    mockReviews.unshift(newReview);
    return newReview;
  },

  async updateReview(
    reviewId: string,
    updates: Partial<Pick<IReviewSubmission, 'rating' | 'comment' | 'photos'>>
  ): Promise<IReview> {
    await delay(600);

    const reviewIndex = mockReviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1) {
      throw new Error('Review not found');
    }

    mockReviews[reviewIndex] = {
      ...mockReviews[reviewIndex],
      ...updates,
    };

    return mockReviews[reviewIndex];
  },

  async deleteReview(reviewId: string): Promise<void> {
    await delay(400);
    const index = mockReviews.findIndex((r) => r.id === reviewId);
    if (index !== -1) {
      mockReviews.splice(index, 1);
    }
  },

  async getBarberReviewStats(barberId: string): Promise<IReviewStats> {
    await delay(300);
    const barberReviews = mockReviews.filter((r) => r.barberId === barberId);
    return calculateStats(barberReviews);
  },

  async uploadReviewPhotos(photos: File[]): Promise<string[]> {
    await delay(1500);
    return photos.map(
      (_, index) => `https://images.unsplash.com/photo-${1621605815971 + index}?w=400`
    );
  },

  async canReviewAppointment(appointmentId: string): Promise<boolean> {
    await delay(200);
    // Check if review already exists
    const existingReview = mockReviews.find((r) => r.appointmentId === appointmentId);
    return !existingReview;
  },
};

// Helper function to calculate review statistics
function calculateStats(reviews: IReview[]): IReviewStats {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };
  }

  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let totalRating = 0;

  reviews.forEach((review) => {
    totalRating += review.rating;
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  return {
    averageRating: Number((totalRating / totalReviews).toFixed(1)),
    totalReviews,
    ratingDistribution,
  };
}
