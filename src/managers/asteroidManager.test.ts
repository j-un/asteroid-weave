import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  initializeAsteroidManager,
  createAsteroid,
  getAsteroids,
  resetAsteroidManager,
} from './asteroidManager';
import { GAME_CONSTANTS, ASTEROID_CONSTANTS } from '../constants/constants';

// scene は add/remove が呼ばれる先として最低限のスタブで十分
const stubScene = {
  add: () => undefined,
  remove: () => undefined,
} as unknown as THREE.Scene;

describe('asteroidManager.createAsteroid', () => {
  beforeEach(() => {
    initializeAsteroidManager(stubScene);
    resetAsteroidManager();
  });

  it('到達点(自機Z平面)のXYがプレイ範囲内に収まる', () => {
    const SAMPLES = 2000;
    const halfW = GAME_CONSTANTS.FIELD_WIDTH / 2;
    const halfH = GAME_CONSTANTS.FIELD_HEIGHT / 2;
    const targetZ = ASTEROID_CONSTANTS.ASTEROID_TARGET_Z;

    for (let i = 0; i < SAMPLES; i++) createAsteroid();
    const asteroids = getAsteroids();
    expect(asteroids.length).toBe(SAMPLES);

    let inRange = 0;
    for (const a of asteroids) {
      const v = a.mesh.userData.velocity as THREE.Vector3;
      const frames = (targetZ - a.mesh.position.z) / v.z;
      const impactX = a.mesh.position.x + v.x * frames;
      const impactY = a.mesh.position.y + v.y * frames;
      if (Math.abs(impactX) <= halfW + 1e-6 && Math.abs(impactY) <= halfH + 1e-6) {
        inRange++;
      }
    }
    expect(inRange).toBe(SAMPLES);
  });

  it('到達点XYが4象限に均等に分布する', () => {
    const SAMPLES = 4000;
    for (let i = 0; i < SAMPLES; i++) createAsteroid();
    const asteroids = getAsteroids();

    const targetZ = ASTEROID_CONSTANTS.ASTEROID_TARGET_Z;
    const counts = [0, 0, 0, 0]; // [-x-y, +x-y, -x+y, +x+y]
    for (const a of asteroids) {
      const v = a.mesh.userData.velocity as THREE.Vector3;
      const frames = (targetZ - a.mesh.position.z) / v.z;
      const impactX = a.mesh.position.x + v.x * frames;
      const impactY = a.mesh.position.y + v.y * frames;
      const xi = impactX >= 0 ? 1 : 0;
      const yi = impactY >= 0 ? 1 : 0;
      counts[yi * 2 + xi]++;
    }

    const expected = SAMPLES / 4;
    // 4象限の偏差が期待値の15%以内 (一様乱数2000本あたりの標準偏差を吸収する余裕)
    for (const c of counts) {
      expect(Math.abs(c - expected) / expected).toBeLessThan(0.15);
    }
  });

  it('スポーン位置はドリフトの大きさによってプレイ範囲外まで広がる', () => {
    // 案Cでは到達点を一様にするためにドリフト分を逆算するので、
    // スポーン位置は SPAWN_Z 平面でプレイ範囲を超えうる。
    // この性質が崩れると四隅の安全地帯が再発するので回帰テストとして担保する。
    const SAMPLES = 2000;
    const halfW = GAME_CONSTANTS.FIELD_WIDTH / 2;

    for (let i = 0; i < SAMPLES; i++) createAsteroid();
    const asteroids = getAsteroids();

    const outsideCount = asteroids.filter(
      (a) => Math.abs(a.mesh.position.x) > halfW
    ).length;
    expect(outsideCount).toBeGreaterThan(0);
  });
});
