export const ITEMS = {
  prybar: {
    id: 'prybar',
    name: 'Leva d’acciaio',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 19L16.5 7.5" />
      <path d="M16.5 7.5C18 6 20 6 20.5 7.5C21 9 19.5 10.5 18 10.5" />
      <path d="M3.5 20.5L6.5 17.5" />
    </svg>`
  },
  fuse: {
    id: 'fuse',
    name: 'Fusibile ceramico',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="7" y="5" width="10" height="14" rx="2" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3" />
      <path d="M12 8v8" stroke-dasharray="2 2" />
    </svg>`
  },
  master_key: {
    id: 'master_key',
    name: 'Chiave maestra d’ottone',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="7.5" cy="12" r="3.5" />
      <path d="M11 12h10M18 12v3.5M21 12v2.5" />
    </svg>`
  }
};

export const VALVE_DELTAS = [6, 4, -3, 2]; // Condotte I, II, III, IV -> I+II+III = 6+4-3 = 7 BAR
export const TARGET_PRESSURE = 7;
export const SAFE_TARGET = [4, 7, 9]; // [alpha, beta, gamma]
export const ROTOR_SYMBOLS = ['✛', '◯', '△', '◇'];
export const TARGET_ROTORS = [3, 2, 1]; // ['◇', '△', '◯']

export function createInitialState() {
  return {
    currentRoom: 'vestibule',
    closeupId: null,
    startedAt: performance.now(),
    interactions: 0,

    // Inventario
    inventory: [],     // IDs posseduti attualmente
    armedItem: null,   // ID selezionato per l'uso

    // Stanza 1: Anticamera Sommersa
    hasPrybar: false,
    grateUnlocked: false,
    fuseboxOpen: false,
    fuseInserted: false,
    powerOn: false,
    safeDigits: [0, 0, 0],
    safeOpen: false,
    hasMasterKey: false,

    // Stanza 2: Sala delle Valvole
    valves: [false, false, false, false],
    basinDrained: false,
    hasFuse: false,

    // Stanza 3: Camera di Controllo
    glassWiped: false,
    consoleUnlocked: false,
    rotors: [0, 0, 1], // Iniziale: ['✛', '✛', '◯']
    vaultOpen: false,
    escaped: false
  };
}

export const state = createInitialState();

export function resetState() {
  const fresh = createInitialState();
  for (const key of Object.keys(fresh)) {
    state[key] = fresh[key];
  }
}

export function computePressure() {
  let total = 0;
  for (let i = 0; i < 4; i++) {
    if (state.valves[i]) total += VALVE_DELTAS[i];
  }
  return total;
}

export function addInventoryItem(itemId) {
  if (!state.inventory.includes(itemId)) {
    state.inventory.push(itemId);
  }
}

export function consumeInventoryItem(itemId) {
  state.inventory = state.inventory.filter((id) => id !== itemId);
  if (state.armedItem === itemId) {
    state.armedItem = null;
  }
}
