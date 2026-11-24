import * as THREE from 'three';
import {
  buildRoomShell,
  createCageLamp,
  makeBrassMaterial,
  makeRustMaterial,
  tagInteractive
} from './geometry.js';
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
  const { group, dust } = buildRoomShell({ width: 7.6, height: 4.2, depth: 7.2, wallTint: 0x6c7178 });

  // Pozza d'acqua stagnante riflettente sul pavimento
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x0c1217,
    roughness: 0.09,
    metalness: 0.78,
    transparent: true,
    opacity: 0.78
  });
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(2.15, 36), puddleMat);
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-0.35, 0.012, -0.45);
  group.add(puddle);

  // Luce ambientale bassa e cupa + coni localizzati sugli elementi interattivi
  const hemi = new THREE.HemisphereLight(0x425261, 0x16110d, 0.44);
  group.add(hemi);

  const cageLamp = createCageLamp({ color: 0xde8940, intensity: 5.8, distance: 10.5 });
  cageLamp.root.position.set(-0.2, 3.62, -0.8);
  group.add(cageLamp.root);

  const backFill = new THREE.PointLight(0x5d768c, 1.35, 7.5, 1.7);
  backFill.position.set(0.0, 2.2, -2.2);
  group.add(backFill);

  // Lama di luce fredda sopra la panca sinistra
  const coldSpot = new THREE.SpotLight(0x6e95b5, 5.5, 8.5, Math.PI / 5.5, 0.65, 1.5);
  coldSpot.position.set(-2.45, 3.95, -0.55);
  coldSpot.target.position.set(-2.45, 0.4, -0.55);
  coldSpot.castShadow = true;
  group.add(coldSpot);
  group.add(coldSpot.target);

  // Grata sul soffitto da cui filtra la luce fredda
  const skyGrate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.85),
    new THREE.MeshBasicMaterial({ color: 0x5c7c94, transparent: true, opacity: 0.35 })
  );
  skyGrate.rotation.x = Math.PI / 2;
  skyGrate.position.set(-2.45, 4.18, -0.55);
  group.add(skyGrate);

  // --- 1. PANCA ARRUGGINITA + LEVA D'ACCIAIO ---
  const benchGroup = new THREE.Group();
  benchGroup.position.set(-2.55, 0, -0.55);
  const benchMat = makeRustMaterial(0x7c5a48, 0.72, 0.38);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.07, 1.55), benchMat);
  seat.position.y = 0.48;
  seat.castShadow = true;
  seat.receiveShadow = true;
  benchGroup.add(seat);

  for (const lz of [-0.62, 0.62]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.08), benchMat);
    leg.position.set(0, 0.24, lz);
    leg.castShadow = true;
    benchGroup.add(leg);
  }
  group.add(benchGroup);

  // Leva d'acciaio raccoglibile
  const prybarGroup = new THREE.Group();
  prybarGroup.position.set(-2.45, 0.545, -0.52);
  prybarGroup.rotation.set(0, 0.42, 0);
  const ironBarMat = new THREE.MeshStandardMaterial({
    color: 0x8f969e,
    roughness: 0.36,
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

  // --- 2. TUBAZIONI SECONDARIE E TARGHETTA (PARETE SINISTRA) ---
  const pipesGroup = new THREE.Group();
  pipesGroup.position.set(-3.7, 2.05, -1.55);
  const brassPipeMat = makeBrassMaterial(0xa88444);
  const leadPipeMat = makeRustMaterial(0x444a52, 0.62, 0.72);

  const pipeII = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 4.4, 14), brassPipeMat);
  pipeII.rotation.x = Math.PI / 2;
  pipeII.position.set(0.06, 0.16, 0);
  pipesGroup.add(pipeII);

  const pipeIII = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 4.4, 14), leadPipeMat);
  pipeIII.rotation.x = Math.PI / 2;
  pipeIII.position.set(0.06, -0.12, 0);
  pipesGroup.add(pipeIII);

  // Targhetta d'ottone appesa ai tubi
  const pipeTagGroup = new THREE.Group();
  pipeTagGroup.position.set(0.11, 0.02, 0.15);
  pipeTagGroup.rotation.y = Math.PI / 2;
  const tagPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.34, 0.025),
    new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('II · III', 'SPECIFICA BAR', false),
      roughness: 0.45,
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

  // --- 3. PORTA A GRATA -> SALA DELLE VALVOLE (PARETE DI FONDO SX) ---
  const grateFrame = new THREE.Group();
  grateFrame.position.set(-1.95, 0, -3.55);
  const frameMat = makeRustMaterial(0x694e40, 0.68, 0.45);

  // Vano scuro oltre la grata con debole bagliore arancio proveniente dalla Sala Caldaie
  const darkVoid = new THREE.Mesh(
    new THREE.PlaneGeometry(1.42, 2.62),
    new THREE.MeshBasicMaterial({ color: 0x17100c })
  );
  darkVoid.position.set(0, 1.31, -0.02);
  darkVoid.userData.noHighlight = true;
  grateFrame.add(darkVoid);

  // Stipiti
  for (const sx of [-0.75, 0.75]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.74, 0.16), frameMat);
    post.position.set(sx, 1.37, 0.02);
    grateFrame.add(post);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.14, 0.18), frameMat);
  lintel.position.set(0, 2.68, 0.02);
  grateFrame.add(lintel);

  // Anta a sbarre metalliche con cardine a sinistra
  const gratePivot = new THREE.Group();
  gratePivot.position.set(-0.7, 0, 0.04);
  const barMat = makeRustMaterial(0x8a6450, 0.58, 0.52);
  for (let i = 0; i <= 6; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 2.58, 8), barMat);
    bar.position.set(0.1 + i * 0.2, 1.3, 0);
    gratePivot.add(bar);
  }
  for (const by of [0.35, 1.32, 2.35]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.065, 0.055), barMat);
    cross.position.set(0.7, by, 0);
    gratePivot.add(cross);
  }

  // Catena arrugginita e lucchetto ben visibili
  const chainGroup = new THREE.Group();
  const chainMat = makeRustMaterial(0xa8623b, 0.52, 0.55);
  const chainBar = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.92, 8), chainMat);
  chainBar.rotation.z = 1.15;
  chainBar.position.set(1.18, 1.32, 0.05);
  chainGroup.add(chainBar);
  const padlock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.17, 0.08), makeBrassMaterial(0xc4954d));
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
          whisper('Una catena corrosa tiene serrata la grata. Serve una leva metallica per spezzarla.');
        }
        return;
      }
      actions.goToRoom('boiler');
    }
  });
  group.add(grateFrame);

  // --- 4. TARGA D'EMERGENZA CENTRALE [ α : 4 ] ---
  const alphaGroup = new THREE.Group();
  alphaGroup.position.set(0.0, 2.28, -3.55);

  const sconceHood = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.16, 12, 1, true),
    makeRustMaterial(0x2a2421, 0.7, 0.7)
  );
  sconceHood.position.set(0, 0.34, 0.08);
  alphaGroup.add(sconceHood);

  const alphaLight = new THREE.PointLight(0xff9d3b, 0, 3.2, 2);
  alphaLight.position.set(0, 0.25, 0.16);
  alphaGroup.add(alphaLight);

  const darkAlphaTex = createPlaqueTexture('· · ·', 'SETTORE I', false);
  const litAlphaTex = createPlaqueTexture('α : 4', 'SETTORE I', true);

  const alphaPlateMat = new THREE.MeshStandardMaterial({
    map: darkAlphaTex,
    color: 0x3b352f,
    emissive: new THREE.Color(0x000000),
    roughness: 0.55,
    metalness: 0.65
  });
  const alphaPlate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.03), alphaPlateMat);
  alphaPlate.position.set(0, 0, 0.02);
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

  // --- 5. PORTA STAGNA -> CAMERA DI CONTROLLO (PARETE DI FONDO DX) ---
  const bulkheadGroup = new THREE.Group();
  bulkheadGroup.position.set(1.95, 0, -3.54);
  const steelMat = makeRustMaterial(0x6d7680, 0.54, 0.52);

  const bFrame = new THREE.Mesh(new THREE.BoxGeometry(1.66, 2.76, 0.16), makeRustMaterial(0x4b5158, 0.68, 0.48));
  bFrame.position.set(0, 1.38, 0);
  bulkheadGroup.add(bFrame);

  const bDoor = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.5, 0.12), steelMat);
  bDoor.position.set(0, 1.3, 0.05);
  bulkheadGroup.add(bDoor);

  const magBolt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.09), makeBrassMaterial(0xa88248));
  magBolt.position.set(-0.48, 1.32, 0.13);
  bulkheadGroup.add(magBolt);

  // Spia luminosa sopra la porta stagna
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
        whisper('L’elettromagnete della porta stagna è senza corrente. Controlla il quadro elettrico a destra.');
        return;
      }
      actions.goToRoom('control');
    }
  });
  group.add(bulkheadGroup);

  // --- 6. QUADRO ELETTRICO PRINCIPALE (PARETE DESTRA, IN FONDO) ---
  const fuseboxGroup = new THREE.Group();
  fuseboxGroup.position.set(3.70, 1.62, -2.25);
  fuseboxGroup.rotation.y = -Math.PI / 2;

  const boxCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.86, 0.16),
    makeRustMaterial(0x6e5446, 0.68, 0.45)
  );
  fuseboxGroup.add(boxCabinet);

  const boxInterior = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.76),
    new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.9 })
  );
  boxInterior.position.z = 0.082;
  boxInterior.userData.noHighlight = true;
  fuseboxGroup.add(boxInterior);

  // Luce dedicata ravvicinata per leggibilità perfetta del quadro
  const fuseboxFill = new THREE.PointLight(0xd99b5e, 1.2, 2.2, 2);
  fuseboxFill.position.set(0, 0.2, 0.55);
  fuseboxGroup.add(fuseboxFill);

  // Fusibile sinistro (già presente)
  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xd8d1c5, roughness: 0.35, metalness: 0.1 });
  const clipMat = makeBrassMaterial(0xb07c44);

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

  // Alloggiamento destro (vuoto finché non si inserisce il fusibile)
  const fuseSlotGroup = new THREE.Group();
  fuseSlotGroup.position.set(0.14, 0.18, 0.11);
  const slotBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.26, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x221d19, roughness: 0.8 })
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

  // Interruttore generale a coltello (in basso nel quadro)
  const switchBase = new THREE.Group();
  switchBase.position.set(0, -0.17, 0.1);
  const sPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.03), makeRustMaterial(0x25201d));
  switchBase.add(sPlate);

  const knifePivot = new THREE.Group();
  knifePivot.position.set(0, -0.04, 0.02);
  knifePivot.rotation.x = -0.75; // Posizione alzata (OFF)

  for (const bx of [-0.08, 0.08]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), clipMat);
    blade.position.set(bx, 0.08, 0);
    knifePivot.add(blade);
  }
  const handleBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: 0x3b1812, roughness: 0.5 })
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

  // Sportello anteriore incernierato a sinistra
  const coverPivot = new THREE.Group();
  coverPivot.position.set(-0.34, 0, 0.085);
  const coverDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.86, 0.025),
    makeRustMaterial(0x7c5c4a, 0.66, 0.46)
  );
  coverDoor.position.set(0.34, 0, 0);
  coverPivot.add(coverDoor);
  fuseboxGroup.add(coverPivot);

  // Hotspot panoramico per avvicinarsi al quadro
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

  // --- 7. CASSETTA D'EMERGENZA [ α · β · γ ] (PARETE DESTRA, CENTRO) ---
  const safeGroup = new THREE.Group();
  safeGroup.position.set(3.70, 1.42, -1.05);
  safeGroup.rotation.y = -Math.PI / 2;

  const safeBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.56, 0.22),
    makeRustMaterial(0x5d6570, 0.58, 0.52)
  );
  safeGroup.add(safeBody);

  const safeCavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.46, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x181b1f, roughness: 0.85 })
  );
  safeCavity.position.z = 0.04;
  safeCavity.userData.noHighlight = true;
  safeGroup.add(safeCavity);

  const safeFill = new THREE.PointLight(0xebb06e, 2.4, 2.6, 1.6);
  safeFill.position.set(0.12, 0.18, 0.62);
  safeGroup.add(safeFill);

  // Oggetti interni alla cassetta (visibili e cliccabili quando safeOpen === true)
  const keyGroup = new THREE.Group();
  keyGroup.position.set(-0.08, -0.1, 0.09);
  keyGroup.rotation.z = 0.22;
  const keyBrass = makeBrassMaterial(0xe0b25c);
  const keyBow = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.013, 10, 20), keyBrass);
  keyGroup.add(keyBow);
  const keyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.16, 8), keyBrass);
  keyStem.rotation.z = Math.PI / 2;
  keyStem.position.set(0.11, 0, 0);
  keyGroup.add(keyStem);
  const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.04, 0.014), keyBrass);
  keyBit.position.set(0.165, -0.022, 0);
  keyGroup.add(keyBit);

  // Hitbox piena per raccogliere la chiave anche cliccando dentro l'anello
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

  // Piastra incisa sul fondo interno della cassetta (Frammento II)
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
          <p>Sul fondo blindato della cassetta è rivettata la seconda regola per i rotori della Console Centrale:</p>
          <div class="code-callout">
            • Il Cerchio ( ◯ ) non va mai collocato sul primo né sul secondo rotore.
          </div>
          <p>Assicurati di raccogliere anche la chiave maestra d’ottone custodita accanto alla lamina.</p>
        `
      });
    }
  });
  safeGroup.add(innerPlaque);

  // Sportello anteriore della cassetta con i 3 tamburi numerici
  const safeDoorPivot = new THREE.Group();
  safeDoorPivot.position.set(-0.33, 0, 0.115);

  const safeDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.56, 0.035),
    makeRustMaterial(0x6b7480, 0.56, 0.54)
  );
  safeDoor.position.set(0.33, 0, 0);
  safeDoorPivot.add(safeDoor);

  const safeHeader = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.12),
    new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('α  ·  β  ·  γ', '', false),
      roughness: 0.5,
      metalness: 0.7
    })
  );
  safeHeader.position.set(0.33, 0.15, 0.02);
  safeHeader.userData.noHighlight = true;
  safeDoorPivot.add(safeHeader);

  const drumMeshes = [];
  const drumKicks = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    const drumHolder = new THREE.Group();
    drumHolder.position.set(0.17 + i * 0.16, -0.05, 0.025);

    const drumMat = new THREE.MeshStandardMaterial({
      map: createDigitFaceTexture(state.safeDigits[i]),
      roughness: 0.38,
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
    new THREE.BoxGeometry(0.74, 0.64, 0.28),
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
        alphaPlate.userData.baseEmissiveIntensity = 0.7;
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
    // Oscillazione impercettibile e tremolio del filamento
    cageLamp.root.rotation.z = Math.sin(elapsed * 0.9) * 0.025;
    const flicker = 1 + Math.sin(elapsed * 17.3) * 0.03 + Math.sin(elapsed * 41.7) * 0.02;
    cageLamp.light.intensity = 6.0 * flicker;

    // Pulviscolo
    dust.rotation.y = elapsed * 0.015;

    // Animazioni meccaniche fluide
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
