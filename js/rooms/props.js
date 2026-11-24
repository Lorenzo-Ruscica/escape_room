import * as THREE from 'three';
import {
  makeBrassMaterial,
  makeFabricMaterial,
  makeGlassMaterial,
  makePorcelainMaterial,
  makeRustMaterial,
  makeWoodMaterial
} from './geometry.js';
import {
  createClockDialTexture,
  createPaintingTexture,
  getRugTexture
} from '../textures.js';

function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function disableRaycast(root) {
  root.traverse((c) => {
    if (c.isMesh) c.raycast = () => {};
  });
  return root;
}

// 1. Tappeto Persiano / Orientale con spessore e bordura scura tessuta
export function createPersianRug({ width = 3.4, depth = 2.5, palette = 'crimson' } = {}) {
  const group = new THREE.Group();
  const tex = getRugTexture(palette);
  const rugMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.88,
    metalness: 0.02,
    dithering: true
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, 0.014, depth), rugMat);
  body.position.y = 0.007;
  body.receiveShadow = true;
  group.add(body);

  // Frange discrete a nappe individuali in corda ambrata scura (niente striscia bianca continua)
  const tasselMat = new THREE.MeshStandardMaterial({ color: 0x6b583e, roughness: 0.92 });
  const tasselCount = 26;
  const tasselGeo = new THREE.BoxGeometry(0.028, 0.005, 0.048);
  for (const side of [-1, 1]) {
    for (let i = 0; i < tasselCount; i++) {
      const tx = -width * 0.46 + (i / (tasselCount - 1)) * (width * 0.92);
      const t = new THREE.Mesh(tasselGeo, tasselMat);
      t.position.set(tx, 0.003, side * (depth / 2 + 0.024));
      group.add(t);
    }
  }
  return disableRaycast(group);
}

// 2. Quadro incorniciato in legno/oro antico con tela a olio e targhetta
export function createFramedPainting({ width = 1.05, height = 0.82, variant = 0, withLight = false } = {}) {
  const group = new THREE.Group();
  const gilt = makeBrassMaterial(0xb88e47);
  const darkWood = makeWoodMaterial('ebony', 0xffffff, 0.42);

  const outer = new THREE.Mesh(new THREE.BoxGeometry(width + 0.12, height + 0.12, 0.055), darkWood);
  outer.castShadow = true;
  group.add(outer);

  const innerFrame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, height + 0.05, 0.068), gilt);
  group.add(innerFrame);

  const canvasMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.02, height - 0.02),
    new THREE.MeshStandardMaterial({
      map: createPaintingTexture(variant),
      roughness: 0.56,
      metalness: 0.04
    })
  );
  canvasMesh.position.z = 0.036;
  group.add(canvasMesh);

  if (withLight) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.18), gilt);
    arm.position.set(0, height / 2 + 0.1, 0.08);
    group.add(arm);

    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.34, 12), gilt);
    hood.rotation.z = Math.PI / 2;
    hood.position.set(0, height / 2 + 0.09, 0.17);
    group.add(hood);

    const picLight = new THREE.PointLight(0xebb06b, 0.95, 2.4, 2);
    picLight.position.set(0, height / 2 + 0.02, 0.22);
    group.add(picLight);
  }

  return disableRaycast(group);
}

// 3. Applique da parete in ottone e vetro smerigliato caldo
export function createWallSconce({ color = 0xe59849, intensity = 1.65 } = {}) {
  const group = new THREE.Group();
  const brass = makeBrassMaterial(0xbe954f);

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.024, 16), brass);
  plate.rotation.x = Math.PI / 2;
  group.add(plate);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.028, 0.16), brass);
  arm.position.set(0, -0.02, 0.08);
  group.add(arm);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.026, 0.035, 12), brass);
  cup.position.set(0, 0.01, 0.15);
  group.add(cup);

  const glassShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.038, 0.14, 14, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xffe4bc,
      emissive: new THREE.Color(color),
      emissiveIntensity: 1.25,
      roughness: 0.25,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })
  );
  glassShade.position.set(0, 0.09, 0.15);
  group.add(glassShade);

  const light = new THREE.PointLight(color, intensity, 4.6, 1.85);
  light.position.set(0, 0.09, 0.2);
  group.add(light);

  return disableRaycast(group);
}

