import { sabbathWindow, sunsetOn, SABBATH_PLACES } from '@/lib/sabbath';

const berrien = SABBATH_PLACES[0]!;

function localHour(date: Date, timeZone: string) {
  const hour = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(date);
  return Number(hour);
}

describe('sabbath quiet hours', () => {
  it('places a summer and winter sunset in the evening', () => {
    const summer = sunsetOn(2026, 6, 21, berrien.latitude, berrien.longitude);
    const winter = sunsetOn(2026, 12, 21, berrien.latitude, berrien.longitude);
    expect(summer).not.toBeNull();
    expect(winter).not.toBeNull();
    expect(localHour(summer!, berrien.timeZone)).toBeGreaterThanOrEqual(20);
    expect(localHour(summer!, berrien.timeZone)).toBeLessThanOrEqual(22);
    expect(localHour(winter!, berrien.timeZone)).toBeGreaterThanOrEqual(16);
    expect(localHour(winter!, berrien.timeZone)).toBeLessThanOrEqual(18);
  });

  it('rests from Friday sunset until Saturday sunset', () => {
    const fridayEvening = new Date('2026-10-31T00:30:00Z');
    const window = sabbathWindow(fridayEvening, berrien);
    expect(window).not.toBeNull();
    expect(window!.end.getTime()).toBeGreaterThan(window!.start.getTime());
    expect(window!.end.getTime() - window!.start.getTime()).toBeGreaterThan(22 * 60 * 60 * 1000);
    expect(window!.end.getTime() - window!.start.getTime()).toBeLessThan(26 * 60 * 60 * 1000);
    const during = new Date(window!.start.getTime() + 60 * 60 * 1000);
    const before = new Date(window!.start.getTime() - 60 * 60 * 1000);
    expect(sabbathWindow(during, berrien)?.resting).toBe(true);
    expect(sabbathWindow(before, berrien)?.resting).toBe(false);
  });
});
