export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export function* filter<T>(
  iterable: Iterable<T>,
  predicate: (value: T) => boolean,
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