// 4. Grande Libreria in Mogano piena di volumi rilegati, pergamene e ninnoli
export function createBookcase({ width = 1.45, height = 2.85, depth = 0.44, seed = 101 } = {}) {
  const group = new THREE.Group();
  const rnd = seeded(seed);
  const wood = makeWoodMaterial('mahogany', 0x9e7d66, 0.42);
  const darkBack = makeWoodMaterial('walnut', 0x5c4636, 0.6);
  const brass = makeBrassMaterial(0xc49a52);
  const porcelain = makePorcelainMaterial(0xe3dac8);

  // Schienale e fianchi
  const back = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, height - 0.12, 0.03), darkBack);
  back.position.set(0, height / 2, -depth / 2 + 0.02);
  group.add(back);

  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.06, height - 0.08, depth), wood);
    side.position.set(sx * (width / 2 - 0.03), (height - 0.08) / 2, 0);
    side.castShadow = true;
    side.receiveShadow = true;
    group.add(side);
  }

  // Zoccolo e cimasa modanata superiore
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.16, depth + 0.05), wood);
  plinth.position.y = 0.08;
  group.add(plinth);

  const crown = new THREE.Mesh(new THREE.BoxGeometry(width + 0.12, 0.14, depth + 0.09), wood);
  crown.position.y = height - 0.05;
  crown.castShadow = true;
  group.add(crown);

  // Ripiani + file di libri rilegati in pelle con dorature
  const bookColors = [0x5e1d1d, 0x1e3b2f, 0x1f2d44, 0x63411f, 0x3d241b, 0x4b2838, 0x2b3624, 0x6e4f28];
  const leatherMats = bookColors.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0.06 })
  );

  const shelfLevels = [0.16, 0.72, 1.28, 1.84, 2.36];
  shelfLevels.forEach((sy, sIdx) => {
    if (sIdx > 0) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, 0.038, depth - 0.02), wood);
      shelf.position.set(0, sy, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      group.add(shelf);
    }

    const innerW = width - 0.16;
    let cursorX = -innerW / 2 + 0.02;
    const shelfTop = sy + 0.02;

    // Su alcuni ripiani lascia spazio a un vaso di porcellana o sfera armillare
    const curioSlot = sIdx === 2 || sIdx === 4 ? (rnd() > 0.5 ? 1 : -1) : 0;
    const maxCursor = curioSlot === 1 ? innerW / 2 - 0.34 : innerW / 2 - 0.03;
    if (curioSlot === -1) cursorX += 0.32;

    while (cursorX < maxCursor) {
      const thick = 0.032 + rnd() * 0.038;
      const bh = 0.24 + rnd() * 0.16;
      const bd = 0.22 + rnd() * 0.07;
      if (cursorX + thick > maxCursor) break;

      const mat = leatherMats[Math.floor(rnd() * leatherMats.length)];
      const book = new THREE.Mesh(new THREE.BoxGeometry(thick - 0.003, bh, bd), mat);
      const tilt = rnd() > 0.9 ? (rnd() - 0.5) * 0.18 : 0;
      book.position.set(cursorX + thick / 2, shelfTop + bh / 2, 0.04 + (rnd() - 0.5) * 0.04);
      book.rotation.z = tilt;
      group.add(book);

      // Fregio dorato sulla costa
      if (rnd() > 0.35) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(thick - 0.001, 0.016, bd + 0.004), brass);
        band.position.set(cursorX + thick / 2, shelfTop + bh * 0.72, book.position.z);
        band.rotation.z = tilt;
        group.add(band);
      }

      cursorX += thick + (rnd() > 0.85 ? 0.025 : 0.002);
    }

    if (curioSlot !== 0) {
      const cx = curioSlot * (innerW / 2 - 0.17);
      if (sIdx === 2) {
        // Anfora in porcellana
        const vase = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), porcelain);
        vase.scale.set(1, 1.35, 1);
        vase.position.set(cx, shelfTop + 0.13, 0.03);
        group.add(vase);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.09, 12), porcelain);
        neck.position.set(cx, shelfTop + 0.26, 0.03);
        group.add(neck);
      } else {
        // Sfera d'ottone su piedistallo
        const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.06, 12), brass);
        ped.position.set(cx, shelfTop + 0.03, 0.03);
        group.add(ped);
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), brass);
        orb.position.set(cx, shelfTop + 0.14, 0.03);
        group.add(orb);
      }
    }
  });

  // Vasi e cofanetto sopra il cornicione della libreria
  const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), darkBack);
  topBox.position.set(-width * 0.24, height + 0.09, 0);
  group.add(topBox);

  const topUrn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.055, 0.24, 14), brass);
  topUrn.position.set(width * 0.25, height + 0.14, 0);
  group.add(topUrn);

  return disableRaycast(group);
}

