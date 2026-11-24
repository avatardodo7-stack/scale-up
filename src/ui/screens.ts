import { iconHTML } from '../data/icons';
import { TIERS, conversions, fmt, jumpText, tierInfo, timesAtom, withArticle } from '../data/tiers';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, converterHref } from '../config';
import { MAX_TIER } from '../logic/board';
import { type ModalHandle, openModal } from './modal';

const swatch = (tier: number) => {
  const c = tierInfo(tier).colors;
  return `--c1:${c[0]};--c2:${c[1]}`;
};

const orb = (tier: number, cls = '') =>
  `<div class="orb ${tier >= 17 ? 'cosmic' : ''} ${cls}" style="${swatch(tier)}">${iconHTML(tierInfo(tier).icon)}</div>`;

const IG_ICON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';

/** "Made by Orynto Labs" credit with the Instagram link. */
export const byline = (prefix = '') =>
  `<div class="byline">${prefix}Made by <b>Orynto Labs</b>` +
  `<a class="ig" href="${INSTAGRAM_URL}" target="_blank" rel="noopener">${IG_ICON}${INSTAGRAM_HANDLE}</a></div>`;

const converterLine = () =>
  `<a class="converter-link" href="${converterHref()}" target="_blank" rel="noopener">Convert anything → <b>Orynto Unit Converter</b></a>`;

// ---------------------------------------------------------------- info card

export function infoCard(tier: number): ModalHandle {
  const t = tierInfo(tier);
  const jump = jumpText(tier);
  const rows = conversions(t)
    .map((r) => `<div class="conv-row${r.fun ? ' fun' : ''}"><span>${r.unit}</span><b>${r.value}</b></div>`)
    .join('');
  return openModal(
    `<button class="x" data-close aria-label="Close">✕</button>
     <div class="card-hero" style="${swatch(tier)}">
       ${orb(tier, 'big')}
       <div class="tier-chip">Tier ${tier} / ${MAX_TIER}</div>
     </div>
     <h2 class="card-title">${t.name}</h2>
     <p class="card-size"><b>${t.label}</b> · ${t.measure}</p>
     ${jump ? `<p class="card-jump">${jump}</p>` : '<p class="card-jump">Where it all begins</p>'}
     <p class="card-fact">💡 ${t.fact}</p>
     <div class="conv">${rows}</div>
     ${tier > 1 ? `<p class="card-atoms">${timesAtom(tier)}× the width of a hydrogen atom</p>` : ''}
     ${converterLine()}`,
    { className: 'info' },
  );
}

// ---------------------------------------------------------------- discovery banner

let bannerTimer: number | undefined;
export function discoveryBanner(tier: number, onOpen: () => void): void {
  const t = tierInfo(tier);
  const host = document.getElementById('banner')!;
  host.innerHTML = `<div class="banner-in" style="${swatch(tier)}">
      ${orb(tier)}
      <div class="banner-txt">
        <div class="kicker">✦ New discovery</div>
        <div class="banner-name">${t.name} <span>${t.label}</span></div>
        <div class="banner-jump">${jumpText(tier) ?? ''}!</div>
      </div>
    </div>`;
  host.classList.remove('show');
  void host.offsetWidth; // restart the animation
  host.classList.add('show');
  host.onclick = () => { hide(); onOpen(); };
  const hide = () => host.classList.remove('show');
  clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(hide, 3000);
}

// ---------------------------------------------------------------- discoveries

export function discoveriesScreen(found: Set<number>): ModalHandle {
  const cards = TIERS.map((t) => {
    const have = found.has(t.tier);
    return have
      ? `<button class="disc have" data-tier="${t.tier}" style="${swatch(t.tier)}">
           ${orb(t.tier)}<span class="dn">${t.name}</span><span class="ds">${t.label}</span></button>`
      : `<div class="disc locked"><div class="orb sil">${iconHTML(t.icon)}</div><span class="dn">???</span><span class="ds">Tier ${t.tier}</span></div>`;
  }).join('');
  const pct = Math.round((found.size / TIERS.length) * 100);
  const m = openModal(
    `<button class="x" data-close aria-label="Close">✕</button>
     <h2 class="sheet-title">Discoveries</h2>
     <div class="disc-progress"><div class="bar"><i style="width:${pct}%"></i></div><span><b>${found.size}</b> / ${TIERS.length} discovered</span></div>
     <div class="disc-grid">${cards}</div>
     ${converterLine()}`,
    { className: 'discoveries' },
  );
  m.el.querySelectorAll<HTMLElement>('.disc.have').forEach((b) =>
    b.addEventListener('click', () => infoCard(Number(b.dataset.tier))),
  );
  return m;
}

