import { atom } from 'jotai';
import { atomWithStorage, unwrap } from 'jotai/utils';
import { storage } from '../utils/storage';

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ILocationState {
  currentLocation: ILocation | null;
  savedLocations: ILocation[];
  isLoading: boolean;
  error: string | null;
}

const initialLocationState: ILocationState = {
  currentLocation: null,
  savedLocations: [],
  isLoading: false,
  error: null,
};

// Persistent location atom
export const locationAtom = atomWithStorage<ILocationState>(
  'location',
  initialLocationState,
  storage,
  { getOnInit: true }
);

// Unwrapped atom for synchronous access
const locationAtomSync = unwrap(locationAtom, (prev) => prev ?? initialLocationState);

// Derived atoms
export const currentLocationAtom = atom((get) => get(locationAtomSync).currentLocation);
export const savedLocationsAtom = atom((get) => get(locationAtomSync).savedLocations);
export const isLocationLoadingAtom = atom((get) => get(locationAtomSync).isLoading);

// Actions
export const setCurrentLocationAtom = atom(null, (get, set, location: ILocation) => {
  const state = get(locationAtomSync);
  set(locationAtom, {
    ...state,
    currentLocation: location,
    isLoading: false,
    error: null,
  });
});

export const setLocationLoadingAtom = atom(null, (get, set, isLoading: boolean) => {
  const state = get(locationAtomSync);
  set(locationAtom, { ...state, isLoading });
});

export const setLocationErrorAtom = atom(null, (get, set, error: string) => {
  const state = get(locationAtomSync);
  set(locationAtom, { ...state, error, isLoading: false });
});

export const addSavedLocationAtom = atom(null, (get, set, location: ILocation) => {
  const state = get(locationAtomSync);
  const isDuplicate = state.savedLocations.some(
    (loc: ILocation) => loc.latitude === location.latitude && loc.longitude === location.longitude
  );

  if (!isDuplicate) {
    set(locationAtom, {
      ...state,
      savedLocations: [...state.savedLocations, location],
    });
  }
});

export const removeSavedLocationAtom = atom(null, (get, set, location: ILocation) => {
  const state = get(locationAtomSync);
  const newSavedLocations = state.savedLocations.filter(
    (loc: ILocation) => loc.latitude !== location.latitude || loc.longitude !== location.longitude
  );
  set(locationAtom, { ...state, savedLocations: newSavedLocations });
});
