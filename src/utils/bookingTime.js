export function validDuration(value, fallback = 30) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.max(Math.round(parsed), 1), 24 * 60);
}
function minutesOfDay(value) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value || '').trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
export function bookingEndTime(start, durationMinutes) {
  const startMinutes = minutesOfDay(start);
  const duration = validDuration(durationMinutes, 0);
  if (startMinutes == null || duration <= 0) return null;
  const total = (startMinutes + duration) % (24 * 60);
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}
export function bookingIntervalLabel(start, durationMinutes) {
  const duration = validDuration(durationMinutes);
  const end = bookingEndTime(start, duration);
  return end ? start + '–' + end + ' · ' + duration + ' min' : start + ' · ' + duration + ' min';
}
export function elapsedBookingMinutes(start, end) {
  const startMinutes = minutesOfDay(start);
  const endMinutes = minutesOfDay(end);
  if (startMinutes == null || endMinutes == null) return null;
  const elapsed = endMinutes - startMinutes;
  return elapsed < 0 ? elapsed + 24 * 60 : elapsed;
}