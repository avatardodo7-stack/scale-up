import './styles/main.css';
import { type Dir, maxTier } from './logic/board';
import { type GameState, canUndo, continueAfterWin, newGame, step, undo } from './logic/game';
import { shortName, tierInfo } from './data/tiers';
import { GridView } from './render/grid';
import { Particles } from './render/particles';
import { bump, countTo, floatText, shake } from './render/fx';
import { initStarfield } from './render/starfield';
import { bindInput } from './input/input';
import { buzz, setHaptics, sfx } from './audio/sfx';
import { store } from './storage';
import { closeAll, modalOpen, toast } from './ui/modal';
import { canOfferInstall, initInstall, onInstallChange, showInstall } from './ui/install';
import {
  discoveriesScreen, discoveryBanner, gameOverScreen, infoCard, settingsScreen, shareText, startScreen, tutorial, winScreen,
} from './ui/screens';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const boardEl = $('board');
const stage = $('stage');
const scoreEl = $('score');
const bestEl = $('best');
const undoBtn = $('btn-undo');
const soundBtn = $('btn-sound');
const discBtn = $('btn-disc');

const grid = new GridView($('tiles'));
const particles = new Particles($<HTMLCanvasElement>('fx'));
initStarfield($('stars'));

let settings = store.settings();
let best = store.best();
let found = store.discovered();
let state: GameState = store.game() ?? newGame(Math.random);
let onStart = true;
let gameOverShown = false;

sfx.enabled = settings.sound;
setHaptics(settings.haptics);

// ---------------------------------------------------------------- HUD

function renderHud(animateFrom?: number): void {
  if (animateFrom !== undefined) countTo(scoreEl, animateFrom, state.score);
  else scoreEl.textContent = state.score.toLocaleString('en-US');
  bestEl.textContent = best.toLocaleString('en-US');

  const left = canUndo(state) ? 1 : 0;
  undoBtn.classList.toggle('off', !left);
  undoBtn.querySelector('small')!.textContent = state.undoUsed ? 'used' : '1 left';

  discBtn.querySelector('small')!.textContent = `${found.size}/19`;
  soundBtn.querySelector('.bi')!.textContent = settings.sound ? '🔊' : '🔇';
  soundBtn.querySelector('.nl')!.textContent = settings.sound ? 'Sound' : 'Muted';

  const top = maxTier(state.tiles) || 1;
  const t = tierInfo(top);
  $('biggest').innerHTML = `<span class="lbl">Biggest</span> <b>${t.name}</b> <span class="sz">${t.label}</span>`;
  $('ladder-fill').style.width = `${((top - 1) / 18) * 100}%`;

  const next = $('next');
  if (top >= 19) {
    next.innerHTML = '<span>✦ You reached the edge of everything</span>';
  } else {
    const n = tierInfo(top + 1);
    const known = found.has(top + 1);
    next.innerHTML = `<span class="lbl">Next</span> <b>${known ? n.name : '???'}</b> <span>· merge two ${shortName(top)} tiles</span>`;
  }
}

function markDiscovered(tiers: number[], announce: boolean): number | null {
  let newest: number | null = null;
  for (const t of tiers) {
    if (found.has(t)) continue;
    found.add(t);
    if (announce && t >= 3) newest = Math.max(newest ?? 0, t);
  }
  store.setDiscovered(found);
  return newest;
}

// ---------------------------------------------------------------- moves (with input queue)

const queue: Dir[] = [];
let busy = false;

function requestMove(dir: Dir): void {
  if (queue.length < 4) queue.push(dir); // queued during animations, never dropped
  void pump();
}