// 5. Pendola a colonna (Grandfather Clock) con pendolo d'ottone animabile
export function createGrandfatherClock() {
  const group = new THREE.Group();
  const wood = makeWoodMaterial('walnut', 0x9c7b61, 0.4);
  const darkWood = makeWoodMaterial('ebony', 0xffffff, 0.45);
  const brass = makeBrassMaterial(0xd4a959);
  const glass = makeGlassMaterial(0xcfe0e8, 0.28);

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.46, 0.36), wood);
  base.position.y = 0.23;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Cassa centrale cava per il pendolo
  const backCase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.12, 0.06), darkWood);
  backCase.position.set(0, 1.02, -0.11);
  group.add(backCase);

  for (const sx of [-0.175, 0.175]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.12, 0.28), wood);
    pillar.position.set(sx, 1.02, 0);
    pillar.castShadow = true;
    group.add(pillar);
  }

  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.98), glass);
  glassPane.position.set(0, 1.02, 0.135);
  group.add(glassPane);

  // Pendolo oscillante
  const pendulumPivot = new THREE.Group();
  pendulumPivot.position.set(0, 1.48, 0.02);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.72, 8), brass);
  rod.position.y = -0.36;
  pendulumPivot.add(rod);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.028, 20), brass);
  bob.rotation.x = Math.PI / 2;
  bob.position.y = -0.72;
  pendulumPivot.add(bob);
  group.add(pendulumPivot);

  // Testa dell'orologio con quadrante romano e timpano
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.56, 0.34), wood);
  hood.position.y = 1.86;
  hood.castShadow = true;
  group.add(hood);

  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 12, 28), brass);
  bezel.position.set(0, 1.86, 0.175);
  group.add(bezel);

  const dial = new THREE.Mesh(
    new THREE.CircleGeometry(0.175, 28),
    new THREE.MeshStandardMaterial({ map: createClockDialTexture(), roughness: 0.38 })
  );
  dial.position.set(0, 1.86, 0.176);
  group.add(dial);

  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.38), darkWood);
  crown.position.y = 2.18;
  group.add(crown);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), brass);
  finial.position.y = 2.28;
  group.add(finial);

  disableRaycast(group);
  return { root: group, pendulumPivot };
}

// 6. Poltrona bergère in pelle/velluto capitonné
export function createTuftedArmchair({ hex = '#541b1e' } = {}) {
  const group = new THREE.Group();
  const upholstery = makeFabricMaterial(hex, 0xffffff, 0.72);
  const wood = makeWoodMaterial('walnut', 0x8c6d54, 0.42);
  const brass = makeBrassMaterial(0xc2984e);

  // Gambe tornite
  for (const [lx, lz] of [[-0.34, -0.32], [0.34, -0.32], [-0.34, 0.32], [0.34, 0.32]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.022, 0.26, 10), wood);
    leg.position.set(lx, 0.13, lz);
    leg.castShadow = true;
    group.add(leg);

    const caster = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), brass);
    caster.position.set(lx, 0.024, lz);
    group.add(caster);
  }

  // Seduta e cuscino morbido
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.18, 0.76), upholstery);
  seatBase.position.y = 0.34;
  seatBase.castShadow = true;
  seatBase.receiveShadow = true;
  group.add(seatBase);

  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.13, 0.62), upholstery);
  cushion.position.set(0, 0.47, 0.04);
  group.add(cushion);

  // Schienale alto inclinato con alette laterali (wingback)
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.78, 0.16), upholstery);
  back.position.set(0, 0.78, -0.31);
  back.rotation.x = -0.12;
  back.castShadow = true;
  group.add(back);

  for (const sx of [-1, 1]) {
    // Braccioli arrotolati
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 0.72), upholstery);
    arm.position.set(sx * 0.38, 0.54, 0.02);
    arm.castShadow = true;
    group.add(arm);

    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.74, 14), upholstery);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(sx * 0.39, 0.68, 0.02);
    group.add(roll);

    // Aletta superiore
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.24), upholstery);
    wing.position.set(sx * 0.36, 0.94, -0.2);
    group.add(wing);
  }

  return disableRaycast(group);
}

