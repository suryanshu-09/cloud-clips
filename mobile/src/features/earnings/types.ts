/**
 * Earnings feature types
 * Types for Stripe Connect barber payouts and earnings tracking
 */

// Stripe Connect account status
export enum ConnectStatus {
  NONE = 'none',
  PENDING = 'pending',
  VERIFIED = 'verified',
  RESTRICTED = 'restricted',
  DISABLED = 'disabled',
}

// Earnings period types
export type EarningsPeriod = 'week' | 'month' | 'year' | 'all';

// Earning item types
export type EarningType = 'service' | 'product' | 'tip';

// Payout status
export enum PayoutStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

// Connect account info
export interface IConnectAccount {
  accountId: string;
  status: ConnectStatus;
  hasAccount: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements?: string[];
  createdAt?: string;
}

// Earnings summary
export interface IEarningsSummary {
  period: EarningsPeriod;
  totalEarnings: number;
  serviceEarnings: number;
  productEarnings: number;
  tips: number;
  platformFee: number;
  platformFeeRate: number;
  netEarnings: number;
  serviceCount: number;
  avgPerService: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  payoutsEnabled: boolean;
  connectStatus: ConnectStatus;
}

// Individual earning item
export interface IEarningItem {
  id: string;
  type: EarningType;
  amount: number;
  fee: number;
  net: number;
  description: string;
  customerName: string;
  status: string;
  date: string;
}

// Earnings history response
export interface IEarningsHistoryResponse {
  earnings: IEarningItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Payout item
export interface IPayout {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  arrivalDate: string;
  createdAt: string;
  failureCode?: string;
  failureMessage?: string;
}

// Payouts response
export interface IPayoutsResponse {
  payouts: IPayout[];
  total: number;
}

// Onboarding link
export interface IOnboardingLink {
  url: string;
  expiresAt?: number;
}

// Dashboard link
export interface IDashboardLink {
  url: string;
}

// Request types
export interface ICreateConnectAccountResponse {
  accountId: string;
  status: ConnectStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export interface ICreateOnboardingLinkRequest {
  refreshUrl?: string;
  returnUrl?: string;
}

export interface IGetEarningsRequest {
  period?: EarningsPeriod;
}

export interface IGetEarningsHistoryRequest {
  page?: number;
  limit?: number;
}

export interface IGetPayoutsRequest {
  limit?: number;
  status?: PayoutStatus;
}
