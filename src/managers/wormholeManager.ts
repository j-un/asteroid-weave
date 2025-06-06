import * as THREE from 'three';
import { WormholeObject } from '../types/types';
import {
  GAME_CONSTANTS,
  WORMHOLE_CONSTANTS,
  ASTEROID_CONSTANTS,
} from '../constants/constants';
import { disposeMaterial } from '../utils/utils';

// --- ワームホール管理の状態 ---
const wormholes: WormholeObject[] = [];

// シーンの参照
let scene: THREE.Scene;

// ワームホール通過時のコールバック関数の型定義
export interface WormholePassCallback {
  (bonusAmount: number, newWormholeBonusCount: number): void;
}

// ワームホール通過時のコールバック
let onWormholePass: WormholePassCallback | null = null;

/**
 * ワームホールマネージャーを初期化
 */
export function initializeWormholeManager(sceneRef: THREE.Scene): void {
  scene = sceneRef;
}

/**
 * ワームホール通過時のコールバックを設定
 */
export function setWormholePassCallback(callback: WormholePassCallback): void {
  onWormholePass = callback;
}

/**
 * 新しいワームホールを作成してシーンに追加
 */
export function createWormhole(): void {
  const geometry = new THREE.TorusGeometry(
    WORMHOLE_CONSTANTS.WORMHOLE_RADIUS,
    WORMHOLE_CONSTANTS.WORMHOLE_TUBE_RADIUS,
    16,
    50
  );
  const material = new THREE.MeshPhongMaterial({
    color: 0x330066,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8,
    shininess: 50,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const wormholeMesh = new THREE.Mesh(geometry, material);

  wormholeMesh.position.x =
    (Math.random() - 0.5) *
    GAME_CONSTANTS.FIELD_WIDTH *
    WORMHOLE_CONSTANTS.WORMHOLE_XY_SPAWN_RANGE_FACTOR;
  wormholeMesh.position.y =
    (Math.random() - 0.5) *
    GAME_CONSTANTS.FIELD_HEIGHT *
    WORMHOLE_CONSTANTS.WORMHOLE_XY_SPAWN_RANGE_FACTOR;
  wormholeMesh.position.z = WORMHOLE_CONSTANTS.WORMHOLE_SPAWN_FIXED_Z;

  wormholeMesh.userData.rotationAxis = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  ).normalize();
  wormholeMesh.userData.rotationSpeed =
    WORMHOLE_CONSTANTS.WORMHOLE_ROTATION_SPEED_MIN +
    Math.random() * WORMHOLE_CONSTANTS.WORMHOLE_ROTATION_SPEED_RANGE;

  wormholeMesh.userData.velocity = new THREE.Vector3(
    0,
    0,
    WORMHOLE_CONSTANTS.WORMHOLE_BASE_SPEED
  );

  // ワームホールの中心部分（黒い穴）を作成
  const holeCoverGeometry = new THREE.CircleGeometry(
    WORMHOLE_CONSTANTS.WORMHOLE_RADIUS -
      WORMHOLE_CONSTANTS.WORMHOLE_TUBE_RADIUS * 0.9,
    32
  );
  const holeCoverMaterial = new THREE.MeshBasicMaterial({
    color: 0x0c0c1e,
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide,
  });
  const holeCoverMesh = new THREE.Mesh(holeCoverGeometry, holeCoverMaterial);
  wormholeMesh.add(holeCoverMesh);

  const wormhole: WormholeObject = {
    mesh: wormholeMesh,
    createdAt: Date.now(),
    passed: false,
  };
  wormholes.push(wormhole);
  scene.add(wormholeMesh);
}

/**
 * すべてのワームホールの位置、回転を更新し、寿命管理を行う
 */
export function updateWormholes(): void {
  const currentTime = Date.now();
  for (let i = wormholes.length - 1; i >= 0; i--) {
    const wh = wormholes[i];
    if (wh.mesh) {
      // 位置更新
      wh.mesh.position.add(wh.mesh.userData.velocity);

      // 回転更新
      const axis = wh.mesh.userData.rotationAxis;
      const speed = wh.mesh.userData.rotationSpeed;
      if (axis && typeof speed === 'number') {
        const deltaRotation = new THREE.Quaternion().setFromAxisAngle(
          axis,
          speed
        );
        wh.mesh.quaternion.multiplyQuaternions(
          deltaRotation,
          wh.mesh.quaternion
        );
      }

      // 寿命管理：時間経過または画面外に出た場合は削除
      if (
        !wh.passed &&
        (currentTime - wh.createdAt >
          WORMHOLE_CONSTANTS.WORMHOLE_ACTIVE_DURATION ||
          wh.mesh.position.z > ASTEROID_CONSTANTS.ASTEROID_DESPAWN_Z)
      ) {
        scene.remove(wh.mesh);
        wh.mesh.geometry.dispose();
        disposeMaterial(wh.mesh.material);
        wormholes.splice(i, 1);
      }
    } else {
      wormholes.splice(i, 1);
    }
  }
}

/**
 * 宇宙船とワームホールの衝突判定を行う
 * @param spaceshipPosition 宇宙船の位置
 * @param internalDistanceTraveled ゲーム内部の進行距離
 * @param accumulatedWormholeBonus 累積ワームホールボーナス
 * @param wormholeBonusCount 現在のワームホールボーナス回数
 * @returns 衝突結果とボーナス情報
 */
export function checkWormholeCollision(
  spaceshipPosition: THREE.Vector3,
  internalDistanceTraveled: number,
  accumulatedWormholeBonus: number,
  wormholeBonusCount: number
): {
  hit: boolean;
  bonusAmount?: number;
  newWormholeBonusCount?: number;
  wormholePosition?: THREE.Vector3;
} {
  for (let i = wormholes.length - 1; i >= 0; i--) {
    const wh = wormholes[i];
    if (wh.passed || !wh.mesh) continue;

    if (
      Math.abs(spaceshipPosition.z - wh.mesh.position.z) <
      WORMHOLE_CONSTANTS.WORMHOLE_TUBE_RADIUS * 2
    ) {
      const distanceXY = Math.sqrt(
        Math.pow(spaceshipPosition.x - wh.mesh.position.x, 2) +
          Math.pow(spaceshipPosition.y - wh.mesh.position.y, 2)
      );
      if (
        distanceXY <
        WORMHOLE_CONSTANTS.WORMHOLE_RADIUS -
          WORMHOLE_CONSTANTS.WORMHOLE_TUBE_RADIUS
      ) {
        wh.passed = true;
        const newWormholeBonusCount = wormholeBonusCount + 1;

        // ボーナス計算
        const bonusPercentage = 0.1 + Math.random() * 0.05;
        const currentBaseDist = Math.pow(
          internalDistanceTraveled,
          ASTEROID_CONSTANTS.DISPLAY_DISTANCE_EXPONENT
        );
        const displayedDistanceBeforeThisBonus = Math.floor(
          currentBaseDist + accumulatedWormholeBonus
        );
        const bonusAmount = displayedDistanceBeforeThisBonus * bonusPercentage;

        // 通過エフェクトを作成
        createWormholePassEffect(wh.mesh.position);

        // ワームホールを削除
        const wormholePosition = wh.mesh.position.clone();
        scene.remove(wh.mesh);
        wh.mesh.geometry.dispose();
        disposeMaterial(wh.mesh.material);
        wormholes.splice(i, 1);

        // コールバック関数を呼び出し
        if (onWormholePass) {
          onWormholePass(bonusAmount, newWormholeBonusCount);
        }

        return {
          hit: true,
          bonusAmount,
          newWormholeBonusCount,
          wormholePosition,
        };
      }
    }
  }
  return { hit: false };
}

/**
 * ワームホール通過時のエフェクトを作成
 */
function createWormholePassEffect(position: THREE.Vector3): void {
  const passEffectMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
  });
  const passEffectGeom = new THREE.SphereGeometry(
    WORMHOLE_CONSTANTS.WORMHOLE_RADIUS * 1.5,
    16,
    16
  );
  const passEffect = new THREE.Mesh(passEffectGeom, passEffectMaterial);
  passEffect.position.copy(position);
  scene.add(passEffect);

  setTimeout(() => {
    scene.remove(passEffect);
    passEffect.geometry.dispose();
    passEffect.material.dispose();
  }, 300);
}

/**
 * 現在のワームホール数を取得
 */
export function getWormholeCount(): number {
  return wormholes.length;
}

/**
 * ワームホール管理状態をリセット
 */
export function resetWormholeManager(): void {
  // 既存のワームホールをすべて削除
  wormholes.forEach((wh) => {
    if (wh.mesh) {
      scene.remove(wh.mesh);
      wh.mesh.geometry.dispose();
      disposeMaterial(wh.mesh.material);
    }
  });
  wormholes.length = 0;
}

/**
 * クリーンアップ処理
 */
export function cleanupWormholeManager(): void {
  resetWormholeManager();
  onWormholePass = null;
}