// ---------------------------------------------------------------- game over / win

export function gameOverScreen(o: {
  score: number; best: number; newBest: boolean; topTier: number; canUndo: boolean; canInstall: boolean;
  onUndo: () => void; onAgain: () => void; onShare: () => void; onInstall: () => void;
}): ModalHandle {
  const t = tierInfo(o.topTier);
  const m = openModal(
    `<div class="end-kicker">No moves left</div>
     <div class="end-score">${o.score.toLocaleString('en-US')}</div>
     <div class="end-best">${o.newBest ? '<span class="new-best">★ New best!</span>' : `Best ${o.best.toLocaleString('en-US')}`}</div>
     <div class="reached" style="${swatch(o.topTier)}">${orb(o.topTier)}<div><small>You reached</small><b>${t.name} ${t.emoji}</b><small>${t.label}</small></div></div>
     <div class="btns">
       ${o.canUndo ? '<button class="btn ghost" data-act="undo">↶ Use your undo</button>' : ''}
       <button class="btn primary" data-act="again">Play again</button>
       <button class="btn" data-act="share">Share</button>
       ${o.canInstall ? '<button class="btn ghost slim" data-act="install">📲 Install to play offline</button>' : ''}
     </div>
     ${byline()}`,
    { className: 'end', dismissable: false },
  );
  wire(m, { undo: o.onUndo, again: o.onAgain, share: o.onShare, install: o.onInstall });
  return m;
}

export function winScreen(o: { score: number; onContinue: () => void; onAgain: () => void; onShare: () => void }): ModalHandle {
  const u = tierInfo(MAX_TIER);
  const m = openModal(
    `<div class="win-orb">${orb(MAX_TIER, 'big')}</div>
     <div class="end-kicker">You reached the</div>
     <h2 class="win-title">Observable Universe</h2>
     <p class="win-sub">93 billion light-years across, about ${fmt(u.meters / TIERS[0].meters)} times wider than the atom you started with.</p>
     <div class="end-score small">${o.score.toLocaleString('en-US')}</div>
     <div class="btns">
       <button class="btn primary" data-act="cont">Keep playing</button>
       <button class="btn" data-act="share">Share</button>
       <button class="btn ghost" data-act="again">New game</button>
     </div>
     ${byline()}`,
    { className: 'end win', dismissable: false },
  );
  wire(m, { cont: o.onContinue, again: o.onAgain, share: o.onShare });
  return m;
}

function wire(m: ModalHandle, acts: Record<string, () => void>): void {
  m.el.querySelectorAll<HTMLElement>('[data-act]').forEach((b) =>
    b.addEventListener('click', () => {
      const fn = acts[b.dataset.act!];
      if (b.dataset.act !== 'share' && b.dataset.act !== 'install') m.close();
      fn?.();
    }),
  );
}

// ---------------------------------------------------------------- settings

export function settingsScreen(o: {
  sound: boolean; haptics: boolean;
  onSound: (v: boolean) => void; onHaptics: (v: boolean) => void;
  onNewGame: () => void; onTutorial: () => void; onReset: () => void; canInstall: boolean; onInstall: () => void;
}): ModalHandle {
  const tog = (id: string, label: string, on: boolean) =>
    `<label class="row"><span>${label}</span><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i class="switch"></i></label>`;
  const m = openModal(
    `<button class="x" data-close aria-label="Close">✕</button>
     <h2 class="sheet-title">Settings</h2>
     <div class="list">
       ${tog('set-sound', '🔊 Sound', o.sound)}
       ${tog('set-haptics', '📳 Vibration', o.haptics)}
       ${o.canInstall ? '<button class="row accent" data-act="install"><span>📲 Install app</span><i>›</i></button>' : ''}
       <button class="row" data-act="new"><span>🔄 New game</span><i>›</i></button>
       <button class="row" data-act="tut"><span>❓ How to play</span><i>›</i></button>
       <a class="row" href="${INSTAGRAM_URL}" target="_blank" rel="noopener"><span>📸 Follow ${INSTAGRAM_HANDLE}</span><i>›</i></a>
       <button class="row danger" data-act="reset"><span>🗑️ Reset all progress</span><i>›</i></button>
     </div>
     ${converterLine()}
     ${byline('SCALE UP · ')}`,
    { className: 'settings' },
  );
  m.el.querySelector<HTMLInputElement>('#set-sound')!.addEventListener('change', (e) => o.onSound((e.target as HTMLInputElement).checked));
  m.el.querySelector<HTMLInputElement>('#set-haptics')!.addEventListener('change', (e) => o.onHaptics((e.target as HTMLInputElement).checked));
  m.el.querySelector('[data-act="new"]')!.addEventListener('click', () => { m.close(); o.onNewGame(); });
  m.el.querySelector('[data-act="install"]')?.addEventListener('click', () => { m.close(); o.onInstall(); });
  m.el.querySelector('[data-act="tut"]')!.addEventListener('click', () => { m.close(); o.onTutorial(); });
  const reset = m.el.querySelector<HTMLElement>('[data-act="reset"]')!;
  reset.addEventListener('click', () => {
    if (reset.dataset.armed) { m.close(); o.onReset(); return; }
    reset.dataset.armed = '1';
    reset.querySelector('span')!.textContent = '⚠️ Tap again: erases best score & discoveries';
  });
  return m;
}

