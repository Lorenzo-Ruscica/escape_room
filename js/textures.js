import * as THREE from 'three';

const cache = new Map();

function seededNoise(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w = 512, h = 512) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function getConcreteTexture(repeatX = 2, repeatY = 1) {
  const key = `concrete_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(404);

  // Base cemento scuro umido uniforme da pavimento a soffitto (nessuno stacco netto)
  ctx.fillStyle = '#404449';
  ctx.fillRect(0, 0, 512, 512);

  // Macchie umide e incrostazioni minerali periodiche su X (nessuna cucitura né orizzontale né verticale)
  for (let i = 0; i < 950; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    const r = 4 + rnd() * 34;
    const v = Math.floor(38 + rnd() * 44);
    ctx.fillStyle = `rgba(${v}, ${v + 2}, ${v + 4}, ${0.06 + rnd() * 0.11})`;
    for (const dx of [-512, 0, 512]) {
      if (x + dx + r < 0 || x + dx - r > 512) continue;
      ctx.beginPath();
      ctx.arc(x + dx, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Colature di umidità verticali e ruggine morbide dall'alto e dal centro
  for (let i = 0; i < 48; i++) {
    const x = rnd() * 512;
    const w = 3 + rnd() * 10;
    const h = 90 + rnd() * 260;
    const y = rnd() * 260;
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    const isRust = rnd() > 0.55;
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.2, isRust ? 'rgba(92, 46, 25, 0.36)' : 'rgba(16, 18, 22, 0.36)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    for (const dx of [-512, 0, 512]) {
      if (x + dx + w < 0 || x + dx > 512) continue;
      ctx.fillRect(x + dx, y, w, h);
    }
  }

  // Crepe sottili nel cemento
  ctx.strokeStyle = 'rgba(14, 16, 19, 0.62)';
  ctx.lineWidth = 1.3;
  for (let c = 0; c < 12; c++) {
    let cx = 40 + rnd() * 432;
    let cy = 30 + rnd() * 380;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 7; s++) {
      cx += (rnd() - 0.5) * 32;
      cy += rnd() * 28;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Sfumatura umida solo alla base del muro (v=0, pavimento) e leggera ombra sotto il soffitto (v=1)
  const topShade = ctx.createLinearGradient(0, 0, 0, 96);
  topShade.addColorStop(0, 'rgba(8, 9, 12, 0.45)');
  topShade.addColorStop(1, 'rgba(8, 9, 12, 0)');
  ctx.fillStyle = topShade;
  ctx.fillRect(0, 0, 512, 96);

  const damp = ctx.createLinearGradient(0, 390, 0, 512);
  damp.addColorStop(0, 'rgba(8, 9, 12, 0)');
  damp.addColorStop(1, 'rgba(8, 9, 12, 0.58)');
  ctx.fillStyle = damp;
  ctx.fillRect(0, 390, 512, 122);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, 1);
  cache.set(key, tex);
  return tex;
}

export function getRustMetalTexture(tint = '#7d685c') {
  const key = `rust_${tint}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(9182);

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 512, 512);

  // Chiazze di ossidazione calda e ferro spazzolato ben visibili
  const palette = [
    'rgba(152, 76, 38, 0.34)',
    'rgba(176, 92, 44, 0.24)',
    'rgba(58, 56, 58, 0.28)',
    'rgba(112, 74, 52, 0.28)'
  ];
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = palette[Math.floor(rnd() * palette.length)];
    const x = rnd() * 512;
    const y = rnd() * 512;
    const rx = 3 + rnd() * 24;
    const ry = 3 + rnd() * 18;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Graffi metallici chiari
  ctx.strokeStyle = 'rgba(215, 198, 180, 0.16)';
  ctx.lineWidth = 1.0;
  for (let i = 0; i < 85; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 48, y + (rnd() - 0.5) * 16);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

