export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export function filter<I, O extends I = I>(
  iterable: Iterable<I>,
  predicate: (value: I) => value is O,
  first?: number,
): Iterable<O>;
export function filter<I>(
  iterable: Iterable<I>,
  predicate: (value: I) => boolean,
  first?: number,
): Iterable<I>;
export function* filter<I>(
  iterable: Iterable<I>,
  predicate: (value: I) => boolean,
  first?: number,
) {
  let count = 0;
  for (const value of iterable) {
    if (predicate(value)) {
      yield value;
      count++;
      if (first !== undefined && count >= first) {
        break;
      }
    }
  }
}
/**
 * Display the given number of milliseconds in a nice format to the user
 */
export const displayMillis = (totalMilliseconds: number): string => {
  let remaining = totalMilliseconds;
  const mins = (remaining / 60000) | 0;
  remaining -= mins * 60000;
  const seconds = (remaining / 1000) | 0;
  remaining -= seconds * 1000;
  const millis = remaining | 0;
  return (
    mins +
    ':' +
    (seconds < 10 ? '0' : '') +
    seconds +
    ':' +
    (millis < 10 ? '00' : millis < 100 ? '0' : '') +
    millis
  );
};
