/**
 * AddressAutocomplete Component
 * Uses Nominatim API for address suggestions with debouncing.
 * Follows AGENTS.md guidelines: 300ms debounce, 1 req/sec rate limit,
 * User-Agent: CloudClips/1.0 header.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, FlatList } from 'react-native';

interface INominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface IAddressAutocompleteProps {
  value: string;
  onAddressSelect: (address: string, coords: { lat: number; lng: number }) => void;
  placeholder?: string;
}

export function AddressAutocomplete({
  value,
  onAddressSelect,
  placeholder = 'Enter your full address',
}: IAddressAutocompleteProps) {
  const [inputText, setInputText] = useState(value);
  const [results, setResults] = useState<INominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Refs for debouncing and rate limiting
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external value changes (e.g., when form resets)
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const fetchSuggestions = useCallback(async (query: string) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      setIsLoading(false);
      return;
    }

    // Rate limit: ensure at least 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    if (timeSinceLastRequest < 1000) {
      const waitTime = 1000 - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CloudClips/1.0',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Nominatim request failed: ${response.status}`);
      }

      const data: INominatimResult[] = await response.json();
      lastRequestTimeRef.current = Date.now();

      setResults(data);
      setShowDropdown(data.length > 0);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      setResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);

      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce by 300ms
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(text);
      }, 300);
    },
    [fetchSuggestions]
  );

  const handleResultSelect = useCallback(
    (result: INominatimResult) => {
      setInputText(result.display_name);
      setShowDropdown(false);
      setResults([]);

      onAddressSelect(result.display_name, {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      });
    },
    [onAddressSelect]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const renderResultItem = useCallback(
    ({ item }: { item: INominatimResult }) => (
      <Pressable
        className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
        onPress={() => handleResultSelect(item)}
      >
        <Text className="text-sm text-gray-800" numberOfLines={2}>
          {item.display_name}
        </Text>
      </Pressable>
    ),
    [handleResultSelect]
  );

  return (
    <View className="relative z-10">
      <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-3">
        <TextInput
          className="flex-1 text-base text-gray-900"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={handleTextChange}
          autoCorrect={false}
        />
        {isLoading && <ActivityIndicator size="small" color="#0066CC" className="ml-2" />}
      </View>

      {showDropdown && results.length > 0 && (
        <View
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 overflow-hidden"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.place_id)}
            renderItem={renderResultItem}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}
