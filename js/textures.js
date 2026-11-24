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

export function getSoftParticleTexture() {
  if (cache.has('soft_particle')) return cache.get('soft_particle');
  const canvas = makeCanvas(64, 64);
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255, 250, 240, 1)');
  g.addColorStop(0.38, 'rgba(255, 238, 210, 0.65)');
  g.addColorStop(0.75, 'rgba(255, 225, 185, 0.16)');
  g.addColorStop(1, 'rgba(255, 220, 180, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('soft_particle', tex);
  return tex;
}

export function getWoodTexture(variant = 'walnut', repeatX = 2, repeatY = 2) {
  const key = `wood_${variant}_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const palettes = {
    walnut: { base: '#3b2619', dark: 'rgba(24, 13, 7, 0.42)', light: 'rgba(96, 64, 42, 0.24)', seed: 311 },
    mahogany: { base: '#462018', dark: 'rgba(26, 9, 6, 0.44)', light: 'rgba(116, 56, 38, 0.25)', seed: 517 },
    oak: { base: '#573c26', dark: 'rgba(36, 22, 12, 0.36)', light: 'rgba(128, 92, 58, 0.24)', seed: 743 },
    ebony: { base: '#211916', dark: 'rgba(8, 6, 5, 0.5)', light: 'rgba(64, 50, 42, 0.2)', seed: 919 }
  };
  const pal = palettes[variant] || palettes.walnut;
  const rnd = seededNoise(pal.seed);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = pal.base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 220; i++) {
    const y = rnd() * 512;
    const h = 1 + rnd() * 5;
    ctx.fillStyle = rnd() > 0.45 ? pal.dark : pal.light;
    ctx.fillRect(0, y, 512, h);
  }

  for (let i = 0; i < 75; i++) {
    const baseY = rnd() * 512;
    const amp = 2 + rnd() * 8;
    const freq = (Math.PI * 2 * (1 + Math.floor(rnd() * 3))) / 512;
    const phase = rnd() * Math.PI * 2;
    ctx.strokeStyle = i % 2 === 0 ? pal.dark : pal.light;
    ctx.lineWidth = 0.9 + rnd() * 1.8;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const yy = baseY + Math.sin(x * freq + phase) * amp;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  for (let k = 0; k < 5; k++) {
    const kx = 50 + rnd() * 412;
    const ky = 40 + rnd() * 432;
    const rx = 14 + rnd() * 20;
    const ry = 5 + rnd() * 8;
    const g = ctx.createRadialGradient(kx, ky, 1, kx, ky, rx);
    g.addColorStop(0, 'rgba(18, 9, 5, 0.55)');
    g.addColorStop(0.6, pal.dark);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(kx, ky, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  cache.set(key, tex);
  return tex;
}

export function getParquetTexture(repeatX = 4, repeatY = 4) {
  const key = `parquet_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(1207);

  ctx.fillStyle = '#24170f';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 16;
  const cw = 512 / cols;
  const ch = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      const y = r * ch;
      const tone = Math.floor(42 + rnd() * 26);
      const warm = Math.floor(tone * 0.66);
      const deep = Math.floor(tone * 0.42);
      ctx.fillStyle = `rgb(${tone}, ${warm}, ${deep})`;
      ctx.fillRect(x + 1.5, y + 1, cw - 3, ch - 2);

      ctx.fillStyle = 'rgba(16, 9, 5, 0.25)';
      for (let g = 0; g < 4; g++) {
        const gy = y + 3 + rnd() * (ch - 6);
        ctx.fillRect(x + 2, gy, cw - 4, 1.1);
      }

      ctx.strokeStyle = 'rgba(120, 84, 54, 0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 1.5, cw - 4, ch - 3);
    }
  }

  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = `rgba(18, 10, 6, ${0.03 + rnd() * 0.06})`;
    ctx.beginPath();
    ctx.arc(rnd() * 512, rnd() * 512, 8 + rnd() * 28, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  cache.set(key, tex);
  return tex;
}

