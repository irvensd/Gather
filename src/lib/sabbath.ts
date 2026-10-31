export interface SabbathPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

export const SABBATH_PLACES: readonly SabbathPlace[] = [
  { id: 'berrien-springs', name: 'Berrien Springs', latitude: 41.95, longitude: -86.42, timeZone: 'America/Detroit' },
  { id: 'collegedale', name: 'Collegedale', latitude: 35.05, longitude: -85.05, timeZone: 'America/New_York' },
  { id: 'loma-linda', name: 'Loma Linda', latitude: 34.05, longitude: -117.26, timeZone: 'America/Los_Angeles' },
  { id: 'silver-spring', name: 'Silver Spring', latitude: 39.0, longitude: -77.03, timeZone: 'America/New_York' },
  { id: 'london', name: 'London', latitude: 51.51, longitude: -0.13, timeZone: 'Europe/London' },
  { id: 'nairobi', name: 'Nairobi', latitude: -1.29, longitude: 36.82, timeZone: 'Africa/Nairobi' },
  { id: 'johannesburg', name: 'Johannesburg', latitude: -26.2, longitude: 28.05, timeZone: 'Africa/Johannesburg' },
  { id: 'sao-paulo', name: 'São Paulo', latitude: -23.55, longitude: -46.63, timeZone: 'America/Sao_Paulo' },
  { id: 'sydney', name: 'Sydney', latitude: -33.87, longitude: 151.21, timeZone: 'Australia/Sydney' },
  { id: 'manila', name: 'Manila', latitude: 14.6, longitude: 120.98, timeZone: 'Asia/Manila' },
];

export interface SabbathWindow {
  place: SabbathPlace;
  start: Date;
  end: Date;
  resting: boolean;
}

const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

/** Official sunset in UTC for a civil date. Returns null near the poles when the sun does not set. */
export function sunsetOn(year: number, month: number, day: number, latitude: number, longitude: number): Date | null {
  const zenith = 90.833;
  const n1 = Math.floor((275 * month) / 9);
  const n2 = Math.floor((month + 9) / 12);
  const n3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  const dayOfYear = n1 - n2 * n3 + day - 30;
  const lngHour = longitude / 15;
  const t = dayOfYear + (18 - lngHour) / 24;
  const meanAnomaly = 0.9856 * t - 3.289;
  let sunLongitude = meanAnomaly + 1.916 * Math.sin(toRad(meanAnomaly)) + 0.02 * Math.sin(toRad(2 * meanAnomaly)) + 282.634;
  sunLongitude = ((sunLongitude % 360) + 360) % 360;
  let rightAscension = toDeg(Math.atan(0.91764 * Math.tan(toRad(sunLongitude))));
  rightAscension = ((rightAscension % 360) + 360) % 360;
  const longitudeQuadrant = Math.floor(sunLongitude / 90) * 90;
  const ascensionQuadrant = Math.floor(rightAscension / 90) * 90;
  rightAscension = (rightAscension + (longitudeQuadrant - ascensionQuadrant)) / 15;
  const sinDeclination = 0.39782 * Math.sin(toRad(sunLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHour = (Math.cos(toRad(zenith)) - sinDeclination * Math.sin(toRad(latitude))) / (cosDeclination * Math.cos(toRad(latitude)));
  if (cosHour > 1 || cosHour < -1) return null;
  const hourAngle = toDeg(Math.acos(cosHour)) / 15;
  let universalTime = hourAngle + rightAscension - 0.06571 * t - 6.622 - lngHour;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (universalTime < 0) {
    universalTime += 24;
    date.setUTCDate(date.getUTCDate() - 1);
  } else if (universalTime >= 24) {
    universalTime -= 24;
    date.setUTCDate(date.getUTCDate() + 1);
  }
  const hours = Math.floor(universalTime);
  const minutes = Math.floor((universalTime - hours) * 60);
  const seconds = Math.floor(((universalTime - hours) * 60 - minutes) * 60);
  date.setUTCHours(hours, minutes, seconds, 0);
  return date;
}

function civilDate(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(instant);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday: WEEKDAY[value('weekday')] ?? 0,
  };
}

function addDays(year: number, month: number, day: number, amount: number) {
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function sabbathWindow(now: Date, place: SabbathPlace): SabbathWindow | null {
  const today = civilDate(now, place.timeZone);
  const daysSinceFriday = (today.weekday - 5 + 7) % 7;
  let friday = addDays(today.year, today.month, today.day, -daysSinceFriday);
  const build = (startDay: { year: number; month: number; day: number }) => {
    const saturday = addDays(startDay.year, startDay.month, startDay.day, 1);
    const start = sunsetOn(startDay.year, startDay.month, startDay.day, place.latitude, place.longitude);
    const end = sunsetOn(saturday.year, saturday.month, saturday.day, place.latitude, place.longitude);
    if (!start || !end) return null;
    return { start, end };
  };
  let window = build(friday);
  if (!window) return null;
  if (now.getTime() >= window.end.getTime()) {
    friday = addDays(friday.year, friday.month, friday.day, 7);
    window = build(friday);
    if (!window) return null;
  }
  const resting = now.getTime() >= window.start.getTime() && now.getTime() < window.end.getTime();
  return { place, start: window.start, end: window.end, resting };
}

export function formatSabbathTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date);
}

export function sabbathPlaceById(id: string): SabbathPlace {
  return SABBATH_PLACES.find((place) => place.id === id) ?? SABBATH_PLACES[0]!;
}
