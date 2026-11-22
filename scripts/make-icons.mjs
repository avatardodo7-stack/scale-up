// Renders the SCALE UP app icons as PNGs with no dependencies (tiny PNG encoder + SDF shapes).
// Usage: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = new URL('../public/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
}
function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
// signed distance to a rounded box centred at (cx,cy) with half-size h and radius r (unit coords)
const rbox = (x, y, cx, cy, h, r) => {
  const qx = Math.abs(x - cx) - h + r, qy = Math.abs(y - cy) - h + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};

const TILES = [ // ascending tiles: small teal -> orange -> big cosmic purple
  { cx: 0.27, cy: 0.71, h: 0.09, c1: '#2DD4BF', c2: '#0E9488' },
  { cx: 0.47, cy: 0.56, h: 0.13, c1: '#FFA53A', c2: '#E2502A' },
  { cx: 0.68, cy: 0.37, h: 0.19, c1: '#B47CFF', c2: '#5838D2' },
];
const STARS = [[0.2, 0.22, 0.012], [0.36, 0.14, 0.008], [0.86, 0.72, 0.01], [0.78, 0.86, 0.007], [0.14, 0.42, 0.007], [0.9, 0.12, 0.009]];

/** Colour at unit coords. `inset` shrinks the artwork into the maskable safe zone. */
function shade(x, y, { rounded, inset }) {
  // background
  let bgA = 1;
  if (rounded) {
    const d = rbox(x, y, 0.5, 0.5, 0.5, 0.22);
    if (d > 0) bgA = 0;
  }
  const g = Math.hypot(x - 0.5, y - 0.05);
  let col = mix(hex('#3A2A9A'), hex('#07061A'), Math.min(1, g / 1.0));
  // artwork coords
  const ax = (x - 0.5) / inset + 0.5, ay = (y - 0.5) / inset + 0.5;
  for (const [sx, sy, sr] of STARS) {
    const d = Math.hypot(ax - sx, ay - sy);
    if (d < sr * 3) col = mix(col, [255, 255, 255], Math.max(0, 1 - d / (sr * 1.2)) * 0.9 + Math.max(0, 1 - d / (sr * 3)) * 0.1);
  }
  for (const t of TILES) {
    // shadow
    const ds = rbox(ax, ay - 0.025, t.cx, t.cy, t.h, t.h * 0.34);
    if (ds < 0.04) col = mix(col, [0, 0, 0], 0.35 * Math.min(1, (0.04 - ds) / 0.04));
    const d = rbox(ax, ay, t.cx, t.cy, t.h, t.h * 0.34);
    if (d < 0) {
      const k = Math.min(1, Math.max(0, ((ax - (t.cx - t.h)) + (ay - (t.cy - t.h))) / (4 * t.h)));
      let tc = mix(hex(t.c1), hex(t.c2), k);
      if (ay < t.cy - t.h * 0.45) tc = mix(tc, [255, 255, 255], 0.12); // top sheen
      col = tc;
    }
  }
  return [...col, bgA * 255];
}

function render(size, opts) {
  const buf = Buffer.alloc(size * size * 4);
  const S = 4; // supersampling
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const c = shade((px + (sx + 0.5) / S) / size, (py + (sy + 0.5) / S) / size, opts);
        const w = c[3] / 255;
        r += c[0] * w; g += c[1] * w; b += c[2] * w; a += c[3];
      }
      const n = S * S, aw = a / 255 || 1;
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / aw); buf[i + 1] = Math.round(g / aw); buf[i + 2] = Math.round(b / aw); buf[i + 3] = Math.round(a / n);
    }
  }
  return png(size, buf);
}

const jobs = [
  ['icon-192.png', 192, { rounded: true, inset: 0.92 }],
  ['icon-512.png', 512, { rounded: true, inset: 0.92 }],
  ['maskable-512.png', 512, { rounded: false, inset: 0.72 }],
  ['apple-touch-icon.png', 180, { rounded: false, inset: 0.86 }],
];
for (const [name, size, opts] of jobs) {
  writeFileSync(new URL(name, OUT), render(size, opts));
  console.log('wrote', name);
}
