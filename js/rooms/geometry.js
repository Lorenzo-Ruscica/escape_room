import * as THREE from 'three';
import {
  getConcreteTexture,
  getFabricTexture,
  getParquetTexture,
  getRustMetalTexture,
  getSoftParticleTexture,
  getWallpaperTexture,
  getWoodTexture
} from '../textures.js';

export function makeConcreteMaterial(tint = 0x8e9399) {
  const tex = getConcreteTexture(2, 1);
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: tint,
    roughness: 0.84,
    metalness: 0.04,
    dithering: true
  });
}

export function makeWoodMaterial(variant = 'walnut', tint = 0xffffff, roughness = 0.44) {
  const tex = getWoodTexture(variant, 2, 2);
  return new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: tex,
    bumpScale: 0.006,
    color: tint,
    roughness,
    metalness: 0.06,
    dithering: true
  });
}

export function makeFabricMaterial(hexStr = '#541e22', tint = 0xffffff, roughness = 0.82) {
  const tex = getFabricTexture(hexStr, 3, 3);
  return new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: tex,
    bumpScale: 0.008,
    color: tint,
    roughness,
    metalness: 0.02,
    dithering: true
  });
}

export function makePorcelainMaterial(hex = 0xeae2d3) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.18,
    metalness: 0.08,
    dithering: true
  });
}

export function makeGlassMaterial(hex = 0xbfd4dc, opacity = 0.34) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity,
    dithering: true
  });
}

export function makeRustMaterial(hex = 0x7a6052, roughness = 0.56, metalness = 0.48) {
  const tex = getRustMetalTexture();
  return new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: tex,
    bumpScale: 0.008,
    color: hex,
    roughness,
    metalness,
    dithering: true
  });
}

export function makeBrassMaterial(hex = 0xc8a05a) {
  const tex = getRustMetalTexture('#78603c');
  return new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: tex,
    bumpScale: 0.006,
    color: hex,
    roughness: 0.3,
    metalness: 0.76,
    dithering: true
  });
}

// Registra un gruppo/mesh come bersaglio interattivo per il raycasting
export function tagInteractive(object, config) {
  const highlightMeshes = [];
  object.traverse((child) => {
    if (child.isMesh && !child.userData.noHighlight) {
      child.material = child.material.clone();
      child.userData.baseEmissive = child.material.emissive
        ? child.material.emissive.clone()
        : new THREE.Color(0x000000);
      child.userData.baseEmissiveIntensity = child.material.emissiveIntensity ?? 1;
      highlightMeshes.push(child);
    }
  });

  object.userData.interactive = {
    ...config,
    highlightMeshes
  };
  return object;
}

