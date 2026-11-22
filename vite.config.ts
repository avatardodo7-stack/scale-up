import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Writes dist/sw.js after the build with a precache list of every output file,
 * versioned by build time, so the game works fully offline after the first visit.
 */
function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'scaleup-sw',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const f of readdirSync(dir)) {
          const p = join(dir, f);
          if (statSync(p).isDirectory()) walk(p);
          else files.push(relative(outDir, p).split('\\').join('/'));
        }
      };
      walk(outDir);
      const list = ['./', ...files.filter((f) => f !== 'sw.js' && f !== 'index.html').map((f) => `./${f}`)];
      const version = Date.now().toString(36);
      writeFileSync(join(outDir, 'sw.js'), `// Generated at build time. Cache-first assets, offline-ready.
const CACHE = 'scaleup-${version}';
const PRECACHE = ${JSON.stringify(list)};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('scaleup-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // Network first for the page so updates arrive; cached shell when offline.
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); return res; })
        .catch(() => caches.match('./', { ignoreVary: true })),
    );
    return;
  }
  e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
`);
    },
  };
}

export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  plugins: [serviceWorker()],
  test: { include: ['tests/**/*.test.ts'] },
});
