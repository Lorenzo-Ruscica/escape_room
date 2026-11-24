import * as THREE from 'three';
import {
  buildRoomShell,
  createCageLamp,
  createHandwheel,
  makeBrassMaterial,
  makeRustMaterial,
  tagInteractive
} from './geometry.js';
import {
  createGaugeDialTexture,
  createPlaqueTexture
} from '../textures.js';
import {
  TARGET_PRESSURE,
  addInventoryItem,
  computePressure,
  state
} from '../state.js';
import { sound } from '../audio.js';
import { openDocument, renderInventory, whisper } from '../ui.js';

export function buildBoilerRoom(actions) {
  const { group, dust } = buildRoomShell({ width: 7.6, height: 4.2, depth: 7.2, wallTint: 0x6b615a });

  const hemi = new THREE.HemisphereLight(0x4a3e36, 0x17100b, 0.42);
  group.add(hemi);

  const mainLamp = createCageLamp({ color: 0xde7c35, intensity: 5.9, distance: 10.8 });
  mainLamp.root.position.set(0.35, 3.62, -0.75);
  group.add(mainLamp.root);

  // --- 1. GRANDE CALDAIA RIVETTATA (SINISTRA / FONDO) ---
  const boilerTank = new THREE.Group();
  boilerTank.position.set(-2.35, 1.35, -2.25);
  const boilerMat = makeRustMaterial(0x82513d, 0.66, 0.45);

  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 2.55, 24), boilerMat);
  cyl.castShadow = true;
  cyl.receiveShadow = true;
  boilerTank.add(cyl);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.92, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), boilerMat);
  dome.position.y = 1.27;
  boilerTank.add(dome);

  // Braciere debole dietro la griglia della caldaia
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff5e1f,
    emissive: new THREE.Color(0xc93b0e),
    emissiveIntensity: 1.6,
    roughness: 0.5
  });
  const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.12), emberMat);
  firebox.position.set(0.55, -0.75, 0.72);
  firebox.rotation.y = 0.6;
  boilerTank.add(firebox);

  const emberLight = new THREE.PointLight(0xd94b1a, 2.8, 5.5, 2);
  emberLight.position.set(0.8, -0.7, 1.0);
  boilerTank.add(emberLight);

  group.add(boilerTank);

  // --- 2. COLLETTORE A 4 VALVOLE E MANOMETRO CENTRALE (β) ---
  const manifoldGroup = new THREE.Group();
  manifoldGroup.position.set(-0.15, 0, -3.32);

  // Luce dedicata sul manometro e su tutte e quattro le valvole
  const manifoldSpot = new THREE.PointLight(0xeba35b, 3.8, 5.2, 1.5);
  manifoldSpot.position.set(0.15, 2.25, 1.15);
  manifoldGroup.add(manifoldSpot);

  // Trave orizzontale collettore
  const headerPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 1.95, 16),
    makeRustMaterial(0x362b26, 0.68, 0.75)
  );
  headerPipe.rotation.z = Math.PI / 2;
  headerPipe.position.set(0, 2.02, 0.08);
  manifoldGroup.add(headerPipe);

  // Manometro grande con simbolo β
  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(0, 2.52, 0.14);

  const bezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.09, 32),
    makeBrassMaterial(0x8f6f3e)
  );
  bezel.rotation.x = Math.PI / 2;
  gaugeGroup.add(bezel);

  const dialFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.325, 32),
    new THREE.MeshStandardMaterial({
      map: createGaugeDialTexture(),
      roughness: 0.45,
      metalness: 0.15
    })
  );
  dialFace.position.z = 0.048;
  dialFace.userData.noHighlight = true;
  gaugeGroup.add(dialFace);

  const needlePivot = new THREE.Group();
  needlePivot.position.set(0, 0, 0.056);
  // Lancetta orientata verso +Y (corrisponde a 6 BAR quando rotation.z === 0)
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.25, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x8f1d16, roughness: 0.35, metalness: 0.5 })
  );
  needle.position.y = 0.095;
  needlePivot.add(needle);

  const needleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.02, 14),
    makeBrassMaterial(0x4a3922)
  );
  needleCap.rotation.x = Math.PI / 2;
  needlePivot.add(needleCap);
  gaugeGroup.add(needlePivot);

  // Spia blocco pneumatico (si accende a 7 BAR)
  const lockLampMat = new THREE.MeshStandardMaterial({
    color: 0x2e251e,
    emissive: new THREE.Color(0x000000),
    roughness: 0.3
  });
  const lockLamp = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), lockLampMat);
  lockLamp.position.set(0.45, 0, 0.02);
  lockLamp.userData.noHighlight = true;
  gaugeGroup.add(lockLamp);

  manifoldGroup.add(gaugeGroup);

  // Le 4 condotte e i 4 volantini: I (Rame), II (Ottone), III (Piombo), IV (Ghisa)
  const valveSpecs = [
    { roman: 'I', metal: 'Rame', pipeMat: makeRustMaterial(0xc96e44, 0.42, 0.62), wheelMat: makeRustMaterial(0xd9794c, 0.40, 0.58) },
    { roman: 'II', metal: 'Ottone', pipeMat: makeBrassMaterial(0xc9a152), wheelMat: makeBrassMaterial(0xd9b05c) },
    { roman: 'III', metal: 'Piombo', pipeMat: makeRustMaterial(0x707b88, 0.52, 0.54), wheelMat: makeRustMaterial(0x7e8a98, 0.48, 0.54) },
    { roman: 'IV', metal: 'Ghisa', pipeMat: makeRustMaterial(0x6e5246, 0.68, 0.45), wheelMat: makeRustMaterial(0x805f50, 0.64, 0.45) }
  ];

  const wheelMeshes = [];
  const statusCollars = [];

  valveSpecs.forEach((spec, idx) => {
    const xPos = -0.66 + idx * 0.44;
    const vCol = new THREE.Group();
    vCol.position.set(xPos, 0, 0.08);

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 2.05, 14), spec.pipeMat);
    pipe.position.y = 1.02;
    pipe.castShadow = true;
    vCol.add(pipe);

    // Targhetta numero romano sopra ogni volantino
    const rTag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.11),
      new THREE.MeshStandardMaterial({
        map: createPlaqueTexture(spec.roman, '', false),
        roughness: 0.5,
        metalness: 0.7
      })
    );
    rTag.position.set(0, 1.78, 0.075);
    rTag.userData.noHighlight = true;
    vCol.add(rTag);

    // Collare indicatore stato (spento = chiusa, ambra/verde = aperta)
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x26201c,
      emissive: new THREE.Color(0x000000),
      roughness: 0.35
    });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.045, 14), collarMat);
    collar.position.set(0, 1.62, 0);
    collar.userData.noHighlight = true;
    vCol.add(collar);
    statusCollars.push(collarMat);

    // Albero e volantino 3D
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 10), spec.pipeMat);
    stem.rotation.x = Math.PI / 2;
    stem.position.set(0, 1.38, 0.09);
    vCol.add(stem);

    const wheelHolder = new THREE.Group();
    wheelHolder.position.set(0, 1.38, 0.19);
    const wheel = createHandwheel(0.165, 0.022, spec.wheelMat);
    wheelHolder.add(wheel);

    // Disco hitbox pieno affinché il clic tra le razze del volantino sia sempre preciso
    const wheelHitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.08, 16),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    wheelHitbox.rotation.x = Math.PI / 2;
    wheelHitbox.userData.noHighlight = true;
    wheelHolder.add(wheelHitbox);

    wheelMeshes.push(wheel);

    tagInteractive(wheelHolder, {
      id: `valve_${idx}`,
      get label() {
        const st = state.valves[idx] ? 'APERTA' : 'CHIUSA';
        return `Valvola ${spec.roman} (${spec.metal}) · ${st}`;
      },
      isEnabled: () => state.closeupId === 'manifold',
      onClick: () => {
        if (state.basinDrained) {
          whisper('Fermo di sicurezza attivo: il collettore è già bloccato a 7 BAR.');
          return;
        }
        state.valves[idx] = !state.valves[idx];
        sound.playSteamValve();
        triggerSteamPuff(xPos);

        const p = computePressure();
        const stateWord = state.valves[idx] ? 'aperta' : 'chiusa';

        if (p === TARGET_PRESSURE) {
          state.basinDrained = true;
          whisper('Manometro stabilizzato a 7 BAR! La valvola pneumatica apre lo scarico della vasca.');
          window.setTimeout(() => {
            sound.playDrain();
            if (state.closeupId === 'manifold') {
              actions.leaveCloseup();
            }
          }, 950);
        } else {
          const displayBar = p < 0 ? `sotto zero (${p} BAR)` : `${p} BAR`;
          whisper(`Valvola ${spec.roman} (${spec.metal}) ${stateWord}. Pressione risultante: ${displayBar}.`);
        }
      }
    });

    vCol.add(wheelHolder);
    manifoldGroup.add(vCol);
  });

  // Sbuffo di vapore particellare
  const puffCount = 28;
  const puffPositions = new Float32Array(puffCount * 3);
  const puffVelocities = [];
  for (let i = 0; i < puffCount; i++) {
    puffVelocities.push(new THREE.Vector3());
  }
  const puffGeo = new THREE.BufferGeometry();
  puffGeo.setAttribute('position', new THREE.BufferAttribute(puffPositions, 3));
  const puffMat = new THREE.PointsMaterial({
    color: 0xd8d2c9,
    size: 0.09,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const steamPoints = new THREE.Points(puffGeo, puffMat);
  manifoldGroup.add(steamPoints);
  let puffLife = 0;

  function triggerSteamPuff(localX) {
    puffLife = 1.0;
    const arr = puffGeo.attributes.position.array;
    for (let i = 0; i < puffCount; i++) {
      arr[i * 3] = localX + (Math.random() - 0.5) * 0.08;
      arr[i * 3 + 1] = 1.42 + (Math.random() - 0.5) * 0.08;
      arr[i * 3 + 2] = 0.22;
      puffVelocities[i].set(
        (Math.random() - 0.5) * 0.45,
        0.45 + Math.random() * 0.65,
        0.25 + Math.random() * 0.45
      );
    }
    puffGeo.attributes.position.needsUpdate = true;
  }

  // Proxy zoom sull'intero collettore dalla visuale stanza
  const manifoldZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(1.95, 1.95, 0.45),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  manifoldZoomProxy.position.set(0, 1.95, 0.16);
  manifoldZoomProxy.userData.noHighlight = true;
  tagInteractive(manifoldZoomProxy, {
    id: 'manifold_zoom',
    label: 'Collettore e manometro β',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.enterCloseup('manifold');
    }
  });
  manifoldGroup.add(manifoldZoomProxy);
  group.add(manifoldGroup);

  // --- 3. BANCO DA LAVORO + REGISTRO DI MACCHINA (SINISTRA AVANTI) ---
  const deskGroup = new THREE.Group();
  deskGroup.position.set(-2.65, 0, 0.25);
  deskGroup.rotation.y = 0.35;
  const deskMat = makeRustMaterial(0x70584b, 0.70, 0.42);

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 1.35), deskMat);
  deskTop.position.y = 0.88;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  for (const [lx, lz] of [[-0.4, -0.58], [0.4, -0.58], [-0.4, 0.58], [0.4, 0.58]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.88, 0.07), deskMat);
    leg.position.set(lx, 0.44, lz);
    deskGroup.add(leg);
  }

  // Luce calda bassa sul registro
  const deskLight = new THREE.PointLight(0xd9924c, 1.8, 3.0, 2);
  deskLight.position.set(0.1, 1.38, 0);
  deskGroup.add(deskLight);

  // Registro aperto macchiato d'olio
  const bookGroup = new THREE.Group();
  bookGroup.position.set(0.06, 0.925, 0.04);
  bookGroup.rotation.y = -0.22;
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.025, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x3b2319, roughness: 0.85 })
  );
  bookGroup.add(cover);
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.032, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xbcae93, roughness: 0.9 })
  );
  pages.position.y = 0.008;
  bookGroup.add(pages);

  tagInteractive(bookGroup, {
    id: 'boiler_logbook',
    label: 'Registro di macchina',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      openDocument({
        meta: 'REGISTRO TECNICO // SALA CALDAIE',
        title: 'Taratura Scarico & Note Chiusa',
        html: `
          <p><strong>Scarico Vasca di Scolmo:</strong> la paratia pneumatica si apre solo quando il manometro centrale (<strong>β</strong>) segna esattamente <strong>7 BAR</strong>.</p>
          <div class="code-callout">
            • CONDOTTA I (Rame) : +6 BAR<br>
            • CONDOTTA IV (Ghisa) : +2 BAR<br>
            • CONDOTTE II e III : vedi targhetta tubi nell’Anticamera
          </div>
          <p><strong>Appunto del Capoturno — Frammento I (Rotori Console):</strong><br>
          «I tre rotori della Chiusa richiedono <em>tre simboli tutti diversi</em>. Non allineare mai la Croce ( <strong>✛</strong> ): blocca istantaneamente i pistoni idraulici.»</p>
        `
      });
    }
  });
  deskGroup.add(bookGroup);
  group.add(deskGroup);

  // --- 4. VASCA DI SCOLMO + FUSIBILE CERAMICO (DESTRA AVANTI) ---
  const basinGroup = new THREE.Group();
  basinGroup.position.set(1.62, 0, -0.18);
  const curbMat = makeRustMaterial(0x5c5754, 0.80, 0.28);

  // Muretti perimetrali della vasca
  const bw = 1.38;
  const bd = 1.56;
  const bh = 0.56;
  const wallThick = 0.12;

  const frontCurb = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, wallThick), curbMat);
  frontCurb.position.set(0, bh / 2, bd / 2);
  basinGroup.add(frontCurb);
  const backCurb = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, wallThick), curbMat);
  backCurb.position.set(0, bh / 2, -bd / 2);
  basinGroup.add(backCurb);
  const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(wallThick, bh, bd), curbMat);
  leftCurb.position.set(-bw / 2, bh / 2, 0);
  basinGroup.add(leftCurb);
  const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(wallThick, bh, bd), curbMat);
  rightCurb.position.set(bw / 2, bh / 2, 0);
  basinGroup.add(rightCurb);

  // Griglia di fondo
  const bottomGrate = new THREE.Mesh(
    new THREE.PlaneGeometry(bw - 0.16, bd - 0.16),
    makeRustMaterial(0x241b17, 0.8, 0.6)
  );
  bottomGrate.rotation.x = -Math.PI / 2;
  bottomGrate.position.y = 0.12;
  basinGroup.add(bottomGrate);

  // Acqua nera oleosa che scende quando basinDrained === true
  const sludgeMat = new THREE.MeshStandardMaterial({
    color: 0x0a0d0c,
    roughness: 0.08,
    metalness: 0.88,
    transparent: true,
    opacity: 0.93
  });
  const sludgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.16, bd - 0.16), sludgeMat);
  sludgeMesh.rotation.x = -Math.PI / 2;
  sludgeMesh.position.y = 0.48;
  basinGroup.add(sludgeMesh);

  // Luce puntata sulla vasca per far risaltare il fusibile bianco una volta drenata
  const basinSpot = new THREE.PointLight(0x9fb8cc, 2.2, 3.6, 2);
  basinSpot.position.set(0, 1.65, 0);
  basinGroup.add(basinSpot);

  // Fusibile ceramico adagiato sul fondo della vasca
  const fusePickup = new THREE.Group();
  fusePickup.position.set(-0.08, 0.18, 0.06);
  fusePickup.rotation.set(Math.PI / 2, 0, 0.55);
  const fBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.28, 16),
    new THREE.MeshStandardMaterial({ color: 0xe8e2d5, roughness: 0.28, metalness: 0.1 })
  );
  fusePickup.add(fBody);
  const brassCapMat = makeBrassMaterial(0xc49248);
  for (const cy of [-0.13, 0.13]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), brassCapMat);
    cap.position.y = cy;
    fusePickup.add(cap);
  }

  // Hitbox generosa per cliccare comodamente il fusibile
  const fuseHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.42, 0.25),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  fuseHitbox.userData.noHighlight = true;
  fusePickup.add(fuseHitbox);

  tagInteractive(fusePickup, {
    id: 'fuse_pickup',
    label: 'Fusibile ceramico',
    isEnabled: () => !state.closeupId && state.basinDrained && !state.hasFuse,
    onClick: () => {
      state.hasFuse = true;
      fusePickup.visible = false;
      addInventoryItem('fuse');
      sound.playPickup();
      renderInventory();
      whisper('Raccolto: Fusibile ceramico ad alta tensione, asciugato dall’olio residuo.');
    }
  });
  basinGroup.add(fusePickup);

  tagInteractive(sludgeMesh, {
    id: 'sludge_surface',
    label: 'Vasca di scolmo colma',
    isEnabled: () => !state.closeupId && !state.basinDrained,
    onClick: () => {
      whisper('Liquido oleoso bollente. Sul fondo c’è un fusibile ceramico, ma lo scarico richiede 7 BAR.');
    }
  });
  group.add(basinGroup);

  // --- 5. PORTA DI RITORNO -> ANTICAMERA SOMMERSA (FONDO DESTRA) ---
  const backDoor = new THREE.Group();
  backDoor.position.set(2.25, 0, -3.54);
  const doorFrameMat = makeRustMaterial(0x6e5244, 0.68, 0.46);

  const voidBack = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36, 2.58),
    new THREE.MeshBasicMaterial({ color: 0x040608 })
  );
  voidBack.position.set(0, 1.29, -0.01);
  voidBack.userData.noHighlight = true;
  backDoor.add(voidBack);

  for (const sx of [-0.72, 0.72]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.68, 0.15), doorFrameMat);
    post.position.set(sx, 1.34, 0.02);
    backDoor.add(post);
  }
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.14, 0.16), doorFrameMat);
  topBar.position.set(0, 2.64, 0.02);
  backDoor.add(topBar);

  // Sbarre socchiuse
  const returnGrate = new THREE.Group();
  returnGrate.position.set(-0.66, 0, 0.05);
  returnGrate.rotation.y = 0.42;
  for (let i = 0; i <= 5; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.52, 8), doorFrameMat);
    b.position.set(0.12 + i * 0.22, 1.28, 0);
    returnGrate.add(b);
  }
  backDoor.add(returnGrate);

  tagInteractive(backDoor, {
    id: 'back_to_vestibule',
    kind: 'door',
    label: 'Anticamera Sommersa',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.goToRoom('vestibule');
    }
  });
  group.add(backDoor);

  function syncFromState() {
    fusePickup.visible = !state.hasFuse;

    statusCollars.forEach((mat, idx) => {
      if (state.valves[idx]) {
        mat.color.setHex(0xd89b48);
        mat.emissive.setHex(0x8c5216);
        mat.emissiveIntensity = 1.1;
      } else {
        mat.color.setHex(0x26201c);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });

    if (state.basinDrained) {
      lockLampMat.color.setHex(0x88f29d);
      lockLampMat.emissive.setHex(0x36c959);
      lockLampMat.emissiveIntensity = 1.8;
    } else {
      lockLampMat.color.setHex(0x2e251e);
      lockLampMat.emissive.setHex(0x000000);
      lockLampMat.emissiveIntensity = 0;
    }
  }

  function update(dt, elapsed) {
    // Tremolio caldaia e lampada
    emberLight.intensity = 2.5 + Math.sin(elapsed * 9.4) * 0.45 + Math.cos(elapsed * 21.1) * 0.25;
    mainLamp.light.intensity = 6.2 + Math.sin(elapsed * 13.5) * 0.18;
    dust.rotation.y = -elapsed * 0.014;

    // Rotazione fluida dei 4 volantini e della lancetta del manometro
    for (let i = 0; i < 4; i++) {
      const targetWheelRot = state.valves[i] ? -Math.PI * 0.75 : 0;
      wheelMeshes[i].rotation.z += (targetWheelRot - wheelMeshes[i].rotation.z) * Math.min(1, dt * 8);
    }

    const rawPressure = state.basinDrained ? TARGET_PRESSURE : computePressure();
    const clampedBar = Math.max(-0.4, Math.min(12, rawPressure));
    const targetNeedleAngle = ((6 - clampedBar) / 6) * ((3 * Math.PI) / 4);
    needlePivot.rotation.z += (targetNeedleAngle - needlePivot.rotation.z) * Math.min(1, dt * 5.5);

    // Drenaggio acqua nella vasca
    const targetWaterY = state.basinDrained ? 0.04 : 0.48;
    sludgeMesh.position.y += (targetWaterY - sludgeMesh.position.y) * Math.min(1, dt * 2.2);
    sludgeMesh.visible = sludgeMesh.position.y > 0.06;

    // Animazione sbuffo di vapore
    if (puffLife > 0) {
      puffLife = Math.max(0, puffLife - dt * 1.6);
      puffMat.opacity = puffLife * 0.52;
      const arr = puffGeo.attributes.position.array;
      for (let i = 0; i < puffCount; i++) {
        arr[i * 3] += puffVelocities[i].x * dt;
        arr[i * 3 + 1] += puffVelocities[i].y * dt;
        arr[i * 3 + 2] += puffVelocities[i].z * dt;
      }
      puffGeo.attributes.position.needsUpdate = true;
    } else {
      puffMat.opacity = 0;
    }

    syncFromState();
  }

  syncFromState();

  return {
    id: 'boiler',
    title: 'II · SALA DELLE VALVOLE',
    group,
    defaultCamera: {
      pos: new THREE.Vector3(0, 1.82, 3.72),
      lookAt: new THREE.Vector3(0, 1.45, -2.5)
    },
    closeups: {
      manifold: {
        pos: new THREE.Vector3(-0.15, 2.02, -0.82),
        lookAt: new THREE.Vector3(-0.15, 1.94, -3.28)
      }
    },
    update,
    syncFromState
  };
}
