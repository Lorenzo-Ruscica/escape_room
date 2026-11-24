import * as THREE from 'three';
import {
  makeBrassMaterial,
  makeGlassMaterial,
  makePorcelainMaterial,
  makeRustMaterial,
  makeWoodMaterial
} from './geometry.js';
import { disableRaycast } from './props.js';
import {
  getCheckerMarbleTexture,
  getCoastalStoneTexture,
  getConservatoryGlassWallTexture,
  getDarkroomTileTexture,
  getRugTexture,
  getSoftParticleTexture,
  getWoodTexture
} from '../textures.js';

function buildSegmentedPlinth({ width, depth, h = 0.72, mat, capMat, backCutouts = [] }) {
  const g = new THREE.Group();
  const sorted = [...backCutouts].sort((a, b) => a[0] - b[0]);
  const segs = [];
  let cur = -width / 2;
  for (const [a, b] of sorted) {
    const s = Math.max(-width / 2, a);
    const e = Math.min(width / 2, b);
    if (s > cur + 0.02) segs.push([cur, s]);
    cur = Math.max(cur, e);
  }
  if (cur < width / 2 - 0.02) segs.push([cur, width / 2]);

  for (const [sa, sb] of segs) {
    const sw = sb - sa;
    const sm = (sa + sb) / 2;
    const base = new THREE.Mesh(new THREE.BoxGeometry(sw, h, 0.06), mat);
    base.position.set(sm, h / 2, -depth / 2 + 0.03);
    base.receiveShadow = true;
    g.add(base);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.06, 0.09), capMat);
    rail.position.set(sm, h + 0.02, -depth / 2 + 0.045);
    g.add(rail);
  }

  for (const side of [-1, 1]) {
    const sBase = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, depth), mat);
    sBase.position.set(side * (width / 2 - 0.03), h / 2, 0);
    sBase.receiveShadow = true;
    g.add(sBase);

    const sRail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, depth), capMat);
    sRail.position.set(side * (width / 2 - 0.045), h + 0.02, 0);
    g.add(sRail);
  }
  return disableRaycast(g);
}

function createDustParticles(width, height, depth, hex = 0xcfe8de) {
  const count = 110;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(Math.random()) * (Math.min(width, depth) * 0.42);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = 0.35 + Math.random() * (height - 0.7);
    positions[i * 3 + 2] = Math.sin(theta) * r - 0.3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    map: getSoftParticleTexture(),
    color: hex,
    size: 0.042,
    transparent: true,
    opacity: 0.44,
    depthWrite: false
  });
  const pts = new THREE.Points(geo, mat);
  pts.raycast = () => {};
  return pts;
}

// 1. Involucro architettonico SERRA D'INVERNO (marmo a scacchi bianco/nero + vetrate liberty in ferro verde salvia)
export function buildConservatoryShell({ width = 7.6, height = 4.2, depth = 7.2, backCutouts = [] } = {}) {
  const group = new THREE.Group();

  const floorTex = getCheckerMarbleTexture(5, 5);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.24,
    metalness: 0.12,
    dithering: true
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const glassWallTex = getConservatoryGlassWallTexture(3);
  const glassWallMat = new THREE.MeshStandardMaterial({
    map: glassWallTex,
    emissive: new THREE.Color(0x1f3947),
    emissiveMap: glassWallTex,
    emissiveIntensity: 0.52,
    roughness: 0.28,
    metalness: 0.18,
    dithering: true
  });

  const sageIron = new THREE.MeshStandardMaterial({
    color: 0x2a4038,
    roughness: 0.46,
    metalness: 0.62,
    dithering: true
  });
  const limestone = makePorcelainMaterial(0x8e948e);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), glassWallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassWallMat);
  backWall.position.set(0, height / 2, -depth / 2);
  backWall.receiveShadow = true;
  group.add(backWall);

  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), glassWallMat);
    w.rotation.y = -side * (Math.PI / 2);
    w.position.set(side * (width / 2), height / 2, 0);
    w.receiveShadow = true;
    group.add(w);
  }

  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassWallMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, height / 2, depth / 2 + 0.5);
  group.add(frontWall);

  // Zoccolo perimetrale in pietra chiara e ferro battuto verde salvia
  group.add(buildSegmentedPlinth({ width, depth, h: 0.72, mat: limestone, capMat: sageIron, backCutouts }));

  // Centine in ghisa verde salvia sul soffitto vetrato
  const ribs = new THREE.Group();
  for (const zPos of [-2.5, -0.8, 0.9, 2.6]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, 0.12), sageIron);
    beam.position.set(0, height - 0.07, zPos);
    ribs.add(beam);
  }
  for (const [px, pz] of [
    [-width / 2 + 0.1, -depth / 2 + 0.1],
    [width / 2 - 0.1, -depth / 2 + 0.1],
    [-width / 2 + 0.1, depth / 2 - 0.1],
    [width / 2 - 0.1, depth / 2 - 0.1]
  ]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, height, 12), sageIron);
    col.position.set(px, height / 2, pz);
    ribs.add(col);
  }
  disableRaycast(ribs);
  group.add(ribs);

  const dust = createDustParticles(width, height, depth, 0xd4f0e4);
  group.add(dust);
  return { group, dust, sageIron };
}