export function getFloorTileTexture() {
  if (cache.has('floor_tile')) return cache.get('floor_tile');
  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(731);

  ctx.fillStyle = '#1b1e22';
  ctx.fillRect(0, 0, 512, 512);

  const step = 64;
  for (let gx = 0; gx < 512; gx += step) {
    for (let gy = 0; gy < 512; gy += step) {
      const v = Math.floor(38 + rnd() * 18);
      ctx.fillStyle = `rgb(${v}, ${v + 2}, ${v + 4})`;
      ctx.fillRect(gx + 2, gy + 2, step - 4, step - 4);
    }
  }

  for (let i = 0; i < 420; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    ctx.fillStyle = rnd() > 0.65 ? 'rgba(110, 62, 36, 0.22)' : 'rgba(24, 26, 30, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y, 4 + rnd() * 22, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  cache.set('floor_tile', tex);
  return tex;
}

// Quadrante Manometro (0..12 BAR, tacca rossa a 7, simbolo β al centro)
export function createGaugeDialTexture() {
  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  // Fondo ottone ossidato / pergamena scura
  const rad = ctx.createRadialGradient(256, 256, 20, 256, 256, 248);
  rad.addColorStop(0, '#cfc2a6');
  rad.addColorStop(0.75, '#a89676');
  rad.addColorStop(1, '#584a38');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(256, 256, 246, 0, Math.PI * 2);
  ctx.fill();

  // Macchie d'invecchiamento
  const rnd = seededNoise(99);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(62, 42, 24, ${0.04 + rnd() * 0.08})`;
    ctx.beginPath();
    ctx.arc(60 + rnd() * 392, 60 + rnd() * 392, 6 + rnd() * 26, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#221c16';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(256, 256, 224, 0, Math.PI * 2);
  ctx.stroke();

  // Arco graduato: 0 BAR a +210° (in basso a sinistra), 12 BAR a -30° (in basso a destra) in senso orario
  // In coordinate canvas (0 = destra, +Y giù): partiamo da 135° (2.356 rad) fino a 405° (7.068 rad)
  const startAngle = (135 * Math.PI) / 180;
  const sweep = (270 * Math.PI) / 180;

  for (let bar = 0; bar <= 12; bar++) {
    const t = bar / 12;
    const ang = startAngle + t * sweep;
    const isTarget = bar === 7;

    const rOuter = 208;
    const rInner = isTarget ? 168 : 180;
    ctx.strokeStyle = isTarget ? '#9e231b' : '#1f1a15';
    ctx.lineWidth = isTarget ? 6 : 3.5;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(ang) * rInner, 256 + Math.sin(ang) * rInner);
    ctx.lineTo(256 + Math.cos(ang) * rOuter, 256 + Math.sin(ang) * rOuter);
    ctx.stroke();

    const rText = 142;
    ctx.fillStyle = isTarget ? '#9e231b' : '#1c1813';
    ctx.font = isTarget ? 'bold 30px monospace' : '23px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(bar), 256 + Math.cos(ang) * rText, 256 + Math.sin(ang) * rText);
  }

  // Simbolo parametro β ben leggibile
  ctx.fillStyle = '#241c14';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('β', 256, 336);

  ctx.font = '18px monospace';
  ctx.fillStyle = '#3b2e22';
  ctx.fillText('BAR · SCARICO 7', 256, 382);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Tamburo numerato singolo (mostra la cifra corrente sul fronte)
export function createDigitFaceTexture(digit) {
  const key = `digit_${digit}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#3a2d1e');
  grad.addColorStop(0.5, '#6e5638');
  grad.addColorStop(1, '#2d2216');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = 'rgba(20, 15, 10, 0.85)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 122, 122);

  ctx.fillStyle = '#ebe0c9';
  ctx.font = 'bold 74px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(digit), 64, 67);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

// Etichetta incisa (es. "α · β · γ" o "I", "II", "III", "IV")
export function createPlaqueTexture(text, subtext = '', glowing = false) {
  const key = `plaque_${text}_${subtext}_${glowing}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 256);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = glowing ? '#18130d' : '#231d17';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = glowing ? '#b57b3c' : '#4f4030';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.fillStyle = glowing ? '#ffbe73' : '#cbb99d';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, subtext ? 108 : 130);

  if (subtext) {
    ctx.fillStyle = glowing ? '#d89a56' : '#9c8b73';
    ctx.font = '26px monospace';
    ctx.fillText(subtext, 256, 186);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

// Terminale CRT ad ambra nella Camera di Controllo
export function createCRTTexture() {
  if (cache.has('crt_screen')) return cache.get('crt_screen');

  const canvas = makeCanvas(512, 384);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d0904';
  ctx.fillRect(0, 0, 512, 384);

  // Scanlines
  ctx.fillStyle = 'rgba(255, 168, 68, 0.06)';
  for (let y = 0; y < 384; y += 4) {
    ctx.fillRect(0, y, 512, 2);
  }

  ctx.strokeStyle = '#c87f32';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 348);

  ctx.fillStyle = '#f2a649';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('SOGLIA IV // DIAGNOSTICA', 38, 62);

  ctx.fillStyle = '#d98c36';
  ctx.font = '19px monospace';
  ctx.fillText('CASSETTA EMERGENZA:', 38, 118);

  ctx.fillStyle = '#ffd089';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('[ α  ·  β  ·  γ ]', 64, 172);

  ctx.fillStyle = '#cf8634';
  ctx.font = '17px monospace';
  ctx.fillText('α : TARGA EMERGENZA ANTICAMERA', 38, 232);
  ctx.fillText('β : PRESSIONE REGIME CALDAIA', 38, 268);
  ctx.fillText('γ : SPIA OTTICA PANNELLO DX', 38, 304);

  ctx.fillStyle = '#8f591e';
  ctx.font = '15px monospace';
  ctx.fillText('>> CLICCA PER DETTAGLI <<', 38, 344);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('crt_screen', tex);
  return tex;
}

// Spia ottica γ = 9 (coperta di fuliggine finché non viene pulita)
export function createSootGlassTexture(wiped = false) {
  const key = `soot_glass_${wiped}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(515);

  ctx.fillStyle = '#120d08';
  ctx.fillRect(0, 0, 256, 256);

  // Scritte luminose sottostanti
  ctx.fillStyle = wiped ? '#ffb559' : 'rgba(210, 130, 50, 0.14)';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('γ', 128, 76);

  ctx.font = 'bold 98px monospace';
  ctx.fillText('9', 128, 176);

  if (!wiped) {
    // Strato pesante di fuliggine e olio
    for (let i = 0; i < 360; i++) {
      ctx.fillStyle = `rgba(12, 11, 10, ${0.35 + rnd() * 0.5})`;
      ctx.beginPath();
      ctx.arc(rnd() * 256, rnd() * 256, 8 + rnd() * 28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(155, 136, 112, 0.42)';
    ctx.font = '16px monospace';
    ctx.fillText('[ FULIGGINE ]', 128, 228);
  } else {
    // Alone residuo ai bordi dopo la pulizia
    const vig = ctx.createRadialGradient(128, 128, 65, 128, 128, 155);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(10, 9, 8, 0.88)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, 256, 256);
  }

  ctx.strokeStyle = '#3c3024';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 246);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

// Disco simbolico per i 3 rotori della Console Principale
export function createSymbolDiskTexture(symbol) {
  const key = `sym_${symbol}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');

  const rad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  rad.addColorStop(0, '#2c2319');
  rad.addColorStop(0.82, '#1c1610');
  rad.addColorStop(1, '#4a3824');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#8b6840';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();

  // Disegno vettoriale nitidissimo del simbolo alchemico/industriale
  ctx.strokeStyle = '#ffbe70';
  ctx.shadowColor = 'rgba(255, 166, 68, 0.65)';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (symbol === '△') {
    ctx.beginPath();
    ctx.moveTo(128, 66);
    ctx.lineTo(184, 168);
    ctx.lineTo(72, 168);
    ctx.closePath();
    ctx.stroke();
  } else if (symbol === '◯') {
    ctx.beginPath();
    ctx.arc(128, 128, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(128, 128, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffbe70';
    ctx.fill();
  } else if (symbol === '◇') {
    ctx.beginPath();
    ctx.moveTo(128, 62);
    ctx.lineTo(182, 128);
    ctx.lineTo(128, 194);
    ctx.lineTo(74, 128);
    ctx.closePath();
    ctx.stroke();
  } else {
    // '✛' Croce
    ctx.beginPath();
    ctx.moveTo(128, 68);
    ctx.lineTo(128, 188);
    ctx.moveTo(68, 128);
    ctx.lineTo(188, 128);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}
