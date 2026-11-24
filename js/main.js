import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { resetState, state } from './state.js';
import { sound } from './audio.js';
import {
  hideWatermark,
  initUI,
  isModalOpen,
  renderInventory,
  setCloseupUI,
  setHoverFeedback,
  setRoomTitle,
  whisper
} from './ui.js';
import { buildVestibuleRoom } from './rooms/vestibule.js';
import { buildBoilerRoom } from './rooms/boiler.js';
import { buildControlRoom } from './rooms/control.js';

const canvas = document.getElementById('scene-canvas');
const roomFadeEl = document.getElementById('room-fade');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// --- RENDERER & SCENA ---
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const BASE_EXPOSURE = 1.06;
const BASE_ENV_INTENSITY = 0.38;
const BASE_FILL_INTENSITY = 0.48;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = BASE_EXPOSURE;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060709);
scene.fog = new THREE.FogExp2(0x07080b, 0.034);

// Riflessi PBR ambientali misurati: gli oggetti metallici emergono dall'ombra senza slavare la stanza
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.045).texture;
scene.environmentIntensity = BASE_ENV_INTENSITY;
pmremGenerator.dispose();

const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.08, 30);
// Riempimento debolissimo vicino all'osservatore per evitare il nero assoluto preservando il buio
const viewerFillLight = new THREE.PointLight(0x8896a6, BASE_FILL_INTENSITY, 10, 1.5);
camera.add(viewerFillLight);
scene.add(camera);

function applyBrightnessMultiplier(mult) {
  renderer.toneMappingExposure = BASE_EXPOSURE * mult;
  scene.environmentIntensity = BASE_ENV_INTENSITY * Math.pow(mult, 1.15);
  viewerFillLight.intensity = BASE_FILL_INTENSITY * Math.pow(mult, 1.35);
}

// Post-processing atmosferico discreto (Bloom morbido sulle luci e sui fosfori)
let composer = null;
let bloomPass = null;
try {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.28,
    0.52,
    0.82
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
} catch {
  composer = null;
}

function updateCameraProjection() {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  const aspect = w / h;
  camera.aspect = aspect;

  // Garantisce sia un FOV verticale minimo sia un FOV orizzontale minimo (così le pareti laterali restano sempre inquadrate)
  const minVFovDeg = state.closeupId ? 46 : 54;
  const minHFovDeg = state.closeupId ? 62 : 86;
  const minHFovRad = THREE.MathUtils.degToRad(minHFovDeg);
  const reqVFovForWidth = THREE.MathUtils.radToDeg(
    2 * Math.atan(Math.tan(minHFovRad / 2) / aspect)
  );

  camera.fov = Math.min(88, Math.max(minVFovDeg, reqVFovForWidth));
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  if (composer) {
    composer.setSize(w, h);
  }
}

window.addEventListener('resize', updateCameraProjection);

// --- AZIONI DI NAVIGAZIONE E VISUALE ---
let rooms = {};
let activeRoom = null;
let isTransitioning = false;

const camCurrentPos = new THREE.Vector3(0, 1.82, 3.72);
const camCurrentLook = new THREE.Vector3(0, 1.45, -2.5);
const camTargetPos = new THREE.Vector3().copy(camCurrentPos);
const camTargetLook = new THREE.Vector3().copy(camCurrentLook);

const pointerNDC = new THREE.Vector2(0, 0);
const smoothParallax = new THREE.Vector2(0, 0);
let pointerInside = false;

