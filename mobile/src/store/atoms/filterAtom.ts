import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { storage } from '../utils/storage';

export interface IFilterState {
  priceRange: {
    min: number;
    max: number;
  } | null;
  minRating: number | null;
  specialties: string[];
}

const initialFilterState: IFilterState = {
  priceRange: null,
  minRating: null,
  specialties: [],
};

// Persistent filter atom
export const filterAtom = atomWithStorage<IFilterState>(
  'discoveryFilters',
  initialFilterState,
  storage,
  { getOnInit: true }
);

// Actions
export const setPriceRangeAtom = atom(
  null,
  (get, set, priceRange: { min: number; max: number } | null) => {
    const state = get(filterAtom);
    set(filterAtom, { ...state, priceRange });
  }
);

export const setMinRatingAtom = atom(null, (get, set, minRating: number | null) => {
  const state = get(filterAtom);
  set(filterAtom, { ...state, minRating });
});

export const toggleSpecialtyAtom = atom(null, (get, set, specialty: string) => {
  const state = get(filterAtom);
  const currentSpecialties = state.specialties;
  const newSpecialties = currentSpecialties.includes(specialty)
    ? currentSpecialties.filter((s) => s !== specialty)
    : [...currentSpecialties, specialty];
  set(filterAtom, { ...state, specialties: newSpecialties });
});

export const setSpecialtiesAtom = atom(null, (get, set, specialties: string[]) => {
  const state = get(filterAtom);
  set(filterAtom, { ...state, specialties });
});

export const clearFiltersAtom = atom(null, (get, set) => {
  set(filterAtom, initialFilterState);
});

// Derived atoms
export const activeFiltersCountAtom = atom((get) => {
  const state = get(filterAtom);
  let count = 0;
  if (state.priceRange) count++;
  if (state.minRating) count++;
  count += state.specialties.length;
  return count;
});

export const hasActiveFiltersAtom = atom((get) => {
  const state = get(filterAtom);
  return state.priceRange !== null || state.minRating !== null || state.specialties.length > 0;
});
