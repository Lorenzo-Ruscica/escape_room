import * as THREE from 'three';
import {
  makeBrassMaterial,
  makePorcelainMaterial,
  makeRustMaterial,
  makeWoodMaterial,
  tagInteractive
} from './geometry.js';
import { createPottedPlant, disableRaycast } from './props.js';
import {
  buildConservatoryShell,
  createBotanicalCloche,
  createGlobeLantern,
  createTieredPlantRack
} from './props_coastal.js';
import {
  createDigitFaceTexture,
  createMistedPaneTexture,
  createPlaqueTexture
} from '../textures.js';
import {
  CABINET_TARGET,
  addInventoryItem,
  consumeInventoryItem,
  state
} from '../state.js';
import { sound } from '../audio.js';
import { openDocument, renderInventory, whisper } from '../ui.js';

export function buildGreenhouseRoom(actions) {
  const { group, dust, sageIron } = buildConservatoryShell({
    width: 7.6,
    height: 4.2,
    depth: 7.2,
    backCutouts: [[-2.68, -1.22], [1.18, 2.72]]
  });

  // Luce lunare azzurro-argento dal tetto vetrato + lanterne a globo calde
  const hemi = new THREE.HemisphereLight(0x7aa4b8, 0x1c2b26, 0.62);
  group.add(hemi);

  const lanternMain = createGlobeLantern({ color: 0xffd99e, intensity: 5.5 });
  lanternMain.root.position.set(0, 3.62, -0.75);
  group.add(lanternMain.root);

  const moonSpot = new THREE.SpotLight(0x8ec4de, 4.6, 10.5, Math.PI / 3.8, 0.6, 1.4);
  moonSpot.position.set(-1.2, 4.05, -0.35);
  moonSpot.target.position.set(0, 0, -1.05);
  moonSpot.castShadow = true;
  group.add(moonSpot);
  group.add(moonSpot.target);

  // --- ARREDI SCENOGRAFICI DELLA SERRA D'INVERNO ---
  const rackRight = createTieredPlantRack();
  rackRight.position.set(2.72, 0, 0.38);
  rackRight.rotation.y = -1.25;
  group.add(rackRight);

  const rackBackLeft = createTieredPlantRack();
  rackBackLeft.position.set(-3.12, 0, -2.55);
  rackBackLeft.rotation.y = 0.85;
  group.add(rackBackLeft);

  const palm1 = createPottedPlant({ scale: 1.28 });
  palm1.position.set(0.95, 0, -3.12);
  group.add(palm1);

  const palm2 = createPottedPlant({ scale: 1.22 });
  palm2.position.set(-0.98, 0, -3.12);
  group.add(palm2);

  const palm3 = createPottedPlant({ scale: 1.15 });
  palm3.position.set(3.25, 0, -3.05);
  group.add(palm3);

  // --- 1. TAVOLO DA INVASO BOTANICO + TACCUINO + CESOIE IN OTTONE (SINISTRA AVANTI) ---
  const pottingBench = new THREE.Group();
  pottingBench.position.set(-2.58, 0, 0.22);
  pottingBench.rotation.y = 0.35;

  const weatheredOak = makeWoodMaterial('oak', 0x998066, 0.52);
  const terracotta = new THREE.MeshStandardMaterial({ color: 0xb05d3c, roughness: 0.72 });
  const brass = makeBrassMaterial(0xd1a658);

  const benchStatic = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.055, 1.56), weatheredOak);
  top.position.y = 0.86;
  top.castShadow = true;
  top.receiveShadow = true;
  benchStatic.add(top);

  const lowerShelf = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.04, 1.42), weatheredOak);
  lowerShelf.position.y = 0.28;
  benchStatic.add(lowerShelf);

  for (const [lx, lz] of [[-0.4, -0.68], [0.4, -0.68], [-0.4, 0.68], [0.4, 0.68]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.86, 0.065), weatheredOak);
    leg.position.set(lx, 0.43, lz);
    leg.castShadow = true;
    benchStatic.add(leg);
  }

  // Campana di vetro (Cloche) luminosa + vasi di terracotta impilati + annaffiatoio in rame
  const cloche = createBotanicalCloche();
  cloche.position.set(-0.22, 0.888, -0.52);
  benchStatic.add(cloche);

  for (let p = 0; p < 3; p++) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.13, 12), terracotta);
    pot.position.set(-0.24, 0.36 + p * 0.09, 0.35);
    benchStatic.add(pot);
  }

  const wateringCan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.1, 0.2, 14),
    makeRustMaterial(0xa8603b, 0.36, 0.68)
  );
  wateringCan.position.set(0.18, 0.39, -0.36);
  benchStatic.add(wateringCan);

  disableRaycast(benchStatic);
  pottingBench.add(benchStatic);

  const benchLight = new THREE.PointLight(0xffe0a8, 1.9, 3.2, 1.85);
  benchLight.position.set(0.1, 1.32, 0);
  pottingBench.add(benchLight);

  // Taccuino Botanico di Aldo Vane
  const notesGroup = new THREE.Group();
  notesGroup.position.set(0.12, 0.902, -0.18);
  notesGroup.rotation.y = -0.24;
  const nCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.024, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x264436, roughness: 0.78 })
  );
  notesGroup.add(nCover);
  const nPages = new THREE.Mesh(
    new THREE.BoxGeometry(0.29, 0.03, 0.21),
    new THREE.MeshStandardMaterial({ color: 0xe2dac8, roughness: 0.88 })
  );
  nPages.position.y = 0.006;
  notesGroup.add(nPages);

  tagInteractive(notesGroup, {
    id: 'botany_notes',
    label: 'Diario della Serra',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      openDocument({
        meta: 'APPUNTI DI CAMPO // 14 NOVEMBRE 1964',
        title: 'Quaderno di Capo Bruma — A. Vane',
        html: `
          <p>«Ho lasciato la casa in città prima dell’alba. Nessuno cercherà oltre la chiusa dello studio, e ancor meno qui sulla scogliera.»</p>
          <p>«Per tenere al fresco il <strong>rivelatore fotografico</strong> l’ho immerso nella vasca della fontana centrale; i rovi selvatici ormai l’avranno avvolta, ma le cesoie sul banco basteranno.»</p>
          <div class="code-callout">
            • <strong>Nota per la Lanterna (Frammento I):</strong> i tre quadranti bussola devono indicare <em>tre punti cardinali diversi</em>. Non puntare mai a <strong>Nord ( N )</strong>: il fascio illuminerebbe la scogliera anziché il canale.
          </div>
        `
      });
    }
  });
  pottingBench.add(notesGroup);

  // Cesoie da potatura in ottone raccoglibili
  const shearsGroup = new THREE.Group();
  shearsGroup.position.set(0.16, 0.905, 0.34);
  shearsGroup.rotation.y = 0.52;

  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.012, 0.028), brass);
  blade1.rotation.y = 0.18;
  shearsGroup.add(blade1);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.012, 0.028), brass);
  blade2.rotation.y = -0.18;
  shearsGroup.add(blade2);

  for (const [hx, hz] of [[-0.14, 0.045], [-0.14, -0.045]]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.009, 8, 14), brass);
    loop.rotation.x = Math.PI / 2;
    loop.position.set(hx, 0.005, hz);
    shearsGroup.add(loop);
  }

  const shearsHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.14, 0.24),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  shearsHitbox.userData.noHighlight = true;
  shearsGroup.add(shearsHitbox);

  tagInteractive(shearsGroup, {
    id: 'shears_pickup',
    label: 'Cesoie da potatura',
    isEnabled: () => !state.closeupId && !state.hasShears,
    onClick: () => {
      state.hasShears = true;
      shearsGroup.visible = false;
      addInventoryItem('shears');
      sound.playPickup();
      renderInventory();
      whisper('Raccolte: Cesoie da potatura in ottone. Le lame sono ancora affilate.');
    }
  });
  pottingBench.add(shearsGroup);
  group.add(pottingBench);

  // --- 2. FONTANA OTTAGONALE IN MARMO + ROVI + FLACONE DI RIVELATORE (CENTRO) ---
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0, -1.05);
  const carraraMat = makePorcelainMaterial(0xd8d4ca);

  const fountainStatic = new THREE.Group();
  const fRim = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.84, 0.44, 8), carraraMat);
  fRim.position.y = 0.22;
  fRim.castShadow = true;
  fRim.receiveShadow = true;
  fountainStatic.add(fRim);

  const waterSurface = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.78, 0.04, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1d4d54,
      roughness: 0.08,
      metalness: 0.68,
      transparent: true,
      opacity: 0.86
    })
  );
  waterSurface.position.y = 0.39;
  fountainStatic.add(waterSurface);

  const centerCol = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.76, 12), carraraMat);
  centerCol.position.y = 0.42;
  centerCol.castShadow = true;
  fountainStatic.add(centerCol);

  const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.14, 0.14, 14), carraraMat);
  upperBowl.position.y = 0.82;
  fountainStatic.add(upperBowl);

  disableRaycast(fountainStatic);
  fountainGroup.add(fountainStatic);

  // Intreccio di rovi spinosi sopra la vasca (finché vinesCut === false)
  const vinesGroup = new THREE.Group();
  vinesGroup.position.y = 0.44;
  const vineMat = new THREE.MeshStandardMaterial({ color: 0x263f28, roughness: 0.68 });
  for (let i = 0; i < 7; i++) {
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.46 + (i % 3) * 0.12, 0.026, 8, 20),
      vineMat
    );
    coil.rotation.x = Math.PI / 2 + (i - 3) * 0.12;
    coil.rotation.y = i * 0.5;
    vinesGroup.add(coil);
  }
  const vinesHitbox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.86, 0.32, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  vinesHitbox.userData.noHighlight = true;
  vinesGroup.add(vinesHitbox);

  tagInteractive(vinesGroup, {
    id: 'thorny_vines',
    label: 'Rovi intrecciati sulla vasca',
    isEnabled: () => !state.closeupId && !state.vinesCut,
    onClick: () => {
      if (state.armedItem === 'shears') {
        consumeInventoryItem('shears');
        state.vinesCut = true;
        vinesGroup.visible = false;
        sound.playScrape();
        renderInventory();
        whisper('Recidi i rami spinosi: nell’acqua limpida della vasca affiora una bottiglia ambrata sigillata.');
      } else {
        sound.playDialTick(0.65);
        whisper('Rovi fitti e spinosi coprono l’acqua della fontana. Dentro brilla una bottiglia di vetro scuro.');
      }
    }
  });
  fountainGroup.add(vinesGroup);

  // Flacone di Rivelatore Argentico immerso nella vasca
  const bottleGroup = new THREE.Group();
  bottleGroup.position.set(0.32, 0.43, 0.24);
  bottleGroup.rotation.set(0.35, 0.4, 0.85);
  const amberMat = new THREE.MeshStandardMaterial({
    color: 0x9e521b,
    emissive: new THREE.Color(0x4a2208),
    emissiveIntensity: 0.45,
    roughness: 0.16,
    metalness: 0.2
  });
  const bBody = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.22, 14), amberMat);
  bottleGroup.add(bBody);
  const bNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.08, 12), amberMat);
  bNeck.position.y = 0.14;
  bottleGroup.add(bNeck);
  const bLabel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.09, 14, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.7 })
  );
  bottleGroup.add(bLabel);

  const bottleHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.36, 0.38),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  bottleHitbox.userData.noHighlight = true;
  bottleGroup.add(bottleHitbox);

  tagInteractive(bottleGroup, {
    id: 'developer_pickup',
    label: 'Rivelatore argentico',
    isEnabled: () => !state.closeupId && state.vinesCut && !state.hasDeveloper,
    onClick: () => {
      state.hasDeveloper = true;
      bottleGroup.visible = false;
      addInventoryItem('developer_bottle');
      sound.playPickup();
      renderInventory();
      whisper('Raccolto: Rivelatore argentico freddo, pronto per la vaschetta della Camera Oscura.');
    }
  });
  fountainGroup.add(bottleGroup);
  group.add(fountainGroup);

  // --- 3. VETRATA BAROMETRICA APPANNATA [ OND = 8 ] (PARETE SINISTRA) ---
  const mistGroup = new THREE.Group();
  mistGroup.position.set(-3.7, 1.65, -1.55);
  mistGroup.rotation.y = Math.PI / 2;

  const mistFrame = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 0.09), brass);
  mistGroup.add(mistFrame);

  const foggedTex = createMistedPaneTexture(false);
  const clearTex = createMistedPaneTexture(true);

  const mistPaneMat = new THREE.MeshStandardMaterial({
    map: foggedTex,
    emissive: new THREE.Color(0x3a7c96),
    emissiveMap: clearTex,
    emissiveIntensity: 0.25,
    roughness: 0.28
  });
  const mistPane = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.44), mistPaneMat);
  mistPane.position.z = 0.05;
  mistGroup.add(mistPane);

  const mistLight = new THREE.PointLight(0x9ad8f0, 1.2, 2.2, 2);
  mistLight.position.set(0, 0.05, 0.48);
  mistGroup.add(mistLight);

  tagInteractive(mistPane, {
    id: 'mist_pane_wipe',
    get label() {
      return state.paneWiped ? 'Scala barometrica OND : 8' : 'Asciugare condensa dal vetro';
    },
    isEnabled: () => state.closeupId === 'mist_pane',
    onClick: () => {
      if (!state.paneWiped) {
        state.paneWiped = true;
        sound.playScrape();
        whisper('Asciugando il velo di condensa salina appare nitida la tacca incisa sul vetro: OND = 8.');
      } else {
        whisper('La scala barometrica esterna segna stabilmente OND = 8.');
      }
    }
  });

  const mistZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.18),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  mistZoomProxy.userData.noHighlight = true;
  tagInteractive(mistZoomProxy, {
    id: 'mist_zoom',
    label: 'Quadrante barometrico appannato',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.enterCloseup('mist_pane');
    }
  });
  mistGroup.add(mistZoomProxy);
  group.add(mistGroup);

  // --- 4. ARMADIETTO ERBARIO CLIMATIZZATO [ LAS · MAR · OND ] (PARETE DESTRA) ---
  const cabGroup = new THREE.Group();
  cabGroup.position.set(3.7, 1.48, -1.55);
  cabGroup.rotation.y = -Math.PI / 2;

  const cabWood = makeWoodMaterial('walnut', 0x8a6d54, 0.42);
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.12), cabWood);
  cabBody.position.z = -0.02;
  cabGroup.add(cabBody);

  const cabInside = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x182924, roughness: 0.82 })
  );
  cabInside.position.z = 0.048;
  cabInside.userData.noHighlight = true;
  cabGroup.add(cabInside);

  const cabFill = new THREE.PointLight(0xffd296, 2.3, 2.6, 1.6);
  cabFill.position.set(0.1, 0.16, 0.62);
  cabGroup.add(cabFill);

  // Chiave della Lanterna + Targa Nautica interna
  const towerKeyGroup = new THREE.Group();
  towerKeyGroup.position.set(-0.08, -0.1, 0.09);
  towerKeyGroup.rotation.z = 0.18;
  const keyMat = makeBrassMaterial(0xe3b864);
  const kBow = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.013, 10, 20), keyMat);
  towerKeyGroup.add(kBow);
  const kStem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.16, 8), keyMat);
  kStem.rotation.z = Math.PI / 2;
  kStem.position.set(0.11, 0, 0);
  towerKeyGroup.add(kStem);
  const kBit = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.042, 0.014), keyMat);
  kBit.position.set(0.165, 0.022, 0);
  towerKeyGroup.add(kBit);

  const kHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.16, 0.09),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  kHit.position.set(0.06, 0, 0);
  kHit.userData.noHighlight = true;
  towerKeyGroup.add(kHit);

  tagInteractive(towerKeyGroup, {
    id: 'tower_key_pickup',
    label: 'Chiave della Lanterna',
    isEnabled: () => state.closeupId === 'cabinet' && state.cabinetOpen && !state.hasTowerKey,
    onClick: () => {
      state.hasTowerKey = true;
      towerKeyGroup.visible = false;
      addInventoryItem('tower_key');
      sound.playPickup();
      renderInventory();
      whisper('Raccolta: Chiave della Lanterna. Apre il portone in pietra verso la torre del faro.');
    }
  });
  cabGroup.add(towerKeyGroup);

  const cabPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.18, 0.015),
    new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('1° = O', 'FRAMMENTO II', false),
      roughness: 0.42,
      metalness: 0.76
    })
  );
  cabPlaque.position.set(0.08, 0.09, 0.07);
  tagInteractive(cabPlaque, {
    id: 'cabinet_plaque',
    label: 'Targhetta di rotta',
    isEnabled: () => state.closeupId === 'cabinet' && state.cabinetOpen,
    onClick: () => {
      openDocument({
        meta: 'PIASTRA NAUTICA // CAPO BRUMA',
        title: 'Allineamento Faro — Frammento II',
        html: `
          <p>Accanto al gancio della chiave della torre è fissata la seconda istruzione per i quadranti della Lanterna:</p>
          <div class="code-callout">
            • Il primo quadrante a sinistra (1°) deve puntare sempre a <strong>Ovest ( O )</strong>, verso la bocca del golfo.
          </div>
        `
      });
    }
  });
  cabGroup.add(cabPlaque);

  const cabDoorPivot = new THREE.Group();
  cabDoorPivot.position.set(-0.35, 0, 0.115);

  const cabDoor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.036), sageIron);
  cabDoor.position.set(0.35, 0, 0);
  cabDoorPivot.add(cabDoor);

  const cabHeader = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.12),
    new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('LAS · MAR · OND', '', false),
      roughness: 0.45,
      metalness: 0.72
    })
  );
  cabHeader.position.set(0.35, 0.16, 0.022);
  cabHeader.userData.noHighlight = true;
  cabDoorPivot.add(cabHeader);

  const drumMeshes = [];
  const drumKicks = [0, 0, 0];
  const drumNames = ['LAS', 'MAR', 'OND'];

  for (let i = 0; i < 3; i++) {
    const holder = new THREE.Group();
    holder.position.set(0.19 + i * 0.16, -0.05, 0.028);

    const dMat = new THREE.MeshStandardMaterial({
      map: createDigitFaceTexture(state.cabinetDigits[i]),
      roughness: 0.36,
      metalness: 0.72
    });
    const dMesh = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.155, 0.045), dMat);
    holder.add(dMesh);
    drumMeshes.push(dMesh);

    tagInteractive(holder, {
      id: `cab_drum_${i}`,
      label: `Tamburo ${drumNames[i]}`,
      isEnabled: () => state.closeupId === 'cabinet' && !state.cabinetOpen,
      onClick: () => {
        state.cabinetDigits[i] = (state.cabinetDigits[i] + 1) % 10;
        dMesh.material.map = createDigitFaceTexture(state.cabinetDigits[i]);
        dMesh.material.needsUpdate = true;
        drumKicks[i] = -0.55;
        sound.playDialTick(0.95 + i * 0.09);

        if (
          state.cabinetDigits[0] === CABINET_TARGET[0] &&
          state.cabinetDigits[1] === CABINET_TARGET[1] &&
          state.cabinetDigits[2] === CABINET_TARGET[2]
        ) {
          state.cabinetOpen = true;
          window.setTimeout(() => {
            sound.playMetalSnap();
            whisper('Codice 5 · 2 · 8 corretto! L’armadietto della serra si apre.');
          }, 180);
        }
      }
    });

    cabDoorPivot.add(holder);
  }
  cabGroup.add(cabDoorPivot);

  const cabZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.68, 0.28),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  cabZoomProxy.userData.noHighlight = true;
  tagInteractive(cabZoomProxy, {
    id: 'cabinet_zoom',
    label: 'Armadietto climatizzato [ LAS · MAR · OND ]',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.enterCloseup('cabinet');
    }
  });
  cabGroup.add(cabZoomProxy);
  group.add(cabGroup);

  // --- 5. PORTA VETRATA SCHERMATURA ROSSA -> CAMERA OSCURA (FONDO SINISTRA, APERTA) ---
  const darkroomDoor = new THREE.Group();
  darkroomDoor.position.set(-1.95, 0, -3.54);

  const rubyGlowPane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.38, 2.58),
    new THREE.MeshBasicMaterial({ color: 0x2a090b })
  );
  rubyGlowPane.position.set(0, 1.29, -0.01);
  rubyGlowPane.userData.noHighlight = true;
  darkroomDoor.add(rubyGlowPane);

  for (const sx of [-0.74, 0.74]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.74, 0.16), sageIron);
    post.position.set(sx, 1.37, 0.02);
    darkroomDoor.add(post);
  }
  const dLintel = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.16, 0.18), sageIron);
  dLintel.position.set(0, 2.68, 0.02);
  darkroomDoor.add(dLintel);

  const ajarLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 2.52, 0.07),
    makeWoodMaterial('walnut', 0x6b5646, 0.45)
  );
  ajarLeaf.position.set(-0.48, 1.28, 0.14);
  ajarLeaf.rotation.y = 0.36;
  darkroomDoor.add(ajarLeaf);

  // Spia rossa "CAMERA OSCURA" sopra l'architrave
  const safeLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.068, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xff4a4a,
      emissive: new THREE.Color(0xd91c1c),
      emissiveIntensity: 1.9
    })
  );
  safeLamp.position.set(0, 2.68, 0.12);
  safeLamp.userData.noHighlight = true;
  darkroomDoor.add(safeLamp);

  tagInteractive(darkroomDoor, {
    id: 'to_darkroom',
    kind: 'door',
    label: 'Camera Oscura',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.goToRoom('darkroom');
    }
  });
  group.add(darkroomDoor);

  // --- 6. PORTONE COSTIERO -> LANTERNA DEL FARO (FONDO DESTRA, CHIUSO A CHIAVE) ---
  const towerDoor = new THREE.Group();
  towerDoor.position.set(1.95, 0, -3.54);
  const stoneFrameMat = makePorcelainMaterial(0x7c827e);
  const heavyTeak = makeWoodMaterial('oak', 0x7c6048, 0.48);

  const tFrame = new THREE.Mesh(new THREE.BoxGeometry(1.68, 2.76, 0.16), stoneFrameMat);
  tFrame.position.set(0, 1.38, 0);
  towerDoor.add(tFrame);

  const tLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.52, 0.11), heavyTeak);
  tLeaf.position.set(0, 1.29, 0.05);
  towerDoor.add(tLeaf);

  const lockEscutcheon = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), brass);
  lockEscutcheon.rotation.x = Math.PI / 2;
  lockEscutcheon.position.set(-0.46, 1.24, 0.11);
  towerDoor.add(lockEscutcheon);

  const towerStatusBulbMat = new THREE.MeshStandardMaterial({
    color: 0x452015,
    emissive: new THREE.Color(0x361108),
    emissiveIntensity: 0.7
  });
  const towerStatusBulb = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), towerStatusBulbMat);
  towerStatusBulb.position.set(0, 2.66, 0.12);
  towerStatusBulb.userData.noHighlight = true;
  towerDoor.add(towerStatusBulb);

  tagInteractive(towerDoor, {
    id: 'to_lighthouse',
    get kind() {
      return state.towerUnlocked ? 'door' : 'mechanism';
    },
    get label() {
      return state.towerUnlocked ? 'Lanterna del Faro' : 'Portone della Torre chiuso a chiave';
    },
    isEnabled: () => !state.closeupId,
    onClick: () => {
      if (!state.towerUnlocked) {
        if (state.armedItem === 'tower_key') {
          consumeInventoryItem('tower_key');
          state.towerUnlocked = true;
          sound.playMetalSnap();
          renderInventory();
          whisper('La Chiave della Lanterna gira nella serratura marina: l’accesso alla Torre del Faro è aperto.');
        } else {
          sound.playDialTick(0.6);
          whisper('Il portone che sale alla Lanterna del Faro è chiuso a chiave. Serve la Chiave della Lanterna.');
        }
        return;
      }
      actions.goToRoom('lighthouse');
    }
  });
  group.add(towerDoor);

  function syncFromState() {
    shearsGroup.visible = !state.hasShears;
    vinesGroup.visible = !state.vinesCut;
    bottleGroup.visible = state.vinesCut && !state.hasDeveloper;
    towerKeyGroup.visible = state.cabinetOpen && !state.hasTowerKey;
    cabPlaque.visible = state.cabinetOpen;

    const targetPaneTex = state.paneWiped ? clearTex : foggedTex;
    if (mistPane.material.map !== targetPaneTex) {
      mistPane.material.map = targetPaneTex;
      mistPane.userData.baseEmissiveIntensity = state.paneWiped ? 0.52 : 0.2;
      mistPane.material.emissiveIntensity = mistPane.userData.baseEmissiveIntensity;
      mistPane.material.needsUpdate = true;
    }

    for (let i = 0; i < 3; i++) {
      const dTex = createDigitFaceTexture(state.cabinetDigits[i]);
      if (drumMeshes[i].material.map !== dTex) {
        drumMeshes[i].material.map = dTex;
        drumMeshes[i].material.needsUpdate = true;
      }
    }

    if (state.towerUnlocked) {
      towerStatusBulbMat.color.setHex(0x88f29d);
      towerStatusBulbMat.emissive.setHex(0x3bd463);
      towerStatusBulbMat.emissiveIntensity = 1.9;
    } else {
      towerStatusBulbMat.color.setHex(0x452015);
      towerStatusBulbMat.emissive.setHex(0x361108);
      towerStatusBulbMat.emissiveIntensity = 0.7;
    }
  }

  function update(dt, elapsed) {
    lanternMain.root.rotation.z = Math.sin(elapsed * 0.8) * 0.015;
    dust.rotation.y = elapsed * 0.014;

    const targetCabRot = state.cabinetOpen ? -1.92 : 0;
    cabDoorPivot.rotation.y += (targetCabRot - cabDoorPivot.rotation.y) * Math.min(1, dt * 5.5);

    for (let i = 0; i < 3; i++) {
      drumKicks[i] += (0 - drumKicks[i]) * Math.min(1, dt * 14);
      drumMeshes[i].rotation.x = drumKicks[i];
    }

    syncFromState();
  }

  syncFromState();

  return {
    id: 'greenhouse',
    title: 'I · SERRA D’INVERNO',
    group,
    defaultCamera: {
      pos: new THREE.Vector3(0, 1.82, 3.72),
      lookAt: new THREE.Vector3(0, 1.45, -2.5)
    },
    closeups: {
      mist_pane: {
        pos: new THREE.Vector3(-2.22, 1.65, -1.55),
        lookAt: new THREE.Vector3(-3.7, 1.65, -1.55)
      },
      cabinet: {
        pos: new THREE.Vector3(2.18, 1.48, -1.55),
        lookAt: new THREE.Vector3(3.7, 1.47, -1.55)
      }
    },
    update,
    syncFromState
  };
}
