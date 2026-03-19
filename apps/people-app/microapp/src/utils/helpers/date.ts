const TIME_ZONE = "Asia/Colombo";

/**
 * Returns today's date in `YYYY-MM-DD` for Asia/Colombo timezone.
 * Backend validates that reservations are for same-day (Sri Lanka time).
 */
export function getTodayBookingDate(): string {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // en-CA => YYYY-MM-DD
  return dtf.format(now);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Formats a `YYYY-MM-DD` booking date into `Mon DD, YYYY`.
 */
export function formatBookingDate(dateYYYYMMDD: string): string {
  const [y, m, d] = dateYYYYMMDD.split("-").map((v) => Number(v));
  const parsed = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return parsed.toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

