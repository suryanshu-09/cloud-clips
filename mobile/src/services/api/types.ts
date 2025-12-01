// Common API types
export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface IApiError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface IPaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ILocationParams {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers
}

export interface IDateRangeParams {
  startDate?: string;
  endDate?: string;
}

// Re-export client types
export { ApiError } from './client';
