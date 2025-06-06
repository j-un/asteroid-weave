import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants/constants';

// シーン、カメラ、レンダラーのインスタンス
export let scene: THREE.Scene;
export let camera: THREE.PerspectiveCamera;
export let renderer: THREE.WebGLRenderer;

// シーンの作成
export function createScene(): THREE.Scene {
  scene = new THREE.Scene();
  return scene;
}

// カメラの作成
export function createCamera(): THREE.PerspectiveCamera {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  return camera;
}

// レンダラーの作成
export function createRenderer(): THREE.WebGLRenderer {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.domElement.setAttribute('tabindex', '0');
  renderer.domElement.style.outline = 'none';

  return renderer;
}

// ライトの作成
export function createLights(): void {
  const ambientLight = new THREE.AmbientLight(0x707070, 2.0 * Math.PI);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8 * Math.PI);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);
}

// 星空の作成
export function createStarfield(): void {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    fog: false,
  });
  const starVertices: number[] = [];

  for (let i = 0; i < 20000; i++) {
    const x = (Math.random() - 0.5) * 3000;
    const y = (Math.random() - 0.5) * 3000;
    const z = (Math.random() - 0.5) * 3000;
    if (
      Math.abs(z) > 150 ||
      Math.abs(x) > GAME_CONSTANTS.FIELD_WIDTH * 4 ||
      Math.abs(y) > GAME_CONSTANTS.FIELD_HEIGHT * 4
    ) {
      starVertices.push(x, y, z);
    }
  }

  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starVertices, 3)
  );
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

// 全体の初期化
export function initializeThreeJS(): void {
  createScene();
  createCamera();
  createRenderer();
  createLights();
  createStarfield();
}
