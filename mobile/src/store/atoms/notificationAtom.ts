import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { storage } from '../utils/storage';
import type {
  INotificationSettings,
  INotificationPermissions,
} from '@/features/notifications/types';

export interface INotificationState {
  unreadCount: number;
  settings: INotificationSettings;
  permissions: INotificationPermissions | null;
  lastSyncedAt: string | null;
}

const initialNotificationState: INotificationState = {
  unreadCount: 0,
  settings: {
    enabled: true,
    appointments: true,
    chat: true,
    promotions: true,
    system: true,
  },
  permissions: null,
  lastSyncedAt: null,
};

// Persistent notification atom using MMKV storage
export const notificationAtom = atomWithStorage<INotificationState>(
  'notifications',
  initialNotificationState,
  storage,
  { getOnInit: true }
);

// Derived atoms for convenience
export const unreadCountAtom = atom((get) => get(notificationAtom).unreadCount);
export const notificationSettingsAtom = atom((get) => get(notificationAtom).settings);
export const notificationPermissionsAtom = atom((get) => get(notificationAtom).permissions);

// Action atoms
export const setUnreadCountAtom = atom(null, (get, set, count: number) => {
  const current = get(notificationAtom);
  set(notificationAtom, {
    ...current,
    unreadCount: count,
  });
});

export const incrementUnreadCountAtom = atom(null, (get, set) => {
  const current = get(notificationAtom);
  set(notificationAtom, {
    ...current,
    unreadCount: current.unreadCount + 1,
  });
});

export const decrementUnreadCountAtom = atom(null, (get, set) => {
  const current = get(notificationAtom);
  set(notificationAtom, {
    ...current,
    unreadCount: Math.max(0, current.unreadCount - 1),
  });
});

export const clearUnreadCountAtom = atom(null, (get, set) => {
  const current = get(notificationAtom);
  set(notificationAtom, {
    ...current,
    unreadCount: 0,
  });
});

export const updateNotificationSettingsAtom = atom(
  null,
  (get, set, settings: Partial<INotificationSettings>) => {
    const current = get(notificationAtom);
    set(notificationAtom, {
      ...current,
      settings: {
        ...current.settings,
        ...settings,
      },
    });
  }
);

export const updateNotificationPermissionsAtom = atom(
  null,
  (get, set, permissions: INotificationPermissions) => {
    const current = get(notificationAtom);
    set(notificationAtom, {
      ...current,
      permissions,
    });
  }
);

export const updateLastSyncedAtAtom = atom(null, (get, set) => {
  const current = get(notificationAtom);
  set(notificationAtom, {
    ...current,
    lastSyncedAt: new Date().toISOString(),
  });
});

export const resetNotificationStateAtom = atom(null, (get, set) => {
  set(notificationAtom, initialNotificationState);
});
