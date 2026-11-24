import * as THREE from 'three';
import {
  buildRoomShell,
  createCageLamp,
  createHandwheel,
  makeBrassMaterial,
  makeFabricMaterial,
  makeRustMaterial,
  makeWoodMaterial,
  tagInteractive
} from './geometry.js';
import {
  createBankersLamp,
  createBookcase,
  createCandelabra,
  createFramedPainting,
  createGlobeStand,
  createPersianRug,
  createPottedPlant,
  createSideTableWithLamp,
  createTuftedArmchair,
  createWallSconce,
  disableRaycast
} from './props.js';
import {
  createCRTTexture,
  createSootGlassTexture,
  createSymbolDiskTexture
} from '../textures.js';
import {
  ROTOR_SYMBOLS,
  TARGET_ROTORS,
  consumeInventoryItem,
  state
} from '../state.js';
import { sound } from '../audio.js';
import { openDocument, openEndingScreen, renderInventory, whisper } from '../ui.js';

export function buildControlRoom(actions) {
  const { group, dust } = buildRoomShell({
    width: 7.6,
    height: 4.2,
    depth: 7.2,
    theme: 'prussian',
    wallTint: 0xd8d2c6,
    backCutouts: [[-1.32, 1.32]]
  });

  // Grande tappeto persiano blu zaffiro e oro sotto lo scrittoio centrale di comando
  const studyRug = createPersianRug({ width: 4.6, depth: 3.6, palette: 'sapphire' });
  studyRug.position.set(0, 0, -0.85);
  group.add(studyRug);

  const hemi = new THREE.HemisphereLight(0x4b5c6e, 0x1c1510, 0.46);
  group.add(hemi);

  const overheadLamp = createCageLamp({ color: 0xde9248, intensity: 6.0, distance: 11.2 });
  overheadLamp.root.position.set(0, 3.62, -0.35);
  group.add(overheadLamp.root);

  // --- ARREDI SCENOGRAFICI DEL GRANDE STUDIO BIBLIOTECA & OSSERVATORIO ---
  // Tre grandi librerie monumentali in mogano colme di volumi rilegati, anfore e sfere d'ottone
  // (il lato sinistro della parete di fondo resta libero in sporgenza affinché il portellone circolare scorra senza urti)
  const backRightBookcase = createBookcase({ width: 1.52, height: 2.92, depth: 0.44, seed: 301 });
  backRightBookcase.position.set(2.48, 0, -3.32);
  group.add(backRightBookcase);

  const leftStudyBookcase = createBookcase({ width: 1.48, height: 2.88, depth: 0.42, seed: 612 });
  leftStudyBookcase.position.set(-3.52, 0, -0.05);
  leftStudyBookcase.rotation.y = Math.PI / 2;
  group.add(leftStudyBookcase);

  const rightStudyBookcase = createBookcase({ width: 1.48, height: 2.88, depth: 0.42, seed: 845 });
  rightStudyBookcase.position.set(3.52, 0, -0.32);
  rightStudyBookcase.rotation.y = -Math.PI / 2;
  group.add(rightStudyBookcase);

  // Angolo lettura dello studio (avanti a sinistra, ben visibile nell'inquadratura)
  const studyArmchair = createTuftedArmchair({ hex: '#1d3b31' });
  studyArmchair.position.set(-2.45, 0, 0.78);
  studyArmchair.rotation.y = 2.25;
  group.add(studyArmchair);

  const studySideTable = createSideTableWithLamp({ lampColor: 0xe89b4a, shadeTint: 0xd68336 });
  studySideTable.position.set(-3.08, 0, 1.05);
  group.add(studySideTable);

  // Mappamondo antico su cavalletto in noce (avanti a destra, interamente inquadrato) + pianta ornamentale
  const antiqueGlobe = createGlobeStand();
  antiqueGlobe.position.set(2.38, 0, 0.65);
  antiqueGlobe.rotation.y = -0.5;
  group.add(antiqueGlobe);

  // Luce morbida d'ambiente anteriore per valorizzare il fronte intagliato della console e i volumi delle librerie
  const frontStudyFill = new THREE.PointLight(0xdca064, 1.45, 5.2, 1.75);
  frontStudyFill.position.set(0, 1.35, 0.65);
  group.add(frontStudyFill);

  const studyPlant = createPottedPlant({ scale: 1.06 });
  studyPlant.position.set(3.26, 0, -2.92);
  group.add(studyPlant);

  // Quadri astronomici e classici + applique calde in ottone
  const leftBackPainting = createFramedPainting({ width: 1.18, height: 0.88, variant: 2, withLight: false });
  leftBackPainting.position.set(-2.45, 2.05, -3.55);
  group.add(leftBackPainting);

  const crtTopPainting = createFramedPainting({ width: 1.05, height: 0.72, variant: 1, withLight: false });
  crtTopPainting.position.set(-3.75, 2.66, -1.72);
  crtTopPainting.rotation.y = Math.PI / 2;
  group.add(crtTopPainting);

  const doorTopPainting = createFramedPainting({ width: 0.96, height: 0.68, variant: 0, withLight: false });
  doorTopPainting.position.set(3.75, 3.18, -1.85);
  doorTopPainting.rotation.y = -Math.PI / 2;
  group.add(doorTopPainting);

  for (const sx of [-1.52, 1.48]) {
    const sconce = createWallSconce({ color: 0xe89b4c, intensity: 1.6 });
    sconce.position.set(sx, 2.58, -3.55);
    group.add(sconce);
  }

  // Mobile credenza fisso sotto la postazione diagnostica CRT (parete sinistra)
  const leftCredenza = new THREE.Group();
  leftCredenza.position.set(-3.48, 0, -1.72);
  const credWood = makeWoodMaterial('walnut', 0x947359, 0.42);
  const credBrass = makeBrassMaterial(0xc89d54);
  const credBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.12, 2.08), credWood);
  credBody.position.y = 0.56;
  credBody.castShadow = true;
  credBody.receiveShadow = true;
  leftCredenza.add(credBody);

  const credTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 2.16), makeWoodMaterial('mahogany', 0x825d46, 0.38));
  credTop.position.y = 1.14;
  leftCredenza.add(credTop);

  const leftCandelabra = createCandelabra();
  leftCandelabra.position.set(0.02, 1.165, 0.85);
  leftCredenza.add(leftCandelabra);

  for (const dz of [-0.65, 0, 0.65]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10), credBrass);
    knob.position.set(0.24, 0.68, dz);
    leftCredenza.add(knob);
  }
  disableRaycast(leftCredenza);
  group.add(leftCredenza);

  // --- 1. GRANDE CHIUSA CIRCOLARE DI SUPERFICIE ("SOGLIA 0") SUL FONDO ---
  const vaultAnchor = new THREE.Group();
  vaultAnchor.position.set(0, 1.95, -3.55);

  const outerBrassRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.44, 0.05, 14, 48),
    makeBrassMaterial(0xc69b52)
  );
  outerBrassRing.raycast = () => {};
  vaultAnchor.add(outerBrassRing);

  const ringCollar = new THREE.Mesh(
    new THREE.TorusGeometry(1.36, 0.13, 16, 48),
    makeRustMaterial(0x475059, 0.48, 0.62)
  );
  vaultAnchor.add(ringCollar);

  const portalMat = new THREE.MeshStandardMaterial({
    color: 0x080b0e,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    roughness: 0.2
  });
  const portalDisk = new THREE.Mesh(new THREE.CircleGeometry(1.28, 44), portalMat);
  portalDisk.position.z = -0.01;
  vaultAnchor.add(portalDisk);

  const daylightSpot = new THREE.SpotLight(0xd8ecff, 0, 14, Math.PI / 3.4, 0.55, 1.2);
  daylightSpot.position.set(0, 0.1, -0.2);
  daylightSpot.target.position.set(0, -0.8, 3.2);
  vaultAnchor.add(daylightSpot);
  vaultAnchor.add(daylightSpot.target);

  tagInteractive(portalDisk, {
    id: 'escape_portal',
    kind: 'door',
    label: 'Varco di Superficie · Esci',
    isEnabled: () => !state.closeupId && state.vaultOpen,
    onClick: () => {
      state.escaped = true;
      sound.playDoorTransition();
      openEndingScreen();
    }
  });

  const vaultDoor = new THREE.Group();
  vaultDoor.position.z = 0.12;
  const heavySteel = makeRustMaterial(0x5d6773, 0.44, 0.64);
  const vaultBrass = makeBrassMaterial(0xcfa459);

  const doorPlate = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.16, 40), heavySteel);
  doorPlate.rotation.x = Math.PI / 2;
  doorPlate.castShadow = true;
  vaultDoor.add(doorPlate);

  // Anelli astrolabici concentrici in ottone cesellato sul portellone
  for (const r of [0.64, 0.96]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 10, 36), vaultBrass);
    ring.position.z = 0.085;
    vaultDoor.add(ring);
  }

  const lugs = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    const lugPivot = new THREE.Group();
    lugPivot.rotation.z = ang;
    const lug = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.42, 0.08),
      vaultBrass
    );
    lug.position.set(0, 1.08, 0.1);
    lugPivot.add(lug);
    lugs.push(lug);
    vaultDoor.add(lugPivot);
  }

  const centerWheel = createHandwheel(0.38, 0.036, vaultBrass);
  centerWheel.position.z = 0.16;
  vaultDoor.add(centerWheel);

  tagInteractive(vaultDoor, {
    id: 'vault_door_inspect',
    label: 'Chiusa blindata Soglia 0',
    isEnabled: () => !state.closeupId && !state.vaultOpen,
    onClick: () => {
      whisper('La Chiusa di Superficie è serrata da sei pistoni idraulici. Si governa dalla console centrale.');
    }
  });

  vaultAnchor.add(vaultDoor);
  group.add(vaultAnchor);

  // --- 2. PARETE SINISTRA: TERMINALE CRT IN NOCE/OTTONE + SPIA OTTICA ANNERITA (γ = 9) ---
  const leftStation = new THREE.Group();
  leftStation.position.set(-3.68, 1.62, -1.75);
  leftStation.rotation.y = Math.PI / 2;

  const crtGroup = new THREE.Group();
  crtGroup.position.set(-0.62, 0.05, 0.14);

  const crtWoodCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.68, 0.28),
    makeWoodMaterial('mahogany', 0x8c6850, 0.4)
  );
  crtGroup.add(crtWoodCase);

  const crtBrassBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.54, 0.29),
    credBrass
  );
  crtGroup.add(crtBrassBezel);

  const crtScreenMat = new THREE.MeshStandardMaterial({
    map: createCRTTexture(),
    emissive: new THREE.Color(0xd9822b),
    emissiveMap: createCRTTexture(),
    emissiveIntensity: 0.92,
    roughness: 0.25
  });
  const crtScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.48), crtScreenMat);
  crtScreen.position.z = 0.15;
  crtGroup.add(crtScreen);

  const crtGlow = new THREE.PointLight(0xe58d35, 1.9, 3.2, 2);
  crtGlow.position.set(0, 0, 0.45);
  crtGroup.add(crtGlow);

  tagInteractive(crtGroup, {
    id: 'crt_terminal',
    label: 'Terminale diagnostico',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      openDocument({
        meta: 'TERMINALE FOSFORI // ARCHIVIO SICUREZZA',
        title: ' Schema Cassetta Emergenza [ α · β · γ ]',
        html: `
          <p>Il monitor elenca l’origine delle tre cifre necessarie ad aprire la Cassetta d’Emergenza nell’Anticamera:</p>
          <div class="code-callout">
            • α — Targa d’emergenza sopra il muro dell’Anticamera<br>
            • β — Pressione di regime sul Manometro in Sala Valvole<br>
            • γ — Spia ottica nel riquadro qui a fianco
          </div>
          <p>Ispeziona il riquadro di vetro accanto al terminale per leggere il parametro <strong>γ</strong>.</p>
        `
      });
    }
  });
  leftStation.add(crtGroup);

  const sootGroup = new THREE.Group();
  sootGroup.position.set(0.52, -0.02, 0.08);

  const sootFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.46, 0.1),
    credBrass
  );
  sootGroup.add(sootFrame);

  const dirtyGlassTex = createSootGlassTexture(false);
  const cleanGlassTex = createSootGlassTexture(true);

  const sootGlassMat = new THREE.MeshStandardMaterial({
    map: dirtyGlassTex,
    emissive: new THREE.Color(0x000000),
    emissiveMap: cleanGlassTex,
    emissiveIntensity: 0,
    roughness: 0.35,
    metalness: 0.2
  });
  const sootGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), sootGlassMat);
  sootGlass.position.z = 0.054;
  sootGroup.add(sootGlass);

  const sootFill = new THREE.PointLight(0xd99248, 0.95, 1.8, 2);
  sootFill.position.set(0, 0.1, 0.48);
  sootGroup.add(sootFill);

  tagInteractive(sootGlass, {
    id: 'soot_wipe',
    get label() {
      return state.glassWiped ? 'Spia ottica γ : 9' : 'Pulire vetro annerito';
    },
    isEnabled: () => state.closeupId === 'soot',
    onClick: () => {
      if (!state.glassWiped) {
        state.glassWiped = true;
        sound.playScrape();
        whisper('Strofini via la patina di fuliggine e grasso: dietro il vetro splende nitido γ = 9.');
      } else {
        whisper('La spia ottica mostra stabilmente il valore γ = 9.');
      }
    }
  });

  const sootZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.18),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  sootZoomProxy.userData.noHighlight = true;
  tagInteractive(sootZoomProxy, {
    id: 'soot_zoom',
    label: 'Vetrino ottico annerito',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.enterCloseup('soot');
    }
  });
  sootGroup.add(sootZoomProxy);
  leftStation.add(sootGroup);
  group.add(leftStation);

  // --- 3. LEGGIO / CONSOLE DI COMANDO PADRONALE IN NOCE, PELLE VERDE E OTTONE (AL CENTRO) ---
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(0, 0, -0.95);
  const consoleWood = makeWoodMaterial('walnut', 0x99785e, 0.38);
  const consoleMahogany = makeWoodMaterial('mahogany', 0x825e48, 0.4);
  const leatherInlay = makeFabricMaterial('#1b382c', 0xffffff, 0.72);

  // Basamento scolpito a boiserie con zoccolo modanato e profili in ottone
  const pedestalGroup = new THREE.Group();
  const pedestalPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.78), consoleMahogany);
  pedestalPlinth.position.y = 0.06;
  pedestalGroup.add(pedestalPlinth);

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.86, 0.68), consoleWood);
  pedestal.position.y = 0.49;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  pedestalGroup.add(pedestal);

  for (const px of [-0.42, 0.42]) {
    const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.03), consoleMahogany);
    frontPanel.position.set(px, 0.5, 0.345);
    pedestalGroup.add(frontPanel);
  }
  disableRaycast(pedestalGroup);
  consoleGroup.add(pedestalGroup);

  // Piano inclinato rivestito in pelle verde con cornice di noce e lampada da banchiere sul bordo superiore
  const slantRoot = new THREE.Group();
  slantRoot.position.set(0, 0.98, 0);
  slantRoot.rotation.x = 0.52;

  const deskPlate = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.095, 0.82), consoleWood);
  deskPlate.castShadow = true;
  deskPlate.raycast = () => {};
  slantRoot.add(deskPlate);

  const greenBlotter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.015, 0.68), leatherInlay);
  greenBlotter.position.y = 0.05;
  greenBlotter.raycast = () => {};
  slantRoot.add(greenBlotter);

  const topBankerLamp = createBankersLamp();
  topBankerLamp.scale.setScalar(0.82);
  topBankerLamp.position.set(-0.58, 0.052, -0.28);
  slantRoot.add(topBankerLamp);

  const consoleLamp = new THREE.PointLight(0xeba65c, 3.5, 3.8, 1.6);
  consoleLamp.position.set(0.08, 0.85, 0.25);
  slantRoot.add(consoleLamp);

  // 3A. Diario del Guardiano (lato sinistro della console)
  const journalGroup = new THREE.Group();
  journalGroup.position.set(-0.56, 0.068, 0.08);
  journalGroup.rotation.y = 0.18;

  const jCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.025, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x3d1c16, roughness: 0.78 })
  );
  journalGroup.add(jCover);
  const jPaper = new THREE.Mesh(
    new THREE.BoxGeometry(0.27, 0.032, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xd1c2a7, roughness: 0.86 })
  );
  jPaper.position.y = 0.006;
  journalGroup.add(jPaper);

  tagInteractive(journalGroup, {
    id: 'keeper_journal',
    label: 'Diario del Guardiano',
    isEnabled: () => !state.closeupId || state.closeupId === 'console',
    onClick: () => {
      openDocument({
        meta: 'TACCUINO DEL GUARDIANO // SOGLIA IV',
        title: 'Protocollo di Allineamento — Frammento III',
        html: `
          <p>«Se qualcuno scenderà fin qui dopo di me, dovrà ricomporre i tre vincoli prima di azionare la leva della Chiusa:»</p>
          <div class="code-callout">
            • Il Rombo ( ◇ ) precede sempre il Triangolo ( △ ), occupando una posizione più a sinistra.
          </div>
          <p><em>Nota a margine:</em> gli altri due frammenti si trovano nel <strong>Registro della Sala Valvole</strong> e all’interno della <strong>Cassetta d’Emergenza</strong> nell’Anticamera. La Chiave Maestra apre lo sportello dei rotori.</p>
          <p>«Oltre questa soglia il sentiero scende a Capo Bruma. — <em>A. Vane, Nov. 1964</em>»</p>
        `
      });
    }
  });
  slantRoot.add(journalGroup);

  // 3B. I 3 Rotori Simbolici al centro della console
  const rotorMeshes = [];
  const rotorKicks = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    const rx = -0.17 + i * 0.22;
    const rHolder = new THREE.Group();
    rHolder.position.set(rx, 0.062, -0.02);

    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.098, 0.024, 24),
      makeBrassMaterial(0xc49850)
    );
    rHolder.add(ring);

    const symTex = createSymbolDiskTexture(ROTOR_SYMBOLS[state.rotors[i]]);
    const bodyDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.084, 0.084, 0.03, 24),
      makeRustMaterial(0x1f1913, 0.5, 0.6)
    );
    const faceMat = new THREE.MeshStandardMaterial({
      map: symTex,
      emissive: new THREE.Color(0xc97b2c),
      emissiveMap: symTex,
      emissiveIntensity: 0.58,
      roughness: 0.3,
      metalness: 0.45
    });
    const faceCap = new THREE.Mesh(new THREE.CircleGeometry(0.082, 28), faceMat);
    faceCap.rotation.x = -Math.PI / 2;
    faceCap.position.y = 0.016;
    bodyDisk.add(faceCap);

    rHolder.add(bodyDisk);

    const posLabels = ['Sinistro (1°)', 'Centrale (2°)', 'Destro (3°)'];
    tagInteractive(rHolder, {
      id: `rotor_${i}`,
      get label() {
        return `Rotore ${posLabels[i]} · ${ROTOR_SYMBOLS[state.rotors[i]]}`;
      },
      isEnabled: () => state.closeupId === 'console' && state.consoleUnlocked && !state.vaultOpen,
      onClick: () => {
        state.rotors[i] = (state.rotors[i] + 1) % ROTOR_SYMBOLS.length;
        const newTex = createSymbolDiskTexture(ROTOR_SYMBOLS[state.rotors[i]]);
        faceCap.material.map = newTex;
        faceCap.material.emissiveMap = newTex;
        faceCap.material.needsUpdate = true;
        rotorKicks[i] = 0.65;
        sound.playDialTick(0.82 + i * 0.12);
      }
    });

    rotorMeshes.push({ group: bodyDisk, faceCap });
    slantRoot.add(rHolder);
  }

  // Sportello a serrandina in ottone e mogano sopra i 3 rotori
  const shutterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.042, 0.28),
    makeBrassMaterial(0xa87e42)
  );
  shutterMesh.position.set(0.05, 0.08, -0.02);

  tagInteractive(shutterMesh, {
    id: 'rotor_shutter',
    label: 'Sportello protettivo bloccato',
    isEnabled: () => state.closeupId === 'console' && !state.consoleUnlocked,
    onClick: () => {
      sound.playDialTick(0.6);
      whisper('Uno sportello d’ottone copre i tre rotori. Inserisci la Chiave Maestra nella serratura a destra.');
    }
  });
  slantRoot.add(shutterMesh);

  // 3C. Serratura d'Ottone + Chiave inserita (lato destro in alto)
  const lockGroup = new THREE.Group();
  lockGroup.position.set(0.56, 0.065, -0.14);

  const lockCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.058, 0.032, 18),
    makeBrassMaterial(0xc89b52)
  );
  lockGroup.add(lockCylinder);

  const keySlotLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.036, 0.048),
    new THREE.MeshBasicMaterial({ color: 0x0b0907 })
  );
  keySlotLine.userData.noHighlight = true;
  lockGroup.add(keySlotLine);

  const insertedKey = new THREE.Group();
  insertedKey.position.y = 0.05;
  insertedKey.visible = false;
  const kBrass = makeBrassMaterial(0xdfb05c);
  const kStem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.09, 8), kBrass);
  insertedKey.add(kStem);
  const kBow = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.009, 8, 18), kBrass);
  kBow.position.y = 0.065;
  insertedKey.add(kBow);
  lockGroup.add(insertedKey);

  const lockHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.18),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  lockHitbox.userData.noHighlight = true;
  lockGroup.add(lockHitbox);

  tagInteractive(lockGroup, {
    id: 'console_keyhole',
    get label() {
      return state.consoleUnlocked ? 'Chiave Maestra inserita' : 'Serratura d’ottone';
    },
    isEnabled: () => state.closeupId === 'console' && !state.consoleUnlocked,
    onClick: () => {
      if (state.armedItem === 'master_key') {
        consumeInventoryItem('master_key');
        state.consoleUnlocked = true;
        insertedKey.visible = true;
        sound.playMetalSnap();
        renderInventory();
        whisper('La Chiave Maestra scatta nel cilindro: lo sportello blindato si ritrae svelando i tre rotori.');
      } else {
        sound.playDialTick(0.62);
        whisper('Una serratura di sicurezza in ottone massiccio. Richiede la Chiave Maestra.');
      }
    }
  });
  slantRoot.add(lockGroup);

  // 3D. Leva di Sblocco Chiusa (lato destro in basso)
  const leverBase = new THREE.Group();
  leverBase.position.set(0.56, 0.062, 0.14);

  const lHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.04, 0.22),
    makeBrassMaterial(0x7c5f36)
  );
  leverBase.add(lHousing);

  const leverPivot = new THREE.Group();
  leverPivot.rotation.x = -0.52;
  const lRod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.18, 10), makeBrassMaterial(0xc89d54));
  lRod.position.y = 0.09;
  leverPivot.add(lRod);
  const lGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.11, 12),
    makeWoodMaterial('mahogany', 0x7c2d22, 0.35)
  );
  lGrip.rotation.z = Math.PI / 2;
  lGrip.position.y = 0.18;
  leverPivot.add(lGrip);
  leverBase.add(leverPivot);

  let leverBounce = 0;

  tagInteractive(leverBase, {
    id: 'vault_release_lever',
    get label() {
      return state.vaultOpen ? 'Chiusa sbloccata' : 'Leva di apertura Chiusa';
    },
    isEnabled: () => state.closeupId === 'console' && !state.vaultOpen,
    onClick: () => {
      if (!state.consoleUnlocked) {
        sound.playDialTick(0.55);
        whisper('La leva è bloccata meccanicamente finché la serratura sopra resta chiusa.');
        return;
      }

      const isSolved =
        state.rotors[0] === TARGET_ROTORS[0] &&
        state.rotors[1] === TARGET_ROTORS[1] &&
        state.rotors[2] === TARGET_ROTORS[2];

      if (!isSolved) {
        leverBounce = 0.48;
        sound.playDialTick(0.48);
        const cur = state.rotors.map((idx) => ROTOR_SYMBOLS[idx]).join(' · ');
        whisper(`Sequenza [ ${cur} ] respinta. Rileggi i tre frammenti del protocollo.`);
        return;
      }

      state.vaultOpen = true;
      sound.playVaultOpen();
      whisper('Sequenza [ ◇ · △ · ◯ ] verificata! I pistoni idraulici aprono la Soglia 0.');
      window.setTimeout(() => {
        if (state.closeupId === 'console') {
          actions.leaveCloseup();
        }
      }, 480);
    }
  });
  slantRoot.add(leverBase);

  consoleGroup.add(slantRoot);

  const consoleZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(1.68, 1.25, 0.92),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  consoleZoomProxy.position.set(0, 0.72, 0);
  consoleZoomProxy.userData.noHighlight = true;
  tagInteractive(consoleZoomProxy, {
    id: 'console_zoom',
    label: 'Console di Comando Principale',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.enterCloseup('console');
    }
  });
  consoleGroup.add(consoleZoomProxy);
  group.add(consoleGroup);

  // --- 4. PORTA BLINDATA IN MOGANO DI RITORNO -> ANTICAMERA (PARETE DESTRA) ---
  const exitBulkhead = new THREE.Group();
  exitBulkhead.position.set(3.68, 0, -1.85);
  exitBulkhead.rotation.y = -Math.PI / 2;

  const doorWood = makeWoodMaterial('walnut', 0x8f6f56, 0.42);
  const doorPanel = makeWoodMaterial('mahogany', 0x9c765d, 0.38);

  const ebFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.7, 0.15), doorWood);
  ebFrame.position.y = 1.35;
  exitBulkhead.add(ebFrame);

  const ebDoor = new THREE.Mesh(new THREE.BoxGeometry(1.28, 2.44, 0.1), doorPanel);
  ebDoor.position.set(0, 1.26, 0.05);
  exitBulkhead.add(ebDoor);

  for (const py of [0.66, 1.88]) {
    const molding = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.78, 0.028), doorWood);
    molding.position.set(0, py, 0.105);
    exitBulkhead.add(molding);
  }

  const ebHandle = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), credBrass);
  ebHandle.position.set(-0.46, 1.18, 0.14);
  exitBulkhead.add(ebHandle);

  const ebLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0x88f29d,
      emissive: new THREE.Color(0x3bd463),
      emissiveIntensity: 1.8
    })
  );
  ebLight.position.set(0, 2.58, 0.1);
  ebLight.userData.noHighlight = true;
  exitBulkhead.add(ebLight);

  tagInteractive(exitBulkhead, {
    id: 'back_from_control',
    kind: 'door',
    label: 'Anticamera Sommersa',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.goToRoom('vestibule');
    }
  });
  group.add(exitBulkhead);

  function syncFromState() {
    insertedKey.visible = state.consoleUnlocked;

    const desiredGlass = state.glassWiped ? cleanGlassTex : dirtyGlassTex;
    if (sootGlass.material.map !== desiredGlass) {
      sootGlass.material.map = desiredGlass;
      if (state.glassWiped) {
        sootGlass.userData.baseEmissive.setHex(0xd9842b);
        sootGlass.userData.baseEmissiveIntensity = 1.1;
      } else {
        sootGlass.userData.baseEmissive.setHex(0x000000);
        sootGlass.userData.baseEmissiveIntensity = 0;
      }
      sootGlass.material.emissive.copy(sootGlass.userData.baseEmissive);
      sootGlass.material.emissiveIntensity = sootGlass.userData.baseEmissiveIntensity;
      sootGlass.material.needsUpdate = true;
    }

    for (let i = 0; i < 3; i++) {
      const targetSymTex = createSymbolDiskTexture(ROTOR_SYMBOLS[state.rotors[i]]);
      const fMat = rotorMeshes[i].faceCap.material;
      if (fMat.map !== targetSymTex) {
        fMat.map = targetSymTex;
        fMat.emissiveMap = targetSymTex;
        fMat.needsUpdate = true;
      }
    }
  }

  let vaultProgress = 0;

  function update(dt, elapsed) {
    dust.rotation.y = elapsed * 0.018;
    crtScreen.userData.baseEmissiveIntensity = 0.88 + Math.sin(elapsed * 28) * 0.03;
    crtScreen.material.emissiveIntensity = crtScreen.userData.baseEmissiveIntensity;

    const targetKeyRot = state.consoleUnlocked ? Math.PI / 2 : 0;
    insertedKey.rotation.y += (targetKeyRot - insertedKey.rotation.y) * Math.min(1, dt * 8);

    const targetShutterZ = state.consoleUnlocked ? -0.32 : -0.02;
    const targetShutterScale = state.consoleUnlocked ? 0.08 : 1;
    shutterMesh.position.z += (targetShutterZ - shutterMesh.position.z) * Math.min(1, dt * 5.5);
    shutterMesh.scale.z += (targetShutterScale - shutterMesh.scale.z) * Math.min(1, dt * 5.5);
    shutterMesh.visible = shutterMesh.scale.z > 0.12;

    for (let i = 0; i < 3; i++) {
      rotorKicks[i] += (0 - rotorKicks[i]) * Math.min(1, dt * 12);
      rotorMeshes[i].group.rotation.y = rotorKicks[i];
    }

    if (leverBounce > 0) {
      leverBounce = Math.max(0, leverBounce - dt * 2.8);
    }
    const targetLeverRot = state.vaultOpen ? 0.58 : -0.52 + Math.sin(leverBounce * Math.PI) * 0.45;
    leverPivot.rotation.x += (targetLeverRot - leverPivot.rotation.x) * Math.min(1, dt * 10);

    const desiredVault = state.vaultOpen ? 1 : 0;
    vaultProgress += (desiredVault - vaultProgress) * Math.min(1, dt * 0.95);

    const lugPhase = Math.min(1, vaultProgress * 2.6);
    for (const lug of lugs) {
      lug.position.y = 1.08 - lugPhase * 0.28;
    }

    const rollPhase = Math.max(0, (vaultProgress - 0.22) / 0.78);
    const easedRoll = 1 - Math.pow(1 - rollPhase, 3);
    vaultDoor.position.x = -easedRoll * 2.15;
    centerWheel.rotation.z = easedRoll * Math.PI * 2.5;
    vaultDoor.rotation.z = easedRoll * 0.9;

    portalDisk.material.color.setHex(vaultProgress > 0.05 ? 0xdbeeff : 0x080b0e);
    portalDisk.userData.baseEmissive.setHex(0xc8e4ff);
    portalDisk.userData.baseEmissiveIntensity = vaultProgress * 2.4;
    portalDisk.material.emissive.copy(portalDisk.userData.baseEmissive);
    portalDisk.material.emissiveIntensity = portalDisk.userData.baseEmissiveIntensity;
    daylightSpot.intensity = vaultProgress * 18;

    syncFromState();
  }

  syncFromState();

  return {
    id: 'control',
    title: 'III · CAMERA DI CONTROLLO',
    group,
    defaultCamera: {
      pos: new THREE.Vector3(0, 1.84, 3.72),
      lookAt: new THREE.Vector3(0, 1.48, -2.5)
    },
    closeups: {
      soot: {
        pos: new THREE.Vector3(-2.25, 1.60, -2.27),
        lookAt: new THREE.Vector3(-3.68, 1.60, -2.27)
      },
      console: {
        pos: new THREE.Vector3(0, 1.86, 0.02),
        lookAt: new THREE.Vector3(0, 1.02, -0.98)
      }
    },
    update,
    syncFromState
  };
}
