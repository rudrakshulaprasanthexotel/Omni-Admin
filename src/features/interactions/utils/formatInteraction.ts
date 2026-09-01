const pad = (n: number) => String(n).padStart(2, '0');

export const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const formatShortDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleString(undefined, { month: 'short', day: '2-digit' });
  const time = date.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day}, ${time}`;
};

/** Timeline stamps match the Interaction Detail spec: `Feb 10, 13:07`. */
export const formatTimelineDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const time = date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${month} ${day}, ${time}`;
};

export const EMPTY_VALUE = '-';

export const displayValue = (value: string | number | undefined | null) => {
  if (value == null) return EMPTY_VALUE;
  const trimmed = String(value).trim();
  return trimmed !== '' && trimmed !== '—' ? trimmed : EMPTY_VALUE;
};

export const isPresent = (
  value: string | number | undefined | null,
): value is string | number => {
  if (value == null) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  const trimmed = value.trim();
  return trimmed !== '' && trimmed !== '—' && trimmed !== EMPTY_VALUE;
};

export const humanizeKey = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
