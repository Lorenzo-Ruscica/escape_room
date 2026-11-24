import * as THREE from 'three';
import {
  createCageLamp,
  createHandwheel,
  makeBrassMaterial,
  makeFabricMaterial,
  makeGlassMaterial,
  makeRustMaterial,
  makeWoodMaterial,
  tagInteractive
} from './geometry.js';
import { createWallSconce, disableRaycast } from './props.js';
import {
  buildLighthouseShell,
  createBrassTelescope,
  createCoastalPorthole,
  createLifebuoy
} from './props_coastal.js';
import { createCompassDiskTexture } from '../textures.js';
import {
  COMPASS_DIRS,
  TARGET_COMPASS,
  addInventoryItem,
  consumeInventoryItem,
  state
} from '../state.js';
import { sound } from '../audio.js';
import { openDocument, openEndingScreen, renderInventory, whisper } from '../ui.js';

export function buildLighthouseRoom(actions) {
  const { group, dust, seaIron } = buildLighthouseShell({
    width: 7.6,
    height: 4.2,
    depth: 7.2,
    backCutouts: [[-1.26, 1.26]]
  });

  const hemi = new THREE.HemisphereLight(0x637d92, 0x261d15, 0.52);
  group.add(hemi);

  const chandelier = createCageLamp({ color: 0xe69c4e, intensity: 5.8, distance: 11.4 });
  chandelier.root.position.set(0, 3.6, -0.35);
  group.add(chandelier.root);

  const frontFill = new THREE.PointLight(0xdca468, 1.4, 5.2, 1.75);
  frontFill.position.set(0, 1.4, 0.65);
  group.add(frontFill);

  // --- ARREDI SCENOGRAFICI DELLA LANTERNA DEL FARO ---
  // Oblò marittimi panoramici sul mare notturno + cannocchiale d'ottone su treppiede + salvagente
  const portholeRight = createCoastalPorthole(0.46);
  portholeRight.position.set(2.42, 2.18, -3.55);
  group.add(portholeRight);

  const portholeLeftWall = createCoastalPorthole(0.44);
  portholeLeftWall.position.set(-3.75, 2.25, -2.15);
  portholeLeftWall.rotation.y = Math.PI / 2;
  group.add(portholeLeftWall);

  const telescope = createBrassTelescope();
  telescope.position.set(2.38, 0, -2.42);
  telescope.rotation.y = 0.18;
  group.add(telescope);

  const lifebuoy = createLifebuoy();
  lifebuoy.position.set(-3.73, 2.18, 0.35);
  lifebuoy.rotation.y = Math.PI / 2;
  group.add(lifebuoy);

  // Radio costiera a valvole con "occhio magico" verde smeraldo (avanti a destra)
  const radioDesk = new THREE.Group();
  radioDesk.position.set(2.75, 0, 0.55);
  radioDesk.rotation.y = -0.55;
  const oakMat = makeWoodMaterial('oak', 0x8f7359, 0.45);
  const brass = makeBrassMaterial(0xd4a958);

  const rTable = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.78, 0.54), oakMat);
  rTable.position.y = 0.39;
  rTable.castShadow = true;
  radioDesk.add(rTable);

  const radioBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.34, 0.32),
    makeRustMaterial(0x343d42, 0.48, 0.65)
  );
  radioBox.position.set(0, 0.95, 0);
  radioDesk.add(radioBox);

  const tuningEye = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 16),
    new THREE.MeshStandardMaterial({
      color: 0x7affb2,
      emissive: new THREE.Color(0x28d475),
      emissiveIntensity: 2.1
    })
  );
  tuningEye.position.set(-0.14, 0.99, 0.165);
  radioDesk.add(tuningEye);

  for (const kx of [0.05, 0.18]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 12), brass);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(kx, 0.91, 0.165);
    radioDesk.add(knob);
  }
  disableRaycast(radioDesk);
  group.add(radioDesk);

  for (const sx of [-1.48, 1.48]) {
    const sconce = createWallSconce({ color: 0xe89c4c, intensity: 1.55 });
    sconce.position.set(sx, 2.55, -3.55);
    group.add(sconce);
  }

  // --- 1. TORRETTA DELLA GRANDE LENTE DI FRESNEL (SINISTRA / FONDO) ---
  const fresnelTower = new THREE.Group();
  fresnelTower.position.set(-2.28, 0, -2.55);

  const pedIron = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.64, 1.38, 20), seaIron);
  pedIron.position.y = 0.69;
  pedIron.castShadow = true;
  fresnelTower.add(pedIron);

  const brassGallery = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.56, 0.1, 24), brass);
  brassGallery.position.y = 1.42;
  fresnelTower.add(brassGallery);

  const lensCage = new THREE.Group();
  lensCage.position.y = 2.02;
  const crystalGlass = makeGlassMaterial(0xdcf2ff, 0.46);

  for (let r = 0; r < 5; r++) {
    const radius = 0.46 - Math.abs(r - 2) * 0.055;
    const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.042, 12, 28), crystalGlass);
    torus.rotation.x = Math.PI / 2;
    torus.position.y = -0.36 + r * 0.18;
    lensCage.add(torus);
  }
  for (let b = 0; b < 6; b++) {
    const a = (b * Math.PI) / 3;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.92, 8), brass);
    strut.position.set(Math.cos(a) * 0.46, 0, Math.sin(a) * 0.46);
    lensCage.add(strut);
  }

  const coreLampMat = new THREE.MeshStandardMaterial({
    color: 0x3b3228,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    roughness: 0.2
  });
  const coreLamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), coreLampMat);
  lensCage.add(coreLamp);

  const capDome = new THREE.Mesh(
    new THREE.ConeGeometry(0.52, 0.34, 20),
    brass
  );
  capDome.position.y = 0.62;
  lensCage.add(capDome);

  const beaconSpot = new THREE.SpotLight(0xffd27a, 0, 14, Math.PI / 4.2, 0.5, 1.3);
  beaconSpot.position.set(0, 0, 0);
  beaconSpot.target.position.set(2.2, -0.4, 2.6);
  lensCage.add(beaconSpot);
  lensCage.add(beaconSpot.target);

  fresnelTower.add(lensCage);
  disableRaycast(fresnelTower);
  group.add(fresnelTower);

  // --- 2. TAVOLO NAUTICO + ULTIMA LETTERA DI VANE + PRISMA DI FRESNEL (SINISTRA AVANTI) ---
  const chartTable = new THREE.Group();
  chartTable.position.set(-2.52, 0, 0.18);
  chartTable.rotation.y = 0.38;

  const tableProps = new THREE.Group();
  const cTop = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.06, 1.54), oakMat);
  cTop.position.y = 0.88;
  cTop.castShadow = true;
  cTop.receiveShadow = true;
  tableProps.add(cTop);

  for (const [lx, lz] of [[-0.44, -0.66], [0.44, -0.66], [-0.44, 0.66], [0.44, 0.66]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.03, 0.88, 10), oakMat);
    leg.position.set(lx, 0.44, lz);
    tableProps.add(leg);
  }

  // Cofanetto aperto in velluto blu per il Prisma
  const caseBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.045, 0.28),
    makeFabricMaterial('#182a3d', 0xffffff, 0.8)
  );
  caseBase.position.set(0.16, 0.928, 0.48);
  tableProps.add(caseBase);

  disableRaycast(tableProps);
  chartTable.add(tableProps);

  const chartLight = new THREE.PointLight(0xffe0a3, 2.2, 3.4, 1.8);
  chartLight.position.set(0.1, 1.38, 0.05);
  chartTable.add(chartLight);

  // Lettera finale di Aldo Vane & Grande Carta Nautica (intera superficie cliccabile)
  const letterGroup = new THREE.Group();
  letterGroup.position.set(0, 0.916, -0.18);

  const seaChart = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.01, 0.88),
    new THREE.MeshStandardMaterial({ color: 0xd8ceb4, roughness: 0.82 })
  );
  letterGroup.add(seaChart);

  const letterSheet = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.018, 0.26),
    new THREE.MeshStandardMaterial({ color: 0xf0e7d3, roughness: 0.84 })
  );
  letterSheet.position.set(0.14, 0.012, 0.08);
  letterSheet.rotation.y = -0.22;
  letterGroup.add(letterSheet);

  const sealWax = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.024, 0.008, 12),
    new THREE.MeshStandardMaterial({ color: 0x8c221b, roughness: 0.45 })
  );
  sealWax.position.set(0.22, 0.023, 0.14);
  letterGroup.add(sealWax);

  const chartHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.12, 0.94),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  chartHitbox.position.y = 0.03;
  chartHitbox.userData.noHighlight = true;
  letterGroup.add(chartHitbox);

  tagInteractive(letterGroup, {
    id: 'vane_letter',
    label: 'Lettera e Carta Nautica',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      openDocument({
        meta: 'ULTIMO FOGLIO // CAPO BRUMA, 19 NOVEMBRE 1964',
        title: 'Lettera dal Tavolo di Rotta — A. Vane',
        html: `
          <p>«Se sei arrivato fin quassù, allora hai attraversato sia lo studio in città sia le stanze di Capo Bruma. Non ho costruito queste Soglie per nascondermi dal mondo, ma per essere certo che chi avesse raccolto i miei appunti sapesse osservare prima di agire.»</p>
          <div class="code-callout">
            • <strong>Allineamento Faro — Frammento III:</strong> il terzo quadrante a destra (3°) deve puntare a <strong>Est ( E )</strong>, verso la cala riparata dove attende la lancia.<br>
            • Inserisci il <strong>Prisma centrale di Fresnel</strong> nella console prima di abbassare la leva.
          </div>
          <p>«Ci rivedremo oltre il molo, dove le carte finiscono.»</p>
        `
      });
    }
  });
  chartTable.add(letterGroup);

  // Prisma di Cristallo di Fresnel raccoglibile
  const prismPickup = new THREE.Group();
  prismPickup.position.set(0.16, 0.99, 0.48);
  prismPickup.rotation.y = 0.45;
  const prismCrystalMat = new THREE.MeshStandardMaterial({
    color: 0xdcf4ff,
    emissive: new THREE.Color(0x52a8d9),
    emissiveIntensity: 0.75,
    roughness: 0.08,
    metalness: 0.25
  });
  const prismMesh = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.18, 3), prismCrystalMat);
  prismPickup.add(prismMesh);

  const prismHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.26, 0.32),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  prismHitbox.userData.noHighlight = true;
  prismPickup.add(prismHitbox);

  tagInteractive(prismPickup, {
    id: 'prism_pickup',
    label: 'Prisma di Fresnel',
    isEnabled: () => !state.closeupId && !state.hasPrism,
    onClick: () => {
      state.hasPrism = true;
      prismPickup.visible = false;
      addInventoryItem('fresnel_prism');
      sound.playPickup();
      renderInventory();
      whisper('Raccolto: Prisma ottico di Fresnel in cristallo sfaccettato.');
    }
  });
  chartTable.add(prismPickup);
  group.add(chartTable);

  // --- 3. CONSOLE NAUTICA CENTRALE DEI QUADRANTI BUSSOLA [ O · S · E ] ---
  const beaconConsole = new THREE.Group();
  beaconConsole.position.set(0, 0, -0.95);
  const consoleTeak = makeWoodMaterial('walnut', 0x8f6f55, 0.4);

  const pedStatic = new THREE.Group();
  const pedBox = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.9, 0.68), consoleTeak);
  pedBox.position.y = 0.45;
  pedBox.castShadow = true;
  pedBox.receiveShadow = true;
  pedStatic.add(pedBox);
  disableRaycast(pedStatic);
  beaconConsole.add(pedStatic);

  const slant = new THREE.Group();
  slant.position.set(0, 0.98, 0);
  slant.rotation.x = 0.52;

  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.095, 0.8), seaIron);
  topPlate.castShadow = true;
  topPlate.raycast = () => {};
  slant.add(topPlate);

  const brassTrimPlate = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.016, 0.68), brass);
  brassTrimPlate.position.y = 0.05;
  brassTrimPlate.raycast = () => {};
  slant.add(brassTrimPlate);

  const consoleLight = new THREE.PointLight(0xffbe73, 3.4, 3.8, 1.6);
  consoleLight.position.set(0, 0.82, 0.25);
  slant.add(consoleLight);

  // 3A. Innesto del Prisma Ottico (a sinistra sulla console)
  const prismSocketGroup = new THREE.Group();
  prismSocketGroup.position.set(-0.54, 0.065, 0.0);

  const socketRing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.125, 0.04, 18), brass);
  prismSocketGroup.add(socketRing);

  const socketVoid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.045, 3),
    new THREE.MeshBasicMaterial({ color: 0x0c141a })
  );
  socketVoid.userData.noHighlight = true;
  prismSocketGroup.add(socketVoid);

  const mountedPrism = new THREE.Mesh(new THREE.ConeGeometry(0.082, 0.17, 3), prismCrystalMat);
  mountedPrism.position.y = 0.09;
  mountedPrism.visible = false;
  prismSocketGroup.add(mountedPrism);

  const socketHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.24, 0.28),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  socketHitbox.position.y = 0.06;
  socketHitbox.userData.noHighlight = true;
  prismSocketGroup.add(socketHitbox);

  tagInteractive(prismSocketGroup, {
    id: 'prism_socket',
    get label() {
      return state.prismInserted ? 'Prisma di Fresnel installato' : 'Innesto ottico vuoto';
    },
    isEnabled: () => state.closeupId === 'beacon' && !state.beaconLit,
    onClick: () => {
      if (state.prismInserted) {
        whisper('Il prisma è innestato: allinea i tre quadranti bussola e aziona la leva a destra.');
        return;
      }
      if (state.armedItem === 'fresnel_prism') {
        consumeInventoryItem('fresnel_prism');
        state.prismInserted = true;
        mountedPrism.visible = true;
        sound.playMetalSnap();
        renderInventory();
        whisper('Prisma di Fresnel innestato nel collettore ottico! Ora allinea la rotta sui tre quadranti.');
      } else {
        sound.playDialTick(0.6);
        whisper('Manca il prisma centrale in cristallo per convogliare il fascio della Lanterna.');
      }
    }
  });
  slant.add(prismSocketGroup);

  // 3B. I 3 Quadranti Bussola [ N · E · S · O ] al centro
  const dialMeshes = [];
  const dialKicks = [0, 0, 0];
  const dialTitles = ['1° (Sinistro)', '2° (Centrale)', '3° (Destro)'];

  for (let i = 0; i < 3; i++) {
    const dx = -0.14 + i * 0.22;
    const holder = new THREE.Group();
    holder.position.set(dx, 0.062, -0.01);

    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.1, 0.025, 24), brass);
    holder.add(bezel);

    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.084, 0.084, 0.03, 24),
      makeRustMaterial(0x18222a, 0.45, 0.6)
    );
    const cTex = createCompassDiskTexture(COMPASS_DIRS[state.compassRings[i]]);
    const faceMat = new THREE.MeshStandardMaterial({
      map: cTex,
      emissive: new THREE.Color(0xc98b38),
      emissiveMap: cTex,
      emissiveIntensity: 0.52,
      roughness: 0.3
    });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.082, 28), faceMat);
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.016;
    disk.add(face);
    holder.add(disk);

    tagInteractive(holder, {
      id: `compass_dial_${i}`,
      get label() {
        return `Quadrante ${dialTitles[i]} · ${COMPASS_DIRS[state.compassRings[i]]}`;
      },
      isEnabled: () => state.closeupId === 'beacon' && !state.beaconLit,
      onClick: () => {
        state.compassRings[i] = (state.compassRings[i] + 1) % COMPASS_DIRS.length;
        const newTex = createCompassDiskTexture(COMPASS_DIRS[state.compassRings[i]]);
        face.material.map = newTex;
        face.material.emissiveMap = newTex;
        face.material.needsUpdate = true;
        dialKicks[i] = 0.65;
        sound.playDialTick(0.86 + i * 0.11);
      }
    });

    dialMeshes.push({ group: disk, face });
    slant.add(holder);
  }

  // 3C. Leva del Segnale Ottico (a destra sulla console)
  const leverBase = new THREE.Group();
  leverBase.position.set(0.55, 0.062, 0.04);

  const lBox = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.045, 0.24), seaIron);
  leverBase.add(lBox);

  const leverPivot = new THREE.Group();
  leverPivot.rotation.x = -0.52;
  const lRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.19, 10), brass);
  lRod.position.y = 0.095;
  leverPivot.add(lRod);
  const lGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.12, 12),
    makeWoodMaterial('mahogany', 0x7c2d22, 0.35)
  );
  lGrip.rotation.z = Math.PI / 2;
  lGrip.position.y = 0.19;
  leverPivot.add(lGrip);
  leverBase.add(leverPivot);

  let leverBounce = 0;

  tagInteractive(leverBase, {
    id: 'beacon_lever',
    get label() {
      return state.beaconLit ? 'Segnale attivo' : 'Leva d’accensione Faro';
    },
    isEnabled: () => state.closeupId === 'beacon' && !state.beaconLit,
    onClick: () => {
      if (!state.prismInserted) {
        leverBounce = 0.45;
        sound.playDialTick(0.52);
        whisper('L’innesto a sinistra è vuoto: inserisci prima il Prisma di Fresnel.');
        return;
      }

      const solved =
        state.compassRings[0] === TARGET_COMPASS[0] &&
        state.compassRings[1] === TARGET_COMPASS[1] &&
        state.compassRings[2] === TARGET_COMPASS[2];

      if (!solved) {
        leverBounce = 0.48;
        sound.playDialTick(0.48);
        const cur = state.compassRings.map((idx) => COMPASS_DIRS[idx]).join(' · ');
        whisper(`Rotta [ ${cur} ] errata. Verifica i tre frammenti nel Diario della Serra, nell’Armadietto e nella Lettera.`);
        return;
      }

      state.beaconLit = true;
      sound.playVaultOpen();
      whisper('Rotta [ O · S · E ] agganciata! La lente di Fresnel s’illumina e la paratia del Molo si apre.');
      window.setTimeout(() => {
        if (state.closeupId === 'beacon') {
          actions.leaveCloseup();
        }
      }, 480);
    }
  });
  slant.add(leverBase);
  beaconConsole.add(slant);

  const consoleZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(1.68, 1.25, 0.92),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  consoleZoomProxy.position.set(0, 0.72, 0);
  consoleZoomProxy.userData.noHighlight = true;
  tagInteractive(consoleZoomProxy, {
    id: 'beacon_console_zoom',
    label: 'Console della Lanterna',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.enterCloseup('beacon');
    }
  });
  beaconConsole.add(consoleZoomProxy);
  group.add(beaconConsole);

  // --- 4. PARATIA COSTIERA DEL MOLO (FONDO CENTRO) ---
  const pierGate = new THREE.Group();
  pierGate.position.set(0, 0, -3.54);

  const seaPortalMat = new THREE.MeshStandardMaterial({
    color: 0x09131c,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    roughness: 0.2
  });
  const seaPortal = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 2.75), seaPortalMat);
  seaPortal.position.set(0, 1.42, -0.02);
  pierGate.add(seaPortal);

  const seaBreezeSpot = new THREE.SpotLight(0xffe0a3, 0, 14, Math.PI / 3.4, 0.55, 1.2);
  seaBreezeSpot.position.set(0, 2.1, -0.2);
  seaBreezeSpot.target.position.set(0, 0.5, 3.0);
  pierGate.add(seaBreezeSpot);
  pierGate.add(seaBreezeSpot.target);

  tagInteractive(seaPortal, {
    id: 'pier_exit',
    kind: 'door',
    label: 'Passerella del Molo · Raggiungi il mare',
    isEnabled: () => !state.closeupId && state.beaconLit,
    onClick: () => {
      state.escaped = true;
      sound.playDoorTransition();
      openEndingScreen();
    }
  });

  // Cornice fissa in ghisa marina + doppie ante scorrevoli
  for (const sx of [-1.14, 1.14]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.92, 0.18), seaIron);
    jamb.position.set(sx, 1.46, 0.04);
    jamb.raycast = () => {};
    pierGate.add(jamb);
  }
  const headerBeam = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.2, 0.22), seaIron);
  headerBeam.position.set(0, 2.86, 0.05);
  headerBeam.raycast = () => {};
  pierGate.add(headerBeam);

  const leftLeaf = new THREE.Group();
  leftLeaf.position.set(-0.54, 1.4, 0.08);
  const lPlate = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.74, 0.1), seaIron);
  leftLeaf.add(lPlate);
  const lWheel = createHandwheel(0.24, 0.024, brass);
  lWheel.position.set(0.24, 0.05, 0.08);
  leftLeaf.add(lWheel);

  const rightLeaf = new THREE.Group();
  rightLeaf.position.set(0.54, 1.4, 0.08);
  const rPlate = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.74, 0.1), seaIron);
  rightLeaf.add(rPlate);

  const doorsInspectGroup = new THREE.Group();
  doorsInspectGroup.add(leftLeaf);
  doorsInspectGroup.add(rightLeaf);

  tagInteractive(doorsInspectGroup, {
    id: 'pier_hatch_inspect',
    label: 'Paratia stagna del Molo',
    isEnabled: () => !state.closeupId && !state.beaconLit,
    onClick: () => {
      whisper('La paratia verso la banchina a mare si sblocca solo quando il segnale ottico del Faro è attivo.');
    }
  });
  pierGate.add(doorsInspectGroup);
  group.add(pierGate);

  // --- 5. PORTA DI RITORNO -> SERRA D'INVERNO (PARETE DESTRA) ---
  const backToGreenhouse = new THREE.Group();
  backToGreenhouse.position.set(3.68, 0, -1.85);
  backToGreenhouse.rotation.y = -Math.PI / 2;

  const gFrame = new THREE.Mesh(new THREE.BoxGeometry(1.58, 2.68, 0.15), seaIron);
  gFrame.position.y = 1.34;
  backToGreenhouse.add(gFrame);

  const gDoor = new THREE.Mesh(new THREE.BoxGeometry(1.28, 2.44, 0.1), oakMat);
  gDoor.position.set(0, 1.26, 0.05);
  backToGreenhouse.add(gDoor);

  const gKnob = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), brass);
  gKnob.position.set(-0.46, 1.18, 0.13);
  backToGreenhouse.add(gKnob);

  tagInteractive(backToGreenhouse, {
    id: 'return_from_lighthouse',
    kind: 'door',
    label: 'Serra d’Inverno',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.goToRoom('greenhouse');
    }
  });
  group.add(backToGreenhouse);

  let openProgress = 0;

  function syncFromState() {
    prismPickup.visible = !state.hasPrism;
    mountedPrism.visible = state.prismInserted;

    for (let i = 0; i < 3; i++) {
      const targetTex = createCompassDiskTexture(COMPASS_DIRS[state.compassRings[i]]);
      const fMat = dialMeshes[i].face.material;
      if (fMat.map !== targetTex) {
        fMat.map = targetTex;
        fMat.emissiveMap = targetTex;
        fMat.needsUpdate = true;
      }
    }
  }

  function update(dt, elapsed) {
    dust.rotation.y = elapsed * 0.016;

    // Rotazione solenne della gabbia di Fresnel (accelera quando il faro è acceso)
    lensCage.rotation.y += dt * (state.beaconLit ? 1.15 : 0.12);

    for (let i = 0; i < 3; i++) {
      dialKicks[i] += (0 - dialKicks[i]) * Math.min(1, dt * 12);
      dialMeshes[i].group.rotation.y = dialKicks[i];
    }

    if (leverBounce > 0) {
      leverBounce = Math.max(0, leverBounce - dt * 2.8);
    }
    const targetLever = state.beaconLit ? 0.58 : -0.52 + Math.sin(leverBounce * Math.PI) * 0.45;
    leverPivot.rotation.x += (targetLever - leverPivot.rotation.x) * Math.min(1, dt * 10);

    const desired = state.beaconLit ? 1 : 0;
    openProgress += (desired - openProgress) * Math.min(1, dt * 1.05);

    coreLampMat.color.setHex(openProgress > 0.05 ? 0xfff0c2 : 0x3b3228);
    coreLampMat.emissive.setHex(0xffb84d);
    coreLampMat.emissiveIntensity = openProgress * 3.2;
    beaconSpot.intensity = openProgress * 14;

    const slide = (1 - Math.pow(1 - openProgress, 3)) * 1.02;
    leftLeaf.position.x = -0.54 - slide;
    rightLeaf.position.x = 0.54 + slide;

    seaPortal.material.color.setHex(openProgress > 0.05 ? 0x24465e : 0x09131c);
    seaPortal.userData.baseEmissive.setHex(0x88bfd9);
    seaPortal.userData.baseEmissiveIntensity = openProgress * 1.85;
    seaPortal.material.emissive.copy(seaPortal.userData.baseEmissive);
    seaPortal.material.emissiveIntensity = seaPortal.userData.baseEmissiveIntensity;
    seaBreezeSpot.intensity = openProgress * 12;

    syncFromState();
  }

  syncFromState();

  return {
    id: 'lighthouse',
    title: 'III · LANTERNA DEL FARO',
    group,
    defaultCamera: {
      pos: new THREE.Vector3(0, 1.84, 3.72),
      lookAt: new THREE.Vector3(0, 1.48, -2.5)
    },
    closeups: {
      beacon: {
        pos: new THREE.Vector3(0, 1.86, 0.02),
        lookAt: new THREE.Vector3(0, 1.02, -0.98)
      }
    },
    update,
    syncFromState
  };
}
