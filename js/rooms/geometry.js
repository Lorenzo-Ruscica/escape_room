import * as THREE from 'three';
import { getConcreteTexture, getFloorTileTexture, getRustMetalTexture } from '../textures.js';

export function makeConcreteMaterial(tint = 0x8e9399) {
  const tex = getConcreteTexture(2, 1);
  return new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: tex,
    bumpScale: 0.04,
    color: tint,
    roughness: 0.88,
    metalness: 0.04
  });
}

export function makeRustMaterial(hex = 0x7a6052, roughness = 0.66, metalness = 0.42) {
  const tex = getRustMetalTexture();
  return new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: tex,
    bumpScale: 0.03,
    color: hex,
    roughness,
    metalness
  });
}

export function makeBrassMaterial(hex = 0xc29b59) {
  const tex = getRustMetalTexture('#705a38');
  return new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: tex,
    bumpScale: 0.018,
    color: hex,
    roughness: 0.38,
    metalness: 0.68
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

// Costruisce l'involucro architettonico decadente della stanza + travi + pulviscolo
export function buildRoomShell({ width = 7.6, height = 4.2, depth = 7.2, wallTint = 0x8c9096 } = {}) {
  const group = new THREE.Group();
  const wallMat = makeConcreteMaterial(wallTint);
  const sideTex = getConcreteTexture(2, 1);
  const sideWallMat = new THREE.MeshStandardMaterial({
    map: sideTex,
    bumpMap: sideTex,
    bumpScale: 0.04,
    color: wallTint,
    roughness: 0.88,
    metalness: 0.04
  });
  const floorTex = getFloorTileTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    bumpMap: floorTex,
    bumpScale: 0.025,
    color: 0x62676d,
    roughness: 0.54,
    metalness: 0.18
  });
  const ceilMat = makeConcreteMaterial(0x3f4348);
  const beamMat = makeRustMaterial(0x5c473d, 0.72, 0.45);

  // Pavimento solido
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Soffitto solido
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  // Parete di fondo (-Z)
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
  backWall.position.set(0, height / 2, -depth / 2);
  backWall.receiveShadow = true;
  group.add(backWall);

  // Parete sinistra (-X)
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), sideWallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-width / 2, height / 2, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // Parete destra (+X)
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), sideWallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(width / 2, height / 2, 0);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Parete frontale dietro la telecamera (+Z)
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), ceilMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, height / 2, depth / 2 + 0.5);
  group.add(frontWall);

  // Travi d'acciaio arrugginite sul soffitto e montanti laterali che scandiscono i muri
  const beamGeo = new THREE.BoxGeometry(width, 0.22, 0.24);
  for (const zPos of [-2.4, -0.4, 1.6]) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, height - 0.11, zPos);
    beam.castShadow = true;
    group.add(beam);
  }

  // Pilastri solo ai quattro angoli della stanza
  const pillarGeo = new THREE.BoxGeometry(0.26, height, 0.26);
  for (const [px, pz] of [
    [-width / 2 + 0.13, -depth / 2 + 0.13],
    [width / 2 - 0.13, -depth / 2 + 0.13],
    [-width / 2 + 0.13, depth / 2 - 0.13],
    [width / 2 - 0.13, depth / 2 - 0.13]
  ]) {
    const pillar = new THREE.Mesh(pillarGeo, beamMat);
    pillar.position.set(px, height / 2, pz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  }

  // Zoccolatura e fascia marcapiano metallica su tutte le pareti (rende subito evidente il volume solido dei muri)
  const trimMat = makeRustMaterial(0x473932, 0.78, 0.38);
  const backTrim = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, 0.07), trimMat);
  backTrim.position.set(0, 0.1, -depth / 2 + 0.035);
  group.add(backTrim);

  for (const side of [-1, 1]) {
    const sideBase = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, depth), trimMat);
    sideBase.position.set(side * (width / 2 - 0.035), 0.1, 0);
    group.add(sideBase);

    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, depth), trimMat);
    sideRail.position.set(side * (width / 2 - 0.025), 0.92, 0);
    group.add(sideRail);

    const topCornice = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, depth), beamMat);
    topCornice.position.set(side * (width / 2 - 0.06), height - 0.07, 0);
    group.add(topCornice);
  }

  // Luce radente molto tenue sulle pareti laterali: rivela la grana del cemento nel buio senza illuminare a giorno
  const wallWashLeft = new THREE.PointLight(0x6c7d8e, 0.62, 8.0, 1.7);
  wallWashLeft.position.set(-2.4, 2.1, -0.4);
  group.add(wallWashLeft);

  const wallWashRight = new THREE.PointLight(0x8a7562, 0.68, 8.0, 1.7);
  wallWashRight.position.set(2.4, 2.1, -0.4);
  group.add(wallWashRight);

  // Pulviscolo atmosferico sospeso (confinato dentro un raggio sicuro per non uscire dai muri)
  const dustCount = 115;
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const r = Math.sqrt(Math.random()) * (Math.min(width, depth) * 0.42);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = 0.3 + Math.random() * (height - 0.6);
    positions[i * 3 + 2] = Math.sin(theta) * r - 0.3;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xd4c3ab,
    size: 0.024,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.name = 'roomDust';
  group.add(dust);

  return { group, dust };
}

// Lampada industriale a gabbia con filamento caldo
export function createCageLamp({ color = 0xd98a48, intensity = 5.2, distance = 9.5 } = {}) {
  const root = new THREE.Group();
  const metal = makeRustMaterial(0x2d2521, 0.7, 0.7);

  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.48, 8), metal);
  cord.position.y = 0.28;
  root.add(cord);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 0.1, 12), metal);
  cap.position.y = 0.04;
  root.add(cap);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffddb0,
    emissive: new THREE.Color(color),
    emissiveIntensity: 2.2,
    roughness: 0.2
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), bulbMat);
  bulb.position.y = -0.06;
  root.add(bulb);

  const cage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.09, 0.2, 8, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x261f1b, wireframe: true, metalness: 0.8, roughness: 0.6 })
  );
  cage.position.y = -0.07;
  root.add(cage);

  const light = new THREE.PointLight(color, intensity, distance, 1.7);
  light.position.y = -0.1;
  light.castShadow = true;
  light.shadow.bias = -0.0015;
  light.shadow.mapSize.set(512, 512);
  root.add(light);

  return { root, light, bulbMat };
}

// Volantino industriale a razze per valvole e portelloni
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