async function pump(): Promise<void> {
  if (busy) return;
  const dir = queue.shift();
  if (!dir) return;

  const r = step(state, dir, Math.random);
  if (!r.moved) {
    grid.nudge(boardEl, dir);
    return pump();
  }

  busy = true;
  const prevScore = state.score;
  state = r.state;
  sfx.slide();
  const created = await grid.animate(r);
  busy = false;

  // ---- juice
  let topMerge = 0;
  for (const m of r.merges) {
    topMerge = Math.max(topMerge, m.tier);
    const el = created.get(m.id);
    if (el) {
      const b = el.getBoundingClientRect();
      particles.burst(b.left + b.width / 2, b.top + b.height / 2, m.tier, tierInfo(m.tier).colors);
    }
  }
  if (topMerge) {
    sfx.pop(topMerge);
    buzz(topMerge >= 12 ? [18, 30, 24] : 8 + Math.min(20, topMerge));
    if (topMerge >= 12) shake(stage, topMerge);
  }

  if (r.scoreGained) {
    floatText($('score-box'), `+${r.scoreGained.toLocaleString('en-US')}`);
    if (state.score > best) {
      best = state.score;
      store.setBest(best);
    }
  }

  const newTier = markDiscovered([...r.merges.map((m) => m.tier), ...(r.spawned ? [r.spawned.tier] : [])], true);
  if (newTier) {
    discoveryBanner(newTier, () => infoCard(newTier));
    window.setTimeout(() => sfx.discover(), 120);
    buzz([12, 40, 12, 40, 30]);
    bump(discBtn);
  }

  renderHud(prevScore);
  store.setGame(state);

  if (r.justWon) {
    queue.length = 0;
    window.setTimeout(showWin, 650);
  } else if (state.over) {
    queue.length = 0;
    window.setTimeout(showGameOver, 700);
  }

  return pump();
}

// ---------------------------------------------------------------- actions

function startNewGame(): void {
  closeAll();
  queue.length = 0;
  gameOverShown = false;
  state = newGame(Math.random);
  markDiscovered(state.tiles.map((t) => t.tier), false);
  store.setGame(state);
  grid.renderAll(state.tiles, 'spawn');
  renderHud();
}

function doUndo(): void {
  if (!canUndo(state)) {
    toast(state.undoUsed ? 'Undo already used this game' : 'Make a move first');
    return;
  }
  queue.length = 0;
  state = undo(state);
  gameOverShown = false;
  sfx.undo();
  grid.renderAll(state.tiles);
  renderHud();
  store.setGame(state);
}

function topTier(): number {
  return maxTier(state.tiles) || 1;
}

async function share(): Promise<void> {
  const text = shareText(topTier(), state.won);
  const url = location.origin + location.pathname;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'SCALE UP', text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast('Copied to clipboard!');
  } catch (e) {
    if ((e as Error).name !== 'AbortError') toast('Could not share');
  }
}

function showGameOver(): void {
  if (gameOverShown || !state.over) return;
  gameOverShown = true;
  sfx.over();
  buzz([40, 60, 40]);
  const isBest = state.score > 0 && state.score >= best;
  gameOverScreen({
    score: state.score,
    best,
    newBest: isBest,
    topTier: topTier(),
    canUndo: canUndo(state),
    canInstall: canOfferInstall(),
    onUndo: doUndo,
    onAgain: startNewGame,
    onShare: () => void share(),
    onInstall: showInstall,
  });
}

function showWin(): void {
  sfx.win();
  buzz([30, 50, 30, 50, 80]);
  winScreen({
    score: state.score,
    onContinue: () => { state = continueAfterWin(state); store.setGame(state); },
    onAgain: startNewGame,
    onShare: () => void share(),
  });
}

function openSettings(): void {
  settingsScreen({
    sound: settings.sound,
    haptics: settings.haptics,
    onSound: (v) => setSound(v),
    onHaptics: (v) => { settings = { ...settings, haptics: v }; setHaptics(v); store.setSettings(settings); if (v) buzz(15); },
    onNewGame: startNewGame,
    canInstall: canOfferInstall(),
    onInstall: showInstall,
    onTutorial: () => tutorial(() => store.setTutorialDone()),
    onReset: () => {
      store.resetAll();
      best = 0;
      found = new Set();
      startNewGame();
      toast('Progress reset');
    },
  });
}

