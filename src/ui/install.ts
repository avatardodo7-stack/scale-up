// Built-in "install the app" flow.
// - Chrome / Edge / Samsung Internet (Android + desktop): real one-tap install via beforeinstallprompt.
// - iPhone / iPad Safari: no install API exists, so we show illustrated "Share → Add to Home Screen" steps.
// - Anything else: generic "browser menu → Install app" steps.
import { openModal } from './modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const INSTALLED_KEY = 'scaleup.v1.installed';
let installed = (() => { try { return localStorage.getItem(INSTALLED_KEY) === '1'; } catch { return false; } })();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isMobile = (): boolean => isIOS() || /android|mobile/i.test(navigator.userAgent);

/** True when we have something useful to offer: a native prompt, or manual steps on a phone. */
export const canOfferInstall = (): boolean =>
  !isStandalone() && (deferred !== null || (!installed && isMobile()));

export function onInstallChange(fn: () => void): void {
  listeners.add(fn);
}

export function initInstall(onInstalled: () => void): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep the event so our own button can trigger it
    deferred = e as BeforeInstallPromptEvent;
    installed = false; // the browser says it is installable again (e.g. the app was removed)
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    try { localStorage.setItem(INSTALLED_KEY, '1'); } catch { /* ignore */ }
    notify();
    onInstalled();
  });
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', notify);
}

const SHARE_ICON =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
const ADD_ICON =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';

const PERKS = `<ul class="perks">
    <li><span>⚡</span>Opens instantly, full screen</li>
    <li><span>✈️</span>Plays offline, anywhere</li>
    <li><span>🏠</span>One tap from your home screen</li>
  </ul>`;

/** Open the install sheet. Uses the native prompt when the browser offers one. */
export function showInstall(): void {
  const head = `<button class="x" data-close aria-label="Close">✕</button>
    <img class="app-icon" src="./icons/icon-192.png" alt="" width="84" height="84">
    <h2 class="sheet-title">Install SCALE UP</h2>
    ${PERKS}`;

  if (deferred) {
    const m = openModal(`${head}<button class="btn primary wide" data-install>📲 Install app</button>
      <button class="btn ghost wide slim" data-close>Not now</button>`, { className: 'install' });
    m.el.querySelector('[data-install]')!.addEventListener('click', async () => {
      const ev = deferred;
      if (!ev) return m.close();
      deferred = null;
      m.close();
      await ev.prompt();
      await ev.userChoice.catch(() => undefined);
      notify();
    });
    return;
  }

  const steps = isIOS()
    ? `<ol class="steps">
         <li><b>1</b><span>Tap the <i class="chip">${SHARE_ICON} Share</i> button in Safari's toolbar</span></li>
         <li><b>2</b><span>Scroll down and tap <i class="chip">${ADD_ICON} Add to Home Screen</i></span></li>
         <li><b>3</b><span>Tap <i class="chip">Add</i>, and SCALE UP appears on your home screen</span></li>
       </ol>`
    : `<ol class="steps">
         <li><b>1</b><span>Open your browser menu <i class="chip">⋮</i></span></li>
         <li><b>2</b><span>Tap <i class="chip">Install app</i> or <i class="chip">Add to Home screen</i></span></li>
         <li><b>3</b><span>Launch SCALE UP from your home screen</span></li>
       </ol>`;
  openModal(`${head}${steps}<button class="btn primary wide" data-close>Got it</button>`, { className: 'install' });
}
