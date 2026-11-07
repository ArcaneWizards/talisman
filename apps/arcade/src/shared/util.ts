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
