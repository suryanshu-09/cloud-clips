import { atom } from 'jotai';
import { atomWithStorage, unwrap } from 'jotai/utils';
import { storage } from '../utils/storage';

export type ColorScheme = 'light' | 'dark' | 'auto';
export type MapStyle = 'standard' | 'dark' | 'satellite' | 'terrain';

export interface IThemeState {
  colorScheme: ColorScheme;
  primaryColor: string;
  fontScale: number;
  mapStyle: MapStyle;
}

const initialThemeState: IThemeState = {
  colorScheme: 'auto',
  primaryColor: '#3B82F6', // Default blue
  fontScale: 1.0,
  mapStyle: 'standard',
};

// Persistent theme atom
export const themeAtom = atomWithStorage<IThemeState>('theme', initialThemeState, storage, {
  getOnInit: true,
});

// Unwrapped atom for synchronous access
const themeAtomSync = unwrap(themeAtom, (prev) => prev ?? initialThemeState);

// Derived atoms
export const colorSchemeAtom = atom((get) => get(themeAtomSync).colorScheme);
export const primaryColorAtom = atom((get) => get(themeAtomSync).primaryColor);
export const fontScaleAtom = atom((get) => get(themeAtomSync).fontScale);
export const mapStyleAtom = atom((get) => get(themeAtomSync).mapStyle);

// Actions
export const setColorSchemeAtom = atom(null, (get, set, colorScheme: ColorScheme) => {
  const theme = get(themeAtomSync);
  set(themeAtom, { ...theme, colorScheme });
});

export const setPrimaryColorAtom = atom(null, (get, set, primaryColor: string) => {
  const theme = get(themeAtomSync);
  set(themeAtom, { ...theme, primaryColor });
});

export const setFontScaleAtom = atom(null, (get, set, fontScale: number) => {
  const theme = get(themeAtomSync);
  set(themeAtom, { ...theme, fontScale: Math.max(0.8, Math.min(1.5, fontScale)) });
});

export const setMapStyleAtom = atom(null, (get, set, mapStyle: MapStyle) => {
  const theme = get(themeAtomSync);
  set(themeAtom, { ...theme, mapStyle });
});

export const resetThemeAtom = atom(null, (get, set) => {
  set(themeAtom, initialThemeState);
});
