import { describe, it, expect } from '@jest/globals';
import { getBitArrays } from './text';

describe('getBitArrays', () => {
  it('test a single character for 4x5', () => {
    const result = getBitArrays('4x5');

    // prettier-ignore
    expect(result['8']).toEqual([
      true, true, true, true,
      true, false, false, true,
      true, true, true, true,
      true, false, false, true,
      true, true, true, true,
    ]);
  });
});
