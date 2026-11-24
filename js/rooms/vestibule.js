import * as THREE from 'three';
import {
  buildRoomShell,
  createCageLamp,
  makeBrassMaterial,
  makeFabricMaterial,
  makeRustMaterial,
  makeWoodMaterial,
  tagInteractive
} from './geometry.js';
import {
  createCoatStand,
  createConsoleCredenza,
  createDrapedWindow,
  createFramedPainting,
  createGrandfatherClock,
  createPersianRug,
  createPottedPlant,
  createSideTableWithLamp,
  createTuftedArmchair,
  createWallSconce,
  disableRaycast
} from './props.js';
import {
  createDigitFaceTexture,
  createPlaqueTexture
} from '../textures.js';
import {
  SAFE_TARGET,
  addInventoryItem,
  consumeInventoryItem,
  state
} from '../state.js';
import { sound } from '../audio.js';
import { openDocument, renderInventory, whisper } from '../ui.js';

export function buildVestibuleRoom(actions) {
  const { group, dust } = buildRoomShell({
    width: 7.6,
    height: 4.2,
    depth: 7.2,
    theme: 'emerald',
    wallTint: 0xdcd4c6,
    backCutouts: [[-2.68, -1.22], [1.18, 2.72]]
  });

  // Grande tappeto persiano cremisi e oro al centro del salone d'ingresso
  const mainRug = createPersianRug({ width: 4.5, depth: 3.5, palette: 'crimson' });
  mainRug.position.set(0, 0, -0.85);
  group.add(mainRug);

  // Illuminazione chiaroscurale calda da dimora signorile + taglio lunare dalla finestra
  const hemi = new THREE.HemisphereLight(0x556472, 0x241811, 0.46);
  group.add(hemi);

  const chandelier = createCageLamp({ color: 0xe39448, intensity: 6.2, distance: 11.2 });
  chandelier.root.position.set(-0.1, 3.6, -0.75);
  group.add(chandelier.root);

  const backFill = new THREE.PointLight(0x8c7762, 1.15, 7.8, 1.7);
  backFill.position.set(0.0, 2.3, -2.15);
  group.add(backFill);

  // Alta finestra all'inglese con tendaggi di velluto sulla parete sinistra + lama di luce lunare
  const hallWindow = createDrapedWindow({ width: 1.28, height: 2.05, curtainHex: '#47181d' });
  hallWindow.position.set(-3.73, 2.28, -0.35);
  hallWindow.rotation.y = Math.PI / 2;
  group.add(hallWindow);

  const coldSpot = new THREE.SpotLight(0x7ca2c4, 5.2, 8.5, Math.PI / 5.2, 0.65, 1.45);
  coldSpot.position.set(-3.25, 3.15, -0.45);
  coldSpot.target.position.set(-2.45, 0.45, -0.55);
  coldSpot.castShadow = true;
  group.add(coldSpot);
  group.add(coldSpot.target);

  // --- ARREDI SCENOGRAFICI DELL'INGRESSO NOBILE ---
  // Credenza intagliata al centro della parete di fondo (con candelabro acceso, busto in marmo e tomi)
  const centerCredenza = createConsoleCredenza({ width: 1.44, height: 0.86, depth: 0.44 });
  centerCredenza.position.set(0, 0, -3.28);
  group.add(centerCredenza);

  // Quadro a olio incorniciato sopra la credenza (sotto la targa α)
  const centerPainting = createFramedPainting({ width: 0.88, height: 0.62, variant: 1, withLight: false });
  centerPainting.position.set(0, 1.58, -3.55);
  group.add(centerPainting);

  // Coppia di applique in ottone e vetro ambrato ai lati della parete di fondo
  for (const sx of [-0.98, 0.98]) {
    const sconce = createWallSconce({ color: 0xe69a4c, intensity: 1.5 });
    sconce.position.set(sx, 2.34, -3.56);
    group.add(sconce);
  }

  // Pendola a colonna con pendolo oscillante nell'angolo sinistro di fondo
  const grandfatherClock = createGrandfatherClock();
  grandfatherClock.root.position.set(-3.36, 0, -3.12);
  grandfatherClock.root.rotation.y = 0.62;
  group.add(grandfatherClock.root);

  // Appendiabiti in legno curvato con cilindro, soprabito e portaombrelli d'ottone (avanti a sinistra, ben inquadrato)
  const coatStand = createCoatStand();
  coatStand.position.set(-3.18, 0, 0.42);
  coatStand.rotation.y = 0.55;
  group.add(coatStand);

  // Angolo lettura signorile avanti a destra: poltrona bergère capitonné + tavolino con lampada Tiffany e tazza da tè
  const parlorChair = createTuftedArmchair({ hex: '#541b1e' });
  parlorChair.position.set(2.58, 0, 0.42);
  parlorChair.rotation.y = -2.28;
  group.add(parlorChair);

  const lampTable = createSideTableWithLamp({ lampColor: 0xe89948, shadeTint: 0xd47d32 });
  lampTable.position.set(3.16, 0, -0.22);
  group.add(lampTable);

  // Pianta ornamentale rigogliosa nell'angolo posteriore destro
  const cornerPlant = createPottedPlant({ scale: 1.08 });
  cornerPlant.position.set(3.26, 0, -3.14);
  group.add(cornerPlant);

  // Galleria di dipinti a olio sulle pareti laterali
  const leftPainting = createFramedPainting({ width: 0.98, height: 0.74, variant: 0, withLight: true });
  leftPainting.position.set(-3.75, 2.76, -2.35);
  leftPainting.rotation.y = Math.PI / 2;
  group.add(leftPainting);

  const rightPaintingBack = createFramedPainting({ width: 1.08, height: 0.76, variant: 3, withLight: false });
  rightPaintingBack.position.set(3.75, 2.66, -1.65);
  rightPaintingBack.rotation.y = -Math.PI / 2;
  group.add(rightPaintingBack);

  const rightPaintingFront = createFramedPainting({ width: 0.92, height: 0.72, variant: 4, withLight: true });
  rightPaintingFront.position.set(3.75, 2.38, 0.52);
  rightPaintingFront.rotation.y = -Math.PI / 2;
  group.add(rightPaintingFront);

  // --- 1. CASSAPANCA IMBOTTITA + LEVA D'ACCIAIO ---
  const benchGroup = new THREE.Group();
  benchGroup.position.set(-2.55, 0, -0.55);
  const benchWood = makeWoodMaterial('walnut', 0x947359, 0.42);
  const benchVelvet = makeFabricMaterial('#233a33', 0xffffff, 0.78);
  const benchBrass = makeBrassMaterial(0xc49a52);

  const benchFrame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 1.58), benchWood);
  benchFrame.position.y = 0.42;
  benchFrame.castShadow = true;
  benchFrame.receiveShadow = true;
  benchGroup.add(benchFrame);

  const benchCushion = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.065, 1.5), benchVelvet);
  benchCushion.position.y = 0.485;
  benchCushion.castShadow = true;
  benchCushion.receiveShadow = true;
  benchGroup.add(benchCushion);

  // Cuscino cilindrico decorativo a un capo della panca (lontano dalla leva)
  const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.64, 14), benchVelvet);
  bolster.rotation.z = Math.PI / 2;
  bolster.position.set(0, 0.57, -0.58);
  benchGroup.add(bolster);

  for (const [lx, lz] of [[-0.31, -0.68], [0.31, -0.68], [-0.31, 0.68], [0.31, 0.68]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.024, 0.4, 10), benchWood);
    leg.position.set(lx, 0.2, lz);
    leg.castShadow = true;
    benchGroup.add(leg);

    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.05, 10), benchBrass);
    ferrule.position.set(lx, 0.025, lz);
    benchGroup.add(ferrule);
  }
  disableRaycast(benchGroup);
  group.add(benchGroup);

  // Leva d'acciaio raccoglibile (posata sul velluto della panca)
  const prybarGroup = new THREE.Group();
  prybarGroup.position.set(-2.45, 0.545, -0.42);
  prybarGroup.rotation.set(0, 0.42, 0);
  const ironBarMat = new THREE.MeshStandardMaterial({
    color: 0xa4acb5,
    roughness: 0.3,
    metalness: 0.88
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.72, 8), ironBarMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.castShadow = true;
  prybarGroup.add(shaft);

  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.02, 8, 14, Math.PI * 0.85),
    ironBarMat
  );
  hook.position.set(0.36, 0.04, 0);
  hook.rotation.z = -Math.PI / 3;
  prybarGroup.add(hook);

  const prybarHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.16, 0.24),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  prybarHitbox.userData.noHighlight = true;
  prybarGroup.add(prybarHitbox);

  tagInteractive(prybarGroup, {
    id: 'prybar_pickup',
    label: 'Leva d’acciaio',
    isEnabled: () => !state.hasPrybar && !state.closeupId,
    onClick: () => {
      state.hasPrybar = true;
      prybarGroup.visible = false;
      addInventoryItem('prybar');
      sound.playPickup();
      renderInventory();
      whisper('Raccolta: Leva d’acciaio. Pesante, ma l’unghia metallica è ancora integra.');
    }
  });
  group.add(prybarGroup);

  // --- 2. TUBAZIONI TERMICHE IN OTTONE E TARGHETTA (PARETE SINISTRA, LATO FONDO) ---
  const pipesGroup = new THREE.Group();
  pipesGroup.position.set(-3.7, 1.82, -2.32);
  const brassPipeMat = makeBrassMaterial(0xc49a4e);
  const leadPipeMat = makeRustMaterial(0x5c646e, 0.48, 0.72);

  const pipeII = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 2.35, 14), brassPipeMat);
  pipeII.rotation.x = Math.PI / 2;
  pipeII.position.set(0.06, 0.14, 0);
  pipesGroup.add(pipeII);

  const pipeIII = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.35, 14), leadPipeMat);
  pipeIII.rotation.x = Math.PI / 2;
  pipeIII.position.set(0.06, -0.11, 0);
  pipesGroup.add(pipeIII);

  // Collari fermatubo in ottone sulla parete
  for (const bz of [-0.95, 0.95]) {
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.06), brassPipeMat);
    clamp.position.set(0.04, 0.02, bz);
    pipesGroup.add(clamp);
  }

  // Targhetta d'ottone appesa ai tubi
  const pipeTagGroup = new THREE.Group();
  pipeTagGroup.position.set(0.11, 0.02, 0.28);
  pipeTagGroup.rotation.y = Math.PI / 2;
  const tagPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.34, 0.025),
    new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('II · III', 'SPECIFICA BAR', false),
      roughness: 0.4,
      metalness: 0.75
    })
  );
  pipeTagGroup.add(tagPlate);

  tagInteractive(pipeTagGroup, {
    id: 'pipe_plaque',
    label: 'Targhetta tubazioni',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      openDocument({
        meta: 'TARGHETTA PUNZONATA // LINEA OVEST',
        title: 'Condotte Secondarie Caldaia',
        html: `
          <p>Piastra di collaudo fissata sulle due tubazioni che attraversano il muro verso la Sala delle Valvole:</p>
          <div class="code-callout">
            • CONDOTTA II (Ottone) : +4 BAR<br>
            • CONDOTTA III (Piombo, sfiato) : -3 BAR
          </div>
          <p>I valori delle condotte primarie I e IV sono annotati nel registro di macchina accanto alla caldaia.</p>
        `
      });
    }
  });
  pipesGroup.add(pipeTagGroup);
  group.add(pipesGroup);

  // --- 3. CANCELLO IN FERRO BATTUTO E NOCE -> SALA DELLE VALVOLE (PARETE DI FONDO SX) ---
  const grateFrame = new THREE.Group();
  grateFrame.position.set(-1.95, 0, -3.55);
  const doorWood = makeWoodMaterial('walnut', 0x8f6f56, 0.42);
  const wroughtIron = makeRustMaterial(0x3a3533, 0.48, 0.68);
  const giltBrass = makeBrassMaterial(0xc89d54);

  const darkVoid = new THREE.Mesh(
    new THREE.PlaneGeometry(1.42, 2.62),
    new THREE.MeshBasicMaterial({ color: 0x1a110c })
  );
  darkVoid.position.set(0, 1.31, -0.02);
  darkVoid.userData.noHighlight = true;
  grateFrame.add(darkVoid);

  // Stipiti e mostra modanata in noce
  for (const sx of [-0.75, 0.75]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.76, 0.16), doorWood);
    post.position.set(sx, 1.38, 0.02);
    grateFrame.add(post);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.18, 0.2), doorWood);
  lintel.position.set(0, 2.71, 0.03);
  grateFrame.add(lintel);

  // Anta in ferro battuto lavorato con anelli ornamentali
  const gratePivot = new THREE.Group();
  gratePivot.position.set(-0.7, 0, 0.04);
  for (let i = 0; i <= 6; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.58, 8), wroughtIron);
    bar.position.set(0.1 + i * 0.2, 1.3, 0);
    gratePivot.add(bar);
  }
  for (const by of [0.35, 1.32, 2.35]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.055, 0.05), wroughtIron);
    cross.position.set(0.7, by, 0);
    gratePivot.add(cross);
  }
  for (let r = 0; r < 3; r++) {
    const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 16), giltBrass);
    scroll.position.set(0.3 + r * 0.4, 1.85, 0);
    gratePivot.add(scroll);
  }

  // Catena pesante e lucchetto d'ottone
  const chainGroup = new THREE.Group();
  const chainMat = makeRustMaterial(0x8c5a3c, 0.48, 0.62);
  const chainBar = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.92, 8), chainMat);
  chainBar.rotation.z = 1.15;
  chainBar.position.set(1.18, 1.32, 0.05);
  chainGroup.add(chainBar);
  const padlock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.17, 0.08), makeBrassMaterial(0xd4a253));
  padlock.position.set(1.26, 1.22, 0.08);
  chainGroup.add(padlock);
  gratePivot.add(chainGroup);

  grateFrame.add(gratePivot);

  tagInteractive(grateFrame, {
    id: 'grate_door',
    get kind() {
      return state.grateUnlocked ? 'door' : 'mechanism';
    },
    get label() {
      return state.grateUnlocked ? 'Sala delle Valvole' : 'Grata incatenata';
    },
    isEnabled: () => !state.closeupId,
    onClick: () => {
      if (!state.grateUnlocked) {
        if (state.armedItem === 'prybar') {
          consumeInventoryItem('prybar');
          state.grateUnlocked = true;
          chainGroup.visible = false;
          sound.playMetalSnap();
          renderInventory();
          whisper('La catena cede con uno schianto secco. Il varco per la Sala delle Valvole è libero.');
        } else {
          sound.playDialTick(0.7);
          whisper('Una catena tiene serrata la grata in ferro battuto. Serve una leva metallica per spezzarla.');
        }
        return;
      }
      actions.goToRoom('boiler');
    }
  });
  group.add(grateFrame);

  // --- 4. TARGA D'EMERGENZA CENTRALE [ α : 4 ] ---
  const alphaGroup = new THREE.Group();
  alphaGroup.position.set(0.0, 2.38, -3.55);

  const sconceHood = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.16, 14, 1, true),
    giltBrass
  );
  sconceHood.position.set(0, 0.34, 0.08);
  alphaGroup.add(sconceHood);

  const alphaLight = new THREE.PointLight(0xff9d3b, 0, 3.4, 2);
  alphaLight.position.set(0, 0.25, 0.16);
  alphaGroup.add(alphaLight);

  const darkAlphaTex = createPlaqueTexture('· · ·', 'SETTORE I', false);
  const litAlphaTex = createPlaqueTexture('α : 4', 'SETTORE I', true);

  const alphaBacking = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.46, 0.025), doorWood);
  alphaBacking.position.set(0, 0, 0.01);
  alphaGroup.add(alphaBacking);

  const alphaPlateMat = new THREE.MeshStandardMaterial({
    map: darkAlphaTex,
    color: 0x3b352f,
    emissive: new THREE.Color(0x000000),
    roughness: 0.48,
    metalness: 0.68
  });
  const alphaPlate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.03), alphaPlateMat);
  alphaPlate.position.set(0, 0, 0.028);
  alphaGroup.add(alphaPlate);

  tagInteractive(alphaGroup, {
    id: 'alpha_plaque',
    label: 'Targa d’emergenza',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      if (!state.powerOn) {
        whisper('Una targa punzonata sotto un faretto d’emergenza spento. È troppo buio per leggerla.');
      } else {
        whisper('Sotto la luce d’emergenza si distingue chiaramente il codice inciso: α = 4.');
      }
    }
  });
  group.add(alphaGroup);

  // --- 5. PORTA BLINDATA IN MOGANO E OTTONE -> CAMERA DI CONTROLLO (PARETE DI FONDO DX) ---
  const bulkheadGroup = new THREE.Group();
  bulkheadGroup.position.set(1.95, 0, -3.54);
  const mahoganyDoorMat = makeWoodMaterial('mahogany', 0x9c765d, 0.38);

  const bFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.78, 0.16), doorWood);
  bFrame.position.set(0, 1.39, 0);
  bulkheadGroup.add(bFrame);

  const bDoor = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.52, 0.11), mahoganyDoorMat);
  bDoor.position.set(0, 1.3, 0.05);
  bulkheadGroup.add(bDoor);

  // Bugnature classiche e borchie in ottone sulla porta
  for (const py of [0.68, 1.92]) {
    const molding = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.82, 0.03), doorWood);
    molding.position.set(0, py, 0.11);
    bulkheadGroup.add(molding);
  }

  const magBolt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.09), giltBrass);
  magBolt.position.set(-0.48, 1.32, 0.13);
  bulkheadGroup.add(magBolt);

  const statusBulbMat = new THREE.MeshStandardMaterial({
    color: 0x451212,
    emissive: new THREE.Color(0x3b0808),
    emissiveIntensity: 0.7,
    roughness: 0.25
  });
  const statusBulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), statusBulbMat);
  statusBulb.position.set(0, 2.66, 0.12);
  statusBulb.userData.noHighlight = true;
  bulkheadGroup.add(statusBulb);

  tagInteractive(bulkheadGroup, {
    id: 'control_door',
    get kind() {
      return state.powerOn ? 'door' : 'mechanism';
    },
    get label() {
      return state.powerOn ? 'Camera di Controllo' : 'Porta stagna bloccata';
    },
    isEnabled: () => !state.closeupId,
    onClick: () => {
      if (!state.powerOn) {
        sound.playDialTick(0.55);
        whisper('L’elettromagnete della porta blindata è senza corrente. Controlla il quadro elettrico a destra.');
        return;
      }
      actions.goToRoom('control');
    }
  });
  group.add(bulkheadGroup);

  // --- 6. QUADRO ELETTRICO D'EPOCA IN NOCE E OTTONE (PARETE DESTRA, IN FONDO) ---
  const fuseboxGroup = new THREE.Group();
  fuseboxGroup.position.set(3.70, 1.62, -2.25);
  fuseboxGroup.rotation.y = -Math.PI / 2;

  const boxCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.88, 0.16),
    doorWood
  );
  fuseboxGroup.add(boxCabinet);

  const boxInterior = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.76),
    new THREE.MeshStandardMaterial({ color: 0x26201b, roughness: 0.8 })
  );
  boxInterior.position.z = 0.082;
  boxInterior.userData.noHighlight = true;
  fuseboxGroup.add(boxInterior);

  const fuseboxFill = new THREE.PointLight(0xe5a86b, 2.1, 2.6, 1.8);
  fuseboxFill.position.set(0, 0.08, 0.62);
  fuseboxGroup.add(fuseboxFill);

  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xe2dbd0, roughness: 0.3, metalness: 0.08 });
  const clipMat = makeBrassMaterial(0xc4904c);

  function makeFuseAssembly() {
    const f = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.18, 14), ceramicMat);
    f.add(body);
    for (const cy of [-0.08, 0.08]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 14), clipMat);
      cap.position.y = cy;
      f.add(cap);
    }
    return f;
  }

  const fixedFuse = makeFuseAssembly();
  fixedFuse.position.set(-0.14, 0.18, 0.11);
  fuseboxGroup.add(fixedFuse);

  const fuseSlotGroup = new THREE.Group();
  fuseSlotGroup.position.set(0.14, 0.18, 0.11);
  const slotBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.26, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x241e19, roughness: 0.8 })
  );
  slotBack.position.z = -0.015;
  fuseSlotGroup.add(slotBack);

  for (const cy of [-0.09, 0.09]) {
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.03, 0.05), clipMat);
    clip.position.y = cy;
    fuseSlotGroup.add(clip);
  }

  const insertedFuseMesh = makeFuseAssembly();
  insertedFuseMesh.visible = false;
  fuseSlotGroup.add(insertedFuseMesh);

  tagInteractive(fuseSlotGroup, {
    id: 'fuse_slot',
    get label() {
      return state.fuseInserted ? 'Fusibile installato' : 'Morsetto fusibile vuoto';
    },
    isEnabled: () => state.closeupId === 'fusebox',
    onClick: () => {
      if (state.fuseInserted) {
        whisper('Il fusibile ceramico è ben saldo nei morsetti. Aziona la leva sottostante.');
        return;
      }
      if (state.armedItem === 'fuse') {
        consumeInventoryItem('fuse');
        state.fuseInserted = true;
        insertedFuseMesh.visible = true;
        sound.playDialTick(0.9);
        renderInventory();
        whisper('Fusibile ceramico inserito. Il circuito primario ora è completo.');
      } else {
        sound.playDialTick(0.6);
        whisper('Manca un fusibile ceramico ad alta tensione in questo alloggiamento.');
      }
    }
  });
  fuseboxGroup.add(fuseSlotGroup);

  const switchBase = new THREE.Group();
  switchBase.position.set(0, -0.17, 0.1);
  const sPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.03), makeBrassMaterial(0x7c5d38));
  switchBase.add(sPlate);

  const knifePivot = new THREE.Group();
  knifePivot.position.set(0, -0.04, 0.02);
  knifePivot.rotation.x = -0.75;

  for (const bx of [-0.08, 0.08]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), clipMat);
    blade.position.set(bx, 0.08, 0);
    knifePivot.add(blade);
  }
  const handleBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: 0x7c2a1e, roughness: 0.36 })
  );
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 0.17, 0.02);
  knifePivot.add(handleBar);
  switchBase.add(knifePivot);

  const sparkLight = new THREE.PointLight(0xffb866, 0, 4.5, 2);
  sparkLight.position.set(0, 0, 0.25);
  switchBase.add(sparkLight);

  tagInteractive(switchBase, {
    id: 'knife_switch',
    get label() {
      return state.powerOn ? 'Alimentazione attiva' : 'Leva generale';
    },
    isEnabled: () => state.closeupId === 'fusebox',
    onClick: () => {
      if (state.powerOn) {
        whisper('La linea principale è già sotto tensione.');
        return;
      }
      if (!state.fuseInserted) {
        sound.playDialTick(0.55);
        whisper('La leva scatta a vuoto: il secondo portafusibile sopra è vuoto.');
        return;
      }
      state.powerOn = true;
      sparkFlash = 1.0;
      sound.playSwitchSpark();
      whisper('Scintilla nei contatti: corrente ripristinata! La porta stagna e le luci d’emergenza sono attive.');
    }
  });
  fuseboxGroup.add(switchBase);

  const coverPivot = new THREE.Group();
  coverPivot.position.set(-0.34, 0, 0.085);
  const coverDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.86, 0.03),
    mahoganyDoorMat
  );
  coverDoor.position.set(0.34, 0, 0);
  coverPivot.add(coverDoor);

  const coverTrim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.72, 0.036), giltBrass);
  coverTrim.position.set(0.34, 0, 0);
  coverPivot.add(coverTrim);
  const coverInset = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.66, 0.04), mahoganyDoorMat);
  coverInset.position.set(0.34, 0, 0);
  coverPivot.add(coverInset);
  fuseboxGroup.add(coverPivot);

  const fuseboxZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.94, 0.24),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  fuseboxZoomProxy.userData.noHighlight = true;
  tagInteractive(fuseboxZoomProxy, {
    id: 'fusebox_zoom',
    label: 'Quadro elettrico',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      if (!state.fuseboxOpen) {
        state.fuseboxOpen = true;
        sound.playDoorTransition();
      }
      actions.enterCloseup('fusebox');
    }
  });
  fuseboxGroup.add(fuseboxZoomProxy);
  group.add(fuseboxGroup);

  // --- 7. CASSAFORTE A MURO INCORNICIATA [ α · β · γ ] (PARETE DESTRA, CENTRO) ---
  const safeGroup = new THREE.Group();
  safeGroup.position.set(3.70, 1.42, -1.05);
  safeGroup.rotation.y = -Math.PI / 2;

  const safeWoodSurround = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.68, 0.14), doorWood);
  safeWoodSurround.position.z = -0.04;
  safeGroup.add(safeWoodSurround);

  const safeBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.56, 0.22),
    makeRustMaterial(0x4b525c, 0.46, 0.64)
  );
  safeGroup.add(safeBody);

  const safeCavity = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.46),
    makeFabricMaterial('#381417', 0xffffff, 0.85)
  );
  safeCavity.position.z = 0.055;
  safeCavity.userData.noHighlight = true;
  safeGroup.add(safeCavity);

  const safeFill = new THREE.PointLight(0xebb06e, 2.4, 2.6, 1.6);
  safeFill.position.set(0.12, 0.18, 0.62);
  safeGroup.add(safeFill);

  const keyGroup = new THREE.Group();
  keyGroup.position.set(-0.08, -0.1, 0.09);
  keyGroup.rotation.z = 0.22;
  const keyBrass = makeBrassMaterial(0xe3b660);
  const keyBow = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.013, 10, 20), keyBrass);
  keyGroup.add(keyBow);
  const keyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.16, 8), keyBrass);
  keyStem.rotation.z = Math.PI / 2;
  keyStem.position.set(0.11, 0, 0);
  keyGroup.add(keyStem);
  const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.04, 0.014), keyBrass);
  keyBit.position.set(0.165, -0.022, 0);
  keyGroup.add(keyBit);

  const keyHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.16, 0.09),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  keyHitbox.position.set(0.06, 0, 0);
  keyHitbox.userData.noHighlight = true;
  keyGroup.add(keyHitbox);

  tagInteractive(keyGroup, {
    id: 'master_key_pickup',
    label: 'Chiave maestra d’ottone',
    isEnabled: () => state.closeupId === 'safe' && state.safeOpen && !state.hasMasterKey,
    onClick: () => {
      state.hasMasterKey = true;
      keyGroup.visible = false;
      addInventoryItem('master_key');
      sound.playPickup();
      renderInventory();
      whisper('Raccolta: Chiave maestra d’ottone. Porta impresso il sigillo della Console Centrale.');
    }
  });
  safeGroup.add(keyGroup);

  const innerPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.18, 0.015),
    new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('◯ ≠ 1, 2', 'FRAMMENTO II', false),
      roughness: 0.42,
      metalness: 0.78
    })
  );
  innerPlaque.position.set(0.08, 0.08, 0.07);
  tagInteractive(innerPlaque, {
    id: 'safe_inner_plaque',
    label: 'Lamina incisa interna',
    isEnabled: () => state.closeupId === 'safe' && state.safeOpen,
    onClick: () => {
      openDocument({
        meta: 'LAMINA D’OTTONE // CASSETTA EMERGENZA',
        title: 'Protocollo Soglia IV — Frammento II',
        html: `
          <p>Sul fondo foderato della cassaforte è rivettata la seconda regola per i rotori della Console Centrale:</p>
          <div class="code-callout">
            • Il Cerchio ( ◯ ) non va mai collocato sul primo né sul secondo rotore.
          </div>
          <p>Assicurati di raccogliere anche la chiave maestra d’ottone custodita accanto alla lamina.</p>
        `
      });
    }
  });
  safeGroup.add(innerPlaque);

  const safeDoorPivot = new THREE.Group();
  safeDoorPivot.position.set(-0.33, 0, 0.115);

  const safeDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.56, 0.038),
    makeRustMaterial(0x57606b, 0.44, 0.64)
  );
  safeDoor.position.set(0.33, 0, 0);
  safeDoorPivot.add(safeDoor);

  const safeBrassBorder = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.042), giltBrass);
  safeBrassBorder.position.set(0.33, 0, 0);
  safeBrassBorder.userData.noHighlight = true;
  safeDoorPivot.add(safeBrassBorder);

  const safeDoorFace = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.46, 0.045),
    makeRustMaterial(0x3a4048, 0.46, 0.66)
  );
  safeDoorFace.position.set(0.33, 0, 0);
  safeDoorPivot.add(safeDoorFace);

  const safeHeader = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.12),
    new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('α  ·  β  ·  γ', '', false),
      roughness: 0.45,
      metalness: 0.72
    })
  );
  safeHeader.position.set(0.33, 0.15, 0.026);
  safeHeader.userData.noHighlight = true;
  safeDoorPivot.add(safeHeader);

  const drumMeshes = [];
  const drumKicks = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    const drumHolder = new THREE.Group();
    drumHolder.position.set(0.17 + i * 0.16, -0.05, 0.03);

    const drumMat = new THREE.MeshStandardMaterial({
      map: createDigitFaceTexture(state.safeDigits[i]),
      roughness: 0.36,
      metalness: 0.72
    });
    const drumMesh = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.155, 0.045), drumMat);
    drumHolder.add(drumMesh);
    drumMeshes.push(drumMesh);

    const paramNames = ['α', 'β', 'γ'];
    tagInteractive(drumHolder, {
      id: `safe_drum_${i}`,
      label: `Tamburo ${paramNames[i]}`,
      isEnabled: () => state.closeupId === 'safe' && !state.safeOpen,
      onClick: () => {
        state.safeDigits[i] = (state.safeDigits[i] + 1) % 10;
        drumMesh.material.map = createDigitFaceTexture(state.safeDigits[i]);
        drumMesh.material.needsUpdate = true;
        drumKicks[i] = -0.55;
        sound.playDialTick(0.92 + i * 0.09);

        if (
          state.safeDigits[0] === SAFE_TARGET[0] &&
          state.safeDigits[1] === SAFE_TARGET[1] &&
          state.safeDigits[2] === SAFE_TARGET[2]
        ) {
          state.safeOpen = true;
          window.setTimeout(() => {
            sound.playMetalSnap();
            whisper('Combinazione 4 · 7 · 9 corretta. Il chiavistello cede e lo sportello si apre.');
          }, 180);
        }
      }
    });

    safeDoorPivot.add(drumHolder);
  }

  safeGroup.add(safeDoorPivot);

  const safeZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.66, 0.28),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  safeZoomProxy.userData.noHighlight = true;
  tagInteractive(safeZoomProxy, {
    id: 'safe_zoom',
    label: 'Cassetta d’emergenza',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.enterCloseup('safe');
    }
  });
  safeGroup.add(safeZoomProxy);
  group.add(safeGroup);

  let sparkFlash = 0;

  function syncFromState() {
    prybarGroup.visible = !state.hasPrybar;
    chainGroup.visible = !state.grateUnlocked;
    insertedFuseMesh.visible = state.fuseInserted;
    keyGroup.visible = state.safeOpen && !state.hasMasterKey;
    innerPlaque.visible = state.safeOpen;

    for (let i = 0; i < 3; i++) {
      const targetTex = createDigitFaceTexture(state.safeDigits[i]);
      if (drumMeshes[i].material.map !== targetTex) {
        drumMeshes[i].material.map = targetTex;
        drumMeshes[i].material.needsUpdate = true;
      }
    }

    const desiredAlphaTex = state.powerOn ? litAlphaTex : darkAlphaTex;
    if (alphaPlate.material.map !== desiredAlphaTex) {
      alphaPlate.material.map = desiredAlphaTex;
      if (state.powerOn) {
        alphaPlate.material.color.setHex(0xffffff);
        alphaPlate.userData.baseEmissive.setHex(0x6e3d14);
        alphaPlate.userData.baseEmissiveIntensity = 0.75;
      } else {
        alphaPlate.material.color.setHex(0x3b352f);
        alphaPlate.userData.baseEmissive.setHex(0x000000);
        alphaPlate.userData.baseEmissiveIntensity = 1;
      }
      alphaPlate.material.emissive.copy(alphaPlate.userData.baseEmissive);
      alphaPlate.material.emissiveIntensity = alphaPlate.userData.baseEmissiveIntensity;
      alphaPlate.material.needsUpdate = true;
    }

    if (state.powerOn) {
      alphaLight.intensity = 2.6;
      statusBulbMat.color.setHex(0x88f29d);
      statusBulbMat.emissive.setHex(0x3bd463);
      statusBulbMat.emissiveIntensity = 2.1;
    } else {
      alphaLight.intensity = 0;
      statusBulbMat.color.setHex(0x451212);
      statusBulbMat.emissive.setHex(0x3b0808);
      statusBulbMat.emissiveIntensity = 0.7;
    }
  }

  function update(dt, elapsed) {
    chandelier.root.rotation.z = Math.sin(elapsed * 0.7) * 0.012;
    const flicker = 1 + Math.sin(elapsed * 14.3) * 0.018 + Math.sin(elapsed * 33.7) * 0.01;
    chandelier.light.intensity = 6.2 * flicker;

    // Oscillazione regolare del pendolo dell'orologio a colonna
    grandfatherClock.pendulumPivot.rotation.z = Math.sin(elapsed * 2.35) * 0.14;

    dust.rotation.y = elapsed * 0.015;

    const targetGrateRot = state.grateUnlocked ? -0.38 : 0;
    gratePivot.rotation.y += (targetGrateRot - gratePivot.rotation.y) * Math.min(1, dt * 6);

    const targetBoltX = state.powerOn ? -0.18 : -0.48;
    magBolt.position.x += (targetBoltX - magBolt.position.x) * Math.min(1, dt * 6);

    const targetCoverRot = state.fuseboxOpen ? -2.05 : 0;
    coverPivot.rotation.y += (targetCoverRot - coverPivot.rotation.y) * Math.min(1, dt * 6.5);

    const targetKnifeRot = state.powerOn ? 0.65 : -0.75;
    knifePivot.rotation.x += (targetKnifeRot - knifePivot.rotation.x) * Math.min(1, dt * 11);

    const targetSafeRot = state.safeOpen ? -1.92 : 0;
    safeDoorPivot.rotation.y += (targetSafeRot - safeDoorPivot.rotation.y) * Math.min(1, dt * 5.5);

    for (let i = 0; i < 3; i++) {
      drumKicks[i] += (0 - drumKicks[i]) * Math.min(1, dt * 14);
      drumMeshes[i].rotation.x = drumKicks[i];
    }

    if (sparkFlash > 0) {
      sparkFlash = Math.max(0, sparkFlash - dt * 3.2);
      sparkLight.intensity = sparkFlash * 10;
    } else {
      sparkLight.intensity = 0;
    }

    syncFromState();
  }

  syncFromState();

  return {
    id: 'vestibule',
    title: 'I · ANTICAMERA SOMMERSA',
    group,
    defaultCamera: {
      pos: new THREE.Vector3(0, 1.82, 3.72),
      lookAt: new THREE.Vector3(0, 1.45, -2.5)
    },
    closeups: {
      fusebox: {
        pos: new THREE.Vector3(2.18, 1.62, -2.25),
        lookAt: new THREE.Vector3(3.70, 1.60, -2.25)
      },
      safe: {
        pos: new THREE.Vector3(2.18, 1.42, -1.05),
        lookAt: new THREE.Vector3(3.70, 1.41, -1.05)
      }
    },
    update,
    syncFromState
  };
}