export function getWallpaperTexture(theme = 'emerald', repeatX = 6) {
  const key = `wallpaper_${theme}_${repeatX}`;
  if (cache.has(key)) return cache.get(key);

  const themes = {
    emerald: {
      bgTop: '#1c2826',
      bgMid: '#243531',
      bgBot: '#1a2623',
      stripe: 'rgba(16, 26, 23, 0.34)',
      motif: 'rgba(176, 145, 92, 0.16)',
      accent: 'rgba(122, 152, 136, 0.11)'
    },
    burgundy: {
      bgTop: '#2c1918',
      bgMid: '#3d2220',
      bgBot: '#291615',
      stripe: 'rgba(22, 10, 10, 0.36)',
      motif: 'rgba(196, 148, 88, 0.17)',
      accent: 'rgba(168, 96, 78, 0.12)'
    },
    prussian: {
      bgTop: '#18222e',
      bgMid: '#213042',
      bgBot: '#16202c',
      stripe: 'rgba(11, 17, 25, 0.36)',
      motif: 'rgba(192, 154, 94, 0.17)',
      accent: 'rgba(110, 146, 178, 0.12)'
    }
  };
  const pal = themes[theme] || themes.emerald;
  const rnd = seededNoise(608);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, pal.bgTop);
  grad.addColorStop(0.5, pal.bgMid);
  grad.addColorStop(1, pal.bgBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let x = 0; x < 512; x += 32) {
    ctx.fillStyle = pal.stripe;
    ctx.fillRect(x, 0, 10, 512);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(x + 15, 0, 2, 512);
  }

  ctx.strokeStyle = pal.motif;
  ctx.lineWidth = 2;
  const stepX = 64;
  const stepY = 85.333;
  for (let gy = -1; gy <= 7; gy++) {
    for (let gx = -1; gx <= 9; gx++) {
      const cx = gx * stepX + (gy % 2 === 0 ? 0 : stepX / 2);
      const cy = gy * stepY;

      ctx.beginPath();
      ctx.moveTo(cx, cy - 26);
      ctx.quadraticCurveTo(cx + 20, cy, cx, cy + 26);
      ctx.quadraticCurveTo(cx - 20, cy, cx, cy - 26);
      ctx.stroke();

      ctx.fillStyle = pal.motif;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy - 11, 2.2, 0, Math.PI * 2);
      ctx.arc(cx, cy + 11, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 650; i++) {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.03 + rnd() * 0.06})`;
    ctx.beginPath();
    ctx.arc(rnd() * 512, rnd() * 512, 2 + rnd() * 14, 0, Math.PI * 2);
    ctx.fill();
  }

  const topAO = ctx.createLinearGradient(0, 0, 0, 74);
  topAO.addColorStop(0, 'rgba(6, 7, 10, 0.55)');
  topAO.addColorStop(1, 'rgba(6, 7, 10, 0)');
  ctx.fillStyle = topAO;
  ctx.fillRect(0, 0, 512, 74);

  const botAO = ctx.createLinearGradient(0, 440, 0, 512);
  botAO.addColorStop(0, 'rgba(6, 7, 10, 0)');
  botAO.addColorStop(1, 'rgba(6, 7, 10, 0.46)');
  ctx.fillStyle = botAO;
  ctx.fillRect(0, 440, 512, 72);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, 1);
  cache.set(key, tex);
  return tex;
}

export function getRugTexture(palette = 'crimson') {
  const key = `rug_${palette}`;
  if (cache.has(key)) return cache.get(key);

  const pals = {
    crimson: { field: '#4d1919', border: '#1d2630', gold: '#b88f4c', cream: '#cbbba0', inner: '#2e1113' },
    ochre: { field: '#54351b', border: '#2b1b14', gold: '#c79b52', cream: '#d1c2a5', inner: '#361f11' },
    sapphire: { field: '#192a3d', border: '#3d1d1c', gold: '#c29954', cream: '#cfc2ab', inner: '#101b29' }
  };
  const p = pals[palette] || pals.crimson;
  const rnd = seededNoise(884);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = p.border;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 476, 476);

  ctx.fillStyle = p.field;
  ctx.fillRect(46, 46, 420, 420);

  ctx.strokeStyle = p.cream;
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, 404, 404);
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(68, 68, 376, 376);

  for (let i = 32; i < 480; i += 24) {
    ctx.fillStyle = p.gold;
    ctx.fillRect(i - 4, 28, 8, 8);
    ctx.fillRect(i - 4, 476, 8, 8);
    ctx.fillRect(28, i - 4, 8, 8);
    ctx.fillRect(476, i - 4, 8, 8);
  }

  for (const [cx, cy] of [[84, 84], [428, 84], [84, 428], [428, 428]]) {
    ctx.fillStyle = p.border;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.gold;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.fillStyle = p.inner;
  ctx.beginPath();
  ctx.moveTo(256, 128);
  ctx.lineTo(366, 256);
  ctx.lineTo(256, 384);
  ctx.lineTo(146, 256);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = p.border;
  ctx.beginPath();
  ctx.arc(256, 256, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.cream;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = p.gold;
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4;
    ctx.beginPath();
    ctx.arc(256 + Math.cos(ang) * 28, 256 + Math.sin(ang) * 28, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(256, 256, 14, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,235,200,0.04)';
    ctx.fillRect(rnd() * 512, rnd() * 512, 3, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function getFabricTexture(hex = '#541e22', repeatX = 3, repeatY = 3) {
  const key = `fabric_${hex}_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(419);

  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(10, 6, 6, 0.34)';
  ctx.lineWidth = 1.5;
  const step = 64;
  for (let y = 0; y <= 256; y += step) {
    for (let x = 0; x <= 256; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y - 32);
      ctx.lineTo(x + 32, y);
      ctx.lineTo(x, y + 32);
      ctx.lineTo(x - 32, y);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = 'rgba(8, 5, 5, 0.45)';
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(255, 240, 225, ${0.015 + rnd() * 0.03})`;
    ctx.fillRect(rnd() * 256, rnd() * 256, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  cache.set(key, tex);
  return tex;
}

export function createPaintingTexture(variant = 0) {
  const key = `painting_${variant}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(384, 288);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(200 + variant * 73);

  const bg = ctx.createLinearGradient(0, 0, 0, 288);
  if (variant % 5 === 0) {
    bg.addColorStop(0, '#0f1822');
    bg.addColorStop(0.58, '#233544');
    bg.addColorStop(0.6, '#101b24');
    bg.addColorStop(1, '#080e14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 384, 288);

    const moon = ctx.createRadialGradient(260, 74, 4, 260, 74, 68);
    moon.addColorStop(0, '#f2dfba');
    moon.addColorStop(0.25, 'rgba(218, 178, 118, 0.35)');
    moon.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, 384, 288);

    ctx.fillStyle = '#121316';
    ctx.beginPath();
    ctx.moveTo(40, 185);
    ctx.lineTo(118, 148);
    ctx.lineTo(165, 185);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(108, 98, 14, 54);
    ctx.fillStyle = '#ffcf86';
    ctx.beginPath();
    ctx.arc(115, 96, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(235, 198, 136, 0.28)';
    for (let y = 182; y < 268; y += 6) {
      const w = 16 + (y - 180) * 0.45;
      ctx.fillRect(260 - w / 2 + (rnd() - 0.5) * 10, y, w, 2);
    }
  } else if (variant % 5 === 1) {
    bg.addColorStop(0, '#17120e');
    bg.addColorStop(0.7, '#291d15');
    bg.addColorStop(1, '#140d09');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 384, 288);

    const glow = ctx.createRadialGradient(196, 118, 6, 196, 118, 130);
    glow.addColorStop(0, 'rgba(245, 176, 92, 0.52)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 384, 288);

    ctx.fillStyle = '#24150d';
    ctx.fillRect(0, 210, 384, 78);

    ctx.fillStyle = '#4f221b';
    ctx.fillRect(74, 192, 96, 20);
    ctx.fillStyle = '#cbb997';
    ctx.fillRect(80, 196, 86, 12);

    ctx.fillStyle = '#dfd3bc';
    ctx.fillRect(190, 132, 12, 78);
    ctx.fillStyle = '#ffd27d';
    ctx.beginPath();
    ctx.ellipse(196, 120, 5, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c4964f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(274, 174, 28, 0, Math.PI * 2);
    ctx.stroke();
  } else if (variant % 5 === 2) {
    ctx.fillStyle = '#121924';
    ctx.fillRect(0, 0, 384, 288);
    ctx.strokeStyle = 'rgba(208, 168, 98, 0.52)';
    ctx.lineWidth = 2;
    for (const r of [42, 74, 106]) {
      ctx.beginPath();
      ctx.arc(192, 144, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(60, 144);
    ctx.lineTo(324, 144);
    ctx.moveTo(192, 24);
    ctx.lineTo(192, 264);
    ctx.stroke();

    ctx.fillStyle = '#d6a456';
    ctx.beginPath();
    ctx.arc(192, 144, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#121924';
    ctx.beginPath();
    ctx.arc(200, 140, 19, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant % 5 === 3) {
    bg.addColorStop(0, '#1e1915');
    bg.addColorStop(1, '#0d0b09');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 384, 288);

    ctx.fillStyle = 'rgba(218, 166, 102, 0.25)';
    ctx.beginPath();
    ctx.arc(192, 152, 78, Math.PI, 0);
    ctx.lineTo(270, 265);
    ctx.lineTo(114, 265);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#241d18';
    ctx.fillRect(58, 40, 56, 248);
    ctx.fillRect(270, 40, 56, 248);
  } else {
    ctx.fillStyle = '#2b241b';
    ctx.fillRect(0, 0, 384, 288);
    ctx.strokeStyle = '#7c8f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(192, 250);
    ctx.quadraticCurveTo(182, 150, 206, 54);
    ctx.stroke();
    for (let l = 0; l < 7; l++) {
      const ly = 82 + l * 22;
      const dir = l % 2 === 0 ? 1 : -1;
      ctx.fillStyle = '#5c7044';
      ctx.beginPath();
      ctx.ellipse(194 + dir * 28, ly, 24, 9, dir * -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const vig = ctx.createRadialGradient(192, 144, 60, 192, 144, 230);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(6, 5, 4, 0.65)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 384, 288);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function createClockDialTexture() {
  if (cache.has('clock_dial')) return cache.get('clock_dial');
  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');

  const rad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
  rad.addColorStop(0, '#e5dac2');
  rad.addColorStop(0.8, '#c6b492');
  rad.addColorStop(1, '#6e5736');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(128, 128, 122, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2b2116';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();

  const romans = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  ctx.fillStyle = '#1f1710';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  romans.forEach((r, i) => {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    ctx.fillText(r, 128 + Math.cos(a) * 86, 128 + Math.sin(a) * 86);
  });

  ctx.strokeStyle = '#1b140e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(96, 78);
  ctx.stroke();

  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(186, 92);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('clock_dial', tex);
  return tex;
}

export function getConcreteTexture(repeatX = 2, repeatY = 1) {
  const key = `concrete_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(404);

  ctx.fillStyle = '#404449';
  ctx.fillRect(0, 0, 512, 512);

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

  const palette = [
    'rgba(128, 86, 54, 0.24)',
    'rgba(154, 108, 66, 0.18)',
    'rgba(48, 46, 48, 0.24)',
    'rgba(98, 74, 56, 0.22)'
  ];
  for (let i = 0; i < 650; i++) {
    ctx.fillStyle = palette[Math.floor(rnd() * palette.length)];
    const x = rnd() * 512;
    const y = rnd() * 512;
    const rx = 3 + rnd() * 22;
    const ry = 3 + rnd() * 16;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(225, 210, 190, 0.15)';
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
  return getParquetTexture(4, 4);
}

export function createGaugeDialTexture() {
  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  const rad = ctx.createRadialGradient(256, 256, 20, 256, 256, 248);
  rad.addColorStop(0, '#cfc2a6');
  rad.addColorStop(0.75, '#a89676');
  rad.addColorStop(1, '#584a38');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(256, 256, 246, 0, Math.PI * 2);
  ctx.fill();

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

export function createPlaqueTexture(text, subtext = '', glowing = false) {
  const key = `plaque_${text}_${subtext}_${glowing}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 256);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = glowing ? '#18130d' : '#231d17';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = glowing ? '#b57b3c' : '#5e4b36';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 236);

  const fontSize = text.length > 11 ? 46 : text.length > 7 ? 58 : 72;
  ctx.fillStyle = glowing ? '#ffbe73' : '#d8c5a8';
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, subtext ? 108 : 130);

  if (subtext) {
    ctx.fillStyle = glowing ? '#d89a56' : '#a8957a';
    ctx.font = '26px monospace';
    ctx.fillText(subtext, 256, 186);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function createCRTTexture() {
  if (cache.has('crt_screen')) return cache.get('crt_screen');

  const canvas = makeCanvas(512, 384);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d0904';
  ctx.fillRect(0, 0, 512, 384);

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

export function createSootGlassTexture(wiped = false) {
  const key = `soot_glass_${wiped}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(515);

  ctx.fillStyle = '#120d08';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = wiped ? '#ffb559' : 'rgba(210, 130, 50, 0.14)';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('γ', 128, 76);

  ctx.font = 'bold 98px monospace';
  ctx.fillText('9', 128, 176);

  if (!wiped) {
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

// --- TEXTURE CAPITOLO II: CAPO BRUMA ---

export function getCheckerMarbleTexture(repeatX = 5, repeatY = 5) {
  const key = `checker_marble_${repeatX}_${repeatY}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(1412);

  const step = 128;
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const isLight = (gx + gy) % 2 === 0;
      const x = gx * step;
      const y = gy * step;
      ctx.fillStyle = isLight ? '#c8c3b8' : '#192024';
      ctx.fillRect(x, y, step, step);

      ctx.strokeStyle = isLight ? 'rgba(85, 84, 80, 0.25)' : 'rgba(130, 145, 152, 0.14)';
      ctx.lineWidth = 1.6;
      for (let v = 0; v < 3; v++) {
        ctx.beginPath();
        ctx.moveTo(x + rnd() * step, y);
        ctx.bezierCurveTo(
          x + rnd() * step, y + step * 0.35,
          x + rnd() * step, y + step * 0.7,
          x + rnd() * step, y + step
        );
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(12, 15, 18, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, step - 2, step - 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  cache.set(key, tex);
  return tex;
}

export function getConservatoryGlassWallTexture(repeatX = 3) {
  const key = `conservatory_wall_${repeatX}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(2201);

  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#132432');
  sky.addColorStop(0.55, '#274252');
  sky.addColorStop(1, '#1b2e2b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 18; i++) {
    const tx = rnd() * 512;
    const th = 140 + rnd() * 160;
    ctx.fillStyle = 'rgba(10, 20, 22, 0.38)';
    ctx.beginPath();
    ctx.arc(tx, 512 - th * 0.4, 48 + rnd() * 44, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 320; i++) {
    ctx.fillStyle = `rgba(195, 224, 236, ${0.02 + rnd() * 0.05})`;
    ctx.beginPath();
    ctx.arc(rnd() * 512, rnd() * 512, 4 + rnd() * 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#243a33';
  ctx.fillStyle = '#243a33';
  const cols = 4;
  const cw = 512 / cols;
  for (let c = 0; c <= cols; c++) {
    ctx.fillRect(c * cw - 6, 0, 12, 512);
  }
  for (const hy of [18, 148, 295, 496]) {
    ctx.fillRect(0, hy - 5, 512, 10);
  }

  ctx.lineWidth = 8;
  for (let c = 0; c < cols; c++) {
    const cx = c * cw + cw / 2;
    ctx.beginPath();
    ctx.arc(cx, 148, cw / 2 - 4, Math.PI, 0);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, 1);
  cache.set(key, tex);
  return tex;
}

export function getDarkroomTileTexture(repeatX = 5) {
  const key = `darkroom_tile_${repeatX}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(3109);

  ctx.fillStyle = '#191b1e';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 8;
  const tw = 512 / cols;
  const th = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (tw / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * tw + offset;
      const y = r * th;
      const base = Math.floor(64 + rnd() * 14);
      ctx.fillStyle = `rgb(${base + 6}, ${base + 4}, ${base})`;
      ctx.fillRect(x + 2, y + 2, tw - 4, th - 4);

      ctx.strokeStyle = 'rgba(255, 245, 235, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3, y + 3, tw - 6, th - 6);
    }
  }

  const topAO = ctx.createLinearGradient(0, 0, 0, 88);
  topAO.addColorStop(0, 'rgba(6, 6, 8, 0.62)');
  topAO.addColorStop(1, 'rgba(6, 6, 8, 0)');
  ctx.fillStyle = topAO;
  ctx.fillRect(0, 0, 512, 88);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, 1);
  cache.set(key, tex);
  return tex;
}

export function getCoastalStoneTexture(repeatX = 4) {
  const key = `coastal_stone_${repeatX}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(4407);

  ctx.fillStyle = '#4c5359';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 10;
  const cols = 4;
  const bw = 512 / cols;
  const bh = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (bw / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * bw + off;
      const y = r * bh;
      const v = Math.floor(92 + rnd() * 24);
      ctx.fillStyle = `rgb(${v + 4}, ${v + 3}, ${v - 2})`;
      ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    }
  }

  for (let i = 0; i < 650; i++) {
    ctx.fillStyle = `rgba(26, 30, 34, ${0.04 + rnd() * 0.08})`;
    ctx.beginPath();
    ctx.arc(rnd() * 512, rnd() * 512, 3 + rnd() * 18, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, 1);
  cache.set(key, tex);
  return tex;
}

export function createMistedPaneTexture(wiped = false) {
  const key = `mist_pane_${wiped}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  const rnd = seededNoise(717);

  ctx.fillStyle = '#13242d';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = wiped ? '#8fdcff' : 'rgba(168, 224, 245, 0.12)';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('OND · MAREA', 128, 66);

  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText('8', 128, 168);

  if (!wiped) {
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = `rgba(184, 206, 216, ${0.26 + rnd() * 0.36})`;
      ctx.beginPath();
      ctx.arc(rnd() * 256, rnd() * 256, 7 + rnd() * 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#20353f';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('[ CONDENSA SALINA ]', 128, 228);
  } else {
    ctx.strokeStyle = 'rgba(180, 222, 236, 0.38)';
    ctx.lineWidth = 12;
    ctx.strokeRect(12, 12, 232, 232);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function createDevelopedPhotoTexture(developed = false) {
  const key = `dev_photo_${developed}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(384, 288);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#dfd8c8';
  ctx.fillRect(0, 0, 384, 288);

  if (!developed) {
    ctx.fillStyle = '#cfc6b4';
    ctx.fillRect(18, 18, 348, 252);
    ctx.fillStyle = 'rgba(85, 78, 66, 0.5)';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ LASTRA LATENTE ]', 192, 148);
  } else {
    const g = ctx.createLinearGradient(0, 18, 0, 270);
    g.addColorStop(0, '#2a2d30');
    g.addColorStop(0.55, '#595e63');
    g.addColorStop(0.57, '#181a1c');
    g.addColorStop(1, '#0d0f11');
    ctx.fillStyle = g;
    ctx.fillRect(18, 18, 348, 252);

    ctx.fillStyle = '#e8e2d5';
    ctx.fillRect(88, 74, 22, 86);
    ctx.beginPath();
    ctx.moveTo(82, 74);
    ctx.lineTo(99, 52);
    ctx.lineTo(116, 74);
    ctx.fill();

    ctx.fillStyle = '#f5eedc';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MOLO CAPO BRUMA', 238, 92);

    ctx.font = 'bold 62px monospace';
    ctx.fillText('LAS : 5', 236, 174);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function createLightboxTexture() {
  if (cache.has('lightbox_tex')) return cache.get('lightbox_tex');

  const canvas = makeCanvas(512, 384);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d8e8ef';
  ctx.fillRect(0, 0, 512, 384);

  for (let i = 0; i < 3; i++) {
    const x = 34 + i * 152;
    ctx.fillStyle = '#182026';
    ctx.fillRect(x, 38, 136, 186);

    ctx.fillStyle = '#cfe4ed';
    for (let p = 0; p < 6; p++) {
      ctx.fillRect(x + 8 + p * 21, 44, 12, 8);
      ctx.fillRect(x + 8 + p * 21, 210, 12, 8);
    }
  }

  ctx.fillStyle = '#a8d0e0';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LAS', 102, 92);
  ctx.fillText('[ VASCHETTA ]', 102, 148);

  ctx.fillStyle = '#ffffff';
  ctx.fillText('MAR', 254, 86);
  ctx.font = 'bold 74px monospace';
  ctx.fillText('2', 254, 168);

  ctx.fillStyle = '#a8d0e0';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('OND', 406, 92);
  ctx.fillText('[ SERRA ]', 406, 148);

  ctx.fillStyle = '#1a262e';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('ARMADIETTO SERRA : [ LAS · MAR · OND ]', 256, 286);
  ctx.font = '17px monospace';
  ctx.fillText('>> CLICCA PER ESAMINARE I PROVINI <<', 256, 332);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set('lightbox_tex', tex);
  return tex;
}

export function createCompassDiskTexture(dirChar) {
  const key = `compass_${dirChar}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');

  const rad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  rad.addColorStop(0, '#1e2c36');
  rad.addColorStop(0.82, '#121b22');
  rad.addColorStop(1, '#5c482c');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c29a52';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    ctx.strokeStyle = i % 4 === 0 ? '#ffd285' : 'rgba(194, 154, 82, 0.45)';
    ctx.lineWidth = i % 4 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88);
    ctx.lineTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffcf7d';
  ctx.shadowColor = 'rgba(255, 186, 82, 0.65)';
  ctx.shadowBlur = 10;
  ctx.font = 'bold 88px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(dirChar, 128, 132);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}
