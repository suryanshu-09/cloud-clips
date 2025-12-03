/**
 * Earnings service
 * API calls for Stripe Connect barber payouts
 */

import apiClient from '../../../services/api/client';
import {
  IConnectAccount,
  ICreateConnectAccountResponse,
  ICreateOnboardingLinkRequest,
  IDashboardLink,
  IEarningsHistoryResponse,
  IEarningsSummary,
  IGetEarningsHistoryRequest,
  IGetEarningsRequest,
  IGetPayoutsRequest,
  IOnboardingLink,
  IPayoutsResponse,
} from '../types';

const BARBERS_API = '/api/barbers';

export const earningsService = {
  /**
   * Create a Stripe Connect account for a barber
   */
  createConnectAccount: async (barberId: string): Promise<ICreateConnectAccountResponse> => {
    const response = await apiClient.post<ICreateConnectAccountResponse>(
      `${BARBERS_API}/${barberId}/connect`
    );
    return response.data;
  },

  /**
   * Get Stripe Connect onboarding link for barber
   */
  getOnboardingLink: async (
    barberId: string,
    params?: ICreateOnboardingLinkRequest
  ): Promise<IOnboardingLink> => {
    const response = await apiClient.post<IOnboardingLink>(
      `${BARBERS_API}/${barberId}/connect/onboarding`,
      params || {}
    );
    return response.data;
  },

  /**
   * Get Connect account status for barber
   */
  getConnectStatus: async (barberId: string): Promise<IConnectAccount> => {
    const response = await apiClient.get<IConnectAccount>(
      `${BARBERS_API}/${barberId}/connect/status`
    );
    return response.data;
  },

  /**
   * Get Stripe Express Dashboard link for barber
   */
  getDashboardLink: async (barberId: string): Promise<IDashboardLink> => {
    const response = await apiClient.post<IDashboardLink>(
      `${BARBERS_API}/${barberId}/connect/dashboard`
    );
    return response.data;
  },

  /**
   * Get earnings summary for barber
   */
  getEarnings: async (
    barberId: string,
    params?: IGetEarningsRequest
  ): Promise<IEarningsSummary> => {
    const response = await apiClient.get<IEarningsSummary>(`${BARBERS_API}/${barberId}/earnings`, {
      params,
    });
    return response.data;
  },

  /**
   * Get earnings history for barber
   */
  getEarningsHistory: async (
    barberId: string,
    params?: IGetEarningsHistoryRequest
  ): Promise<IEarningsHistoryResponse> => {
    const response = await apiClient.get<IEarningsHistoryResponse>(
      `${BARBERS_API}/${barberId}/earnings/history`,
      { params }
    );
    return response.data;
  },

  /**
   * Get payout history for barber
   */
  getPayouts: async (barberId: string, params?: IGetPayoutsRequest): Promise<IPayoutsResponse> => {
    const response = await apiClient.get<IPayoutsResponse>(`${BARBERS_API}/${barberId}/payouts`, {
      params,
    });
    return response.data;
  },
};