// Costruisce l'architettura d'interni di una dimora signorile (parquet, boiserie scolpita, parati damascati, soffitto a cassettoni)
export function buildRoomShell({
  width = 7.6,
  height = 4.2,
  depth = 7.2,
  theme = 'emerald',
  wallTint = 0xd8d0c5,
  backCutouts = []
} = {}) {
  const group = new THREE.Group();

  const wallTex = getWallpaperTexture(theme, 6);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    color: wallTint,
    roughness: 0.78,
    metalness: 0.05,
    dithering: true
  });

  const floorTex = getParquetTexture(5, 5);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    color: 0xb89d82,
    roughness: 0.38,
    metalness: 0.08,
    dithering: true
  });

  const woodDark = makeWoodMaterial('walnut', 0x8f745c, 0.46);
  const woodPanel = makeWoodMaterial('mahogany', 0x9c7c63, 0.42);
  const woodCeiling = makeWoodMaterial('walnut', 0x695341, 0.54);
  const brassTrim = makeBrassMaterial(0xb58d4d);

  // Pavimento in parquet di noce
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Soffitto ligneo scuro
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), woodCeiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  // Pareti principali rivestite di carta damascata
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
  backWall.position.set(0, height / 2, -depth / 2);
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-width / 2, height / 2, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(width / 2, height / 2, 0);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, height / 2, depth / 2 + 0.5);
  group.add(frontWall);

  // --- BOISERIE SCOLPITA LUNGO TUTTE LE PARETI (h = 1.10m) ---
  const dadoH = 1.08;
  const boiserieGroup = new THREE.Group();

  // Calcola i segmenti pieni della parete di fondo escludendo i vani porta / chiusa (backCutouts)
  const sortedCuts = [...backCutouts].sort((a, b) => a[0] - b[0]);
  const backSegments = [];
  let cursor = -width / 2;
  for (const [cStart, cEnd] of sortedCuts) {
    const s = Math.max(-width / 2, cStart);
    const e = Math.min(width / 2, cEnd);
    if (s > cursor + 0.02) backSegments.push([cursor, s]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < width / 2 - 0.02) backSegments.push([cursor, width / 2]);

  for (const [segA, segB] of backSegments) {
    const segW = segB - segA;
    const segMid = (segA + segB) / 2;

    const segWainscot = new THREE.Mesh(new THREE.BoxGeometry(segW, dadoH, 0.045), woodDark);
    segWainscot.position.set(segMid, dadoH / 2, -depth / 2 + 0.022);
    segWainscot.receiveShadow = true;
    boiserieGroup.add(segWainscot);

    const segBase = new THREE.Mesh(new THREE.BoxGeometry(segW, 0.16, 0.075), woodPanel);
    segBase.position.set(segMid, 0.08, -depth / 2 + 0.036);
    boiserieGroup.add(segBase);

    const segRail = new THREE.Mesh(new THREE.BoxGeometry(segW, 0.075, 0.085), woodPanel);
    segRail.position.set(segMid, dadoH + 0.02, -depth / 2 + 0.04);
    boiserieGroup.add(segRail);

    // Specchiature bugnate solo nei tratti di muro sufficientemente larghi
    const pCount = Math.floor((segW - 0.12) / 0.72);
    if (pCount >= 1) {
      const pStep = (segW - 0.12) / pCount;
      const recGeo = new THREE.BoxGeometry(Math.max(0.2, pStep - 0.14), 0.66, 0.024);
      for (let i = 0; i < pCount; i++) {
        const px = segA + 0.06 + pStep * (i + 0.5);
        const panel = new THREE.Mesh(recGeo, woodPanel);
        panel.position.set(px, 0.58, -depth / 2 + 0.05);
        boiserieGroup.add(panel);
      }
    }
  }

  const backCrown = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, 0.14), woodDark);
  backCrown.position.set(0, height - 0.08, -depth / 2 + 0.07);
  boiserieGroup.add(backCrown);

  // Boiserie pareti laterali (-X e +X)
  const panelCountSide = 7;
  const stepSide = (depth - 0.6) / panelCountSide;
  const recGeoSide = new THREE.BoxGeometry(0.024, 0.66, stepSide - 0.14);

  for (const side of [-1, 1]) {
    const xWall = side * (width / 2 - 0.022);
    const sideWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.045, dadoH, depth), woodDark);
    sideWainscot.position.set(xWall, dadoH / 2, 0);
    sideWainscot.receiveShadow = true;
    boiserieGroup.add(sideWainscot);

    const sideBase = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.16, depth), woodPanel);
    sideBase.position.set(side * (width / 2 - 0.036), 0.08, 0);
    boiserieGroup.add(sideBase);

    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.075, depth), woodPanel);
    sideRail.position.set(side * (width / 2 - 0.04), dadoH + 0.02, 0);
    boiserieGroup.add(sideRail);

    const sideCrown = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, depth), woodDark);
    sideCrown.position.set(side * (width / 2 - 0.07), height - 0.08, 0);
    boiserieGroup.add(sideCrown);

    // Profilo dorato discreto sotto il cornicione
    const giltLine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.022, depth), brassTrim);
    giltLine.position.set(side * (width / 2 - 0.135), height - 0.165, 0);
    boiserieGroup.add(giltLine);

    for (let i = 0; i < panelCountSide; i++) {
      const pz = -depth / 2 + 0.3 + stepSide * (i + 0.5);
      const panel = new THREE.Mesh(recGeoSide, woodPanel);
      panel.position.set(side * (width / 2 - 0.05), 0.58, pz);
      boiserieGroup.add(panel);
    }
  }

  // Lesene angolari e paraste intermedie in noce intagliato
  const pilasterGeo = new THREE.BoxGeometry(0.24, height, 0.24);
  const capGeo = new THREE.BoxGeometry(0.3, 0.12, 0.3);
  for (const [px, pz] of [
    [-width / 2 + 0.12, -depth / 2 + 0.12],
    [width / 2 - 0.12, -depth / 2 + 0.12],
    [-width / 2 + 0.12, depth / 2 - 0.12],
    [width / 2 - 0.12, depth / 2 - 0.12]
  ]) {
    const pil = new THREE.Mesh(pilasterGeo, woodDark);
    pil.position.set(px, height / 2, pz);
    pil.castShadow = true;
    pil.receiveShadow = true;
    boiserieGroup.add(pil);

    const cap = new THREE.Mesh(capGeo, woodPanel);
    cap.position.set(px, height - 0.2, pz);
    boiserieGroup.add(cap);
  }

  // Soffitto a cassettoni con travi trasversali e longitudinali + rosone centrale in ottone
  const beamXGeo = new THREE.BoxGeometry(width, 0.16, 0.2);
  for (const zPos of [-2.4, -0.6, 1.2, 3.0]) {
    const beam = new THREE.Mesh(beamXGeo, woodDark);
    beam.position.set(0, height - 0.08, zPos);
    beam.castShadow = true;
    boiserieGroup.add(beam);
  }
  const beamZGeo = new THREE.BoxGeometry(0.18, 0.14, depth);
  for (const xPos of [-2.1, 2.1]) {
    const beam = new THREE.Mesh(beamZGeo, woodDark);
    beam.position.set(xPos, height - 0.07, 0);
    boiserieGroup.add(beam);
  }

  // Disabilita raycast sui puri dettagli architettonici per massimizzare gli FPS
  boiserieGroup.traverse((c) => {
    if (c.isMesh) c.raycast = () => {};
  });
  group.add(boiserieGroup);

  // Luce radente calda sulle pareti per esaltare damasco, quadri e boiserie
  const wallWashLeft = new THREE.PointLight(0xa88b6c, 0.72, 8.5, 1.65);
  wallWashLeft.position.set(-2.4, 2.3, -0.4);
  group.add(wallWashLeft);

  const wallWashRight = new THREE.PointLight(0xb5916d, 0.78, 8.5, 1.65);
  wallWashRight.position.set(2.4, 2.3, -0.4);
  group.add(wallWashRight);

  // Pulviscolo dorato sospeso nei fasci di luce della casa
  const dustCount = 120;
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const r = Math.sqrt(Math.random()) * (Math.min(width, depth) * 0.42);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = 0.35 + Math.random() * (height - 0.7);
    positions[i * 3 + 2] = Math.sin(theta) * r - 0.3;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    map: getSoftParticleTexture(),
    color: 0xedd6b0,
    size: 0.042,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.raycast = () => {};
  dust.name = 'roomDust';
  group.add(dust);

  return { group, dust };
}

