import { formatDistanceToNow, parseISO, format } from "date-fns";

const FORMAT_LONG = "EEEE, MMMM d, yyyy";
const FORMAT_SHORT = "MMMM dd, yyyy";

const dateCache = new Map<string, Date>();


export const getDateDistance = (date: string) => {
  try {
    const result = formatDistanceToNow(parseISO(date), {
      addSuffix: true,
    });
    return result;
  } catch (error) {
    console.error('Date formatting error:', error, 'for date:', date);
    // Fallback to simple format
    const d = new Date(date);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days > 0) return `${days} days ago`;
    if (days === -1) return "tomorrow";
    if (days < 0) return `in ${Math.abs(days)} days`;
    return "unknown date";
  }
};


export const normalizeDate = (date: string | Date): string =>
  date instanceof Date ? date.toISOString() : date;

const getParsedDate = (dateString: string): Date => {
  if (dateCache.has(dateString)) {
    return dateCache.get(dateString)!;
  }

  const parsedDate = parseISO(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date value provided.");
  }

  dateCache.set(dateString, parsedDate);
  return parsedDate;
};

export const formatDate = (
  date: string | Date,
  formatType: "long" | "short" = "long"
) => {
  // Ensure that the date is a valid Date string
  const dateString = date instanceof Date ? date.toISOString() : date;

  // Get parsed date from cache or parse it
  const parsedDate = getParsedDate(dateString);

  // Format the date based on the requested format
  return format(parsedDate, formatType === "short" ? FORMAT_SHORT : FORMAT_LONG);
};