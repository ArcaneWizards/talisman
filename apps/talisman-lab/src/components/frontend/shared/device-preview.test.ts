import { describe, it, expect } from '@jest/globals';

import { createGridInfo } from './device-preview';

describe('createGridInfo', () => {
  it('no items should return null', () => {
    expect(createGridInfo([])).toBeNull();
  });
  it('items with no coordinates should return null', () => {
    expect(
      createGridInfo([
        {
          id: '1',
        },
        {
          id: '2',
        },
        {
          id: '3',
        },
      ]),
    ).toBeNull();
  });
  it('non-overlapping single-cell items', () => {
    expect(
      createGridInfo([
        {
          id: '1',
          position: { col: 0, row: 0 },
        },
        {
          id: '2',
          position: { col: 1, row: 0 },
        },
        {
          id: '3',
          position: { col: 1, row: 1 },
        },
      ]),
    ).toEqual({
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1,
      cols: 2,
      rows: 2,
      cells: [
        {
          type: 'visible',
          span: { cols: [0, 0], rows: [0, 0] },
          items: [{ id: '1', position: { col: 0, row: 0 } }],
        },
        {
          type: 'visible',
          span: { cols: [1, 1], rows: [0, 0] },
          items: [{ id: '2', position: { col: 1, row: 0 } }],
        },
        {
          type: 'visible',
          span: { cols: [1, 1], rows: [1, 1] },
          items: [{ id: '3', position: { col: 1, row: 1 } }],
        },
      ],
    });
  });
  it('non-overlapping multi-cell items', () => {
    expect(
      createGridInfo([
        {
          id: '1',
          position: { col: 0, row: [0, 2] },
        },
        {
          id: '2',
          position: { col: [1, 2], row: 0 },
        },
        {
          id: '3',
          position: { col: [1, 2], row: [1, 2] },
        },
      ]),
    ).toEqual({
      minX: 0,
      minY: 0,
      maxX: 2,
      maxY: 2,
      cols: 3,
      rows: 3,
      cells: [
        {
          type: 'visible',
          span: { cols: [0, 0], rows: [0, 2] },
          items: [{ id: '1', position: { col: 0, row: [0, 2] } }],
        },
        {
          type: 'visible',
          span: { cols: [1, 2], rows: [0, 0] },
          items: [{ id: '2', position: { col: [1, 2], row: 0 } }],
        },
        {
          type: 'visible',
          span: { cols: [1, 2], rows: [1, 2] },
          items: [{ id: '3', position: { col: [1, 2], row: [1, 2] } }],
        },
      ],
    });
  });
  it('overlapping multi-cell items', () => {
    const result = createGridInfo([
      {
        id: '1',
        position: { col: 0, row: [0, 2] },
      },
      {
        id: '2',
        position: { col: [0, 2], row: 0 },
      },
      {
        id: '3',
        position: { col: [1, 2], row: [1, 2] },
      },
      {
        id: '3b',
        position: { col: [1, 2], row: [1, 2] },
      },
    ]);

    expect(result).toEqual({
      minX: 0,
      minY: 0,
      maxX: 2,
      maxY: 2,
      cols: 3,
      rows: 3,
      cells: expect.any(Array),
    });

    const sortedCells = result?.cells.sort((a, b) => {
      const aMinX = a.span.cols[0];
      const bMinX = b.span.cols[0];
      if (aMinX !== bMinX) return aMinX - bMinX;
      const aMinY = a.span.rows[0];
      const bMinY = b.span.rows[0];
      return aMinY - bMinY;
    });

    expect(sortedCells).toEqual([
      {
        type: 'overlap',
        span: {
          cols: [0, 0],
          rows: [0, 0],
        },
        items: [
          {
            id: '1',
            position: {
              col: 0,
              row: [0, 2],
            },
          },
          {
            id: '2',
            position: {
              col: [0, 2],
              row: 0,
            },
          },
        ],
      },
      {
        type: 'overlap',
        span: {
          cols: [0, 0],
          rows: [1, 1],
        },
        items: [
          {
            id: '1',
            position: {
              col: 0,
              row: [0, 2],
            },
          },
        ],
      },
      {
        type: 'overlap',
        span: {
          cols: [0, 0],
          rows: [2, 2],
        },
        items: [
          {
            id: '1',
            position: {
              col: 0,
              row: [0, 2],
            },
          },
        ],
      },
      {
        type: 'overlap',
        span: {
          cols: [1, 1],
          rows: [0, 0],
        },
        items: [
          {
            id: '2',
            position: {
              col: [0, 2],
              row: 0,
            },
          },
        ],
      },
      {
        type: 'visible',
        span: {
          cols: [1, 2],
          rows: [1, 2],
        },
        items: [
          {
            id: '3',
            position: {
              col: [1, 2],
              row: [1, 2],
            },
          },
          {
            id: '3b',
            position: {
              col: [1, 2],
              row: [1, 2],
            },
          },
        ],
      },
      {
        type: 'overlap',
        span: {
          cols: [2, 2],
          rows: [0, 0],
        },
        items: [
          {
            id: '2',
            position: {
              col: [0, 2],
              row: 0,
            },
          },
        ],
      },
    ]);
  });
});
