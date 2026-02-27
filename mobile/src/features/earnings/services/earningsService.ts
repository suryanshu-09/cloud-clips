/**
 * Earnings service - Convex integration
 * Uses Convex actions for Stripe Connect operations
 */

import type {
  IConnectAccount,
  ICreateConnectAccountResponse,
  IDashboardLink,
  IEarningsHistoryResponse,
  IEarningsSummary,
  IPayoutsResponse,
} from '../types';
import { ConnectStatus } from '../types';

/**
 * Transform Convex action response to IConnectAccount type
 */
export const transformConnectAccountResponse = (data: any): IConnectAccount => {
  let status = ConnectStatus.NONE;

  if (data.detailsSubmitted && data.chargesEnabled && data.payoutsEnabled) {
    status = ConnectStatus.VERIFIED;
  } else if (data.detailsSubmitted) {
    status = ConnectStatus.PENDING;
  } else if (data.accountId) {
    status = ConnectStatus.PENDING;
  }

  return {
    accountId: data.accountId || '',
    status,
    hasAccount: !!data.accountId,
    detailsSubmitted: data.detailsSubmitted || false,
    chargesEnabled: data.chargesEnabled || false,
    payoutsEnabled: data.payoutsEnabled || false,
    requirements: data.requirements?.currentlyDue || [],
  };
};

/**
 * Transform Convex action response to ICreateConnectAccountResponse type
 */
export const transformCreateAccountResponse = (data: any): ICreateConnectAccountResponse => {
  return {
    accountId: data.accountId,
    status: data.isExisting ? ConnectStatus.PENDING : ConnectStatus.NONE,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
  };
};

/**
 * Transform Convex action response to IDashboardLink type
 */
export const transformDashboardLinkResponse = (data: any): IDashboardLink => {
  return {
    url: data.url,
  };
};

/**
 * Mock earnings data generators for development
 */
export const generateMockEarnings = (count: number): any[] => {
  const items: any[] = [];
  const services = ['Haircut', 'Beard Trim', 'Hair + Beard', 'Fade', 'Kids Cut'];
  const names = ['John D.', 'Mike S.', 'Chris P.', 'David L.', 'James W.'];

  for (let i = 0; i < count; i++) {
    const amount = (2500 + Math.random() * 5000) | 0;
    const fee = (amount * 0.15) | 0;
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

export const generateMockPayouts = (count: number): any[] => {
  const payouts: any[] = [];

  for (let i = 0; i < count; i++) {
    payouts.push({
      id: `po_mock_${i}_${Date.now()}`,
      amount: (50000 + Math.random() * 100000) | 0,
      currency: 'usd',
      status: i === 0 ? 'in_transit' : 'paid',
      arrivalDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - (i * 7 + 2) * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return payouts;
};

/**
 * Generate mock earnings summary
 */
export const generateMockEarningsSummary = (
  period: string,
  connectStatus: ConnectStatus
): IEarningsSummary => {
  let multiplier = 1;

  switch (period) {
    case 'month':
      multiplier = 4.5;
      break;
    case 'year':
      multiplier = 52;
      break;
    case 'all':
      multiplier = 104;
      break;
  }

  const baseEarnings = 150000;
  const totalEarnings = (baseEarnings * multiplier) | 0;
  const serviceEarnings = (totalEarnings * 0.8) | 0;
  const productEarnings = (totalEarnings * 0.13) | 0;
  const tips = (totalEarnings * 0.07) | 0;
  const platformFee = (totalEarnings * 0.15) | 0;
  const netEarnings = totalEarnings - platformFee;
  const serviceCount = (25 * multiplier) | 0;

  return {
    period: period as any,
    totalEarnings,
    serviceEarnings,
    productEarnings,
    tips,
    platformFee,
    platformFeeRate: 15,
    netEarnings,
    serviceCount,
    avgPerService: serviceCount > 0 ? (netEarnings / serviceCount) | 0 : 0,
    availableBalance: 85000,
    pendingBalance: 45000,
    currency: 'usd',
    payoutsEnabled: connectStatus === ConnectStatus.VERIFIED,
    connectStatus,
  };
};

/**
 * Generate mock earnings history response
 */
export const generateMockEarningsHistory = (
  page: number,
  limit: number
): IEarningsHistoryResponse => {
  const total = 100;
  const earnings = generateMockEarnings(limit);

  return {
    earnings: earnings as any,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Generate mock payouts response
 */
export const generateMockPayoutsResponse = (limit: number): IPayoutsResponse => {
  const payouts = generateMockPayouts(limit);

  return {
    payouts: payouts as any,
    total: payouts.length,
  };
};