function setSound(v: boolean): void {
  settings = { ...settings, sound: v };
  sfx.enabled = v;
  store.setSettings(settings);
  renderHud();
  if (v) sfx.click();
}

// ---------------------------------------------------------------- start screen

function showStart(): void {
  onStart = true;
  const canContinue = !!store.game() && !state.over && state.tiles.length > 2;
  const el = startScreen({
    canContinue,
    best,
    found: found.size,
    onPlay: () => leaveStart(),
    onNew: () => { startNewGame(); leaveStart(); },
    onDiscoveries: () => discoveriesScreen(found),
    onInstall: showInstall,
  });
  document.body.appendChild(el);
  syncInstallUI();
}

// ---------------------------------------------------------------- install

const pill = $('install-pill');

function syncInstallUI(): void {
  const can = canOfferInstall();
  document.querySelectorAll<HTMLElement>('.install-cta').forEach((b) => { b.hidden = !can; });
  if (!can) pill.classList.remove('show');
}

/** From the second visit on, offer install once with a small dismissible pill. */
function maybeNudgeInstall(): void {
  if (!canOfferInstall() || store.installNudged() || store.visits() < 2) return;
  window.setTimeout(() => { if (canOfferInstall() && !modalOpen()) pill.classList.add('show'); }, 2500);
}

pill.querySelector('[data-open]')!.addEventListener('click', () => { pill.classList.remove('show'); store.setInstallNudged(); showInstall(); });
pill.querySelector('[data-dismiss]')!.addEventListener('click', () => { pill.classList.remove('show'); store.setInstallNudged(); });
initInstall(() => { toast('Installed! Find SCALE UP on your home screen'); syncInstallUI(); });
onInstallChange(syncInstallUI);
store.bumpVisits();

function leaveStart(): void {
  sfx.unlock();
  sfx.click();
  const el = document.querySelector('.start');
  el?.classList.add('leaving');
  window.setTimeout(() => el?.remove(), 320);
  onStart = false;
  if (state.over) startNewGame(); // a finished game was saved: start fresh
  if (!store.tutorialDone()) window.setTimeout(() => tutorial(() => store.setTutorialDone()), 350);
  else maybeNudgeInstall();
}

// ---------------------------------------------------------------- wiring

bindInput(stage, {
  enabled: () => !onStart && !modalOpen(),
  onMove: requestMove,
  onInspect: (tier) => { buzz(10); sfx.click(); infoCard(tier); },
});

undoBtn.addEventListener('click', doUndo);
discBtn.addEventListener('click', () => discoveriesScreen(found));
soundBtn.addEventListener('click', () => { sfx.unlock(); setSound(!settings.sound); });
$('btn-settings').addEventListener('click', openSettings);
$('logo').addEventListener('click', () => { if (!modalOpen()) showStart(); });

// Audio needs a user gesture; unlock on the first one of any kind.
['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => sfx.unlock(), { capture: true }));

// iOS Safari ignores user-scalable=no; block pinch zoom here. Double-tap zoom is
// disabled with `touch-action: manipulation` / `none` in CSS.
document.addEventListener('gesturestart', (e) => e.preventDefault());

document.addEventListener('visibilitychange', () => { if (document.hidden) store.setGame(state); });

markDiscovered(state.tiles.map((t) => t.tier), false);
grid.renderAll(state.tiles);
renderHud();
showStart();

if (import.meta.env.DEV) {
  // Dev-only test hook: __scaleup.board([[tier,...],...]) loads a custom board.
  (window as unknown as Record<string, unknown>).__scaleup = {
    board(rows: number[][]) {
      const tiles: GameState['tiles'] = [];
      let id = 1;
      rows.forEach((r, row) => r.forEach((tier, col) => { if (tier) tiles.push({ id: id++, tier, row, col }); }));
      state = { ...newGame(Math.random), tiles, nextId: 1000, score: state.score };
      grid.renderAll(state.tiles);
      renderHud();
    },
  };
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
