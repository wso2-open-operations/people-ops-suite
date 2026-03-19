import type { DecimalLike } from "@/types/parking";

export function toNumber(value: DecimalLike): number {
  return typeof value === "string" ? Number(value) : value;
}

export function formatCoins(value: DecimalLike, fractionDigits = 2): string {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(fractionDigits);
}