// 2. Involucro architettonico CAMERA OSCURA (piastrelle smaltate grigio-avorio + pedane in legno + lampade rosse)
export function buildDarkroomShell({ width = 7.6, height = 4.2, depth = 7.2, backCutouts = [] } = {}) {
  const group = new THREE.Group();

  const tileTex = getDarkroomTileTexture(5);
  const wallMat = new THREE.MeshStandardMaterial({
    map: tileTex,
    color: 0xd0cbc4,
    roughness: 0.34,
    metalness: 0.08,
    dithering: true
  });

  const slateFloorMat = new THREE.MeshStandardMaterial({
    color: 0x202328,
    roughness: 0.42,
    metalness: 0.14,
    dithering: true
  });
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.8, dithering: true });
  const darkTrim = makeRustMaterial(0x2a2e33, 0.5, 0.55);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), slateFloorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Grigliato antiscivolo in listelli di legno al centro del laboratorio
  const duckboard = new THREE.Group();
  const slatWood = makeWoodMaterial('oak', 0x8a6d52, 0.55);
  for (let i = -8; i <= 8; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.022, 0.11), slatWood);
    slat.position.set(0, 0.011, -0.75 + i * 0.16);
    slat.receiveShadow = true;
    duckboard.add(slat);
  }
  disableRaycast(duckboard);
  group.add(duckboard);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
  backWall.position.set(0, height / 2, -depth / 2);
  backWall.receiveShadow = true;
  group.add(backWall);

  for (const side of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
    sw.rotation.y = -side * (Math.PI / 2);
    sw.position.set(side * (width / 2), height / 2, 0);
    sw.receiveShadow = true;
    group.add(sw);
  }

  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), ceilMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, height / 2, depth / 2 + 0.5);
  group.add(frontWall);

  group.add(buildSegmentedPlinth({ width, depth, h: 0.85, mat: darkTrim, capMat: darkTrim, backCutouts }));

  const dust = createDustParticles(width, height, depth, 0xffb8b0);
  group.add(dust);
  return { group, dust };
}

