/**
 * Date utilities for LMNL app
 * Handles timezone-aware operations for daily limit resets
 */
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
  startOfDay,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

/**
 * Get the start of day in user's timezone
 */
export function getLocalDayStart(timezone: string = 'UTC'): Date {
  const now = new Date();
  // For simplicity, we use the device's local timezone
  // In production, you'd use a library like date-fns-tz for proper timezone handling
  return startOfDay(now);
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(dateString: string): string {
  const date = parseISO(dateString);
  const now = new Date();
  const minutesDiff = differenceInMinutes(now, date);
  const hoursDiff = differenceInHours(now, date);
  const daysDiff = differenceInDays(now, date);

  if (minutesDiff < 1) {
    return 'Just now';
  } else if (minutesDiff < 60) {
    return `${minutesDiff}m`;
  } else if (hoursDiff < 24) {
    return `${hoursDiff}h`;
  } else if (daysDiff < 7) {
    return `${daysDiff}d`;
  } else {
    return format(date, 'MMM d');
  }
}

/**
 * Format a date for post display
 */
export function formatPostDate(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return format(date, "'Today at' h:mm a");
  } else if (isYesterday(date)) {
    return format(date, "'Yesterday at' h:mm a");
  } else {
    return format(date, 'MMM d, yyyy');
  }
}

/**
 * Get relative time description
 */
export function getRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format time until midnight (for daily reset)
 */
export function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Check if a date is today in local timezone
 */
export function isDateToday(dateString: string): boolean {
  const date = parseISO(dateString);
  return isToday(date);
}

/**
 * Get current date as YYYY-MM-DD string
 */
export function getCurrentDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Format notification time
 */
export function formatNotificationTime(dateString: string): string {
  const date = parseISO(dateString);
  const now = new Date();
  const hoursDiff = differenceInHours(now, date);

  if (hoursDiff < 1) {
    const minutesDiff = differenceInMinutes(now, date);
    if (minutesDiff < 1) return 'now';
    return `${minutesDiff}m ago`;
  } else if (hoursDiff < 24) {
    return `${hoursDiff}h ago`;
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
}
