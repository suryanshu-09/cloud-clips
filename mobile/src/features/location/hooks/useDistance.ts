import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/locationService';
import type { ICoordinates } from '../types';

interface IUseDistanceProps {
  from?: ICoordinates | null;
  to?: ICoordinates | null;
  enabled?: boolean;
}

interface IUseDistanceReturn {
  distance: number | null;
  formattedDistance: string | null;
  isCalculating: boolean;
  calculate: (from: ICoordinates, to: ICoordinates) => number;
}

export function useDistance({
  from,
  to,
  enabled = true,
}: IUseDistanceProps = {}): IUseDistanceReturn {
  const [distance, setDistance] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!enabled || !from || !to) {
      setDistance(null);
      return;
    }

    setIsCalculating(true);
    try {
      const calculatedDistance = locationService.calculateDistance(from, to);
      setDistance(calculatedDistance);
    } catch (error) {
      console.error('Error calculating distance:', error);
      setDistance(null);
    } finally {
      setIsCalculating(false);
    }
  }, [from, to, enabled]);

  const calculate = useCallback((fromCoords: ICoordinates, toCoords: ICoordinates) => {
    return locationService.calculateDistance(fromCoords, toCoords);
  }, []);

  const formattedDistance = distance !== null ? locationService.formatDistance(distance) : null;

  return {
    distance,
    formattedDistance,
    isCalculating,
    calculate,
  };
}
