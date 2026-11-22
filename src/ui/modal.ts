export interface ModalHandle { el: HTMLElement; close: () => void }

interface Entry extends ModalHandle { dismissable: boolean }

const stack: Entry[] = [];
const root = () => document.getElementById('overlay-root')!;

export const modalOpen = (): boolean => stack.length > 0;

/** Open a centered sheet over a blurred backdrop. Returns the sheet element. */
export function openModal(
  html: string,
  opts: { className?: string; dismissable?: boolean; onClose?: () => void } = {},
): ModalHandle {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="sheet ${opts.className ?? ''}" role="dialog" aria-modal="true">${html}</div>`;
  const sheet = back.firstElementChild as HTMLElement;
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    const i = stack.findIndex((e) => e.el === sheet);
    if (i >= 0) stack.splice(i, 1);
    back.classList.add('closing');
    window.setTimeout(() => back.remove(), 180);
    opts.onClose?.();
  };

  const dismissable = opts.dismissable ?? true;
  back.addEventListener('pointerdown', (e) => {
    if (e.target === back && dismissable) close();
  });
  sheet.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => b.addEventListener('click', close));

  root().appendChild(back);
  const entry = { el: sheet, close, dismissable };
  stack.push(entry);
  return entry;
}

export function closeAll(): void {
  [...stack].forEach((e) => e.close());
}

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const top = stack[stack.length - 1];
  if (top?.dismissable) top.close();
});

let toastTimer: number | undefined;
export function toast(msg: string): void {
  const t = document.getElementById('toast')!;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), 2000);
}