const actions = {
  goToRoom(roomId) {
    if (isTransitioning || !rooms[roomId] || state.currentRoom === roomId) return;
    isTransitioning = true;
    state.closeupId = null;
    setCloseupUI(false);
    clearHovered();
    sound.playDoorTransition();

    roomFadeEl.classList.add('is-visible');

    window.setTimeout(() => {
      if (activeRoom) {
        scene.remove(activeRoom.group);
      }
      state.currentRoom = roomId;
      activeRoom = rooms[roomId];
      activeRoom.syncFromState();
      scene.add(activeRoom.group);

      setRoomTitle(activeRoom.title);
      camTargetPos.copy(activeRoom.defaultCamera.pos);
      camTargetLook.copy(activeRoom.defaultCamera.lookAt);
      camCurrentPos.copy(camTargetPos);
      camCurrentLook.copy(camTargetLook);
      updateCameraProjection();

      window.setTimeout(() => {
        roomFadeEl.classList.remove('is-visible');
        isTransitioning = false;
      }, 90);
    }, 520);
  },

  enterCloseup(closeupId) {
    if (!activeRoom || !activeRoom.closeups[closeupId]) return;
    state.closeupId = closeupId;
    const target = activeRoom.closeups[closeupId];
    camTargetPos.copy(target.pos);
    camTargetLook.copy(target.lookAt);
    setCloseupUI(true);
    clearHovered();
    updateCameraProjection();
  },

  leaveCloseup() {
    if (!activeRoom || !state.closeupId) return;
    state.closeupId = null;
    camTargetPos.copy(activeRoom.defaultCamera.pos);
    camTargetLook.copy(activeRoom.defaultCamera.lookAt);
    setCloseupUI(false);
    clearHovered();
    updateCameraProjection();
  }
};

function buildAllRooms() {
  if (activeRoom) {
    scene.remove(activeRoom.group);
  }
  rooms = {
    vestibule: buildVestibuleRoom(actions),
    boiler: buildBoilerRoom(actions),
    control: buildControlRoom(actions)
  };
  activeRoom = rooms[state.currentRoom];
  scene.add(activeRoom.group);
  setRoomTitle(activeRoom.title);
  camTargetPos.copy(activeRoom.defaultCamera.pos);
  camTargetLook.copy(activeRoom.defaultCamera.lookAt);
  camCurrentPos.copy(camTargetPos);
  camCurrentLook.copy(camTargetLook);
  setCloseupUI(false);
  updateCameraProjection();
}

function restartGame() {
  roomFadeEl.classList.add('is-visible');
  sound.setPowerHum(false);
  window.setTimeout(() => {
    resetState();
    renderInventory();
    buildAllRooms();
    whisper('L’acqua gocciola dal soffitto di cemento. Il silenzio del sotterraneo è intatto.');
    window.setTimeout(() => {
      roomFadeEl.classList.remove('is-visible');
    }, 150);
  }, 480);
}

initUI({
  onLeaveCloseup: () => actions.leaveCloseup(),
  onRestart: restartGame,
  onBrightnessChange: applyBrightnessMultiplier
});

buildAllRooms();
renderInventory();

// Dissolvenza d'apertura morbida
window.requestAnimationFrame(() => {
  window.setTimeout(() => {
    roomFadeEl.classList.remove('is-visible');
    whisper('Aria umida e odore di ruggine. Trova un modo per riattivare la Soglia.');
  }, 180);
});

// --- RAYCASTING E MICRO-FEEDBACK VISIVI ---
const raycaster = new THREE.Raycaster();
let hoveredInteractive = null;
const hoverTint = new THREE.Color(0x5c3416);

