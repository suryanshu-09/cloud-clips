/**
 * Mock earnings service for development
 */

import {
  ConnectStatus,
  EarningsPeriod,
  IConnectAccount,
  ICreateConnectAccountResponse,
  ICreateOnboardingLinkRequest,
  IDashboardLink,
  IEarningsHistoryResponse,
  IEarningItem,
  IEarningsSummary,
  IGetEarningsHistoryRequest,
  IGetEarningsRequest,
  IGetPayoutsRequest,
  IOnboardingLink,
  IPayout,
  IPayoutsResponse,
  PayoutStatus,
} from '../types';

// Mock data for development
const generateMockEarnings = (count: number): IEarningItem[] => {
  const items: IEarningItem[] = [];
  const services = ['Haircut', 'Beard Trim', 'Hair + Beard', 'Fade', 'Kids Cut'];
  const names = ['John D.', 'Mike S.', 'Chris P.', 'David L.', 'James W.'];

  for (let i = 0; i < count; i++) {
    const amount = (2500 + Math.random() * 5000) | 0; // $25-75
    const fee = (amount * 0.15) | 0; // 15% platform fee
    items.push({
      id: `earning_${i}_${Date.now()}`,
      type: Math.random() > 0.1 ? 'service' : 'tip',
      amount,
      fee,
      net: amount - fee,
      description: services[i % services.length],
      customerName: names[i % names.length],
      status: 'completed',
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return items;
};

const generateMockPayouts = (count: number): IPayout[] => {
  const payouts: IPayout[] = [];

  for (let i = 0; i < count; i++) {
    payouts.push({
      id: `po_mock_${i}_${Date.now()}`,
      amount: (50000 + Math.random() * 100000) | 0, // $500-1500
      currency: 'usd',
      status: i === 0 ? PayoutStatus.IN_TRANSIT : PayoutStatus.PAID,
      arrivalDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - (i * 7 + 2) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return payouts;
};

// Mock Connect account state
let mockConnectStatus: ConnectStatus = ConnectStatus.NONE;
let mockAccountId: string | null = null;

export const mockEarningsService = {
  createConnectAccount: async (barberId: string): Promise<ICreateConnectAccountResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    mockAccountId = `acct_mock_${Date.now()}`;
    mockConnectStatus = ConnectStatus.PENDING;

    return {
      accountId: mockAccountId,
      status: ConnectStatus.PENDING,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  },

  getOnboardingLink: async (
    barberId: string,
    params?: ICreateOnboardingLinkRequest
  ): Promise<IOnboardingLink> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      url: 'https://connect.stripe.com/express/mock-onboarding',
      expiresAt: Date.now() + 3600000, // 1 hour
    };
  },

  getConnectStatus: async (barberId: string): Promise<IConnectAccount> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!mockAccountId) {
      return {
        accountId: '',
        status: ConnectStatus.NONE,
        hasAccount: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      };
    }

    return {
      accountId: mockAccountId,
      status: mockConnectStatus,
      hasAccount: true,
      detailsSubmitted: mockConnectStatus === ConnectStatus.VERIFIED,
      chargesEnabled: mockConnectStatus === ConnectStatus.VERIFIED,
      payoutsEnabled: mockConnectStatus === ConnectStatus.VERIFIED,
      requirements:
        mockConnectStatus === ConnectStatus.PENDING
          ? ['individual.verification.document', 'external_account']
          : [],
    };
  },

  getDashboardLink: async (barberId: string): Promise<IDashboardLink> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      url: 'https://dashboard.stripe.com/express/mock',
    };
  },

  getEarnings: async (
    barberId: string,
    params?: IGetEarningsRequest
  ): Promise<IEarningsSummary> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const period = params?.period || 'week';
    let multiplier = 1;

    switch (period) {
      case 'month':
        multiplier = 4.5;
        break;
      case 'year':
        multiplier = 52;
        break;
      case 'all':
        multiplier = 104; // ~2 years
        break;
    }

    const baseEarnings = 150000; // $1,500 weekly
    const totalEarnings = (baseEarnings * multiplier) | 0;
    const serviceEarnings = (totalEarnings * 0.8) | 0;
    const productEarnings = (totalEarnings * 0.13) | 0;
    const tips = (totalEarnings * 0.07) | 0;
    const platformFee = (totalEarnings * 0.15) | 0;
    const netEarnings = totalEarnings - platformFee;
    const serviceCount = (25 * multiplier) | 0;

    return {
      period: period as EarningsPeriod,
      totalEarnings,
      serviceEarnings,
      productEarnings,
      tips,
      platformFee,
      platformFeeRate: 15,
      netEarnings,
      serviceCount,
      avgPerService: serviceCount > 0 ? (netEarnings / serviceCount) | 0 : 0,
      availableBalance: 85000, // $850
      pendingBalance: 45000, // $450
      currency: 'usd',
      payoutsEnabled: mockConnectStatus === ConnectStatus.VERIFIED,
      connectStatus: mockConnectStatus,
    };
  },

  getEarningsHistory: async (
    barberId: string,
    params?: IGetEarningsHistoryRequest
  ): Promise<IEarningsHistoryResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = 100;
    const earnings = generateMockEarnings(limit);

    return {
      earnings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  getPayouts: async (barberId: string, params?: IGetPayoutsRequest): Promise<IPayoutsResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const limit = params?.limit || 10;
    const payouts = generateMockPayouts(limit);

    return {
      payouts,
      total: payouts.length,
    };
  },

  // Helper to simulate completing onboarding (for testing)
  _completeOnboarding: () => {
    mockConnectStatus = ConnectStatus.VERIFIED;
  },

  _resetState: () => {
    mockConnectStatus = ConnectStatus.NONE;
    mockAccountId = null;
  },
};
