import { describe, it, expect } from '@jest/globals';
import { getBitArrays, renderText } from './text';

describe('getBitArrays', () => {
  it('test a single character for 4x5', () => {
    const result = getBitArrays('4x5');

    // prettier-ignore
    expect(result['8']?.map((x) => x ? 1 : 0)).toEqual([
      1, 1, 1, 1,
      1, 0, 0, 1,
      1, 1, 1, 1,
      1, 0, 0, 1,
      1, 1, 1, 1,
    ]);
  });
  it('test a single character for 5x7', () => {
    const result = getBitArrays('5x7');

    // prettier-ignore
    expect(result['0']?.map((x) => x ? 1 : 0)).toEqual([
      0, 1, 1, 1, 0,
      1, 0, 0, 0, 1,
      1, 0, 0, 1, 1,
      1, 0, 1, 0, 1,
      1, 1, 0, 0, 1,
      1, 0, 0, 0, 1,
      0, 1, 1, 1, 0,
    ]);
  });
  it('test a single character for 6x8', () => {
    const result = getBitArrays('6x8');

    // prettier-ignore
    expect(result['0']?.map((x) => x ? 1 : 0)).toEqual([
      0, 1, 1, 1, 1, 0,
      1, 0, 0, 0, 0, 1,
      1, 0, 0, 0, 1, 1,
      1, 0, 0, 1, 0, 1,
      1, 0, 1, 0, 0, 1,
      1, 1, 0, 0, 0, 1,
      1, 0, 0, 0, 0, 1,
      0, 1, 1, 1, 1, 0,
    ]);
  });
});

describe('renderText', () => {
  it('test a single character for 4x5', () => {
    const render = renderText('4x5', ['9']).getValue;
    const result = Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 4 }).map((_, c) => (render(c, 4 - r) ? 1 : 0)),
    );

    expect(result).toEqual([
      [1, 1, 1, 1],
      [1, 0, 0, 1],
      [1, 1, 1, 1],
      [0, 0, 0, 1],
      [1, 1, 1, 1],
    ]);
  });
  it('multiple characters at default padding 4x5', () => {
    const render = renderText('4x5', ['1', '2', '3']).getValue;
    const result = Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 16 }).map((_, c) => (render(c, 4 - r) ? 1 : 0)),
    );

    expect(result).toEqual([
      [0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    ]);
  });
});
