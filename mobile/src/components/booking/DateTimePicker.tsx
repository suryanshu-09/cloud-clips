/**
 * DateTimePicker Component
 * Custom date and time picker for appointment scheduling.
 *
 * Displays a horizontal scrollable calendar (next 14 days) and,
 * once a date is selected, shows the available time slots returned
 * by the Convex checkAvailability query.
 *
 * All dates/times are handled as numeric timestamps (milliseconds)
 * to stay consistent with IBookingSchedule.
 */

import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IDateTimePickerProps {
  /** Timestamp of the currently selected date (start-of-day ms) */
  selectedDate?: number;
  /** Timestamp of the currently selected time slot */
  selectedTime?: number;
  /** Called when the user taps a date tile */
  onDateSelect: (dateTimestamp: number) => void;
  /** Called when the user taps a time slot */
  onTimeSelect: (timeTimestamp: number) => void;
  /** Available time-slot strings for the selected date (e.g. ["09:00","09:30"]) */
  availableSlots?: string[];
  /** Whether the slots for the selected date are still loading */
  isSlotsLoading?: boolean;
  /** Number of days to display in the calendar strip */
  daysToShow?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an array of start-of-day timestamps for the next N days. */
function generateDateRange(days: number): number[] {
  const result: number[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    result.push(d.getTime());
  }

  return result;
}

/** Human-friendly date label. */
function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Day-of-month number (e.g. "14"). */
function formatDayNumber(timestamp: number): string {
  return new Date(timestamp).getDate().toString();
}

/** Short weekday (e.g. "Mon"). */
function formatWeekday(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
}

/** Convert a time string like "09:30" into a display label like "9:30 AM". */
function formatTimeString(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** Convert a time string (e.g. "09:30") + a day timestamp into a full timestamp. */
function timeStringToTimestamp(timeStr: string, dayTimestamp: number): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(dayTimestamp);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  availableSlots = [],
  isSlotsLoading = false,
  daysToShow = 14,
}: IDateTimePickerProps) {
  const dateRange = useMemo(() => generateDateRange(daysToShow), [daysToShow]);

  /** Whether a specific date tile is the selected one. */
  const isDateSelected = (dayTs: number) => selectedDate === dayTs;

  /** Check if a past date (before today). */
  const isPastDate = (dayTs: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayTs < today.getTime();
  };

  return (
    <View className="gap-6">
      {/* ----------------------------------------------------------------- */}
      {/* Date Selection Strip                                              */}
      {/* ----------------------------------------------------------------- */}
      <View>
        <Text className="text-lg font-semibold text-gray-900 mb-3">Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {dateRange.map((dayTs) => {
            const selected = isDateSelected(dayTs);
            const past = isPastDate(dayTs);

            return (
              <Pressable
                key={dayTs}
                onPress={() => !past && onDateSelect(dayTs)}
                disabled={past}
                className={`
                  items-center px-4 py-3 rounded-xl border-2 min-w-[72px]
                  ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}
                  ${past ? 'opacity-40' : 'active:scale-95'}
                `}
              >
                <Text
                  className={`text-xs font-medium ${selected ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  {formatWeekday(dayTs)}
                </Text>
                <Text
                  className={`text-xl font-bold mt-0.5 ${selected ? 'text-blue-600' : 'text-gray-900'}`}
                >
                  {formatDayNumber(dayTs)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected date label */}
        {selectedDate !== undefined && (
          <Text className="text-sm text-gray-500 mt-2">{formatDateLabel(selectedDate)}</Text>
        )}
      </View>

      {/* ----------------------------------------------------------------- */}
      {/* Time Slots                                                        */}
      {/* ----------------------------------------------------------------- */}
      {selectedDate !== undefined && (
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">Select Time</Text>

          {/* Loading state */}
          {isSlotsLoading && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-sm text-gray-500 mt-3">Loading available times…</Text>
            </View>
          )}

          {/* Available slots */}
          {!isSlotsLoading && availableSlots.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {availableSlots.map((timeStr) => {
                const slotTs = timeStringToTimestamp(timeStr, selectedDate);
                const isSelected = selectedTime === slotTs;

                return (
                  <Pressable
                    key={timeStr}
                    onPress={() => onTimeSelect(slotTs)}
                    className={`
                      px-4 py-2.5 rounded-lg border-2
                      ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}
                      active:scale-95
                    `}
                  >
                    <Text
                      className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}
                    >
                      {formatTimeString(timeStr)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Empty state — no slots available */}
          {!isSlotsLoading && availableSlots.length === 0 && (
            <View className="py-8 px-4 bg-gray-50 rounded-xl">
              <Text className="text-sm text-gray-600 text-center font-medium">
                No available time slots for this date
              </Text>
              <Text className="text-xs text-gray-400 text-center mt-1">
                Try selecting a different date
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Prompt to select a date */}
      {selectedDate === undefined && (
        <View className="py-6 px-4 bg-blue-50 rounded-xl">
          <Text className="text-sm text-blue-600 text-center font-medium">
            Select a date above to view available time slots
          </Text>
        </View>
      )}
    </View>
  );
}
