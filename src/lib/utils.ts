import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTMDBImageUrl(
  path: string | null | undefined,
  size: 'w92' | 'w154' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w342'
): string {
  if (!path) return '/placeholder-poster.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function formatYear(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getFullYear())) {
    // If it's already a year string like "2024"
    const match = String(dateStr).match(/\d{4}/);
    return match ? match[0] : 'N/A';
  }
  return parsed.getFullYear().toString();
}

export function formatRating(rating?: number | null): string {
  if (rating === undefined || rating === null || Number.isNaN(rating)) return 'NR';
  return rating.toFixed(1);
}

export function formatRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}
