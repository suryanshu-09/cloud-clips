import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

export interface INetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
}

/**
 * Hook to monitor network connectivity status
 * Returns current network state and provides utilities for offline handling
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<INetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    isWifi: false,
    isCellular: false,
  });
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const updateNetworkStatus = useCallback(
    (state: NetInfoState) => {
      const newStatus: INetworkStatus = {
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      };

      setNetworkStatus(newStatus);

      // Consider offline if no connection or internet is explicitly not reachable
      const offline = state.isConnected === false || state.isInternetReachable === false;

      if (offline && !isOffline) {
        setWasOffline(true);
      }

      setIsOffline(offline);
    },
    [isOffline]
  );

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(updateNetworkStatus);

    // Subscribe to network state changes
    const unsubscribe: NetInfoSubscription = NetInfo.addEventListener(updateNetworkStatus);

    // Also check when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        NetInfo.fetch().then(updateNetworkStatus);
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [updateNetworkStatus]);

  // Function to manually refresh network status
  const refreshStatus = useCallback(async () => {
    const state = await NetInfo.fetch();
    updateNetworkStatus(state);
    return state;
  }, [updateNetworkStatus]);

  // Reset the wasOffline flag (call after syncing data)
  const acknowledgeOnline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    ...networkStatus,
    isOffline,
    wasOffline,
    refreshStatus,
    acknowledgeOnline,
  };
}
