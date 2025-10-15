import { getDateDistance } from "./date";

export function getSafeDateDistance(date: Date | string | undefined | null): string {
  try {
    if (!date) {
      return "Recently";
    }
    
    // Convert Date object to ISO string if needed
    const dateString = date instanceof Date ? date.toISOString() : String(date);
    
    // Check if the date string is valid
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date value: ${dateString}`);
      return "Recently";
    }
    
    return getDateDistance(dateString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Recently";
  }
}