// 3. Involucro architettonico LANTERNA DEL FARO (pietra calcarea costiera + tavolato navale + ghisa marina)
export function buildLighthouseShell({ width = 7.6, height = 4.2, depth = 7.2, backCutouts = [] } = {}) {
  const group = new THREE.Group();

  const stoneTex = getCoastalStoneTexture(4);
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: 0xd8d5cc,
    roughness: 0.76,
    metalness: 0.05,
    dithering: true
  });

  const deckTex = getWoodTexture('oak', 6, 6);
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckTex,
    color: 0x8f7b66,
    roughness: 0.48,
    metalness: 0.06,
    dithering: true
  });

  const seaIron = makeRustMaterial(0x2f4447, 0.46, 0.65);
  const brass = makeBrassMaterial(0xc89f56);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), deckMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Tappeto nautico tessuto al centro della torre
  const ropeMat = new THREE.MeshStandardMaterial({
    map: getRugTexture('sapphire'),
    roughness: 0.88,
    dithering: true
  });
  const ropeRug = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.014, 2.9), ropeMat);
  ropeRug.position.set(0, 0.008, -0.95);
  ropeRug.receiveShadow = true;
  ropeRug.raycast = () => {};
  group.add(ropeRug);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), seaIron);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), stoneMat);
  backWall.position.set(0, height / 2, -depth / 2);
  backWall.receiveShadow = true;
  group.add(backWall);

  for (const side of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), stoneMat);
    sw.rotation.y = -side * (Math.PI / 2);
    sw.position.set(side * (width / 2), height / 2, 0);
    sw.receiveShadow = true;
    group.add(sw);
  }

  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), stoneMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, height / 2, depth / 2 + 0.5);
  group.add(frontWall);

  group.add(buildSegmentedPlinth({ width, depth, h: 0.78, mat: seaIron, capMat: brass, backCutouts }));

  // Costoloni metallici da torre costiera
  const girders = new THREE.Group();
  for (const zPos of [-2.4, -0.5, 1.4]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 0.18), seaIron);
    beam.position.set(0, height - 0.09, zPos);
    girders.add(beam);
  }
  disableRaycast(girders);
  group.add(girders);

  const dust = createDustParticles(width, height, depth, 0xffe4b8);
  group.add(dust);
  return { group, dust, seaIron };
}

// Lanterna a globo in vetro opalino (Serra d'Inverno)
export function createGlobeLantern({ color = 0xffe2ad, intensity = 5.4 } = {}) {
  const root = new THREE.Group();
  const brass = makeBrassMaterial(0xc49c54);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 8), brass);
  chain.position.y = 0.28;
  root.add(chain);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.07, 16), brass);
  cap.position.y = 0.02;
  root.add(cap);

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 20, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfff0d4,
      emissive: new THREE.Color(color),
      emissiveIntensity: 1.45,
      roughness: 0.25
    })
  );
  globe.position.y = -0.14;
  root.add(globe);

  disableRaycast(root);

  const light = new THREE.PointLight(color, intensity, 11.5, 1.65);
  light.position.y = -0.16;
  light.castShadow = true;
  light.shadow.bias = -0.0005;
  light.shadow.normalBias = 0.04;
  light.shadow.mapSize.set(1024, 1024);
  root.add(light);

  return { root, light };
}

// Scaffale botanico a gradoni con vasi di terracotta, felci, orchidee e annaffiatoio
export function createTieredPlantRack() {
  const group = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x263b34, roughness: 0.5, metalness: 0.6 });
  const terracotta = new THREE.MeshStandardMaterial({ color: 0xa8583b, roughness: 0.72 });
  const celadon = makePorcelainMaterial(0x88a89a);
  const foliageDark = new THREE.MeshStandardMaterial({ color: 0x264f33, roughness: 0.55, side: THREE.DoubleSide });
  const foliageBright = new THREE.MeshStandardMaterial({ color: 0x3b6e42, roughness: 0.5, side: THREE.DoubleSide });
  const blossomMat = new THREE.MeshStandardMaterial({
    color: 0xf2d8e4,
    emissive: new THREE.Color(0x8c4b6e),
    emissiveIntensity: 0.35,
    roughness: 0.4
  });

  // 3 gradoni in ferro battuto
  [
    { y: 0.28, z: 0.24 },
    { y: 0.62, z: 0.0 },
    { y: 0.96, z: -0.24 }
  ].forEach((step, idx) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.03, 0.28), iron);
    shelf.position.set(0, step.y, step.z);
    shelf.castShadow = true;
    group.add(shelf);

    for (const lx of [-0.58, 0.58]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, step.y, 8), iron);
      leg.position.set(lx, step.y / 2, step.z);
      group.add(leg);
    }

    for (let p = 0; p < 3; p++) {
      const px = -0.4 + p * 0.4;
      const pMat = (p + idx) % 2 === 0 ? terracotta : celadon;
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.16, 12), pMat);
      pot.position.set(px, step.y + 0.095, step.z);
      pot.castShadow = true;
      group.add(pot);

      for (let f = 0; f < 6; f++) {
        const a = (f * Math.PI) / 3 + idx;
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.085, 8, 6),
          f % 2 === 0 ? foliageDark : foliageBright
        );
        leaf.scale.set(1.5, 0.16, 0.7);
        leaf.position.set(px + Math.cos(a) * 0.1, step.y + 0.22 + (f % 2) * 0.05, step.z + Math.sin(a) * 0.1);
        leaf.rotation.y = -a;
        leaf.rotation.z = -0.35;
        group.add(leaf);
      }

      if ((p + idx) % 2 === 1) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), blossomMat);
        flower.position.set(px, step.y + 0.31, step.z);
        group.add(flower);
      }
    }
  });

  return disableRaycast(group);
}