// 7. Tavolino rotondo tornito con lampada Tiffany ambrata, tazza da tè e libri
export function createSideTableWithLamp({ lampColor = 0xe89846, shadeTint = 0xd98438 } = {}) {
  const group = new THREE.Group();
  const wood = makeWoodMaterial('mahogany', 0x9c7860, 0.38);
  const brass = makeBrassMaterial(0xc89d54);
  const porcelain = makePorcelainMaterial(0xede6d8);

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.06, 20), wood);
  foot.position.y = 0.03;
  group.add(foot);

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.62, 14), wood);
  column.position.y = 0.34;
  column.castShadow = true;
  group.add(column);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.045, 28), wood);
  top.position.y = 0.67;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Lampada da tavolo con cupola in vetro piombato caldo
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.095, 0.04, 16), brass);
  lampBase.position.set(-0.06, 0.71, -0.05);
  group.add(lampBase);

  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.28, 12), brass);
  lampStem.position.set(-0.06, 0.86, -0.05);
  group.add(lampStem);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshStandardMaterial({
      color: shadeTint,
      emissive: new THREE.Color(lampColor),
      emissiveIntensity: 1.35,
      roughness: 0.3,
      side: THREE.DoubleSide
    })
  );
  dome.position.set(-0.06, 0.96, -0.05);
  group.add(dome);

  const lampLight = new THREE.PointLight(lampColor, 2.3, 4.4, 1.8);
  lampLight.position.set(-0.06, 0.93, -0.05);
  group.add(lampLight);

  // Tazza in porcellana su piattino + libro appoggiato
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.045, 0.014, 16), porcelain);
  saucer.position.set(0.14, 0.7, 0.1);
  group.add(saucer);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.032, 0.055, 16), porcelain);
  cup.position.set(0.14, 0.73, 0.1);
  group.add(cup);

  const book = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.034, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x233c32, roughness: 0.65 })
  );
  book.position.set(0.11, 0.71, -0.12);
  book.rotation.y = 0.4;
  group.add(book);

  return disableRaycast(group);
}

// 8. Alta finestra notturna all'inglese con tendaggi in velluto pesante
export function createDrapedWindow({ width = 1.35, height = 2.15, curtainHex = '#3d171a' } = {}) {
  const group = new THREE.Group();
  const wood = makeWoodMaterial('walnut', 0x856851, 0.45);
  const curtainMat = makeFabricMaterial(curtainHex, 0xffffff, 0.85);
  const brass = makeBrassMaterial(0xc79e55);

  // Cornice esterna e davanzale
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.14, height + 0.12, 0.08), wood);
  group.add(frame);

  const sill = new THREE.Mesh(new THREE.BoxGeometry(width + 0.28, 0.06, 0.18), wood);
  sill.position.set(0, -height / 2 - 0.02, 0.05);
  group.add(sill);

  // Vetro notturno blu lunare
  const nightGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.08, height - 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x1a2c3d,
      emissive: new THREE.Color(0x3a5f82),
      emissiveIntensity: 0.72,
      roughness: 0.15,
      metalness: 0.3
    })
  );
  nightGlass.position.z = 0.044;
  group.add(nightGlass);

  // Inglesine in legno
  const vMullion = new THREE.Mesh(new THREE.BoxGeometry(0.035, height - 0.06, 0.03), wood);
  vMullion.position.z = 0.055;
  group.add(vMullion);

  for (const hy of [-height * 0.18, height * 0.18]) {
    const hMullion = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, 0.03, 0.03), wood);
    hMullion.position.set(0, hy, 0.055);
    group.add(hMullion);
  }

  // Bastone reggitenda in ottone + drappeggi laterali a pieghe
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, width + 0.56, 12), brass);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, height / 2 + 0.12, 0.11);
  group.add(rod);

  for (const sx of [-1, 1]) {
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), brass);
    finial.position.set(sx * (width / 2 + 0.29), height / 2 + 0.12, 0.11);
    group.add(finial);

    for (let fold = 0; fold < 3; fold++) {
      const drape = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.082, height + 0.52, 12),
        curtainMat
      );
      drape.position.set(
        sx * (width / 2 - 0.04 + fold * 0.095),
        -0.14,
        0.11 + (fold % 2) * 0.018
      );
      drape.castShadow = true;
      group.add(drape);
    }
  }

  return disableRaycast(group);
}