function isVisibleInHierarchy(obj) {
  let cur = obj;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

function findInteractiveTarget(object3D) {
  let cur = object3D;
  while (cur) {
    const inter = cur.userData?.interactive;
    if (inter && inter.isEnabled()) {
      return inter;
    }
    cur = cur.parent;
  }
  return null;
}

function applyHighlight(inter, active) {
  if (!inter || !inter.highlightMeshes) return;
  for (const mesh of inter.highlightMeshes) {
    if (!mesh.material || !mesh.material.emissive) continue;
    if (active) {
      mesh.material.emissive.copy(mesh.userData.baseEmissive).add(hoverTint);
    } else {
      mesh.material.emissive.copy(mesh.userData.baseEmissive);
      mesh.material.emissiveIntensity = mesh.userData.baseEmissiveIntensity;
    }
  }
}

function clearHovered() {
  if (hoveredInteractive) {
    applyHighlight(hoveredInteractive, false);
    hoveredInteractive = null;
  }
  setHoverFeedback(null);
}

function updateRaycast() {
  if (!activeRoom || isTransitioning || isModalOpen() || !pointerInside) {
    clearHovered();
    return;
  }

  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(activeRoom.group.children, true);

  let found = null;
  for (const hit of hits) {
    if (!isVisibleInHierarchy(hit.object)) continue;
    const candidate = findInteractiveTarget(hit.object);
    if (candidate) {
      found = candidate;
      break;
    }
  }

  if (found !== hoveredInteractive) {
    if (hoveredInteractive) applyHighlight(hoveredInteractive, false);
    hoveredInteractive = found;
    if (hoveredInteractive) {
      applyHighlight(hoveredInteractive, true);
      sound.playSoftHover();
    }
  }

  if (hoveredInteractive) {
    applyHighlight(hoveredInteractive, true);
    setHoverFeedback(hoveredInteractive.label, hoveredInteractive.kind);
  } else {
    setHoverFeedback(null);
  }
}

canvas.addEventListener('pointermove', (e) => {
  pointerInside = true;
  pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

canvas.addEventListener('pointerleave', () => {
  pointerInside = false;
  clearHovered();
});

let downPos = { x: 0, y: 0 };
canvas.addEventListener('pointerdown', (e) => {
  downPos = { x: e.clientX, y: e.clientY };
  pointerInside = true;
  pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  sound.init();
  hideWatermark();
});

canvas.addEventListener('click', (e) => {
  if (isTransitioning || isModalOpen()) return;
  if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 14) return;

  pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  updateRaycast();

  if (hoveredInteractive) {
    state.interactions += 1;
    hoveredInteractive.onClick();
    updateRaycast();
  } else if (state.closeupId && (Math.abs(pointerNDC.x) > 0.72 || Math.abs(pointerNDC.y) > 0.72)) {
    // Clic sui margini esterni dello schermo per allontanarsi senza uscite accidentali vicino ai controlli
    actions.leaveCloseup();
  }
});

// --- LOOP PRINCIPALE DI RENDERING ---
const clock = new THREE.Clock();
const camRight = new THREE.Vector3();
const camUp = new THREE.Vector3();
const camForward = new THREE.Vector3();
const finalCamPos = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.elapsedTime;

  const camLerp = Math.min(1, dt * 6.2);
  camCurrentPos.lerp(camTargetPos, camLerp);
  camCurrentLook.lerp(camTargetLook, camLerp);

  const allowParallax = !reducedMotionQuery.matches;
  const targetPx = allowParallax && pointerInside ? pointerNDC.x : 0;
  const targetPy = allowParallax && pointerInside ? pointerNDC.y : 0;
  smoothParallax.x += (targetPx - smoothParallax.x) * Math.min(1, dt * 5);
  smoothParallax.y += (targetPy - smoothParallax.y) * Math.min(1, dt * 5);

  const ampX = state.closeupId ? 0.018 : 0.14;
  const ampY = state.closeupId ? 0.012 : 0.08;

  camForward.subVectors(camCurrentLook, camCurrentPos).normalize();
  camRight.crossVectors(camForward, THREE.Object3D.DEFAULT_UP).normalize();
  camUp.crossVectors(camRight, camForward).normalize();

  finalCamPos.copy(camCurrentPos)
    .addScaledVector(camRight, smoothParallax.x * ampX)
    .addScaledVector(camUp, smoothParallax.y * ampY);

  camera.position.copy(finalCamPos);
  camera.lookAt(camCurrentLook);

  if (activeRoom) {
    activeRoom.update(dt, elapsed);
  }

  updateRaycast();

  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

animate();
