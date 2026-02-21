/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export const formatDateISO = (date: Date = new Date()): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Parse ISO date string from various formats
 * Handles: "2025-02-21", "2025-02-21T10:30:00", "2025-02-21 10:30:00"
 */
export const parseISODate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return formatDateISO();
  }

  // Extract date part (YYYY-MM-DD)
  const datePart = dateString.split("T")[0].split(" ")[0];
  return datePart || formatDateISO();
};

/**
 * Get current date in ISO format
 */
export const getCurrentDateISO = (): string => {
  return formatDateISO();
};

/**
 * Get current time in HH:MM:SS format
 */
export const getCurrentTimeGB = (): string => {
  return new Date().toLocaleTimeString("en-GB");
};

/**
 * Combine date and time into timestamp
 */
export const createTimestamp = (dateISO: string, timeGB?: string): string => {
  const time = timeGB || getCurrentTimeGB();
  return `${dateISO} ${time}`;
};
