import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants/constants';
import { KeysPressed, AsteroidObject, CollisionResult } from '../types/types';

// 宇宙船の状態管理
export let targetSpaceshipX: number = 0;
export let targetSpaceshipY: number = 0;
export const spaceshipColliderSize: number = 1.8;

// 宇宙船オブジェクト（カメラを宇宙船として使用）
export let spaceship: THREE.PerspectiveCamera;

// 宇宙船の初期化（カメラを引数として受け取る）
export function initializeSpaceship(camera: THREE.PerspectiveCamera): void {
  spaceship = camera; // カメラを宇宙船として設定
  spaceship.position.set(0, 0, 5); // 宇宙船としての初期位置
  targetSpaceshipX = spaceship.position.x;
  targetSpaceshipY = spaceship.position.y;
}

// 宇宙船の目標位置をリセット
export function resetSpaceshipPosition(): void {
  if (spaceship) {
    spaceship.position.set(0, 0, 5);
    targetSpaceshipX = spaceship.position.x;
    targetSpaceshipY = spaceship.position.y;
  }
}

// キー入力やタッチ入力に基づく宇宙船の目標位置の更新
export function handleContinuousMovement(
  keysPressed: KeysPressed,
  isTouching: boolean,
  touchDirectionX: number,
  touchDirectionY: number
): void {
  const keyMoveStep = GAME_CONSTANTS.SPACESHIP_MOVE_SPEED * 0.16;

  if (keysPressed['arrowleft'] || keysPressed['a']) {
    targetSpaceshipX = Math.max(
      targetSpaceshipX - keyMoveStep,
      -GAME_CONSTANTS.FIELD_WIDTH / 2 + 1
    );
  }
  if (keysPressed['arrowright'] || keysPressed['d']) {
    targetSpaceshipX = Math.min(
      targetSpaceshipX + keyMoveStep,
      GAME_CONSTANTS.FIELD_WIDTH / 2 + 1
    );
  }
  if (keysPressed['arrowup'] || keysPressed['w']) {
    targetSpaceshipY = Math.min(
      targetSpaceshipY + keyMoveStep,
      GAME_CONSTANTS.FIELD_HEIGHT / 2 + 1
    );
  }
  if (keysPressed['arrowdown'] || keysPressed['s']) {
    targetSpaceshipY = Math.max(
      targetSpaceshipY - keyMoveStep,
      -GAME_CONSTANTS.FIELD_HEIGHT / 2 + 1
    );
  }

  if (isTouching) {
    const swipeMoveAmount = GAME_CONSTANTS.SPACESHIP_MOVE_SPEED * 0.16;
    if (touchDirectionX !== 0) {
      targetSpaceshipX += touchDirectionX * swipeMoveAmount;
      targetSpaceshipX = Math.max(
        -GAME_CONSTANTS.FIELD_WIDTH / 2 + 1,
        Math.min(GAME_CONSTANTS.FIELD_WIDTH / 2 + 1, targetSpaceshipX)
      );
    }
    if (touchDirectionY !== 0) {
      targetSpaceshipY += touchDirectionY * swipeMoveAmount;
      targetSpaceshipY = Math.max(
        -GAME_CONSTANTS.FIELD_HEIGHT / 2 + 1,
        Math.min(GAME_CONSTANTS.FIELD_HEIGHT / 2 + 1, targetSpaceshipY)
      );
    }
  }
}

// 宇宙船の現在位置を目標位置にスムーズに移動
export function updateSpaceshipPosition(): void {
  if (spaceship) {
    spaceship.position.x +=
      (targetSpaceshipX - spaceship.position.x) *
      GAME_CONSTANTS.SMOOTHING_FACTOR;
    spaceship.position.y +=
      (targetSpaceshipY - spaceship.position.y) *
      GAME_CONSTANTS.SMOOTHING_FACTOR;
  }
}

// 宇宙船と小惑星との衝突判定
export function checkCollisions(asteroids: AsteroidObject[]): CollisionResult {
  if (!spaceship) {
    return { hit: false };
  }

  const spaceshipBox = new THREE.Box3(
    new THREE.Vector3(
      spaceship.position.x - spaceshipColliderSize / 2,
      spaceship.position.y - spaceshipColliderSize / 2,
      spaceship.position.z - spaceshipColliderSize / 2
    ),
    new THREE.Vector3(
      spaceship.position.x + spaceshipColliderSize / 2,
      spaceship.position.y + spaceshipColliderSize / 2,
      spaceship.position.z + spaceshipColliderSize / 2
    )
  );

  for (let i = 0; i < asteroids.length; i++) {
    const asteroidObj = asteroids[i];
    if (!asteroidObj.mesh) continue;

    asteroidObj.boundingBox.setFromObject(asteroidObj.mesh);

    if (spaceshipBox.intersectsBox(asteroidObj.boundingBox)) {
      return { hit: true, impactPoint: asteroidObj.mesh.position.clone() };
    }
  }
  return { hit: false };
}

// 宇宙船の現在位置を取得
export function getSpaceshipPosition(): THREE.Vector3 {
  return spaceship ? spaceship.position.clone() : new THREE.Vector3();
}

// 目標位置を直接設定（デバッグ用など）
export function setTargetPosition(x: number, y: number): void {
  targetSpaceshipX = x;
  targetSpaceshipY = y;
}
