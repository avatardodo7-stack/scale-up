import type { Tile } from '../logic/board';
import type { StepResult } from '../logic/game';
import { iconHTML } from '../data/icons';
import { shortName, tierInfo } from '../data/tiers';

export const SLIDE_MS = 120;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Renders tiles as absolutely positioned DOM nodes moved with CSS transforms. */
export class GridView {
  private els = new Map<number, HTMLElement>();

  constructor(private layer: HTMLElement) {}

  private make(t: Tile, anim: 'spawn' | 'pop' | 'none'): HTMLElement {
    const info = tierInfo(t.tier);
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.tier = String(t.tier);
    if (t.tier >= 17) el.classList.add('cosmic');
    if (t.tier >= 19) el.classList.add('apex');
    el.style.setProperty('--r', String(t.row));
    el.style.setProperty('--c', String(t.col));
    el.style.setProperty('--c1', info.colors[0]);
    el.style.setProperty('--c2', info.colors[1]);
    el.innerHTML =
      `<div class="tile-in${anim === 'none' ? '' : ' ' + anim}">${iconHTML(info.icon)}` +
      `<span class="tname">${shortName(t.tier)}</span><span class="tsize">${info.label}</span></div>`;
    el.setAttribute('aria-label', `${info.name}, ${info.label}`);
    this.layer.appendChild(el);
    this.els.set(t.id, el);
    return el;
  }

  /** Replace everything without animation (new game, undo, restore). */
  renderAll(tiles: Tile[], anim: 'spawn' | 'none' = 'none'): void {
    this.layer.replaceChildren();
    this.els.clear();
    for (const t of tiles) this.make(t, anim);
  }

  /**
   * Phase 1: slide every tile to its destination (SLIDE_MS).
   * Phase 2: swap merged pairs for the new tile (pop) and add the spawn.
   * Resolves at the end of phase 1 + DOM swap, so the next queued move can start
   * while pop animations are still playing.
   */
  animate(r: StepResult): Promise<Map<number, HTMLElement>> {
    for (const s of r.slides) {
      const el = this.els.get(s.id);
      if (!el) continue;
      el.style.setProperty('--r', String(s.row));
      el.style.setProperty('--c', String(s.col));
    }
    const ms = reduceMotion() ? 60 : SLIDE_MS;
    return new Promise((resolve) => {
      window.setTimeout(() => {
        const created = new Map<number, HTMLElement>();
        for (const m of r.merges) {
          for (const id of m.fromIds) {
            this.els.get(id)?.remove();
            this.els.delete(id);
          }
          const el = this.make({ id: m.id, tier: m.tier, row: m.row, col: m.col }, 'pop');
          el.classList.add('merged');
          created.set(m.id, el);
        }
        if (r.spawned) this.make(r.spawned, 'spawn');
        resolve(created);
      }, ms);
    });
  }

  /** Small bump toward an edge when a move does nothing. */
  nudge(board: HTMLElement, dir: 'up' | 'down' | 'left' | 'right'): void {
    if (reduceMotion()) return;
    const d = 5;
    const [x, y] = { up: [0, -d], down: [0, d], left: [-d, 0], right: [d, 0] }[dir];
    board.animate(
      [{ transform: 'translate(0,0)' }, { transform: `translate(${x}px,${y}px)` }, { transform: 'translate(0,0)' }],
      { duration: 140, easing: 'ease-out' },
    );
  }
}
