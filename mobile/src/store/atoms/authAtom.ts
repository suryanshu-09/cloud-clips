import { atom } from 'jotai';
import { atomWithStorage, unwrap } from 'jotai/utils';
import { storage } from '../utils/storage';

export interface IAuthState {
  isAuthenticated: boolean;
  user: IAuthUser | null;
  token: string | null;
  refreshToken: string | null;
}

export interface IAuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'client' | 'barber';
  profileImage?: string;
}

const initialAuthState: IAuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
};

// Persistent auth atom using MMKV storage
export const authAtom = atomWithStorage<IAuthState>('auth', initialAuthState, storage, {
  getOnInit: true,
});

// Unwrapped atom for synchronous access
const authAtomSync = unwrap(authAtom, (prev) => prev ?? initialAuthState);

// Derived atoms for convenience
export const isAuthenticatedAtom = atom((get) => get(authAtomSync).isAuthenticated);
export const currentUserAtom = atom((get) => get(authAtomSync).user);
export const authTokenAtom = atom((get) => get(authAtomSync).token);
export const userRoleAtom = atom((get) => get(authAtomSync).user?.role);

// Actions
export const loginAtom = atom(
  null,
  (
    get,
    set,
    { user, token, refreshToken }: { user: IAuthUser; token: string; refreshToken: string }
  ) => {
    set(authAtom, {
      isAuthenticated: true,
      user,
      token,
      refreshToken,
    });
  }
);

export const logoutAtom = atom(null, (get, set) => {
  set(authAtom, initialAuthState);
});

export const updateUserAtom = atom(null, (get, set, user: Partial<IAuthUser>) => {
  const currentAuth = get(authAtomSync);
  if (currentAuth.user) {
    set(authAtom, {
      ...currentAuth,
      user: { ...currentAuth.user, ...user },
    });
  }
});