// 9. Credenza / Consolle intagliata con busto classico, candelabro, libri e anfora
export function createConsoleCredenza({ width = 1.45, height = 0.88, depth = 0.46 } = {}) {
  const group = new THREE.Group();
  const wood = makeWoodMaterial('walnut', 0x9c7b61, 0.4);
  const darkWood = makeWoodMaterial('mahogany', 0x7c5944, 0.45);
  const brass = makeBrassMaterial(0xcda259);
  const marble = makePorcelainMaterial(0xd8d2c5);

  const body = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, height - 0.24, depth - 0.06), wood);
  body.position.y = 0.2 + (height - 0.24) / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Ante bugnate e pomelli d'ottone
  for (const dx of [-width * 0.24, width * 0.24]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(width * 0.4, height - 0.36, 0.028), darkWood);
    door.position.set(dx, 0.2 + (height - 0.24) / 2, depth / 2 - 0.02);
    group.add(door);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), brass);
    knob.position.set(dx * 0.32, 0.2 + (height - 0.24) / 2, depth / 2 + 0.005);
    group.add(knob);
  }

  for (const [lx, lz] of [
    [-width / 2 + 0.08, -depth / 2 + 0.08],
    [width / 2 - 0.08, -depth / 2 + 0.08],
    [-width / 2 + 0.08, depth / 2 - 0.08],
    [width / 2 - 0.08, depth / 2 - 0.08]
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.028, 0.22, 10), darkWood);
    leg.position.set(lx, 0.11, lz);
    group.add(leg);
  }

  // Piano superiore in marmo scuro venato / noce
  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), darkWood);
  top.position.y = height;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Candelabro a 3 bracci sul lato sinistro
  const cand = createCandelabra();
  cand.position.set(-width * 0.32, height + 0.025, 0);
  group.add(cand);

  // Busto scultoreo classico al centro-destra
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.08, 14), brass);
  ped.position.set(width * 0.24, height + 0.065, -0.02);
  group.add(ped);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), marble);
  shoulders.scale.set(1.25, 0.65, 0.72);
  shoulders.position.set(width * 0.24, height + 0.16, -0.02);
  group.add(shoulders);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 14), marble);
  head.scale.set(0.88, 1.15, 0.95);
  head.position.set(width * 0.24, height + 0.29, -0.01);
  group.add(head);

  // Pila di volumi e cofanetto al centro
  const tome1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.042, 0.19),
    new THREE.MeshStandardMaterial({ color: 0x4b1d1b, roughness: 0.65 })
  );
  tome1.position.set(-0.02, height + 0.046, 0.03);
  tome1.rotation.y = 0.15;
  group.add(tome1);

  const tome2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.036, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x1f362c, roughness: 0.65 })
  );
  tome2.position.set(-0.01, height + 0.085, 0.03);
  tome2.rotation.y = -0.22;
  group.add(tome2);

  return disableRaycast(group);
}

// 10. Candelabro a 3 fiamme calde
export function createCandelabra() {
  const group = new THREE.Group();
  const brass = makeBrassMaterial(0xd4a95a);
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xe8dec5, roughness: 0.55 });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a3,
    emissive: new THREE.Color(0xff9b36),
    emissiveIntensity: 2.4,
    roughness: 0.2
  });

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.085, 0.04, 16), brass);
  foot.position.y = 0.02;
  group.add(foot);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.22, 10), brass);
  stem.position.y = 0.13;
  group.add(stem);

  const crossArm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.24, 10), brass);
  crossArm.rotation.z = Math.PI / 2;
  crossArm.position.y = 0.2;
  group.add(crossArm);

  for (const [cx, cy] of [[-0.12, 0.21], [0, 0.24], [0.12, 0.21]]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.014, 0.025, 10), brass);
    cup.position.set(cx, cy, 0);
    group.add(cup);

    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.014, 0.11, 10), waxMat);
    candle.position.set(cx, cy + 0.065, 0);
    group.add(candle);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), flameMat);
    flame.scale.set(0.7, 1.8, 0.7);
    flame.position.set(cx, cy + 0.135, 0);
    group.add(flame);
  }

  const glow = new THREE.PointLight(0xff9f40, 1.15, 3.2, 2);
  glow.position.set(0, 0.36, 0.05);
  group.add(glow);

  return disableRaycast(group);
}

