import * as THREE from 'three';

// ---------- materials ----------
const SKIN = 0xd99e78;
const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.55, metalness: 0.0 });
const skinDark = new THREE.MeshStandardMaterial({ color: 0xc98a64, roughness: 0.6 });
const hairMat = new THREE.MeshStandardMaterial({ color: 0x241309, roughness: 0.45 });
const lipMat = new THREE.MeshStandardMaterial({ color: 0xb84a5e, roughness: 0.5 });
const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1d1410, roughness: 0.25 });

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

export interface Dancer {
  group: THREE.Group;
  update: (t: number, dancing: boolean) => void;
}

/** Procedural adult female dancer (~1.75 units tall). Stylized mannequin finish. */
export function makeDancer(): Dancer {
  const g = new THREE.Group();

  // ----- torso: lathe profile (radius, height), hips -> waist -> bust -> neck -----
  const profile: [number, number][] = [
    [0.001, 0.72], [0.07, 0.74], [0.115, 0.80], [0.148, 0.90], [0.156, 0.97],
    [0.142, 1.05], [0.118, 1.14], [0.122, 1.22], [0.138, 1.30], [0.146, 1.36],
    [0.124, 1.43], [0.094, 1.50], [0.062, 1.55], [0.052, 1.60],
  ];
  const torsoGeo = new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 28);
  const torso = mesh(torsoGeo, skinMat);
  g.add(torso);

  // ----- bust -----
  for (const s of [-1, 1]) {
    const b = mesh(new THREE.SphereGeometry(0.075, 18, 14), skinMat, s * 0.068, 1.365, 0.095);
    b.scale.set(1, 1.08, 0.92);
    g.add(b);
  }

  // ----- hips / pelvis group (for dance sway) -----
  const hips = new THREE.Group();
  hips.position.set(0, 0.95, 0);
  g.add(hips);

  // ----- legs (pivot at hips) -----
  const legL = new THREE.Group(); legL.position.set(-0.088, -0.03, 0);
  const legR = new THREE.Group(); legR.position.set(0.088, -0.03, 0);
  for (const leg of [legL, legR]) {
    const thigh = mesh(new THREE.CapsuleGeometry(0.068, 0.30, 6, 12), skinMat, 0, -0.21, 0);
    const knee = mesh(new THREE.SphereGeometry(0.055, 12, 10), skinMat, 0, -0.42, 0);
    const calf = mesh(new THREE.CapsuleGeometry(0.048, 0.28, 6, 12), skinMat, 0, -0.62, 0.01);
    const foot = mesh(new THREE.BoxGeometry(0.075, 0.05, 0.17), skinDark, 0, -0.855, 0.045);
    leg.add(thigh, knee, calf, foot);
    hips.add(leg);
  }

  // ----- arms (pivot at shoulders) -----
  const armL = new THREE.Group(); armL.position.set(-0.165, 1.46, 0);
  const armR = new THREE.Group(); armR.position.set(0.165, 1.46, 0);
  for (const arm of [armL, armR]) {
    const upper = mesh(new THREE.CapsuleGeometry(0.045, 0.20, 6, 12), skinMat, 0, -0.14, 0);
    const elbow = mesh(new THREE.SphereGeometry(0.04, 12, 10), skinMat, 0, -0.27, 0);
    const fore = mesh(new THREE.CapsuleGeometry(0.037, 0.18, 6, 12), skinMat, 0, -0.39, 0.01);
    const hand = mesh(new THREE.SphereGeometry(0.045, 12, 10), skinDark, 0, -0.52, 0.01);
    hand.scale.set(0.85, 1.15, 0.9);
    arm.add(upper, elbow, fore, hand);
    g.add(arm);
  }
  // rest pose: arms hang slightly out
  armL.rotation.z = 0.16; armR.rotation.z = -0.16;

  // ----- neck + head -----
  const neck = mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.12, 12), skinMat, 0, 1.60, 0);
  g.add(neck);
  const headG = new THREE.Group(); headG.position.set(0, 1.66, 0); g.add(headG);
  const skull = mesh(new THREE.SphereGeometry(0.105, 24, 18), skinMat, 0, 0.03, 0);
  skull.scale.set(0.92, 1.08, 0.96);
  headG.add(skull);
  // jaw taper
  const jaw = mesh(new THREE.SphereGeometry(0.075, 16, 12), skinMat, 0, -0.015, 0.02);
  jaw.scale.set(0.85, 0.85, 0.9);
  headG.add(jaw);
  // eyes
  for (const s of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.0135, 10, 8), eyeMat, s * 0.037, 0.045, 0.088);
    headG.add(eye);
    // upper lid line
    const lid = mesh(new THREE.BoxGeometry(0.034, 0.006, 0.008), hairMat, s * 0.037, 0.062, 0.088);
    lid.rotation.z = s * -0.12;
    headG.add(lid);
  }
  // nose (subtle)
  const nose = mesh(new THREE.SphereGeometry(0.011, 8, 8), skinDark, 0, 0.015, 0.098);
  headG.add(nose);
  // lips
  const lips = mesh(new THREE.SphereGeometry(0.02, 12, 10), lipMat, 0, -0.028, 0.092);
  lips.scale.set(1.7, 0.55, 0.7);
  headG.add(lips);

  // ----- hair: back mass + fringe cap + long fall -----
  const hairBack = mesh(new THREE.SphereGeometry(0.125, 20, 16), hairMat, 0, 1.70, -0.055);
  hairBack.scale.set(1.02, 1.35, 1.0);
  g.add(hairBack);
  const hairFall = mesh(new THREE.CylinderGeometry(0.085, 0.055, 0.52, 14), hairMat, 0, 1.32, -0.135);
  hairFall.rotation.x = 0.08;
  g.add(hairFall);
  const fringe = mesh(new THREE.SphereGeometry(0.108, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat, 0, 1.685, 0.012);
  fringe.scale.set(0.98, 0.9, 1.0);
  fringe.rotation.x = -0.5;
  g.add(fringe);
  // side locks
  for (const s of [-1, 1]) {
    const lock = mesh(new THREE.CapsuleGeometry(0.028, 0.22, 4, 8), hairMat, s * 0.105, 1.52, 0.01);
    lock.rotation.z = s * 0.1;
    g.add(lock);
  }

  // ----- animation -----
  const baseArmL = armL.rotation.z, baseArmR = armR.rotation.z;
  function update(t: number, dancing: boolean) {
    const a = dancing ? 1 : 0.25; // idle = quarter intensity
    const w = dancing ? 2.6 : 1.1; // tempo
    // breath
    const breath = Math.sin(t * 1.7) * 0.012 * (dancing ? 1.6 : 1);
    torso.scale.set(1 + breath, 1, 1 + breath * 1.4);
    // hips sway
    hips.rotation.z = Math.sin(t * w) * 0.07 * a;
    hips.rotation.y = Math.sin(t * w * 0.5) * 0.12 * a;
    hips.position.y = 0.95 + Math.abs(Math.sin(t * w)) * 0.02 * a;
    // torso counter-sway
    torso.rotation.z = Math.sin(t * w + 0.6) * -0.045 * a;
    torso.rotation.y = Math.sin(t * w * 0.5 + 1.2) * 0.06 * a;
    // arms: slow wave
    armL.rotation.z = baseArmL + Math.sin(t * w + 0.4) * 0.22 * a;
    armR.rotation.z = baseArmR - Math.sin(t * w + 1.1) * 0.22 * a;
    armL.rotation.x = Math.sin(t * w * 0.5) * 0.15 * a - 0.08 * a;
    armR.rotation.x = Math.sin(t * w * 0.5 + 2.2) * 0.15 * a - 0.08 * a;
    // head groove
    headG.rotation.y = Math.sin(t * w * 0.5 + 0.8) * 0.22 * a;
    headG.rotation.z = Math.sin(t * w + 2.0) * 0.06 * a;
    headG.rotation.x = Math.sin(t * 1.3) * 0.03;
    // legs: subtle weight shift
    legL.rotation.z = Math.sin(t * w) * 0.03 * a + 0.02;
    legR.rotation.z = Math.sin(t * w + Math.PI) * 0.03 * a - 0.02;
    // hair follows with lag
    hairBack.rotation.z = Math.sin(t * w + 1.4) * 0.05 * a;
    hairFall.rotation.z = Math.sin(t * w + 1.8) * 0.09 * a;
  }

  return { group: g, update };
}
