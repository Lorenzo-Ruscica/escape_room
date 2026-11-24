import * as THREE from 'three';
import {
  makeBrassMaterial,
  makePorcelainMaterial,
  makeRustMaterial,
  makeWoodMaterial,
  tagInteractive
} from './geometry.js';
import { disableRaycast } from './props.js';
import {
  buildDarkroomShell,
  createBellowsCameraOnTripod,
  createPhotoDryingLine,
  createReagentShelf
} from './props_coastal.js';
import {
  createDevelopedPhotoTexture,
  createLightboxTexture
} from '../textures.js';
import {
  consumeInventoryItem,
  state
} from '../state.js';
import { sound } from '../audio.js';
import { openDocument, renderInventory, whisper } from '../ui.js';

export function buildDarkroomRoom(actions) {
  const { group, dust } = buildDarkroomShell({
    width: 7.6,
    height: 4.2,
    depth: 7.2,
    backCutouts: [[1.52, 2.98]]
  });

  // Atmosfera autentica da Camera Oscura: luce inattinica rossa rubino + bagliore ciano del visore negativi
  const hemi = new THREE.HemisphereLight(0x6e2b2b, 0x161820, 0.54);
  group.add(hemi);

  const rubySafelight1 = new THREE.PointLight(0xe62e2e, 5.4, 11.5, 1.6);
  rubySafelight1.position.set(-0.6, 3.65, -0.5);
  rubySafelight1.castShadow = true;
  rubySafelight1.shadow.bias = -0.0005;
  rubySafelight1.shadow.normalBias = 0.04;
  rubySafelight1.shadow.mapSize.set(1024, 1024);
  group.add(rubySafelight1);

  const warmBenchFill = new THREE.PointLight(0xe57c4e, 2.6, 8.5, 1.7);
  warmBenchFill.position.set(1.2, 2.6, 0.35);
  group.add(warmBenchFill);

  // Plafoniere rosse inattiniche appese al soffitto
  const safelightFixture = new THREE.Group();
  for (const lx of [-1.2, 1.1]) {
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8),
      makeRustMaterial(0x222428)
    );
    cord.position.set(lx, 3.96, -0.65);
    safelightFixture.add(cord);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0xff5252,
        emissive: new THREE.Color(0xd91818),
        emissiveIntensity: 2.2,
        roughness: 0.25
      })
    );
    bulb.position.set(lx, 3.68, -0.65);
    safelightFixture.add(bulb);
  }
  disableRaycast(safelightFixture);
  group.add(safelightFixture);

  // --- ARREDI SCENOGRAFICI DELLA CAMERA OSCURA ---
  // Fili tesi con stampe in bianco e nero appese ad asciugare
  const dryingLineBack = createPhotoDryingLine(5.8);
  dryingLineBack.root.position.set(-0.2, 2.86, -1.75);
  group.add(dryingLineBack.root);

  const dryingLineFront = createPhotoDryingLine(5.4);
  dryingLineFront.root.position.set(0.1, 2.98, -0.25);
  group.add(dryingLineFront.root);

  // Grande fotocamera a soffietto su treppiede (avanti a sinistra)
  const bellowsCam = createBellowsCameraOnTripod();
  bellowsCam.position.set(-2.35, 0, 0.15);
  bellowsCam.rotation.y = 0.65;
  group.add(bellowsCam);

  // Due scaffalature cariche di reagenti ambrati/cobalto e scatole di pellicola
  const shelfLeft = createReagentShelf({ width: 1.48, height: 2.4, depth: 0.4 });
  shelfLeft.position.set(-3.52, 0, -1.75);
  shelfLeft.rotation.y = Math.PI / 2;
  group.add(shelfLeft);

  const shelfRight = createReagentShelf({ width: 1.48, height: 2.4, depth: 0.4 });
  shelfRight.position.set(3.52, 0, -1.45);
  shelfRight.rotation.y = -Math.PI / 2;
  group.add(shelfRight);

  // Schedario metallico d'archivio negativi (fondo sinistra)
  const filingCab = new THREE.Group();
  filingCab.position.set(-2.78, 0, -3.22);
  const cabSteel = makeRustMaterial(0x3a434a, 0.48, 0.62);
  const brass = makeBrassMaterial(0xc89e54);
  const fcBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.48, 0.56), cabSteel);
  fcBody.position.y = 0.74;
  fcBody.castShadow = true;
  filingCab.add(fcBody);
  for (let d = 0; d < 4; d++) {
    const dy = 0.24 + d * 0.34;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.04), brass);
    handle.position.set(0, dy, 0.29);
    filingCab.add(handle);
  }
  disableRaycast(filingCab);
  group.add(filingCab);

  // --- 1. VISORE LUMINOSO PER NEGATIVI (LIGHTBOX) SULLA PARETE DI FONDO ---
  const lightboxGroup = new THREE.Group();
  lightboxGroup.position.set(-0.78, 1.88, -3.52);

  const lbCase = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 0.98, 0.12),
    makeRustMaterial(0x282d33, 0.52, 0.68)
  );
  lightboxGroup.add(lbCase);

  const lbTex = createLightboxTexture();
  const lbScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 0.86),
    new THREE.MeshStandardMaterial({
      map: lbTex,
      emissive: new THREE.Color(0x9cd0e6),
      emissiveMap: lbTex,
      emissiveIntensity: 0.95,
      roughness: 0.22
    })
  );
  lbScreen.position.z = 0.065;
  lightboxGroup.add(lbScreen);

  const lbGlow = new THREE.PointLight(0xa6dcf2, 2.5, 4.8, 1.8);
  lbGlow.position.set(0, 0, 0.55);
  lightboxGroup.add(lbGlow);

  tagInteractive(lightboxGroup, {
    id: 'negative_lightbox',
    label: 'Visore luminoso dei negativi',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      openDocument({
        meta: 'PROVINI A CONTATTO // ARCHIVIO FOTOGRAFICO VANE',
        title: 'Sequenza Armadietto Serra [ LAS · MAR · OND ]',
        html: `
          <p>Sul piano retroilluminato sono fissati tre spezzoni di pellicola 35mm con le annotazioni a matita grassa di Aldo Vane:</p>
          <div class="code-callout">
            • <strong>LAS</strong> — Numero del pontile sulla stampa latente nella vaschetta qui a fianco<br>
            • <strong>MAR : 2</strong> — Livello di bassa marea registrato sul negativo centrale<br>
            • <strong>OND</strong> — Valore sul quadrante barometrico esterno nella Serra
          </div>
          <p><em>Retro della busta:</em> «17 Nov. 1964 — Ho distrutto tutte le copie tranne l’ultima lastra nella bacinella. Senza il rivelatore freddo non apparirà nulla.»</p>
        `
      });
    }
  });
  group.add(lightboxGroup);

  // --- 2. BANCO UMIDO CON INGRANDITORE OTTICO + VASCHETTE DI SVILUPPO (CENTRO-DESTRA) ---
  const wetBench = new THREE.Group();
  wetBench.position.set(0.65, 0, -0.95);
  const benchWood = makeWoodMaterial('walnut', 0x6e5544, 0.48);
  const enamelWhite = makePorcelainMaterial(0xded8cc);
  const enamelRed = makePorcelainMaterial(0x7c2624);

  const benchDecor = new THREE.Group();
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.07, 0.88), benchWood);
  tableTop.position.y = 0.9;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  benchDecor.add(tableTop);

  for (const [lx, lz] of [[-0.84, -0.36], [0.84, -0.36], [-0.84, 0.36], [0.84, 0.36]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), benchWood);
    leg.position.set(lx, 0.45, lz);
    leg.castShadow = true;
    benchDecor.add(leg);
  }

  // Ingranditore fotografico verticale sul lato destro del banco (lascia libero il visore negativi sul fondo)
  const enlargerCol = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.92, 12), cabSteel);
  enlargerCol.position.set(0.66, 1.36, -0.18);
  benchDecor.add(enlargerCol);

  const enlargerHead = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 14), cabSteel);
  enlargerHead.position.set(0.66, 1.58, -0.02);
  benchDecor.add(enlargerHead);

  // Seconda vaschetta ausiliaria (bagno d'arresto) a sinistra
  const stopTray = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.34), enamelRed);
  stopTray.position.set(-0.58, 0.965, 0.02);
  benchDecor.add(stopTray);

  disableRaycast(benchDecor);
  wetBench.add(benchDecor);

  const traySpot = new THREE.PointLight(0xffb894, 2.8, 3.4, 1.7);
  traySpot.position.set(0.02, 1.68, 0.12);
  wetBench.add(traySpot);

  // Vaschetta principale di sviluppo (al centro del banco)
  const devTrayGroup = new THREE.Group();
  devTrayGroup.position.set(0.02, 0.94, 0.04);

  const trayRim = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.075, 0.44), enamelWhite);
  devTrayGroup.add(trayRim);

  const blankPhotoTex = createDevelopedPhotoTexture(false);
  const revealedPhotoTex = createDevelopedPhotoTexture(true);

  const photoSheetMat = new THREE.MeshStandardMaterial({
    map: blankPhotoTex,
    roughness: 0.32,
    metalness: 0.05
  });
  const photoSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.33), photoSheetMat);
  photoSheet.rotation.x = -Math.PI / 2;
  photoSheet.position.y = 0.041;
  devTrayGroup.add(photoSheet);

  // Velo liquido chimico trasparente sopra la stampa
  const chemLiquidMat = new THREE.MeshStandardMaterial({
    color: 0xc8dce2,
    roughness: 0.06,
    metalness: 0.35,
    transparent: true,
    opacity: 0.22
  });
  const chemLiquid = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.37), chemLiquidMat);
  chemLiquid.rotation.x = -Math.PI / 2;
  chemLiquid.position.y = 0.046;
  chemLiquid.userData.noHighlight = true;
  devTrayGroup.add(chemLiquid);

  tagInteractive(devTrayGroup, {
    id: 'developing_tray',
    get label() {
      return state.photoDeveloped
        ? 'Stampa sviluppata · LAS : 5'
        : 'Vaschetta con carta fotografica latente';
    },
    isEnabled: () => state.closeupId === 'tray',
    onClick: () => {
      if (state.photoDeveloped) {
        whisper('L’immagine sul fondo della vaschetta mostra nitidamente il molo e la scritta: LAS = 5.');
        return;
      }
      if (state.armedItem === 'developer_bottle') {
        consumeInventoryItem('developer_bottle');
        state.photoDeveloped = true;
        sound.playDrain();
        renderInventory();
        whisper('Versi il rivelatore argentico: i sali d’argento anneriscono e affiora la foto del molo — LAS = 5!');
      } else {
        sound.playDialTick(0.62);
        whisper('La bacinella è asciutta: serve il Rivelatore argentico per far emergere l’immagine latente.');
      }
    }
  });
  wetBench.add(devTrayGroup);

  const benchZoomProxy = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 1.1, 0.92),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  benchZoomProxy.position.set(0, 0.72, 0);
  benchZoomProxy.userData.noHighlight = true;
  tagInteractive(benchZoomProxy, {
    id: 'wetbench_zoom',
    label: 'Banco di sviluppo fotografico',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.enterCloseup('tray');
    }
  });
  wetBench.add(benchZoomProxy);
  group.add(wetBench);

  // --- 3. PORTA DI RITORNO -> SERRA D'INVERNO (FONDO DESTRA) ---
  const returnDoor = new THREE.Group();
  returnDoor.position.set(2.25, 0, -3.54);
  const frameMat = makeRustMaterial(0x2d3538, 0.5, 0.62);

  const conservatoryBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1.38, 2.58),
    new THREE.MeshBasicMaterial({ color: 0x162b2d })
  );
  conservatoryBackdrop.position.set(0, 1.29, -0.01);
  conservatoryBackdrop.userData.noHighlight = true;
  returnDoor.add(conservatoryBackdrop);

  for (const sx of [-0.72, 0.72]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.7, 0.16), frameMat);
    post.position.set(sx, 1.35, 0.02);
    returnDoor.add(post);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.16, 0.18), frameMat);
  lintel.position.set(0, 2.66, 0.02);
  returnDoor.add(lintel);

  tagInteractive(returnDoor, {
    id: 'back_to_greenhouse',
    kind: 'door',
    label: 'Serra d’Inverno',
    isEnabled: () => !state.closeupId,
    onClick: () => {
      actions.goToRoom('greenhouse');
    }
  });
  group.add(returnDoor);

  function syncFromState() {
    const desiredPhoto = state.photoDeveloped ? revealedPhotoTex : blankPhotoTex;
    if (photoSheet.material.map !== desiredPhoto) {
      photoSheet.material.map = desiredPhoto;
      photoSheet.material.needsUpdate = true;
    }
    chemLiquidMat.opacity = state.photoDeveloped ? 0.36 : 0.14;
    chemLiquidMat.color.setHex(state.photoDeveloped ? 0x9ec4d4 : 0xc8dce2);
  }

  function update(dt, elapsed) {
    dust.rotation.y = -elapsed * 0.015;

    // Leggero dondolio delle foto appese ai fili
    dryingLineBack.photos.forEach((p, idx) => {
      p.rotation.x = Math.sin(elapsed * 1.3 + idx * 0.9) * 0.045;
    });
    dryingLineFront.photos.forEach((p, idx) => {
      p.rotation.x = Math.cos(elapsed * 1.15 + idx * 0.8) * 0.04;
    });

    syncFromState();
  }

  syncFromState();

  return {
    id: 'darkroom',
    title: 'II · CAMERA OSCURA',
    group,
    defaultCamera: {
      pos: new THREE.Vector3(0, 1.82, 3.72),
      lookAt: new THREE.Vector3(0, 1.45, -2.5)
    },
    closeups: {
      tray: {
        pos: new THREE.Vector3(0.67, 1.86, -0.05),
        lookAt: new THREE.Vector3(0.67, 0.96, -0.92)
      }
    },
    update,
    syncFromState
  };
}
