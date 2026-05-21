export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0) {
    const remaining = m > 0 ? ` ${m} min` : '';
    return `${h}h${remaining}`;
  }
  return `${m} min`;
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  if (h >= 1000) {
    return `${(h / 1000).toFixed(1)}K`;
  }
  if (h >= 100) {
    return h.toString();
  }
  return h.toString();
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
