// Starfield built from three box-shadow layers that drift with CSS transforms.
// Each layer is rasterized once and moved on the compositor: practically free at 60fps.

const FIELD = 2000; // px tall tile that loops seamlessly

function layer(count: number, size: number, alpha: number): string {
  const w = Math.max(window.screen.width, window.innerWidth, 1200);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(Math.random() * w);
    const y = Math.round(Math.random() * FIELD);
    const a = (alpha * (0.5 + Math.random() * 0.5)).toFixed(2);
    const tint = Math.random() < 0.2 ? '180,200,255' : Math.random() < 0.1 ? '255,220,190' : '255,255,255';
    out.push(`${x}px ${y}px 0 ${size > 1 ? (size - 1) / 2 : 0}px rgba(${tint},${a})`);
  }
  return out.join(',');
}

export function initStarfield(host: HTMLElement): void {
  const specs = [
    { n: 140, s: 1, a: 0.55, cls: 's1' },
    { n: 55, s: 2, a: 0.7, cls: 's2' },
    { n: 18, s: 3, a: 0.85, cls: 's3' },
  ];
  host.innerHTML = specs.map((l) => `<div class="star-layer ${l.cls}" style="--stars:${layer(l.n, l.s, l.a)}"></div>`).join('');
}
