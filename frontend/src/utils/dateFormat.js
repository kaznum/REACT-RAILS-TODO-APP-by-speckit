import { MESSAGES } from '../constants/messages';

/**
 * Format a date string to Japanese format (YYYY年MM月DD日)
 * @param {string} dateString - ISO date string (e.g., "2025-10-09")
 * @returns {string} Formatted Japanese date (e.g., "2025年10月9日") or "期限なし"
 */
export const formatJapaneseDate = (dateString) => {
  if (!dateString) return MESSAGES.status.noDeadline;

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return MESSAGES.status.noDeadline;

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
};

/**
 * Format a date string for HTML date input (YYYY-MM-DD)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date for input or empty string
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return '';

  return date.toISOString().split('T')[0];
};
