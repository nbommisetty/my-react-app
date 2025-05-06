// src/holidays.ts
// For simplicity, using a static list of US federal holidays for 2025.
// In a real app, this might come from an API or a more dynamic configuration.
import { parseISO, isEqual, format, isValid as isValidDateFns } from 'date-fns';

// Array of holiday date strings in 'yyyy-MM-dd' format
const US_HOLIDAYS_2025_STRINGS: string[] = [
  "2025-01-01", // New Year's Day
  "2025-01-20", // Martin Luther King, Jr. Day
  "2025-02-17", // Washington's Birthday (Presidents' Day)
  "2025-05-26", // Memorial Day
  "2025-06-19", // Juneteenth National Independence Day
  "2025-07-04", // Independence Day
  "2025-09-01", // Labor Day
  "2025-10-13", // Columbus Day
  "2025-11-11", // Veterans Day
  "2025-11-27", // Thanksgiving Day
  "2025-12-25", // Christmas Day
];

// Parse the string dates into Date objects
const US_HOLIDAYS_2025: Date[] = US_HOLIDAYS_2025_STRINGS.map(dateStr => parseISO(dateStr));

/**
 * Checks if a given date is a public holiday.
 * @param {Date} date The date to check.
 * @returns {boolean} True if the date is a holiday, false otherwise.
 */
export function isPublicHoliday(date: Date): boolean {
  // Check if the input is a valid Date object
  if (!(date instanceof Date) || !isValidDateFns(date)) {
    return false;
  }
  // Normalize the date to ignore time components for comparison by formatting and re-parsing
  // This ensures we are comparing just the date part.
  const dateToCheck = parseISO(format(date, 'yyyy-MM-dd'));
  
  // Check if dateToCheck is valid after parsing (format might return invalid string for invalid input date)
  if (!isValidDateFns(dateToCheck)) {
      return false;
  }

  return US_HOLIDAYS_2025.some(holiday => 
    isValidDateFns(holiday) && isEqual(dateToCheck, holiday)
  );
}

/**
 * Checks if a given date is a weekend (Saturday or Sunday).
 * @param {Date} date The date to check.
 * @returns {boolean} True if the date is a weekend, false otherwise.
 */
export function isWeekend(date: Date): boolean {
  // Check if the input is a valid Date object
  if (!(date instanceof Date) || !isValidDateFns(date)) {
    return false;
  }
  const day = date.getDay(); // Sunday - 0, Saturday - 6
  return day === 0 || day === 6;
}
