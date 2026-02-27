/**
 * Timezone handling utilities for availability and booking functions.
 * Uses standard Date APIs only (no external dependencies).
 */

/**
 * Converts a date string and time string to a UTC timestamp in milliseconds.
 *
 * @param dateStr - Date in 'YYYY-MM-DD' format
 * @param timeStr - Time in 'HH:mm' format
 * @returns UTC timestamp in milliseconds
 */
export function toUTCTimestamp(dateStr: string, timeStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  return date.getTime();
}

/**
 * Converts a UTC timestamp to date, time, and day-of-week components.
 *
 * @param timestamp - UTC timestamp in milliseconds
 * @returns Object with date ('YYYY-MM-DD'), time ('HH:mm'), and dayOfWeek (0=Sunday, 6=Saturday)
 */
export function fromTimestamp(timestamp: number): {
  date: string;
  time: string;
  dayOfWeek: number;
} {
  const d = new Date(timestamp);

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    dayOfWeek: d.getUTCDay(),
  };
}

/**
 * Returns the start-of-day and end-of-day UTC timestamps for a given date.
 *
 * @param dateStr - Date in 'YYYY-MM-DD' format
 * @returns Object with startOfDay and endOfDay timestamps in milliseconds
 */
export function getDateRange(dateStr: string): {
  startOfDay: number;
  endOfDay: number;
} {
  const [year, month, day] = dateStr.split("-").map(Number);

  const startOfDay = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = Date.UTC(year, month - 1, day, 23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

/**
 * Formats a UTC timestamp as a time string in 'HH:mm' format.
 *
 * @param timestamp - UTC timestamp in milliseconds
 * @returns Time string in 'HH:mm' format
 */
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
