/** "45 min" or "1 h 10 min", with localized unit labels. */
export function formatMinutes(total: number, units: { h: string; min: string }): string {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (!h) return `${m} ${units.min}`;
  return m ? `${h} ${units.h} ${m} ${units.min}` : `${h} ${units.h}`;
}
