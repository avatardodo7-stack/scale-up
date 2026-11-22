import { describe, expect, it } from 'vitest';
import { MAX_TIER, type Tile, canMove, move, spawn, tierValue } from '../src/logic/board';
import { fromRows } from './helpers';

function toRows(tiles: Tile[]): number[][] {
  const g = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  for (const t of tiles) g[t.row][t.col] = t.tier;
  return g;
}
const E = [0, 0, 0, 0];
const mv = (rows: number[][], dir: Parameters<typeof move>[1]) => move(fromRows(rows), dir, 100);

describe('move', () => {
  it('slides tiles to the edge', () => {
    const r = mv([[0, 0, 0, 1], E, [0, 2, 0, 0], E], 'left');
    expect(toRows(r.tiles)).toEqual([[1, 0, 0, 0], E, [2, 0, 0, 0], E]);
    expect(r.moved).toBe(true);
    expect(r.merges).toHaveLength(0);
  });

  it('merges two equal tiles into the next tier and scores 2^tier', () => {
    const r = mv([[1, 1, 0, 0], E, E, E], 'left');
    expect(toRows(r.tiles)[0]).toEqual([2, 0, 0, 0]);
    expect(r.scoreGained).toBe(tierValue(2));
    expect(r.merges).toHaveLength(1);
    expect(r.merges[0].fromIds).toEqual([1, 2]);
  });

  it('does not merge different tiers', () => {
    const r = mv([[1, 2, 0, 0], E, E, E], 'left');
    expect(r.moved).toBe(false);
    expect(r.merges).toHaveLength(0);
  });

  it('merges each tile only once per move: [1,1,2,_] -> [2,2,_,_], not [3]', () => {
    const r = mv([[1, 1, 2, 0], E, E, E], 'left');
    expect(toRows(r.tiles)[0]).toEqual([2, 2, 0, 0]);
    expect(r.merges).toHaveLength(1);
  });

  it('four equal tiles merge into two pairs: [1,1,1,1] -> [2,2,_,_]', () => {
    const r = mv([[1, 1, 1, 1], E, E, E], 'left');
    expect(toRows(r.tiles)[0]).toEqual([2, 2, 0, 0]);
    expect(r.merges).toHaveLength(2);
  });

  it('three equal tiles merge the pair nearest the wall', () => {
    expect(toRows(mv([[1, 1, 1, 0], E, E, E], 'left').tiles)[0]).toEqual([2, 1, 0, 0]);
    expect(toRows(mv([[1, 1, 1, 0], E, E, E], 'right').tiles)[0]).toEqual([0, 0, 1, 2]);
  });

  it('works in every direction', () => {
    const start = [[1, 0, 0, 0], [1, 0, 0, 0], E, E];
    expect(toRows(mv(start, 'down').tiles)).toEqual([E, E, E, [2, 0, 0, 0]]);
    expect(toRows(mv(start, 'up').tiles)).toEqual([[2, 0, 0, 0], E, E, E]);
    expect(toRows(mv(start, 'right').tiles)).toEqual([[0, 0, 0, 1], [0, 0, 0, 1], E, E]);
  });

  it('reports every old tile destination for animation', () => {
    const r = mv([[0, 1, 0, 1], E, E, E], 'left');
    expect(r.slides).toEqual([{ id: 1, row: 0, col: 0 }, { id: 2, row: 0, col: 0 }]);
    expect(r.merges[0].id).toBe(100);
    expect(r.nextId).toBe(101);
  });

  it('never merges the top tier', () => {
    const r = mv([[MAX_TIER, MAX_TIER, 0, 0], E, E, E], 'left');
    expect(r.moved).toBe(false);
  });
});

describe('spawn', () => {
  it('spawns tier 1 90% of the time and tier 2 otherwise', () => {
    expect(spawn([], () => 0.5, 1)!.tier).toBe(1);
    const seq = [0, 0.95];
    expect(spawn([], () => seq.shift()!, 1)!.tier).toBe(2);
  });

  it('only spawns in empty cells, and returns null when full', () => {
    const tiles = fromRows([[1, 2, 1, 2], [2, 1, 2, 1], [1, 2, 1, 2], [2, 1, 2, 0]]);
    const t = spawn(tiles, () => 0.99, 99)!;
    expect([t.row, t.col]).toEqual([3, 3]);
    expect(spawn([...tiles, t], () => 0, 100)).toBeNull();
  });
});

describe('canMove (game-over detection)', () => {
  it('is true with an empty cell', () => {
    expect(canMove(fromRows([[1, 2, 1, 2], [2, 1, 2, 1], [1, 2, 1, 2], [2, 1, 2, 0]]))).toBe(true);
  });

  it('is true on a full board with a horizontal or vertical pair', () => {
    expect(canMove(fromRows([[1, 1, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]))).toBe(true);
    expect(canMove(fromRows([[1, 2, 3, 4], [1, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]))).toBe(true);
  });

  it('is false on a full board with no pairs', () => {
    expect(canMove(fromRows([[1, 2, 1, 2], [2, 1, 2, 1], [1, 2, 1, 2], [2, 1, 2, 1]]))).toBe(false);
  });

  it('treats top-tier pairs as unmergeable', () => {
    const T = MAX_TIER;
    expect(canMove(fromRows([[T, T, 1, 2], [2, 1, 2, 1], [1, 2, 1, 2], [2, 1, 2, 1]]))).toBe(false);
  });
});