// Campana di vetro botanica (Cloche) con esemplare luminescente
export function createBotanicalCloche() {
  const g = new THREE.Group();
  const wood = makeWoodMaterial('walnut', 0x7c5d46, 0.42);
  const glass = makeGlassMaterial(0xd8eef5, 0.28);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3b6e4c, roughness: 0.5 });
  const glowFlower = new THREE.MeshStandardMaterial({
    color: 0xdff7ff,
    emissive: new THREE.Color(0x64b8d9),
    emissiveIntensity: 1.35,
    roughness: 0.25
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.03, 18), wood);
  base.position.y = 0.015;
  g.add(base);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.16, 8), stemMat);
  stem.position.y = 0.1;
  g.add(stem);

  const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), glowFlower);
  bloom.position.y = 0.19;
  g.add(bloom);

  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.115, 0.22, 18), glass);
  dome.position.y = 0.14;
  g.add(dome);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  cap.position.y = 0.25;
  g.add(cap);

  return disableRaycast(g);
}

// Macchina fotografica d'epoca a soffietto su treppiede in legno
export function createBellowsCameraOnTripod() {
  const g = new THREE.Group();
  const wood = makeWoodMaterial('mahogany', 0x8f674f, 0.42);
  const bellowsMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const brass = makeBrassMaterial(0xd4a959);

  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.3;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 1.38, 8), wood);
    leg.position.set(Math.cos(a) * 0.22, 0.66, Math.sin(a) * 0.22);
    leg.rotation.z = Math.cos(a) * 0.22;
    leg.rotation.x = -Math.sin(a) * 0.22;
    leg.castShadow = true;
    g.add(leg);
  }

  const headPlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.34), wood);
  headPlate.position.y = 1.32;
  g.add(headPlate);

  const rearBox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.08), wood);
  rearBox.position.set(0, 1.47, -0.1);
  g.add(rearBox);

  const bellows = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.21, 0.2), bellowsMat);
  bellows.position.set(0, 1.47, 0.04);
  g.add(bellows);

  const frontStandard = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.24, 0.04), wood);
  frontStandard.position.set(0, 1.47, 0.15);
  g.add(frontStandard);

  const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.1, 16), brass);
  lensBarrel.rotation.x = Math.PI / 2;
  lensBarrel.position.set(0, 1.47, 0.21);
  g.add(lensBarrel);

  return disableRaycast(g);
}

// Filo con stampe fotografiche B/N appese ad asciugare con mollette
export function createPhotoDryingLine(span = 5.4) {
  const g = new THREE.Group();
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, span, 6),
    new THREE.MeshStandardMaterial({ color: 0x9c8e78, roughness: 0.9 })
  );
  cord.rotation.z = Math.PI / 2;
  g.add(cord);

  const photos = [];
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c7,
    roughness: 0.65,
    side: THREE.DoubleSide
  });
  const imgMat = new THREE.MeshStandardMaterial({
    color: 0x35383d,
    roughness: 0.45,
    side: THREE.DoubleSide
  });
  const clipMat = makeWoodMaterial('oak', 0xa88662, 0.6);

  for (let i = 0; i < 6; i++) {
    const px = -span * 0.38 + (i / 5) * (span * 0.76);
    const holder = new THREE.Group();
    holder.position.set(px, 0, 0);

    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.055, 0.022), clipMat);
    clip.position.y = -0.01;
    holder.add(clip);

    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.34), paperMat);
    sheet.position.y = -0.18;
    holder.add(sheet);

    const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.27), imgMat);
    inner.position.set(0, -0.175, 0.003);
    holder.add(inner);

    g.add(holder);
    photos.push(holder);
  }

  disableRaycast(g);
  return { root: g, photos };
}

