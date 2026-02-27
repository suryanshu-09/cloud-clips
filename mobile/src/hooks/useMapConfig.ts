import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { mapStyleAtom, setMapStyleAtom } from '@/store/atoms/themeAtom';
import {
  MAP_STYLES,
  AVAILABLE_MAP_STYLES,
  DEFAULT_MAP_CONFIG,
  MAP_UI_OPTIONS,
  MAP_ANIMATION_DURATION,
  type MapStyle,
  type IMapStyleConfig,
} from '@/config/mapStyles';

interface IUseMapConfigReturn {
  // Current state
  currentMapStyle: MapStyle;
  mapConfig: IMapStyleConfig;

  // Available options
  availableStyles: IMapStyleConfig[];

  // Actions
  setMapStyle: (style: MapStyle) => void;
  getMapStyleConfig: (style: MapStyle) => IMapStyleConfig;

  // Constants
  defaultConfig: typeof DEFAULT_MAP_CONFIG;
  uiOptions: typeof MAP_UI_OPTIONS;
  animationDuration: typeof MAP_ANIMATION_DURATION;

  // Helpers
  isValidMapStyle: (style: string) => style is MapStyle;
}

export const useMapConfig = (): IUseMapConfigReturn => {
  const currentMapStyle = useAtomValue(mapStyleAtom);
  const setMapStyleAction = useSetAtom(setMapStyleAtom);

  const setMapStyle = useCallback(
    (style: MapStyle) => {
      setMapStyleAction(style);
    },
    [setMapStyleAction]
  );

  const getMapStyleConfig = useCallback((style: MapStyle): IMapStyleConfig => {
    return MAP_STYLES[style];
  }, []);

  const isValidMapStyle = useCallback((style: string): style is MapStyle => {
    return style in MAP_STYLES;
  }, []);

  return {
    currentMapStyle,
    mapConfig: MAP_STYLES[currentMapStyle],
    availableStyles: AVAILABLE_MAP_STYLES,
    setMapStyle,
    getMapStyleConfig,
    defaultConfig: DEFAULT_MAP_CONFIG,
    uiOptions: MAP_UI_OPTIONS,
    animationDuration: MAP_ANIMATION_DURATION,
    isValidMapStyle,
  };
};

export default useMapConfig;
