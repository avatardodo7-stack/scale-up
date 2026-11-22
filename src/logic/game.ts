import { type Dir, type Merge, type Rng, type Slide, type Tile, MAX_TIER, canMove, maxTier, move, spawn } from './board';

interface Snapshot {
  tiles: Tile[];
  score: number;
  nextId: number;
  won: boolean;
  over: boolean;
}

export interface GameState extends Snapshot {
  keepPlaying: boolean;
  /** State before the last move, available while the single undo is unused. */
  undo: Snapshot | null;
  undoUsed: boolean;
}

export interface StepResult {
  state: GameState;
  moved: boolean;
  slides: Slide[];
  merges: Merge[];
  spawned: Tile | null;
  scoreGained: number;
  /** True on the move that first reaches MAX_TIER */
  justWon: boolean;
}

export function newGame(rng: Rng): GameState {
  let tiles: Tile[] = [];
  let nextId = 1;
  for (let i = 0; i < 2; i++) {
    const t = spawn(tiles, rng, nextId++);
    if (t) tiles = [...tiles, t];
  }
  return { tiles, score: 0, nextId, won: false, over: false, keepPlaying: false, undo: null, undoUsed: false };
}

const snapshot = (s: GameState): Snapshot => ({
  tiles: s.tiles, score: s.score, nextId: s.nextId, won: s.won, over: s.over,
});

export function step(state: GameState, dir: Dir, rng: Rng): StepResult {
  const none = { state, moved: false, slides: [], merges: [], spawned: null, scoreGained: 0, justWon: false };
  if (state.over || (state.won && !state.keepPlaying)) return none;

  const r = move(state.tiles, dir, state.nextId);
  if (!r.moved) return none;

  let nextId = r.nextId;
  const spawned = spawn(r.tiles, rng, nextId++);
  const tiles = spawned ? [...r.tiles, spawned] : r.tiles;
  const reachedTop = maxTier(tiles) >= MAX_TIER;
  const justWon = reachedTop && !state.won;

  return {
    state: {
      tiles,
      score: state.score + r.scoreGained,
      nextId,
      won: state.won || reachedTop,
      keepPlaying: state.keepPlaying,
      over: !canMove(tiles),
      undo: state.undoUsed ? null : snapshot(state),
      undoUsed: state.undoUsed,
    },
    moved: true,
    slides: r.slides,
    merges: r.merges,
    spawned,
    scoreGained: r.scoreGained,
    justWon,
  };
}

export const canUndo = (s: GameState): boolean => !s.undoUsed && s.undo !== null;

/** Revert the last move. Allowed once per game (also from the game-over state). */
export function undo(s: GameState): GameState {
  if (!canUndo(s)) return s;
  return { ...s, ...s.undo!, keepPlaying: s.keepPlaying, undo: null, undoUsed: true };
}

export const continueAfterWin = (s: GameState): GameState => ({ ...s, keepPlaying: true });
