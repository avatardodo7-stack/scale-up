import type { GameState } from './logic/game';

const P = 'scaleup.v1.';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(P + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(P + key, JSON.stringify(value));
  } catch { /* storage full or blocked: the game still works */ }
}
function remove(key: string): void {
  try { localStorage.removeItem(P + key); } catch { /* ignore */ }
}

export interface Settings { sound: boolean; haptics: boolean }

export const store = {
  best: () => read<number>('best', 0),
  setBest: (n: number) => write('best', n),

  discovered: () => new Set(read<number[]>('discovered', [])),
  setDiscovered: (s: Set<number>) => write('discovered', [...s].sort((a, b) => a - b)),

  settings: () => ({ sound: true, haptics: true, ...read<Partial<Settings>>('settings', {}) }),
  setSettings: (s: Settings) => write('settings', s),

  tutorialDone: () => read<boolean>('tutorial', false),
  setTutorialDone: () => write('tutorial', true),

  game: () => read<GameState | null>('game', null),
  setGame: (g: GameState) => write('game', g),
  clearGame: () => remove('game'),

  visits: () => read<number>('visits', 0),
  bumpVisits: () => write('visits', read<number>('visits', 0) + 1),
  installNudged: () => read<boolean>('installNudged', false),
  setInstallNudged: () => write('installNudged', true),

  resetAll: () => ['best', 'discovered', 'game', 'tutorial'].forEach(remove),
};