// 11. Mappamondo antico da pavimento su cavalletto in noce e meridiano d'ottone
export function createGlobeStand() {
  const group = new THREE.Group();
  const wood = makeWoodMaterial('walnut', 0x96755b, 0.42);
  const brass = makeBrassMaterial(0xcfa55a);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.055, 18), wood);
  base.position.y = 0.028;
  group.add(base);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.048, 0.62, 12), wood);
  post.position.y = 0.35;
  post.castShadow = true;
  group.add(post);

  const horizonRing = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.024, 10, 28), wood);
  horizonRing.rotation.x = Math.PI / 2;
  horizonRing.position.y = 0.76;
  group.add(horizonRing);

  const tiltGroup = new THREE.Group();
  tiltGroup.position.y = 0.76;
  tiltGroup.rotation.z = 0.41;

  const meridian = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.012, 10, 28), brass);
  tiltGroup.add(meridian);

  const globeMat = new THREE.MeshStandardMaterial({
    color: 0xa89268,
    roughness: 0.42,
    metalness: 0.12
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.21, 22, 18), globeMat);
  sphere.castShadow = true;
  tiltGroup.add(sphere);

  const eq = new THREE.Mesh(new THREE.TorusGeometry(0.212, 0.005, 8, 28), brass);
  eq.rotation.x = Math.PI / 2;
  tiltGroup.add(eq);

  group.add(tiltGroup);
  return disableRaycast(group);
}

// 12. Pianta ornamentale da salotto in vaso di ceramica / ottone su piedistallo
export function createPottedPlant({ scale = 1 } = {}) {
  const group = new THREE.Group();
  const wood = makeWoodMaterial('walnut', 0x8a6b52, 0.45);
  const potMat = new THREE.MeshStandardMaterial({ color: 0x264037, roughness: 0.26, metalness: 0.12 });
  const brass = makeBrassMaterial(0xc49a52);
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2c4a31,
    roughness: 0.52,
    side: THREE.DoubleSide
  });

  // Piedistallo basso
  const standTop = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 16), wood);
  standTop.position.y = 0.28;
  group.add(standTop);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.28, 8), wood);
    leg.position.set(Math.cos(a) * 0.12, 0.14, Math.sin(a) * 0.12);
    group.add(leg);
  }

  // Vaso smaltato
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.3, 18), potMat);
  pot.position.y = 0.44;
  pot.castShadow = true;
  group.add(pot);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.016, 10, 22), brass);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.59;
  group.add(rim);

  // Fogliame rigoglioso a raggiera
  const fronds = 13;
  for (let i = 0; i < fronds; i++) {
    const ang = (i / fronds) * Math.PI * 2 + (i % 2) * 0.2;
    const tier = i % 3;
    const frond = new THREE.Group();
    frond.position.set(0, 0.56, 0);
    frond.rotation.y = ang;

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.34 + tier * 0.08, 6), leafMat);
    stem.position.set(0.08, 0.16, 0);
    stem.rotation.z = -0.35 - tier * 0.16;
    frond.add(stem);

    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), leafMat);
    leaf.scale.set(1.55, 0.12, 0.72);
    leaf.position.set(0.22 + tier * 0.05, 0.28 + (2 - tier) * 0.06, 0);
    leaf.rotation.z = -0.45 - tier * 0.2;
    leaf.castShadow = true;
    frond.add(leaf);

    group.add(frond);
  }

  group.scale.setScalar(scale);
  return disableRaycast(group);
}

