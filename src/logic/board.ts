// Pure board logic. No DOM, no globals: every function returns new data.

export const SIZE = 4;
export const MAX_TIER = 19;

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Tile {
  id: number;
  tier: number;
  row: number;
  col: number;
}

/** Where every pre-move tile ended up (including tiles consumed by a merge). */
export interface Slide {
  id: number;
  row: number;
  col: number;
}

export interface Merge {
  /** id of the newly created merged tile */
  id: number;
  tier: number;
  row: number;
  col: number;
  fromIds: [number, number];
}

export interface MoveResult {
  tiles: Tile[];
  moved: boolean;
  slides: Slide[];
  merges: Merge[];
  scoreGained: number;
  nextId: number;
}

export type Rng = () => number;

export const tierValue = (tier: number): number => 2 ** tier;

const VECTORS: Record<Dir, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

export function toGrid(tiles: Tile[]): (Tile | null)[][] {
  const g: (Tile | null)[][] = Array.from({ length: SIZE }, () => Array<Tile | null>(SIZE).fill(null));
  for (const t of tiles) g[t.row][t.col] = t;
  return g;
}

/**
 * Slide all tiles in `dir`. Classic 2048 rules:
 * - tiles travel as far as possible
 * - two equal tiers that meet merge into tier + 1
 * - a tile produced by a merge cannot merge again in the same move
 * - the top tier (MAX_TIER) never merges
 */
export function move(tiles: Tile[], dir: Dir, nextId: number): MoveResult {
  const grid = toGrid(tiles);
  const { dr, dc } = VECTORS[dir];
  const out: Tile[] = [];
  const slides: Slide[] = [];
  const merges: Merge[] = [];
  let scoreGained = 0;
  let moved = false;
  let id = nextId;

  for (let line = 0; line < SIZE; line++) {
    // Cells of this line, ordered from the edge tiles move toward.
    const cells: [number, number][] = [];
    for (let i = 0; i < SIZE; i++) {
      const k = dr + dc > 0 ? SIZE - 1 - i : i;
      cells.push(dr !== 0 ? [k, line] : [line, k]);
    }

    // Placed tiles in this line, with a flag marking merge results.
    const placed: { tile: Tile; merged: boolean }[] = [];
    for (const [r, c] of cells) {
      const t = grid[r][c];
      if (!t) continue;
      const last = placed[placed.length - 1];
      if (last && !last.merged && last.tile.tier === t.tier && t.tier < MAX_TIER) {
        const [mr, mc] = cells[placed.length - 1];
        const merged: Tile = { id: id++, tier: t.tier + 1, row: mr, col: mc };
        merges.push({ id: merged.id, tier: merged.tier, row: mr, col: mc, fromIds: [last.tile.id, t.id] });
        slides.push({ id: t.id, row: mr, col: mc });
        scoreGained += tierValue(merged.tier);
        last.tile = merged;
        last.merged = true;
        moved = true;
      } else {
        const [nr, nc] = cells[placed.length];
        if (nr !== r || nc !== c) moved = true;
        slides.push({ id: t.id, row: nr, col: nc });
        placed.push({ tile: { ...t, row: nr, col: nc }, merged: false });
      }
    }
    for (const p of placed) out.push(p.tile);
  }

  return { tiles: moved ? out : tiles, moved, slides, merges, scoreGained, nextId: id };
}

export function emptyCells(tiles: Tile[]): [number, number][] {
  const g = toGrid(tiles);
  const res: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!g[r][c]) res.push([r, c]);
  return res;
}

/** Spawn one tile in a random empty cell: 90% tier 1, 10% tier 2. */
export function spawn(tiles: Tile[], rng: Rng, id: number): Tile | null {
  const empty = emptyCells(tiles);
  if (empty.length === 0) return null;
  const [row, col] = empty[Math.min(empty.length - 1, Math.floor(rng() * empty.length))];
  return { id, tier: rng() < 0.9 ? 1 : 2, row, col };
}

/** True if any direction would change the board. */
export function canMove(tiles: Tile[]): boolean {
  if (tiles.length < SIZE * SIZE) return true;
  const g = toGrid(tiles);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = g[r][c]!;
      if (t.tier >= MAX_TIER) continue;
      if (c + 1 < SIZE && g[r][c + 1]!.tier === t.tier) return true;
      if (r + 1 < SIZE && g[r + 1][c]!.tier === t.tier) return true;
    }
  }
  return false;
}

export const maxTier = (tiles: Tile[]): number => tiles.reduce((m, t) => Math.max(m, t.tier), 0);
