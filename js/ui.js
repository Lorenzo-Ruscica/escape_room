import { ITEMS, state } from './state.js';
import { sound } from './audio.js';

const reticleEl = document.getElementById('reticle');
const watermarkEl = document.getElementById('intro-watermark');
const roomTagEl = document.getElementById('room-tag');
const audioBtn = document.getElementById('audio-toggle');
const brightnessSlider = document.getElementById('brightness-slider');
const closeupBackBtn = document.getElementById('closeup-back');
const whisperEl = document.getElementById('whisper-text');
const hoverLabelEl = document.getElementById('hover-label');
const invBarEl = document.getElementById('inventory-bar');
const invSlotsEl = document.getElementById('inventory-slots');

const docDialog = document.getElementById('doc-dialog');
const docMetaEl = document.getElementById('doc-meta');
const docTitleEl = document.getElementById('doc-title');
const docBodyEl = document.getElementById('doc-body');
const docCloseBtn = document.getElementById('doc-close');

const endingDialog = document.getElementById('ending-dialog');
const endingStatsEl = document.getElementById('ending-stats');
const restartBtn = document.getElementById('restart-btn');

let whisperTimer = null;
let supportsDisplayTransition;

// Rilevamento affidabile del supporto transizioni discrete su display (incluso bug Firefox)
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
}

export async function closeTopLayer(dialog) {
  if (!dialog.open) return;
  if (!supportsTopLayerExit()) {
    dialog.setAttribute('data-closing', '');
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 600))
      ]);
    }
    if (!dialog.hasAttribute('data-closing')) return;
    dialog.removeAttribute('data-closing');
  }
  dialog.close();
}

export function initUI({ onLeaveCloseup, onRestart, onBrightnessChange }) {
  if (window.matchMedia('(pointer: fine)').matches) {
    document.body.classList.add('custom-cursor');
    window.addEventListener('pointermove', (e) => {
      reticleEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }, { passive: true });
  }

  if (brightnessSlider) {
    const syncFallbackProgress = () => {
      if (!window.CSS?.supports?.('accent-color', 'auto')) {
        const min = Number(brightnessSlider.min) || 50;
        const max = Number(brightnessSlider.max) || 220;
        const pct = ((Number(brightnessSlider.value) - min) / (max - min)) * 100;
        brightnessSlider.style.setProperty('--progress', `${pct.toFixed(1)}%`);
      }
    };
    syncFallbackProgress();
    brightnessSlider.addEventListener('input', () => {
      syncFallbackProgress();
      if (onBrightnessChange) {
        onBrightnessChange(Number(brightnessSlider.value) / 100);
      }
    });
  }

  audioBtn.addEventListener('click', () => {
    const muted = sound.toggleMute();
    audioBtn.classList.toggle('is-muted', muted);
  });

  closeupBackBtn.addEventListener('click', () => {
    onLeaveCloseup();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !docDialog.open && !endingDialog.open && state.closeupId) {
      onLeaveCloseup();
    }
  });

  // Gestione dialoghi nativi (<dialog>) + fallback closedby + animazione uscita
  for (const dialog of [docDialog, endingDialog]) {
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeTopLayer(dialog);
    });
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
    });
  }

  // Fallback light-dismiss per browser senza closedby nativo
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    docDialog.addEventListener('click', (event) => {
      if (event.target !== docDialog) return;
      const rect = docDialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) {
        closeTopLayer(docDialog);
      }
    });
  }

  docCloseBtn.addEventListener('click', () => {
    closeTopLayer(docDialog);
  });

  restartBtn.addEventListener('click', async () => {
    await closeTopLayer(endingDialog);
    onRestart();
  });
}

export function hideWatermark() {
  watermarkEl.classList.add('is-hidden');
}

export function setRoomTitle(title) {
  roomTagEl.textContent = title;
}

export function setCloseupUI(isActive) {
  closeupBackBtn.hidden = !isActive;
}

export function whisper(message, duration = 4200) {
  if (!message) return;
  clearTimeout(whisperTimer);
  whisperEl.textContent = message;
  whisperEl.classList.add('is-visible');
  whisperTimer = window.setTimeout(() => {
    whisperEl.classList.remove('is-visible');
  }, duration);
}

export function setHoverFeedback(label, kind = null) {
  if (label) {
    const armedPrefix = state.armedItem ? `Usa ${ITEMS[state.armedItem].name} → ` : '';
    hoverLabelEl.textContent = armedPrefix + label;
    hoverLabelEl.classList.add('is-visible');
  } else {
    hoverLabelEl.classList.remove('is-visible');
  }

  reticleEl.classList.toggle('is-interactive', Boolean(label));
  reticleEl.classList.toggle('is-door', kind === 'door');
  reticleEl.classList.toggle('has-item', Boolean(state.armedItem));
}

export function renderInventory() {
  invSlotsEl.innerHTML = '';
  if (state.inventory.length === 0) {
    invBarEl.classList.add('is-empty');
    reticleEl.classList.remove('has-item');
    return;
  }

  invBarEl.classList.remove('is-empty');

  for (const itemId of state.inventory) {
    const item = ITEMS[itemId];
    if (!item) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'inv-slot' + (state.armedItem === itemId ? ' is-armed' : '');
    btn.title = item.name;
    btn.setAttribute('aria-label', item.name);
    btn.setAttribute('aria-pressed', state.armedItem === itemId ? 'true' : 'false');
    btn.innerHTML = item.svg;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playDialTick(1.25);
      if (state.armedItem === itemId) {
        state.armedItem = null;
        whisper(`${item.name} riposta.`, 2200);
      } else {
        state.armedItem = itemId;
        whisper(`In mano: ${item.name}. Clicca sull’elemento su cui usarla.`, 3400);
      }
      renderInventory();
      reticleEl.classList.toggle('has-item', Boolean(state.armedItem));
    });

    invSlotsEl.appendChild(btn);
  }
}

export function openDocument({ meta, title, html }) {
  sound.playPaper();
  docMetaEl.textContent = meta || 'REPERTO';
  docTitleEl.textContent = title;
  docBodyEl.innerHTML = html;
  if (!docDialog.open) {
    docDialog.showModal();
  }
}

export function openEndingScreen() {
  const elapsedSec = Math.max(1, Math.round((performance.now() - state.startedAt) / 1000));
  const mins = Math.floor(elapsedSec / 60);
  const secs = String(elapsedSec % 60).padStart(2, '0');
  endingStatsEl.textContent = `TEMPO TRASCORSO: ${mins}m ${secs}s  ·  AZIONI: ${state.interactions}`;
  if (!endingDialog.open) {
    endingDialog.showModal();
  }
}

export function isModalOpen() {
  return docDialog.open || endingDialog.open;
}
