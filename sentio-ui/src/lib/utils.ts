import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function getSentimentColor(label: string): string {
  switch (label.toUpperCase()) {
    case "POSITIVE":
      return "text-positive";
    case "NEGATIVE":
      return "text-negative";
    case "NEUTRAL":
    default:
      return "text-neutral";
  }
}

export function getSentimentBgColor(label: string): string {
  switch (label.toUpperCase()) {
    case "POSITIVE":
      return "bg-positive/20 text-positive border-positive/30";
    case "NEGATIVE":
      return "bg-negative/20 text-negative border-negative/30";
    case "NEUTRAL":
    default:
      return "bg-neutral/20 text-neutral border-neutral/30";
  }
}

export function clampSentiment(value: number): number {
  return Math.min(Math.max(value, -1), 1);
}
