// One full-screen canvas for all particles. The rAF loop only runs while particles are alive.

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; color: string; ring?: boolean }

export class Particles {
  private ctx: CanvasRenderingContext2D;
  private ps: P[] = [];
  private running = false;
  private last = 0;
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(window.innerWidth * this.dpr);
    this.canvas.height = Math.round(window.innerHeight * this.dpr);
  }

  burst(x: number, y: number, tier: number, colors: [string, string]): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const n = Math.min(54, 8 + tier * 2.5);
    const speed = 90 + tier * 18; // px/s
    const palette = [colors[0], colors[1], '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.75);
      this.ps.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0,
        max: 0.38 + Math.random() * 0.3 + tier * 0.015,
        r: 1.4 + Math.random() * (1.6 + tier * 0.12),
        color: palette[i % 3],
      });
    }
    if (tier >= 8) this.ps.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.45, r: 20 + tier * 3, color: colors[0], ring: true });
    if (this.ps.length > 400) this.ps.splice(0, this.ps.length - 400);
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.frame);
    }
  }

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    this.ps = this.ps.filter((p) => (p.life += dt) < p.max);
    for (const p of this.ps) {
      const k = 1 - p.life / p.max;
      if (p.ring) {
        ctx.globalAlpha = k * 0.6;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * k + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1.2 + (1 - k) * 2.2), 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }
      p.vx *= 1 - 3.2 * dt;
      p.vy = p.vy * (1 - 3.2 * dt) + 140 * dt; // drag + a hint of gravity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = k;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + 0.6 * k), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (this.ps.length) requestAnimationFrame(this.frame);
    else {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.running = false;
    }
  };
}
