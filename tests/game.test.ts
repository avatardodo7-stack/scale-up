import { describe, expect, it } from 'vitest';
import { MAX_TIER, type Tile } from '../src/logic/board';
import { type GameState, canUndo, continueAfterWin, newGame, step, undo } from '../src/logic/game';
import { fromRows } from './helpers';

const rng = () => 0; // always the first empty cell, tier 1
const state = (tiles: Tile[], extra: Partial<GameState> = {}): GameState => ({
  tiles, score: 0, nextId: 50, won: false, over: false, keepPlaying: false, undo: null, undoUsed: false, ...extra,
});
// Moving left fills the hole at (3,3); the tier-1 spawn there leaves no pairs.
const almostLocked = () => fromRows([[1, 2, 1, 2], [2, 1, 2, 1], [1, 2, 1, 2], [0, 2, 1, 2]]);

describe('newGame', () => {
  it('starts with two tiles, score 0 and no undo', () => {
    const g = newGame(Math.random);
    expect(g.tiles).toHaveLength(2);
    expect(g.score).toBe(0);
    expect(canUndo(g)).toBe(false);
  });
});

describe('step', () => {
  it('spawns exactly one tile after a valid move and adds score', () => {
    const s = state([{ id: 1, tier: 3, row: 0, col: 2 }, { id: 2, tier: 3, row: 0, col: 3 }]);
    const r = step(s, 'left', rng);
    expect(r.moved).toBe(true);
    expect(r.state.tiles).toHaveLength(2); // merged tile + spawn
    expect(r.state.score).toBe(16);
    expect(r.spawned).not.toBeNull();
  });

  it('does nothing (no spawn) on an invalid move', () => {
    const s = state([{ id: 1, tier: 1, row: 0, col: 0 }]);
    const r = step(s, 'left', rng);
    expect(r.moved).toBe(false);
    expect(r.state).toBe(s);
  });

  it('flags game over when the board locks up', () => {
    const r = step(state(almostLocked()), 'left', rng);
    expect(r.state.over).toBe(true);
    expect(step(r.state, 'right', rng).moved).toBe(false);
  });

  it('detects the win and pauses until the player keeps playing', () => {
    const T = MAX_TIER - 1;
    const s = state([{ id: 1, tier: T, row: 0, col: 0 }, { id: 2, tier: T, row: 0, col: 1 }]);
    const r = step(s, 'left', rng);
    expect(r.justWon).toBe(true);
    expect(r.state.won).toBe(true);
    expect(step(r.state, 'down', rng).moved).toBe(false);
    expect(step(continueAfterWin(r.state), 'down', rng).moved).toBe(true);
  });
});

describe('undo', () => {
  it('restores the previous board and score, once per game', () => {
    const s = state([{ id: 1, tier: 1, row: 0, col: 2 }, { id: 2, tier: 1, row: 0, col: 3 }]);
    const a = step(s, 'left', rng).state;
    expect(canUndo(a)).toBe(true);
    const b = undo(a);
    expect(b.tiles).toEqual(s.tiles);
    expect(b.score).toBe(0);
    expect(canUndo(b)).toBe(false);
    // later moves never re-enable it
    const c = step(b, 'left', rng).state;
    expect(canUndo(c)).toBe(false);
    expect(undo(c)).toBe(c);
  });

  it('can rescue a game over', () => {
    const over = step(state(almostLocked()), 'left', rng).state;
    expect(over.over).toBe(true);
    expect(undo(over).over).toBe(false);
  });
});
