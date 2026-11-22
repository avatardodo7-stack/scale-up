const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Screen shake for big merges; stronger as tiers climb. */
export function shake(el: HTMLElement, tier: number): void {
  if (reduceMotion()) return;
  const a = Math.min(10, 2 + (tier - 11) * 1.1);
  const frames: Keyframe[] = [];
  for (let i = 0; i < 7; i++) {
    const k = 1 - i / 7;
    frames.push({ transform: `translate(${(Math.random() * 2 - 1) * a * k}px, ${(Math.random() * 2 - 1) * a * k}px)` });
  }
  frames.push({ transform: 'translate(0,0)' });
  el.animate(frames, { duration: 260 + tier * 8, easing: 'ease-out' });
}

/** Animated number counter. Cancels any running tween on the same element. */
const tweens = new WeakMap<HTMLElement, number>();
export function countTo(el: HTMLElement, from: number, to: number, ms = 380): void {
  const prev = tweens.get(el);
  if (prev) cancelAnimationFrame(prev);
  if (from === to || reduceMotion()) {
    el.textContent = to.toLocaleString('en-US');
    return;
  }
  const t0 = performance.now();
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / ms);
    const e = 1 - (1 - k) ** 3;
    el.textContent = Math.round(from + (to - from) * e).toLocaleString('en-US');
    if (k < 1) tweens.set(el, requestAnimationFrame(tick));
    else tweens.delete(el);
  };
  tweens.set(el, requestAnimationFrame(tick));
}

/** Floating "+64" that drifts up from an element and fades out. */
export function floatText(host: HTMLElement, text: string): void {
  const f = document.createElement('span');
  f.className = 'float-score';
  f.textContent = text;
  host.appendChild(f);
  f.addEventListener('animationend', () => f.remove(), { once: true });
}

/** Little bounce for a UI element (score box, badge). */
export function bump(el: HTMLElement): void {
  if (reduceMotion()) return;
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
}