// 13. Vetrina / Cristalliera da collezione con bottiglie, calici, caraffe e astrolabio
export function createCurioCabinet({ width = 1.15, height = 2.15, depth = 0.42 } = {}) {
  const group = new THREE.Group();
  const wood = makeWoodMaterial('walnut', 0x99785e, 0.4);
  const glass = makeGlassMaterial(0xd4e5ec, 0.24);
  const brass = makeBrassMaterial(0xcfa55c);
  const porcelain = makePorcelainMaterial(0xeae2d2);

  // Base chiusa e cappello
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.58, depth), wood);
  base.position.y = 0.29;
  base.castShadow = true;
  group.add(base);

  const topCap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, 0.12, depth + 0.06), wood);
  topCap.position.y = height - 0.06;
  group.add(topCap);

  const back = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, height - 0.68, 0.03), wood);
  back.position.set(0, 0.58 + (height - 0.68) / 2, -depth / 2 + 0.02);
  group.add(back);

  // Montanti angolari e ante vetrate
  for (const [px, pz] of [
    [-width / 2 + 0.035, -depth / 2 + 0.035],
    [width / 2 - 0.035, -depth / 2 + 0.035],
    [-width / 2 + 0.035, depth / 2 - 0.035],
    [width / 2 - 0.035, depth / 2 - 0.035]
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.065, height - 0.68, 0.065), wood);
    post.position.set(px, 0.58 + (height - 0.68) / 2, pz);
    group.add(post);
  }

  const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.14, height - 0.72), glass);
  frontGlass.position.set(0, 0.58 + (height - 0.68) / 2, depth / 2 - 0.02);
  group.add(frontGlass);

  // Luce interna discreta da vetrina
  const innerLight = new THREE.PointLight(0xebb26a, 1.05, 2.5, 2);
  innerLight.position.set(0, height - 0.22, 0.05);
  group.add(innerLight);

  const bottleMats = [
    makeGlassMaterial(0x3a7a62, 0.68),
    makeGlassMaterial(0x9e5a24, 0.72),
    makeGlassMaterial(0x325785, 0.68),
    makeGlassMaterial(0x7a242b, 0.72)
  ];

  // 3 ripiani con caraffe, ampolle, calici d'ottone e porcellane
  [0.59, 1.08, 1.56].forEach((sy, idx) => {
    if (idx > 0) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.022, depth - 0.08), glass);
      shelf.position.set(0, sy, 0);
      group.add(shelf);
    }

    for (let j = 0; j < 4; j++) {
      const ox = -width * 0.33 + j * (width * 0.22);
      if ((idx + j) % 3 === 0) {
        // Calice / trofeo d'ottone
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.02, 0.14, 12), brass);
        cup.position.set(ox, sy + 0.09, 0);
        group.add(cup);
      } else if ((idx + j) % 3 === 1) {
        // Bottiglia / decanter in vetro colorato
        const bMat = bottleMats[(idx + j) % bottleMats.length];
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.18, 12), bMat);
        body.position.set(ox, sy + 0.1, 0.02);
        group.add(body);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.09, 10), bMat);
        neck.position.set(ox, sy + 0.22, 0.02);
        group.add(neck);
      } else {
        // Piatto o statuetta in porcellana
        const jar = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), porcelain);
        jar.position.set(ox, sy + 0.08, -0.01);
        group.add(jar);
      }
    }
  });

  return disableRaycast(group);
}

// 14. Appendiabiti da ingresso in legno curvato con cappello, mantello e portaombrelli
export function createCoatStand() {
  const group = new THREE.Group();
  const wood = makeWoodMaterial('walnut', 0x8f6f56, 0.42);
  const brass = makeBrassMaterial(0xc89d54);
  const coatMat = makeFabricMaterial('#22262e', 0xffffff, 0.88);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.042, 1.92, 12), wood);
  pole.position.y = 0.96;
  pole.castShadow = true;
  group.add(pole);

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const foot = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 14, Math.PI * 0.65), wood);
    foot.rotation.y = a;
    foot.position.set(Math.cos(a) * 0.12, 0.14, Math.sin(a) * 0.12);
    group.add(foot);

    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 8, 14, Math.PI * 0.9), brass);
    hook.rotation.y = a;
    hook.position.set(Math.cos(a) * 0.07, 1.78, Math.sin(a) * 0.07);
    group.add(hook);
  }

  // Cappello a cilindro appeso
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.016, 18), coatMat);
  brim.position.set(0.1, 1.88, 0);
  brim.rotation.z = -0.32;
  group.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.098, 0.15, 16), coatMat);
  crown.position.set(0.12, 1.95, 0);
  crown.rotation.z = -0.32;
  group.add(crown);

  // Soprabito scuro drappeggiato
  const coat = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.88, 12), coatMat);
  coat.position.set(-0.08, 1.28, 0.05);
  coat.castShadow = true;
  group.add(coat);

  // Portaombrelli in ottone con bastone da passeggio accanto
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.46, 16, 1, true), brass);
  stand.position.set(0.24, 0.23, 0.14);
  group.add(stand);

  const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.82, 8), wood);
  cane.position.set(0.25, 0.42, 0.14);
  cane.rotation.z = -0.14;
  group.add(cane);
  const canePommel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), brass);
  canePommel.position.set(0.305, 0.82, 0.14);
  group.add(canePommel);

  return disableRaycast(group);
}

