import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Score formatting
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  return score.toFixed(1);
}

// Severity color mapping
export function getSeverityColor(severity: string): string {
  const colors = {
    'Critical': 'bg-red-100 text-red-800',
    'High': 'bg-orange-100 text-orange-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800'
  };
  return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

// Status color mapping
export function getStatusColor(status: string): string {
  const colors = {
    'Open': 'bg-red-100 text-red-800',
    'Mitigating': 'bg-yellow-100 text-yellow-800',
    'Fixed': 'bg-green-100 text-green-800',
    'Accepted': 'bg-blue-100 text-blue-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}