// ---------------------------------------------------------------- tutorial

const STEPS = [
  {
    art: '<div class="tut-swipe"><span class="hand">👆</span></div>',
    title: 'Swipe to move',
    body: 'Swipe in any direction and every tile slides. On a keyboard, use the arrow keys or WASD.',
  },
  {
    art: `<div class="tut-merge">${orb(1)}<span>+</span>${orb(1)}<span>=</span>${orb(2)}</div>`,
    title: 'Merge to scale up',
    body: 'Two identical objects merge into the next size up. Start at an atom and grow all the way to the universe.',
  },
  {
    art: `<div class="tut-hold">${orb(8)}<span class="ring"></span></div>`,
    title: 'Long-press to learn',
    body: 'Hold any tile (right-click on desktop) to see its real size in different units, plus a fun fact.',
  },
];

export function tutorial(onDone: () => void): void {
  let i = 0;
  const m = openModal('', { className: 'tutorial', dismissable: false });
  const render = () => {
    const s = STEPS[i];
    m.el.innerHTML = `<div class="tut-art">${s.art}</div>
      <h2 class="sheet-title">${s.title}</h2><p class="tut-body">${s.body}</p>
      <div class="dots">${STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn primary wide" data-next>${i < STEPS.length - 1 ? 'Next' : "Let's go!"}</button>`;
    m.el.querySelector('[data-next]')!.addEventListener('click', () => {
      i++;
      if (i >= STEPS.length) { m.close(); onDone(); } else render();
    });
  };
  render();
}

// ---------------------------------------------------------------- start screen

export function startScreen(o: { canContinue: boolean; best: number; found: number; onPlay: () => void; onNew: () => void; onDiscoveries: () => void; onInstall: () => void }): HTMLElement {
  const el = document.createElement('div');
  el.className = 'start';
  const ladder = TIERS.map((t) => orb(t.tier)).join('');
  el.innerHTML = `
    <div class="start-in">
      <div class="start-logo"><span>SCALE</span><span class="up">UP</span></div>
      <p class="start-tag">From an atom to the observable universe.<br>Merge your way up the scale of everything.</p>
      <div class="ladder"><div class="ladder-track">${ladder}${ladder}</div></div>
      <div class="start-stats">
        <div><b>${o.best.toLocaleString('en-US')}</b><small>Best score</small></div>
        <div><b>${o.found} / ${TIERS.length}</b><small>Discovered</small></div>
      </div>
      <div class="btns">
        <button class="btn primary big" data-act="play">${o.canContinue ? 'Continue' : 'Play'}</button>
        ${o.canContinue ? '<button class="btn" data-act="new">New game</button>' : ''}
        <button class="btn ghost" data-act="disc">Discoveries</button>
        <button class="btn install-cta" data-act="install" hidden>📲 Install app · plays offline</button>
      </div>
    </div>
    ${byline()}`;
  const acts: Record<string, () => void> = { play: o.onPlay, new: o.onNew, disc: o.onDiscoveries, install: o.onInstall };
  el.querySelectorAll<HTMLElement>('[data-act]').forEach((b) => b.addEventListener('click', () => acts[b.dataset.act!]()));
  return el;
}

export const shareText = (topTier: number, won: boolean): string => {
  const t = tierInfo(topTier);
  return won
    ? `I scaled all the way up to the Observable Universe in SCALE UP ✨ Can you?`
    : `I scaled up to ${withArticle(t)} in SCALE UP ${t.emoji} Can you reach the Universe?`;
};