// 15. Scaffalatura da Cantina Nobile / Dispensa con bottiglie d'annata, damigiane e botti in rovere
export function createWineAndApothecaryRack({ width = 1.55, height = 2.45, depth = 0.46 } = {}) {
  const group = new THREE.Group();
  const rnd = seeded(909);
  const oak = makeWoodMaterial('oak', 0x99795b, 0.48);
  const iron = makeRustMaterial(0x3a322d, 0.55, 0.68);
  const glassGreen = makeGlassMaterial(0x274d33, 0.78);
  const glassAmber = makeGlassMaterial(0x7c4619, 0.78);

  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, height, depth), oak);
    post.position.set(sx * (width / 2 - 0.035), height / 2, 0);
    post.castShadow = true;
    group.add(post);
  }

  // Piccole botti in rovere nel ripiano basso
  for (const bx of [-0.38, 0.38]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.42, 16), oak);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(bx, 0.24, 0.02);
    barrel.castShadow = true;
    group.add(barrel);

    for (const hz of [-0.13, 0.13]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.01, 8, 18), iron);
      hoop.position.set(bx, 0.24, 0.02 + hz);
      group.add(hoop);
    }
  }

  // Ripiani superiori carichi di bottiglie coricate e vasi
  [0.56, 1.04, 1.52, 2.0, 2.42].forEach((sy, idx) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth), oak);
    shelf.position.set(0, sy, 0);
    group.add(shelf);

    if (idx < 3) {
      for (let b = 0; b < 7; b++) {
        const bx = -width / 2 + 0.18 + b * ((width - 0.36) / 6);
        const bMat = (b + idx) % 2 === 0 ? glassGreen : glassAmber;
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.28, 10), bMat);
        bottle.rotation.x = Math.PI / 2;
        bottle.position.set(bx, sy + 0.065, 0.03);
        group.add(bottle);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.09, 8), bMat);
        neck.rotation.x = Math.PI / 2;
        neck.position.set(bx, sy + 0.065, 0.2);
        group.add(neck);
      }
    } else if (idx === 3) {
      // Cassetta di legno, lanterna d'ottone e vasetti d'erboristeria
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.3), oak);
      crate.position.set(-0.36, sy + 0.14, 0);
      group.add(crate);

      for (let j = 0; j < 4; j++) {
        const jar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 0.18 + (j % 2) * 0.05, 12),
          j % 2 === 0 ? glassAmber : makePorcelainMaterial(0xd8cfc0)
        );
        jar.position.set(0.05 + j * 0.16, sy + 0.12, (rnd() - 0.5) * 0.06);
        group.add(jar);
      }
    }
  });

  return disableRaycast(group);
}

// 16. Lampada da scrivania "Banker's Lamp" con paralume verde smeraldo
export function createBankersLamp() {
  const group = new THREE.Group();
  const brass = makeBrassMaterial(0xd4aa5b);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.03, 16), brass);
  base.position.y = 0.015;
  group.add(base);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.28, 10), brass);
  stem.position.set(-0.02, 0.15, -0.02);
  stem.rotation.z = -0.15;
  group.add(stem);

  const greenShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.22, 14, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({
      color: 0x1b663e,
      emissive: new THREE.Color(0x2d8c53),
      emissiveIntensity: 0.95,
      roughness: 0.22,
      side: THREE.DoubleSide
    })
  );
  greenShade.rotation.z = Math.PI / 2;
  greenShade.rotation.y = Math.PI / 2;
  greenShade.position.set(0.02, 0.28, 0.02);
  group.add(greenShade);

  return disableRaycast(group);
}
