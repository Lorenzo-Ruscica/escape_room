import * as THREE from 'three';
import {
  buildRoomShell,
  createCageLamp,
  createHandwheel,
  makeBrassMaterial,
  makeGlassMaterial,
  makePorcelainMaterial,
  makeRustMaterial,
  makeWoodMaterial,
  tagInteractive
} from './geometry.js';
import {
  createBankersLamp,
  createBookcase,
  createCurioCabinet,
  createFramedPainting,
  createPersianRug,
  createPottedPlant,
  createSideTableWithLamp,
  createWallSconce,
  createWineAndApothecaryRack,
  disableRaycast
} from './props.js';
import {
  createGaugeDialTexture,
  createPlaqueTexture,
  getSoftParticleTexture
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
  const { group, dust } = buildRoomShell({
    width: 7.6,
    height: 4.2,
    depth: 7.2,
    theme: 'burgundy',
    wallTint: 0xd9cfc2,
    backCutouts: [[1.52, 2.98]]
  });

  // Tappeto persiano ocra e bordeaux nella galleria centrale
  const cellarRug = createPersianRug({ width: 3.9, depth: 2.9, palette: 'ochre' });
  cellarRug.position.set(-0.2, 0, -0.35);
  group.add(cellarRug);

  const hemi = new THREE.HemisphereLight(0x5c493d, 0x1e130d, 0.46);
  group.add(hemi);

  const mainLamp = createCageLamp({ color: 0xe3883e, intensity: 6.1, distance: 11.2 });
  mainLamp.root.position.set(0.25, 3.6, -0.75);
  group.add(mainLamp.root);

  // --- ARREDI SCENOGRAFICI DELLA CANTINA-OFFICINA PADRONALE ---
  // Grande scaffalatura in rovere con bottiglie d'annata, botti e vasi da speziale (parete destra fondo)
  const wineRack = createWineAndApothecaryRack({ width: 1.55, height: 2.48, depth: 0.46 });
  wineRack.position.set(3.48, 0, -2.05);
  wineRack.rotation.y = -Math.PI / 2;
  group.add(wineRack);

  // Vetrina/cristalliera con caraffe, ampolle ambrate e calici (parete destra, ben visibile in quadro)
  const curioCab = createCurioCabinet({ width: 1.12, height: 2.18, depth: 0.4 });
  curioCab.position.set(3.5, 0, -0.45);
  curioCab.rotation.y = -Math.PI / 2;
  group.add(curioCab);

  // Libreria tecnica / armadio da laboratorio sulla parete sinistra
  const workshopLibrary = createBookcase({ width: 1.28, height: 2.62, depth: 0.42, seed: 404 });
  workshopLibrary.position.set(-3.52, 0, -0.92);
  workshopLibrary.rotation.y = Math.PI / 2;
  group.add(workshopLibrary);

  // Tavolino con lume ambrato nell'angolo anteriore destro (illumina anche il fronte della vasca)
  const cornerLampTable = createSideTableWithLamp({ lampColor: 0xe69244, shadeTint: 0xc9702c });
  cornerLampTable.position.set(2.92, 0, 0.62);
  group.add(cornerLampTable);

  // Pianta in vaso smaltato accanto al varco di ritorno
  const conservatoryPlant = createPottedPlant({ scale: 1.02 });
  conservatoryPlant.position.set(1.18, 0, -3.12);
  group.add(conservatoryPlant);

  // Applique in ottone e quadri d'epoca alle pareti
  for (const sx of [-1.26, 1.18]) {
    const sconce = createWallSconce({ color: 0xe89646, intensity: 1.55 });
    sconce.position.set(sx, 2.46, -3.55);
    group.add(sconce);
  }

  const botanicalPrint = createFramedPainting({ width: 0.94, height: 0.72, variant: 4, withLight: true });
  botanicalPrint.position.set(-3.75, 2.38, 0.62);
  botanicalPrint.rotation.y = Math.PI / 2;
  group.add(botanicalPrint);

  const celestialPrint = createFramedPainting({ width: 0.96, height: 0.74, variant: 2, withLight: false });
  celestialPrint.position.set(3.75, 2.68, -0.68);
  celestialPrint.rotation.y = -Math.PI / 2;
  group.add(celestialPrint);

  // --- 1. CALDAIA VITTORIANA IN RAME BRUNITO E OTTONE (SINISTRA / FONDO) ---
  const boilerTank = new THREE.Group();
  boilerTank.position.set(-2.35, 1.35, -2.25);
  const copperMat = makeRustMaterial(0x9e5938, 0.38, 0.68);
  const brassBandMat = makeBrassMaterial(0xd4a657);
  const castBaseMat = makeRustMaterial(0x362f2c, 0.58, 0.62);

  const basePedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.08, 0.24, 24), castBaseMat);
  basePedestal.position.y = -1.23;
  boilerTank.add(basePedestal);

  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.45, 28), copperMat);
  cyl.castShadow = true;
  cyl.receiveShadow = true;
  boilerTank.add(cyl);

  // Fasce cerchiate in ottone lucido lungo il fusto della caldaia
  for (const by of [-0.95, -0.32, 0.32, 0.95]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.918, 0.918, 0.065, 28), brassBandMat);
    band.position.y = by;
    boilerTank.add(band);
  }

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    copperMat
  );
  dome.position.y = 1.22;
  boilerTank.add(dome);

  // Camino superiore in rame che sale al soffitto
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.1, 16), copperMat);
  chimney.position.y = 2.35;
  boilerTank.add(chimney);

  // Focolare ardente dietro lo sportello in ghisa traforata
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff6524,
    emissive: new THREE.Color(0xd94211),
    emissiveIntensity: 1.8,
    roughness: 0.45
  });
  const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.12), emberMat);
  firebox.position.set(0.55, -0.75, 0.72);
  firebox.rotation.y = 0.6;
  boilerTank.add(firebox);

  const fireboxFrame = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.38, 0.09), brassBandMat);
  fireboxFrame.position.set(0.54, -0.75, 0.7);
  fireboxFrame.rotation.y = 0.6;
  boilerTank.add(fireboxFrame);

  const emberLight = new THREE.PointLight(0xe05522, 2.9, 5.8, 1.9);
  emberLight.position.set(0.82, -0.68, 1.02);
  boilerTank.add(emberLight);

  disableRaycast(boilerTank);
  group.add(boilerTank);

  // --- 2. COLLETTORE IN MOGANO E OTTONE A 4 VALVOLE + MANOMETRO CENTRALE (β) ---
  const manifoldGroup = new THREE.Group();
  manifoldGroup.position.set(-0.15, 0, -3.32);

  // Pannello a muro sagomato in mogano dietro il collettore
  const backBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 2.85, 0.06),
    makeWoodMaterial('mahogany', 0x916e57, 0.4)
  );
  backBoard.position.set(0, 1.56, -0.14);
  backBoard.receiveShadow = true;
  backBoard.raycast = () => {};
  manifoldGroup.add(backBoard);

  const manifoldSpot = new THREE.PointLight(0xeba35b, 3.8, 5.4, 1.5);
  manifoldSpot.position.set(0.15, 2.28, 1.15);
  manifoldGroup.add(manifoldSpot);

  const headerPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 1.95, 18),
    brassBandMat
  );
  headerPipe.rotation.z = Math.PI / 2;
  headerPipe.position.set(0, 2.02, 0.08);
  manifoldGroup.add(headerPipe);

  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(0, 2.52, 0.14);

  const bezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.38, 0.095, 32),
    makeBrassMaterial(0xc49a50)
  );
  bezel.rotation.x = Math.PI / 2;
  gaugeGroup.add(bezel);

  const dialFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.325, 32),
    new THREE.MeshStandardMaterial({
      map: createGaugeDialTexture(),
      roughness: 0.42,
      metalness: 0.15
    })
  );
  dialFace.position.z = 0.05;
  dialFace.userData.noHighlight = true;
  gaugeGroup.add(dialFace);

  const needlePivot = new THREE.Group();
  needlePivot.position.set(0, 0, 0.058);
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.25, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x8f1d16, roughness: 0.35, metalness: 0.5 })
  );
  needle.position.y = 0.095;
  needlePivot.add(needle);

  const needleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.02, 14),
    makeBrassMaterial(0x5c472b)
  );
  needleCap.rotation.x = Math.PI / 2;
  needlePivot.add(needleCap);
  gaugeGroup.add(needlePivot);

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

  const valveSpecs = [
    { roman: 'I', metal: 'Rame', pipeMat: makeRustMaterial(0xc96e44, 0.38, 0.66), wheelMat: makeRustMaterial(0xd9794c, 0.36, 0.62) },
    { roman: 'II', metal: 'Ottone', pipeMat: makeBrassMaterial(0xcfa554), wheelMat: makeBrassMaterial(0xdfb562) },
    { roman: 'III', metal: 'Piombo', pipeMat: makeRustMaterial(0x74808d, 0.46, 0.58), wheelMat: makeRustMaterial(0x83909e, 0.44, 0.58) },
    { roman: 'IV', metal: 'Ghisa', pipeMat: makeRustMaterial(0x52453f, 0.58, 0.52), wheelMat: makeRustMaterial(0x69544b, 0.54, 0.52) }
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

    const rTag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.11),
      new THREE.MeshStandardMaterial({
        map: createPlaqueTexture(spec.roman, '', false),
        roughness: 0.45,
        metalness: 0.72
      })
    );
    rTag.position.set(0, 1.78, 0.075);
    rTag.userData.noHighlight = true;
    vCol.add(rTag);

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

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 10), spec.pipeMat);
    stem.rotation.x = Math.PI / 2;
    stem.position.set(0, 1.38, 0.09);
    vCol.add(stem);

    const wheelHolder = new THREE.Group();
    wheelHolder.position.set(0, 1.38, 0.19);
    const wheel = createHandwheel(0.165, 0.022, spec.wheelMat);
    wheelHolder.add(wheel);

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

  const puffCount = 28;
  const puffPositions = new Float32Array(puffCount * 3);
  const puffVelocities = [];
  for (let i = 0; i < puffCount; i++) {
    puffVelocities.push(new THREE.Vector3());
  }
  const puffGeo = new THREE.BufferGeometry();
  puffGeo.setAttribute('position', new THREE.BufferAttribute(puffPositions, 3));
  const puffMat = new THREE.PointsMaterial({
    map: getSoftParticleTexture(),
    color: 0xe2dbd0,
    size: 0.14,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const steamPoints = new THREE.Points(puffGeo, puffMat);
  steamPoints.raycast = () => {};
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

  // --- 3. SCRITTOIO DA ARTIGIANO IN NOCE + LAMPADA VERDE + REGISTRO (SINISTRA AVANTI) ---
  const deskGroup = new THREE.Group();
  deskGroup.position.set(-2.62, 0, 0.35);
  deskGroup.rotation.y = 0.38;
  const deskWood = makeWoodMaterial('walnut', 0x99795f, 0.4);
  const deskDark = makeWoodMaterial('mahogany', 0x785642, 0.44);

  const deskProps = new THREE.Group();

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.055, 1.46), deskWood);
  deskTop.position.y = 0.88;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskProps.add(deskTop);

  // Fascia cassetti con pomelli in ottone
  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 1.36), deskDark);
  apron.position.y = 0.77;
  deskProps.add(apron);

  for (const dz of [-0.34, 0.34]) {
    const pull = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), brassBandMat);
    pull.position.set(0.47, 0.77, dz);
    deskProps.add(pull);
  }

  for (const [lx, lz] of [[-0.43, -0.63], [0.43, -0.63], [-0.43, 0.63], [0.43, 0.63]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.028, 0.88, 12), deskWood);
    leg.position.set(lx, 0.44, lz);
    leg.castShadow = true;
    deskProps.add(leg);
  }

  // Lampada verde da banchiere + calamaio + ampolla + progetti arrotolati agli angoli dello scrittoio
  const bankersLamp = createBankersLamp();
  bankersLamp.position.set(-0.22, 0.905, -0.44);
  bankersLamp.rotation.y = -0.4;
  deskProps.add(bankersLamp);

  const inkBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.048, 0.08, 12),
    makeGlassMaterial(0x23384d, 0.75)
  );
  inkBottle.position.set(-0.26, 0.945, 0.42);
  deskProps.add(inkBottle);

  const scrollTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.42, 12),
    makePorcelainMaterial(0xd9ceb8)
  );
  scrollTube.rotation.x = Math.PI / 2;
  scrollTube.rotation.z = 0.25;
  scrollTube.position.set(-0.28, 0.935, 0.06);
  deskProps.add(scrollTube);

  disableRaycast(deskProps);
  deskGroup.add(deskProps);

  const deskLight = new THREE.PointLight(0xe5a458, 2.2, 3.4, 1.85);
  deskLight.position.set(0.05, 1.32, -0.15);
  deskGroup.add(deskLight);

  // Registro di macchina interattivo ben esposto sul lato anteriore dello scrittoio
  const bookGroup = new THREE.Group();
  bookGroup.position.set(0.14, 0.925, 0.06);
  bookGroup.rotation.y = -0.22;
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.025, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x472119, roughness: 0.78 })
  );
  bookGroup.add(cover);
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.032, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xcec0a5, roughness: 0.88 })
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

  // --- 4. VASCA DI DECANTAZIONE BASSA IN NOCE, MAIOLICA E OTTONE + FUSIBILE CERAMICO (DESTRA AVANTI) ---
  const basinGroup = new THREE.Group();
  basinGroup.position.set(1.56, 0, -0.22);
  const curbWood = makeWoodMaterial('walnut', 0x947359, 0.4);
  const tileInterior = makePorcelainMaterial(0x2d3f3c);

  const bw = 1.36;
  const bd = 1.52;
  const bh = 0.36;
  const wallThick = 0.11;

  const basinShell = new THREE.Group();
  const frontCurb = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, wallThick), curbWood);
  frontCurb.position.set(0, bh / 2, bd / 2);
  frontCurb.castShadow = true;
  basinShell.add(frontCurb);

  // Targa/fregio d'ottone sul fronte della vasca per staccare il volume
  const frontPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.02), brassBandMat);
  frontPlaque.position.set(0, bh * 0.52, bd / 2 + 0.06);
  basinShell.add(frontPlaque);

  const backCurb = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, wallThick), curbWood);
  backCurb.position.set(0, bh / 2, -bd / 2);
  basinShell.add(backCurb);

  const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(wallThick, bh, bd), curbWood);
  leftCurb.position.set(-bw / 2, bh / 2, 0);
  leftCurb.castShadow = true;
  basinShell.add(leftCurb);

  const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(wallThick, bh, bd), curbWood);
  rightCurb.position.set(bw / 2, bh / 2, 0);
  basinShell.add(rightCurb);

  // Bordo superiore sottile rifinito in ottone brunito
  const topRimF = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.03, 0.022, wallThick + 0.02), brassBandMat);
  topRimF.position.set(0, bh + 0.01, bd / 2);
  basinShell.add(topRimF);
  const topRimB = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.03, 0.022, wallThick + 0.02), brassBandMat);
  topRimB.position.set(0, bh + 0.01, -bd / 2);
  basinShell.add(topRimB);
  const topRimL = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, 0.022, bd + 0.03), brassBandMat);
  topRimL.position.set(-bw / 2, bh + 0.01, 0);
  basinShell.add(topRimL);
  const topRimR = new THREE.Mesh(new THREE.BoxGeometry(wallThick + 0.02, 0.022, bd + 0.03), brassBandMat);
  topRimR.position.set(bw / 2, bh + 0.01, 0);
  basinShell.add(topRimR);

  const bottomGrate = new THREE.Mesh(
    new THREE.PlaneGeometry(bw - 0.16, bd - 0.16),
    tileInterior
  );
  bottomGrate.rotation.x = -Math.PI / 2;
  bottomGrate.position.y = 0.18;
  basinShell.add(bottomGrate);

  disableRaycast(basinShell);
  basinGroup.add(basinShell);

  const sludgeMat = new THREE.MeshStandardMaterial({
    color: 0x0d1211,
    roughness: 0.07,
    metalness: 0.88,
    transparent: true,
    opacity: 0.94
  });
  const sludgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.16, bd - 0.16), sludgeMat);
  sludgeMesh.rotation.x = -Math.PI / 2;
  sludgeMesh.position.y = 0.33;
  basinGroup.add(sludgeMesh);

  const basinSpot = new THREE.PointLight(0xcfe0ec, 2.5, 4.0, 1.8);
  basinSpot.position.set(0, 1.55, 0.15);
  basinGroup.add(basinSpot);

  // Fusibile ceramico ben visibile sul ripiano interno appena l'acqua scende
  const fusePickup = new THREE.Group();
  fusePickup.position.set(-0.06, 0.245, -0.14);
  fusePickup.rotation.set(Math.PI / 2, 0, 0.48);
  const fBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.28, 16),
    new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.25, metalness: 0.1 })
  );
  fusePickup.add(fBody);
  const brassCapMat = makeBrassMaterial(0xd19f52);
  for (const cy of [-0.13, 0.13]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), brassCapMat);
    cap.position.y = cy;
    fusePickup.add(cap);
  }

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
  const doorFrameWood = makeWoodMaterial('walnut', 0x8c6d54, 0.42);
  const wroughtMat = makeRustMaterial(0x3a3431, 0.48, 0.68);

  const voidBack = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36, 2.58),
    new THREE.MeshBasicMaterial({ color: 0x131d21 })
  );
  voidBack.position.set(0, 1.29, -0.01);
  voidBack.userData.noHighlight = true;
  backDoor.add(voidBack);

  for (const sx of [-0.72, 0.72]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.7, 0.16), doorFrameWood);
    post.position.set(sx, 1.35, 0.02);
    backDoor.add(post);
  }
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.16, 0.18), doorFrameWood);
  topBar.position.set(0, 2.66, 0.02);
  backDoor.add(topBar);

  const returnGrate = new THREE.Group();
  returnGrate.position.set(-0.66, 0, 0.05);
  returnGrate.rotation.y = 0.42;
  for (let i = 0; i <= 5; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.52, 8), wroughtMat);
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
    emberLight.intensity = 2.6 + Math.sin(elapsed * 9.4) * 0.42 + Math.cos(elapsed * 21.1) * 0.22;
    mainLamp.light.intensity = 6.1 + Math.sin(elapsed * 11.5) * 0.14;
    dust.rotation.y = -elapsed * 0.014;

    for (let i = 0; i < 4; i++) {
      const targetWheelRot = state.valves[i] ? -Math.PI * 0.75 : 0;
      wheelMeshes[i].rotation.z += (targetWheelRot - wheelMeshes[i].rotation.z) * Math.min(1, dt * 8);
    }

    const rawPressure = state.basinDrained ? TARGET_PRESSURE : computePressure();
    const clampedBar = Math.max(-0.4, Math.min(12, rawPressure));
    const targetNeedleAngle = ((6 - clampedBar) / 6) * ((3 * Math.PI) / 4);
    needlePivot.rotation.z += (targetNeedleAngle - needlePivot.rotation.z) * Math.min(1, dt * 5.5);

    const targetWaterY = state.basinDrained ? 0.08 : 0.33;
    sludgeMesh.position.y += (targetWaterY - sludgeMesh.position.y) * Math.min(1, dt * 2.2);
    sludgeMesh.visible = sludgeMesh.position.y > 0.12;

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
