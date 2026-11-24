# SCALE UP

A merge puzzle from a hydrogen atom to the observable universe. By **Orynto Labs**.

Swipe to slide the tiles. Two identical objects merge into the next size up, across 19 tiers of real objects with real sizes.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on localhost |
| `npm run dev:host` | Dev server reachable from your phone on the same Wi-Fi |
| `npm test` | Vitest unit tests for the game logic |
| `npm run build` | Type-check and production build to `dist/` (includes the service worker) |
| `npm run preview` | Serve the production build (also on your LAN) |
| `npm run icons` | Regenerate the PWA icons in `public/icons/` |

## Structure

```
src/
  logic/       pure game rules (move, merge, spawn, game over, undo), fully unit-tested
  data/        the 19 tiers (sizes, facts, colors), unit conversions, custom SVG icons
  render/      DOM tile renderer, particle canvas, shake/score FX, starfield
  input/       swipe, long-press, right-click, keyboard (arrows / WASD)
  audio/       Web Audio synthesized sound effects and haptics
  ui/          modals and screens (start, tutorial, info card, discoveries, settings, game over, win)
  storage.ts   localStorage: best score, discoveries, settings, game in progress
  config.ts    Orynto Unit Converter link (replace the placeholder)
tests/         Vitest specs
```

## Configuration

- **Converter link:** set `CONVERTER_URL` in `src/config.ts`.
- **Live:** https://scale-up-olive.vercel.app (auto-deploys from `main`)
- **Brand colors:** `--primary` and `--accent` at the top of `src/styles/main.css`.
