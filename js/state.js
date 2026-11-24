export const LEVELS = {
  1: {
    id: 1,
    roman: 'I',
    code: 'ARCHIVIO VANE // CAPITOLO I',
    title: 'SOGLIA IV',
    subtitle: 'La Dimora Cittadina · Clicca per ispezionare',
    startRoom: 'vestibule',
    introWhisper: 'Aria ferma e legno antico. L’ingegnere Vane ha sigillato lo studio prima di svanire.',
    epilogue: {
      meta: 'SOGLIA 0 // PASSAGGIO ESTERNO',
      title: 'LA DIMORA È ALLE SPALLE',
      copy: 'I pistoni idraulici cedono dopo decenni di silenzio. Oltre la chiusa dello studio non c’è la strada di città, ma un sentiero scavato nella falesia che scende verso il mare aperto e la vecchia vedetta di Capo Bruma.',
      nextLevel: 2,
      nextLabel: 'Prosegui → Capitolo II · Capo Bruma'
    }
  },
  2: {
    id: 2,
    roman: 'II',
    code: 'CAPO BRUMA // CAPITOLO II',
    title: 'SOGLIA III',
    subtitle: 'L’Osservatorio Costiero · Clicca per ispezionare',
    startRoom: 'greenhouse',
    introWhisper: 'Vento salmastro contro i vetri della serra. Qui Vane trascorse le ultime notti del ’64.',
    epilogue: {
      meta: 'MOLO DI CAPO BRUMA // MARE APERTO',
      title: 'IL SEGNALE SUL LARGO',
      copy: 'Il fascio dorato della lente di Fresnel fende la foschia sull’acqua nera. Giù alla banchina di pietra la paratia del molo è finalmente aperta: al largo, dove le carte di Vane segnavano il punto di raccolta, una lanterna risponde dal mare.',
      nextLevel: null,
      nextLabel: null
    }
  }
};

export const ITEMS = {
  // --- Oggetti Capitolo I ---
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
  },

  // --- Oggetti Capitolo II ---
  shears: {
    id: 'shears',
    name: 'Cesoie da potatura',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="18" r="2.6" />
      <circle cx="18" cy="18" r="2.6" />
      <path d="M8.2 16.2L19 4M15.8 16.2L5 4" />
    </svg>`
  },
  developer_bottle: {
    id: 'developer_bottle',
    name: 'Rivelatore argentico',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3h6M10 3v4l-3 3.5V19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8.5L14 7V3" />
      <path d="M7 14h10" />
    </svg>`
  },
  tower_key: {
    id: 'tower_key',
    name: 'Chiave della Lanterna',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
      <path d="M10.5 12H21M17.5 12v-3M20.5 12v-2.5" />
    </svg>`
  },
  fresnel_prism: {
    id: 'fresnel_prism',
    name: 'Prisma di Fresnel',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,3 21,19 3,19" />
      <path d="M12 3l3 16M12 3L9 19" opacity="0.65" />
    </svg>`
  }
};

// Costanti Enigmi Capitolo I
export const VALVE_DELTAS = [6, 4, -3, 2]; // I+II+III = 6+4-3 = 7 BAR
export const TARGET_PRESSURE = 7;
export const SAFE_TARGET = [4, 7, 9]; // [alpha, beta, gamma]
export const ROTOR_SYMBOLS = ['✛', '◯', '△', '◇'];
export const TARGET_ROTORS = [3, 2, 1]; // ['◇', '△', '◯']

// Costanti Enigmi Capitolo II
export const CABINET_TARGET = [5, 2, 8]; // [LAS, MAR, OND]
export const COMPASS_DIRS = ['N', 'E', 'S', 'O'];
export const TARGET_COMPASS = [3, 2, 1]; // ['O', 'S', 'E']

export function createInitialState(level = 1) {
  const lvl = LEVELS[level] ? level : 1;
  return {
    currentLevel: lvl,
    currentRoom: LEVELS[lvl].startRoom,
    closeupId: null,
    startedAt: performance.now(),
    interactions: 0,

    // Inventario condiviso col capitolo attivo
    inventory: [],
    armedItem: null,

    // --- CAPITOLO I: Dimora Vane ---
    hasPrybar: false,
    grateUnlocked: false,
    fuseboxOpen: false,
    fuseInserted: false,
    powerOn: false,
    safeDigits: [0, 0, 0],
    safeOpen: false,
    hasMasterKey: false,

    valves: [false, false, false, false],
    basinDrained: false,
    hasFuse: false,

    glassWiped: false,
    consoleUnlocked: false,
    rotors: [0, 0, 1],
    vaultOpen: false,
    escaped: false,

    // --- CAPITOLO II: Capo Bruma ---
    // Stanza 1: Serra d'Inverno
    hasShears: false,
    vinesCut: false,
    hasDeveloper: false,
    paneWiped: false,
    cabinetDigits: [0, 0, 0],
    cabinetOpen: false,
    hasTowerKey: false,
    towerUnlocked: false,

    // Stanza 2: Camera Oscura
    photoDeveloped: false,

    // Stanza 3: Lanterna del Faro
    hasPrism: false,
    prismInserted: false,
    compassRings: [0, 1, 2], // Iniziale: ['N', 'E', 'S']
    beaconLit: false
  };
}

export const state = createInitialState(1);

export function resetState(level = state.currentLevel) {
  const fresh = createInitialState(level);
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
