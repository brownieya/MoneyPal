export function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

export function formatCompactDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function startOfWeek(): Date {
  const date = startOfToday();
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date;
}

export function startOfMonth(): Date {
  const date = startOfToday();
  date.setDate(1);
  return date;
}

export function isSameDay(left: string, right: string): boolean {
  const first = new Date(left);
  const second = new Date(right);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function formatDaySectionTitle(dateString: string): string {
  const date = new Date(dateString);
  const today = startOfToday();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date.toISOString(), today.toISOString())) {
    return '今天';
  }

  if (isSameDay(date.toISOString(), yesterday.toISOString())) {
    return '昨天';
  }

  return formatCompactDate(dateString);
}
