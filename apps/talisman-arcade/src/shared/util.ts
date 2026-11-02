export type BufferSlice<T> = {
  slice: T[];
  /**
   * The index of the first item in the slice.
   *
   * Will be `received - slice.length`
   */
  startIndex: number;
  /**
   * The total number of items received
   */
  received: number;
};

export class CircularBuffer<T> {
  private readonly _buffer: T[];
  /**
   * The index of the next slot to write to in the circular buffer.
   */
  private _index = 0;
  /**
   * The total number of messages that have been added to the buffer.
   */
  private _received = 0;

  public constructor(private readonly size: number) {
    if (size <= 0) {
      throw new Error('Size of MessageBuffer must be greater than 0.');
    }
    this._buffer = new Array<T>(size);
  }

  /**
   * Add an item to the buffer, returning the number of items received so far.
   */
  public add = (message: T): number => {
    this._buffer[this._index] = message;
    this._received++;
    this._index = (this._index + 1) % this.size;
    return this._received;
  };

  /**
   * Get all available messages from the given index.
   *
   * If the requested index is older than the available messages,
   * it will return all available messages.
   */
  public getFromIndex = (from: number): BufferSlice<T> => {
    if (from < 0) {
      throw new Error(`Invalid index ${from}`);
    }
    /**
     * How far behind the current index the requested index is.
     */
    let backtrack = this._received - from;

    if (backtrack < 0) {
      throw new Error(
        `Requested index ${from} is ahead of the current received index ${this._received}.`,
      );
    }

    if (backtrack > this.size) {
      backtrack = this.size;
    }

    /**
     * The actual index in the circular buffer corresponding to the requested starting point.
     *
     * We then later use this value as the iterated index for lookup to avoid
     * expensive mod operations
     */
    let index = this._index - backtrack;
    while (index < 0) {
      index += this.size;
    }

    const totalResults = Math.min(backtrack, this.size, this._received);
    const slice: T[] = new Array(totalResults);
    for (let i = 0; i < totalResults; i++) {
      const nextVal = this._buffer[index];
      if (nextVal === undefined) {
        throw new Error(
          `Unexpected undefined in MessageBuffer at index ${index}.`,
        );
      }
      slice[i] = nextVal;
      index = index + 1;
      if (index >= this.size) {
        index -= this.size;
      }
    }
    return {
      slice,
      startIndex: this._received - backtrack,
      received: this._received,
    };
  };

  public getAllAvailable = (): BufferSlice<T> => {
    return this.getFromIndex(Math.max(0, this._received - this.size));
  };
}
