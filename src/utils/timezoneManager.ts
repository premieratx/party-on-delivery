/**
 * Central timezone management for the entire application
 * Ensures CST (America/Chicago) is used consistently everywhere
 */

import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { parseISO, isValid } from 'date-fns';

// Central timezone configuration
const APP_TIMEZONE = 'America/Chicago';

// Save timezone preference permanently
export const initializeTimezone = () => {
  localStorage.setItem('app_timezone', APP_TIMEZONE);
  localStorage.setItem('timezone_preference_saved', 'true');
};

// Get the app timezone (always CST)
export const getAppTimezone = (): string => {
  // Always return CST, but initialize localStorage if not set
  if (!localStorage.getItem('app_timezone')) {
    initializeTimezone();
  }
  return APP_TIMEZONE;
};

// Convert any date to app timezone (CST)
export const toAppTimezone = (date: Date | string): Date => {
  let parsedDate: Date;
  
  if (typeof date === 'string') {
    parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      parsedDate = new Date(date);
    }
  } else {
    parsedDate = date;
  }
  
  return toZonedTime(parsedDate, getAppTimezone());
};

// Format date in app timezone
export const formatInAppTimezone = (
  date: Date | string, 
  formatStr: string = 'yyyy-MM-dd HH:mm:ss zzz'
): string => {
  const zonedDate = toAppTimezone(date);
  return format(zonedDate, formatStr, { timeZone: getAppTimezone() });
};

// Format delivery dates consistently
export const formatDeliveryDate = (
  dateString: string, 
  formatString: string = 'EEEE, MMMM do, yyyy'
): string => {
  const date = new Date(dateString);
  return formatInAppTimezone(date, formatString);
};

// Parse delivery date with CST timezone
export const parseDeliveryDate = (dateString: string): Date => {
  if (!dateString) return toAppTimezone(new Date());
  
  // If already has time component, convert to CST
  if (dateString.includes('T')) {
    return toAppTimezone(dateString);
  }
  
  // Add noon time to avoid timezone issues
  return toAppTimezone(dateString + 'T12:00:00');
};

// Get current date/time in app timezone
export const nowInAppTimezone = (): Date => {
  return toAppTimezone(new Date());
};

// Check if date is today in app timezone
export const isTodayInAppTimezone = (date: Date | string): boolean => {
  const today = nowInAppTimezone();
  const checkDate = toAppTimezone(date);
  
  return (
    today.getFullYear() === checkDate.getFullYear() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getDate() === checkDate.getDate()
  );
};

// Initialize timezone on module load
initializeTimezone();