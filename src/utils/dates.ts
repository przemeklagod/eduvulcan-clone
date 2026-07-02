/**
 * Hebe date/datetime fields are plain strings like "2026-01-15" or
 * "2026-01-15 08:30:00" (VulcanDateTimeSerializer / VulcanDateSerializer output),
 * not a nested date object.
 */
export function formatHebeDate(value: string): string {
  const datePart = value.split(/[ T]/)[0];
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateForApi(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Monday-to-Sunday range containing `date`, as API-formatted date strings. */
export function getWeekRange(date: Date): { dateFrom: string; dateTo: string } {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { dateFrom: formatDateForApi(monday), dateTo: formatDateForApi(sunday) };
}

/** e.g. "13.01 - 19.01.2026" for the Monday-to-Sunday week containing `date`. */
export function formatWeekRangeLabel(date: Date): string {
  const { dateFrom, dateTo } = getWeekRange(date);
  const [fromY, fromM, fromD] = dateFrom.split('-');
  const [toY, toM, toD] = dateTo.split('-');
  return `${fromD}.${fromM} - ${toD}.${toM}.${toY}`;
}
