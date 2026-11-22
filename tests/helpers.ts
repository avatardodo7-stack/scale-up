import type { Tile } from '../src/logic/board';

/** Build tiles from a 4x4 matrix of tiers (0 = empty). */
export function fromRows(rows: number[][]): Tile[] {
  const tiles: Tile[] = [];
  let id = 1;
  rows.forEach((r, row) => r.forEach((tier, col) => { if (tier) tiles.push({ id: id++, tier, row, col }); }));
  return tiles;
}
