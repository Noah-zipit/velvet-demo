import * as THREE from 'three';
import { makeDancer } from './dancer';
import './style.css';

const app = document.getElementById('app')!;

// ---------- renderer / scene / camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0612);
scene.fog = new THREE.Fog(0x0a0612, 7, 16);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 60);
function frameCam() {
  const a = window.innerWidth / window.innerHeight;
  camera.aspect = a;
  const d = a < 0.8 ? 4.6 : 3.5;
  camera.position.set(0, 1.42, d);
  camera.lookAt(0, 1.02, 0);
  camera.updateProjectionMatrix();
}
frameCam();

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x8a7bb8, 0x1a0f24, 0.55));
const key = new THREE.SpotLight(0xfff1dd, 60, 20, 0.5, 0.45, 1.6);
key.position.set(1.6, 4.4, 2.6);
key.target.position.set(0, 1, 0);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key, key.target);
const neonPink = new THREE.PointLight(0xff2d78, 22, 12, 1.8);
neonPink.position.set(-2.6, 1.6, -1.4);
scene.add(neonPink);
const neonBlue = new THREE.PointLight(0x2d9bff, 22, 12, 1.8);
neonBlue.position.set(2.6, 1.2, -1.6);
scene.add(neonBlue);
const foot = new THREE.PointLight(0xffb46a, 6, 6, 1.8);
foot.position.set(0, 0.25, 1.6);
scene.add(foot);

// ---------- floor ----------
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(9, 48),
  new THREE.MeshStandardMaterial({ color: 0x161020, roughness: 0.32, metalness: 0.55 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
// glow ring around the stage spot
const ring = new THREE.Mesh(
  new THREE.RingGeometry(0.85, 0.95, 48),
  new THREE.MeshBasicMaterial({ color: 0xff2d78, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.005;
scene.add(ring);

// ---------- dance pole ----------
const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dce2, roughness: 0.15, metalness: 0.95 });
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 2.7, 16), chrome);
pole.position.set(0.62, 1.35, -0.12);
pole.castShadow = true;
scene.add(pole);
const poleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.05, 20), chrome);
poleBase.position.set(0.62, 0.025, -0.12);
scene.add(poleBase);

// ---------- neon strips on the back wall (club vibe) ----------
const stripGeo = new THREE.BoxGeometry(1.6, 0.07, 0.07);
const stripCols = [0xff2d78, 0x2d9bff, 0xff2d78, 0xb44dff, 0x2d9bff];
stripCols.forEach((c, i) => {
  const s = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: c }));
  s.position.set(-3.2 + i * 1.6, 2.4 + (i % 2) * 0.5, -4.2);
  scene.add(s);
});

// ---------- the dancer ----------
const dancer = makeDancer();
scene.add(dancer.group);

// ---------- interaction: drag to rotate, auto turntable ----------
let rotY = 0, autoRot = true, dragging = false, lastX = 0;
let dancing = true;
renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; autoRot = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  rotY += (e.clientX - lastX) * 0.008;
  lastX = e.clientX;
});
window.addEventListener('pointerup', () => { dragging = false; });

// ---------- UI ----------
const ui = document.createElement('div');
ui.id = 'ui';
ui.innerHTML = `
  <div class="title">VELVET <span>· procedural 3D character demo</span></div>
  <div class="hint">drag to rotate</div>
  <button id="danceBtn" class="pill on">dancing</button>
`;
app.appendChild(ui);
const danceBtn = document.getElementById('danceBtn')!;
danceBtn.addEventListener('click', () => {
  dancing = !dancing;
  danceBtn.textContent = dancing ? 'dancing' : 'idle';
  danceBtn.classList.toggle('on', dancing);
});

// ---------- 18+ gate ----------
const gate = document.createElement('div');
gate.id = 'gate';
gate.innerHTML = `
  <div class="card">
    <div class="age">18+</div>
    <p>This demo contains artistic adult nudity.<br/>Confirm you are 18 or older to enter.</p>
    <button id="enterBtn">I am 18+ — Enter</button>
  </div>
`;
app.appendChild(gate);
let entered = false;
document.getElementById('enterBtn')!.addEventListener('click', () => {
  entered = true;
  gate.classList.add('hidden');
});

// ---------- loop ----------
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  if (entered) {
    dancer.update(t, dancing);
    if (autoRot && !dragging) rotY += 0.0035;
    dancer.group.rotation.y = rotY;
    // neon pulse
    neonPink.intensity = 20 + Math.sin(t * 2.2) * 5;
    neonBlue.intensity = 20 + Math.sin(t * 2.2 + Math.PI) * 5;
  }
  renderer.render(scene, camera);
}
loop();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  frameCam();
});