// Lampadario d'epoca in ottone brunito a 4 bracci con tulipani in vetro ambrato
export function createCageLamp({ color = 0xe3964a, intensity = 6.2, distance = 11.2 } = {}) {
  const root = new THREE.Group();
  const brass = makeBrassMaterial(0xb88f4c);
  const darkBronze = makeRustMaterial(0x3a2b20, 0.45, 0.72);

  // Rosone a soffitto e asta con catena
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.06, 20), brass);
  rose.position.y = 0.52;
  root.add(rose);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.56, 12), darkBronze);
  stem.position.y = 0.24;
  root.add(stem);

  // Corpo centrale tornito
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 14), brass);
  hub.position.y = -0.04;
  root.add(hub);

  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 14), brass);
  finial.rotation.x = Math.PI;
  finial.position.y = -0.18;
  root.add(finial);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffe5bd,
    emissive: new THREE.Color(color),
    emissiveIntensity: 2.1,
    roughness: 0.22
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xffdfb0,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.95,
    roughness: 0.28,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide
  });

  // 4 bracci curvi con piattelli e coppe di vetro smerigliato
  for (let i = 0; i < 4; i++) {
    const armGroup = new THREE.Group();
    armGroup.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;

    const arm = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.014, 8, 18, Math.PI * 0.85),
      brass
    );
    arm.position.set(0.18, -0.02, 0);
    arm.rotation.z = Math.PI * 1.08;
    armGroup.add(arm);

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.03, 0.03, 14), brass);
    cup.position.set(0.35, 0.02, 0);
    armGroup.add(cup);

    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.042, 0.13, 16, 1, true), shadeMat);
    shade.position.set(0.35, 0.09, 0);
    armGroup.add(shade);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), bulbMat);
    bulb.position.set(0.35, 0.075, 0);
    armGroup.add(bulb);

    root.add(armGroup);
  }

  root.traverse((c) => {
    if (c.isMesh) c.raycast = () => {};
  });

  const light = new THREE.PointLight(color, intensity, distance, 1.65);
  light.position.y = -0.12;
  light.castShadow = true;
  light.shadow.bias = -0.0005;
  light.shadow.normalBias = 0.04;
  light.shadow.mapSize.set(1024, 1024);
  root.add(light);

  return { root, light, bulbMat };
}

// Volantino a razze per valvole e portelloni
export function createHandwheel(radius = 0.22, tube = 0.024, material) {
  const wheel = new THREE.Group();
  const mat = material || makeRustMaterial(0x6e3724, 0.6, 0.65);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 28), mat);
  rim.castShadow = true;
  wheel.add(rim);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, tube * 2.4, 12), mat);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);

  const spokeGeo = new THREE.CylinderGeometry(tube * 0.58, tube * 0.58, radius * 1.92, 8);
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(spokeGeo, mat);
    spoke.rotation.z = (i * Math.PI) / 3;
    wheel.add(spoke);
  }

  return wheel;
}
