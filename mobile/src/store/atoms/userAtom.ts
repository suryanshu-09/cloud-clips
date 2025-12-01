import { atom } from 'jotai';
import { atomWithStorage, unwrap } from 'jotai/utils';
import { storage } from '../utils/storage';

export interface IUserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'client' | 'barber';
  profileImage?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBarberProfile extends IUserProfile {
  role: 'barber';
  businessName: string;
  bio?: string;
  services: string[];
  portfolio: string[];
  rating: number;
  reviewCount: number;
  yearsOfExperience?: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  availability: IAvailability[];
  pricing: Record<string, number>;
}

export interface IAvailability {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // HH:mm format
  endTime: string;
  isAvailable: boolean;
}

// User profile atom with persistence
export const userProfileAtom = atomWithStorage<IUserProfile | null>('userProfile', null, storage, {
  getOnInit: true,
});

// Barber profile atom (only for barbers)
export const barberProfileAtom = atomWithStorage<IBarberProfile | null>(
  'barberProfile',
  null,
  storage,
  { getOnInit: true }
);

// Unwrapped atoms for synchronous access
const userProfileAtomSync = unwrap(userProfileAtom, (prev) => prev ?? null);
const barberProfileAtomSync = unwrap(barberProfileAtom, (prev) => prev ?? null);

// Derived atoms
export const isBarberAtom = atom((get) => get(userProfileAtomSync)?.role === 'barber');
export const isClientAtom = atom((get) => get(userProfileAtomSync)?.role === 'client');

// Update user profile action
export const updateUserProfileAtom = atom(null, (get, set, updates: Partial<IUserProfile>) => {
  const current = get(userProfileAtomSync);
  if (current) {
    set(userProfileAtom, { ...current, ...updates });
  }
});

// Update barber profile action
export const updateBarberProfileAtom = atom(null, (get, set, updates: Partial<IBarberProfile>) => {
  const current = get(barberProfileAtomSync);
  if (current) {
    set(barberProfileAtom, { ...current, ...updates });
  }
});
