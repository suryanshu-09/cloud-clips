import { NOMINATIM_CONFIG } from '@/config/openstreetmap';
import { storageHelpers } from '@/services/storage/mmkv';
import { UI } from '@/utils/constants';
import {
  IGeocodingConfig,
  IGeocodingError,
  IGeocodingResult,
  IGeocodingSearchParams,
  ICachedGeocodingResult,
  INominatimResult,
  IReverseGeocodingParams,
} from './types';

const CACHE_KEY_PREFIX = 'geocoding_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const config: IGeocodingConfig = {
  baseUrl: NOMINATIM_CONFIG.baseUrl,
  userAgent: NOMINATIM_CONFIG.userAgent,
  rateLimitMs: NOMINATIM_CONFIG.rateLimitMs,
  timeout: NOMINATIM_CONFIG.timeout,
  defaultLimit: NOMINATIM_CONFIG.defaultLimit,
  cacheDuration: CACHE_DURATION,
  debounceMs: UI.DEBOUNCE.SEARCH,
};

class NominatimService {
  private lastRequestTime: number = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Generate cache key for a query
   */
  private getCacheKey(query: string): string {
    return `${CACHE_KEY_PREFIX}${query.toLowerCase().trim()}`;
  }

  /**
   * Get cached result if valid
   */
  private getCachedResult<T>(cacheKey: string): T | null {
    const cached = storageHelpers.getObject<ICachedGeocodingResult>(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > config.cacheDuration;
    if (isExpired) {
      storageHelpers.delete(cacheKey);
      return null;
    }

    return cached.result as T;
  }

  /**
   * Store result in cache
   */
  private setCachedResult<T>(cacheKey: string, result: T): void {
    const cached: ICachedGeocodingResult = {
      result,
      timestamp: Date.now(),
    };
    storageHelpers.setObject(cacheKey, cached);
  }

  /**
   * Wait for rate limit
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < config.rateLimitMs) {
      const waitTime = config.rateLimitMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Make authenticated request to Nominatim API
   */
  private async fetchWithAuth<T>(url: string): Promise<T> {
    await this.waitForRateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': config.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw this.createError('Rate limit exceeded', 'RATE_LIMIT', 429);
        }
        throw this.createError(`HTTP error ${response.status}`, 'NETWORK_ERROR', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError('Request timeout', 'TIMEOUT');
        }
        if (error.message.includes('Network')) {
          throw this.createError('Network error', 'NETWORK_ERROR');
        }
      }

      throw error;
    }
  }

  /**
   * Create geocoding error
   */
  private createError(
    message: string,
    code: IGeocodingError['code'],
    statusCode?: number
  ): IGeocodingError {
    return { message, code, statusCode };
  }

  /**
   * Parse Nominatim result to internal format
   */
  private parseNominatimResult(result: INominatimResult): IGeocodingResult {
    return {
      placeId: result.place_id,
      coordinates: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      },
      displayName: result.display_name,
      address: {
        street: result.address?.road,
        city: result.address?.city || result.address?.town || result.address?.village,
        state: result.address?.state,
        zipCode: result.address?.postcode,
        country: result.address?.country,
      },
      boundingBox: {
        minLat: parseFloat(result.boundingbox[0]),
        maxLat: parseFloat(result.boundingbox[1]),
        minLon: parseFloat(result.boundingbox[2]),
        maxLon: parseFloat(result.boundingbox[3]),
      },
      importance: result.importance,
    };
  }

  /**
   * Search for addresses by query string
   * Returns cached results if available
   */
  async search(params: IGeocodingSearchParams): Promise<IGeocodingResult[]> {
    const cacheKey = this.getCacheKey(params.query);
    const cached = this.getCachedResult<IGeocodingResult[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const searchParams = new URLSearchParams({
      q: params.query,
      format: 'json',
      limit: String(params.limit || config.defaultLimit),
      addressdetails: '1',
    });

    if (params.countryCodes?.length) {
      searchParams.set('countrycodes', params.countryCodes.join(','));
    }

    if (params.viewBox) {
      searchParams.set(
        'viewbox',
        `${params.viewBox.minLon},${params.viewBox.maxLat},${params.viewBox.maxLon},${params.viewBox.minLat}`
      );
    }

    const url = `${config.baseUrl}/search?${searchParams.toString()}`;

    const results = await this.fetchWithAuth<INominatimResult[]>(url);

    if (!results || results.length === 0) {
      throw this.createError('No results found', 'NOT_FOUND');
    }

    const parsedResults = results.map((r) => this.parseNominatimResult(r));
    this.setCachedResult(cacheKey, parsedResults);

    return parsedResults;
  }

  /**
   * Reverse geocode coordinates to address
   * Returns cached results if available
   */
  async reverse(params: IReverseGeocodingParams): Promise<IGeocodingResult> {
    const cacheKey = this.getCacheKey(`reverse_${params.latitude}_${params.longitude}`);
    const cached = this.getCachedResult<IGeocodingResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const searchParams = new URLSearchParams({
      lat: String(params.latitude),
      lon: String(params.longitude),
      format: 'json',
      addressdetails: '1',
    });

    const url = `${config.baseUrl}/reverse?${searchParams.toString()}`;

    const result = await this.fetchWithAuth<INominatimResult>(url);

    if (!result) {
      throw this.createError('No results found', 'NOT_FOUND');
    }

    const parsedResult = this.parseNominatimResult(result);
    this.setCachedResult(cacheKey, parsedResult);

    return parsedResult;
  }

  /**
   * Debounced search for autocomplete functionality
   * Cancels previous pending search if called again within debounce period
   */
  async searchDebounced(
    params: IGeocodingSearchParams,
    callback: (results: IGeocodingResult[] | null, error: IGeocodingError | null) => void
  ): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (!params.query.trim()) {
      callback(null, null);
      return;
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        const results = await this.search(params);
        callback(results, null);
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error) {
          callback(null, error as IGeocodingError);
        } else {
          callback(null, this.createError('Unknown error', 'NETWORK_ERROR'));
        }
      }
    }, config.debounceMs);
  }

  /**
   * Clear debounce timer (call when component unmounts)
   */
  clearDebounce(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Clear all cached geocoding results
   */
  clearCache(): void {
    const keys = storageHelpers.getAllKeys();
    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        storageHelpers.delete(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; size: number } {
    const keys = storageHelpers.getAllKeys().filter((k) => k.startsWith(CACHE_KEY_PREFIX));
    let size = 0;

    keys.forEach((key) => {
      const value = storageHelpers.getString(key);
      if (value) {
        size += value.length;
      }
    });

    return { total: keys.length, size };
  }
}

export const nominatimService = new NominatimService();
export default nominatimService;