// Scaffale metallico da Camera Oscura con flaconi ambrati/blu, cilindri graduati e bobine
export function createReagentShelf({ width = 1.4, height = 2.35, depth = 0.4 } = {}) {
  const g = new THREE.Group();
  const steel = makeRustMaterial(0x3a4046, 0.5, 0.65);
  const amberGlass = makeGlassMaterial(0x8c4b19, 0.8);
  const cobaltGlass = makeGlassMaterial(0x1f4578, 0.8);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xb5a68c, roughness: 0.8 });

  for (const [lx, lz] of [
    [-width / 2 + 0.03, -depth / 2 + 0.03],
    [width / 2 - 0.03, -depth / 2 + 0.03],
    [-width / 2 + 0.03, depth / 2 - 0.03],
    [width / 2 - 0.03, depth / 2 - 0.03]
  ]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, height, 0.05), steel);
    post.position.set(lx, height / 2, lz);
    g.add(post);
  }

  [0.24, 0.78, 1.32, 1.86, 2.3].forEach((sy, idx) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(width, 0.03, depth), steel);
    shelf.position.set(0, sy, 0);
    g.add(shelf);

    if (idx < 4) {
      for (let b = 0; b < 5; b++) {
        const bx = -width * 0.36 + b * (width * 0.18);
        if ((b + idx) % 3 === 0) {
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.24), boxMat);
          box.position.set(bx, sy + 0.085, 0);
          g.add(box);
        } else {
          const mat = (b + idx) % 2 === 0 ? amberGlass : cobaltGlass;
          const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.2, 12), mat);
          jar.position.set(bx, sy + 0.115, 0.02);
          g.add(jar);
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 10), steel);
          cap.position.set(bx, sy + 0.23, 0.02);
          g.add(cap);
        }
      }
    }
  });

  return disableRaycast(g);
}

// Cannocchiale / Telescopio marittimo in ottone lucido su treppiede
export function createBrassTelescope() {
  const g = new THREE.Group();
  const wood = makeWoodMaterial('mahogany', 0x8a644b, 0.4);
  const brass = makeBrassMaterial(0xd9ae5f);

  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 1.32, 8), wood);
    leg.position.set(Math.cos(a) * 0.22, 0.64, Math.sin(a) * 0.22);
    leg.rotation.z = Math.cos(a) * 0.22;
    leg.rotation.x = -Math.sin(a) * 0.22;
    g.add(leg);
  }

  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 12), brass);
  mount.position.y = 1.34;
  g.add(mount);

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.068, 0.96, 16), brass);
  tube.rotation.x = Math.PI / 2 - 0.18;
  tube.position.set(0, 1.46, -0.08);
  tube.castShadow = true;
  g.add(tube);

  return disableRaycast(g);
}

// Salvagente costiero bianco e rosso mattone + oblò panoramico sul mare
export function createLifebuoy() {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xdcd6c8, roughness: 0.65 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0x9e3426, roughness: 0.6 });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.075, 14, 28), whiteMat);
  g.add(ring);

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.078, 12, 10, 0.36), redMat);
    band.rotation.z = a - 0.18;
    g.add(band);
  }

  return disableRaycast(g);
}

export function createCoastalPorthole(radius = 0.44) {
  const g = new THREE.Group();
  const brass = makeBrassMaterial(0xc69c52);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.055, 14, 32), brass);
  g.add(rim);

  const seaPane = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 0.02, 28),
    new THREE.MeshStandardMaterial({
      color: 0x102230,
      emissive: new THREE.Color(0x2d5878),
      emissiveIntensity: 0.85,
      roughness: 0.15
    })
  );
  seaPane.position.z = 0.01;
  g.add(seaPane);

  return disableRaycast(g);
}
