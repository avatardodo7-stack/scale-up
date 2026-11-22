import type { Dir } from '../logic/board';

export interface InputHandlers {
  onMove: (dir: Dir) => void;
  onInspect: (tier: number) => void;
  /** Return false to ignore input (a modal is open, etc.) */
  enabled: () => boolean;
}

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
};

const SWIPE_PX = 26; // distance that commits a swipe mid-gesture (feels instant)
const FLICK_PX = 14; // shorter, fast flicks count on release
const HOLD_MS = 420;
const HOLD_SLOP = 10;

const dirOf = (dx: number, dy: number): Dir =>
  Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

export function bindInput(surface: HTMLElement, h: InputHandlers): void {
  window.addEventListener('keydown', (e) => {
    const dir = KEYS[e.key];
    if (!dir || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!h.enabled()) return;
    e.preventDefault();
    h.onMove(dir);
  });

  let id: number | null = null;
  let x0 = 0, y0 = 0, t0 = 0;
  let fired = false;
  let hold: number | undefined;

  const tierAt = (target: EventTarget | null): number | null => {
    const el = (target as HTMLElement | null)?.closest?.('.tile') as HTMLElement | null;
    return el ? Number(el.dataset.tier) : null;
  };
  const clearHold = () => { if (hold !== undefined) { clearTimeout(hold); hold = undefined; } };

  surface.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (!h.enabled()) return;
    id = e.pointerId;
    x0 = e.clientX; y0 = e.clientY; t0 = performance.now();
    fired = false;
    try { surface.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const tier = tierAt(e.target);
    clearHold();
    if (tier !== null) {
      hold = window.setTimeout(() => {
        hold = undefined;
        if (fired) return;
        fired = true; // a long-press never also counts as a swipe
        h.onInspect(tier);
      }, HOLD_MS);
    }
  });

  surface.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id || fired) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    const dist = Math.hypot(dx, dy);
    if (dist > HOLD_SLOP) clearHold();
    if (dist >= SWIPE_PX) {
      fired = true;
      h.onMove(dirOf(dx, dy));
    }
  });

  const end = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    clearHold();
    if (!fired && e.type === 'pointerup') {
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.hypot(dx, dy) >= FLICK_PX && performance.now() - t0 < 300) h.onMove(dirOf(dx, dy));
    }
    id = null;
  };
  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', end);

  surface.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const tier = tierAt(e.target);
    if (tier !== null && h.enabled()) h.onInspect(tier);
  });
}
