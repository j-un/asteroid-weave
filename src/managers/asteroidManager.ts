import * as THREE from 'three';
import { AsteroidObject } from '../types/types';
import { GAME_CONSTANTS, ASTEROID_CONSTANTS } from '../constants/constants';
import { disposeMaterial } from '../utils/utils';

// --- 小惑星管理の状態 ---
const asteroids: AsteroidObject[] = [];
let currentDynamicAsteroidSpeed: number =
  ASTEROID_CONSTANTS.INITIAL_ASTEROID_SPEED;
let lastAsteroidSpawnTime: number = 0;

// シーンの参照
let scene: THREE.Scene;

/**
 * 小惑星マネージャーを初期化
 */
export function initializeAsteroidManager(sceneRef: THREE.Scene): void {
  scene = sceneRef;
}

/**
 * 新しい小惑星を作成してシーンに追加
 */
export function createAsteroid(): void {
  const radius = Math.random() * 3.5 + 0.5;
  const geometry = new THREE.IcosahedronGeometry(radius, 0);
  const material = new THREE.MeshStandardMaterial({
    color: Math.random() * 0x999999 + 0x333333,
    roughness: 0.6 + Math.random() * 0.3,
    metalness: 0.1 + Math.random() * 0.3,
  });
  const asteroid = new THREE.Mesh(geometry, material);
  asteroid.userData.radius = radius;

  asteroid.position.x = (Math.random() - 0.5) * GAME_CONSTANTS.FIELD_WIDTH;
  asteroid.position.y = (Math.random() - 0.5) * GAME_CONSTANTS.FIELD_HEIGHT;
  asteroid.position.z = ASTEROID_CONSTANTS.ASTEROID_SPAWN_Z;

  asteroid.rotation.x = Math.random() * 2 * Math.PI;
  asteroid.rotation.y = Math.random() * 2 * Math.PI;
  asteroid.rotation.z = Math.random() * 2 * Math.PI;

  asteroid.userData.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * ASTEROID_CONSTANTS.ASTEROID_XY_SWAY_FACTOR,
    (Math.random() - 0.5) * ASTEROID_CONSTANTS.ASTEROID_XY_SWAY_FACTOR,
    currentDynamicAsteroidSpeed +
      Math.random() * ASTEROID_CONSTANTS.ASTEROID_SPEED_RANDOM_ADD_MAX
  );

  const boundingBox = new THREE.Box3().setFromObject(asteroid);
  asteroids.push({ mesh: asteroid, boundingBox: boundingBox });
  scene.add(asteroid);
}

/**
 * すべての小惑星の位置と回転を更新し、画面外の小惑星を削除
 */
export function updateAsteroids(): void {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroidObj = asteroids[i];
    if (!asteroidObj.mesh) continue;

    // 位置更新
    asteroidObj.mesh.position.add(asteroidObj.mesh.userData.velocity);

    // 回転更新
    asteroidObj.mesh.rotation.x += 0.015;
    asteroidObj.mesh.rotation.y += 0.015;

    // 画面外に出た小惑星を削除
    if (asteroidObj.mesh.position.z > ASTEROID_CONSTANTS.ASTEROID_DESPAWN_Z) {
      scene.remove(asteroidObj.mesh);
      asteroidObj.mesh.geometry.dispose();
      disposeMaterial(asteroidObj.mesh.material);
      asteroids.splice(i, 1);
    }
  }
}

/**
 * ゲーム進行に応じて小惑星の速度を更新
 */
export function updateAsteroidSpeed(internalDistanceTraveled: number): void {
  currentDynamicAsteroidSpeed =
    ASTEROID_CONSTANTS.INITIAL_ASTEROID_SPEED +
    Math.pow(internalDistanceTraveled, 2) *
      ASTEROID_CONSTANTS.ASTEROID_SPEED_INCREMENT_FACTOR;
}

/**
 * 小惑星のスポーンタイミングをチェックし、必要に応じて新しい小惑星を生成
 */
export function handleAsteroidSpawning(): boolean {
  const currentTime = Date.now();

  if (
    currentTime - lastAsteroidSpawnTime >=
      ASTEROID_CONSTANTS.ASTEROID_SPAWN_INTERVAL &&
    asteroids.length < 120
  ) {
    createAsteroid();
    lastAsteroidSpawnTime = currentTime;
    return true;
  }

  return false;
}

/**
 * 現在の小惑星配列を取得
 */
export function getAsteroids(): AsteroidObject[] {
  return asteroids;
}

/**
 * 現在の小惑星数を取得
 */
export function getAsteroidCount(): number {
  return asteroids.length;
}

/**
 * 現在の動的小惑星速度を取得
 */
export function getCurrentAsteroidSpeed(): number {
  return currentDynamicAsteroidSpeed;
}

/**
 * 小惑星管理状態をリセット
 */
export function resetAsteroidManager(): void {
  // 既存の小惑星をすべて削除
  asteroids.forEach((asteroidObj) => {
    if (asteroidObj.mesh) {
      scene.remove(asteroidObj.mesh);
      asteroidObj.mesh.geometry.dispose();
      disposeMaterial(asteroidObj.mesh.material);
    }
  });
  asteroids.length = 0;

  // 状態をリセット
  currentDynamicAsteroidSpeed = ASTEROID_CONSTANTS.INITIAL_ASTEROID_SPEED;
  lastAsteroidSpawnTime = 0;
}

/**
 * クリーンアップ処理
 */
export function cleanupAsteroidManager(): void {
  resetAsteroidManager();
}
