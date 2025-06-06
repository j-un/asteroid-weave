import * as THREE from 'three';
import { ExplosionParticle, Explosion } from '../types/types';
import { EXPLOSION_CONSTANTS } from '../constants/constants';

// --- 爆発エフェクト管理の状態 ---
const explosions: Explosion[] = [];

// シーンとカメラの参照
let scene: THREE.Scene | null = null;
let camera: THREE.Camera | null = null;

/**
 * 爆発マネージャーを初期化
 */
export function initializeExplosionManager(
  sceneRef: THREE.Scene,
  cameraRef: THREE.Camera
): void {
  scene = sceneRef;
  camera = cameraRef;
}

/**
 * 爆発エフェクトを作成してシーンに追加
 */
export function createExplosion(): void {
  if (!scene || !camera) {
    console.warn('爆発マネージャーが初期化されていません');
    return;
  }

  const explosion: Explosion = {
    particles: [],
    startTime: performance.now(),
  };

  // カメラの前方方向を取得して爆発の中心位置を決定
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const spawnPosition = new THREE.Vector3()
    .copy(camera.position)
    .addScaledVector(
      forward,
      EXPLOSION_CONSTANTS.EXPLOSION_CENTER_DISTANCE_OFFSET
    );

  // 指定された数のパーティクルを生成
  for (let i = 0; i < EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT; i++) {
    const particle = createExplosionParticle(
      spawnPosition,
      explosion.startTime
    );
    scene.add(particle);
    explosion.particles.push(particle);
  }

  explosions.push(explosion);
}

/**
 * 個別の爆発パーティクルを作成
 * @param spawnPosition パーティクルの生成位置
 * @param creationTime パーティクルの作成時刻
 * @returns 作成されたパーティクル
 */
function createExplosionParticle(
  spawnPosition: THREE.Vector3,
  creationTime: number
): ExplosionParticle {
  // パーティクルのサイズをランダムに決定
  const particleRadius = (0.2 + Math.random() * 0.3) * 3.0;

  // パーティクルのジオメトリとマテリアルを作成
  const particleGeometry = new THREE.SphereGeometry(particleRadius, 5, 5);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd66,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const baseMesh = new THREE.Mesh(particleGeometry, particleMaterial);
  baseMesh.position.copy(spawnPosition);

  // パーティクルの速度を計算
  const speed =
    EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_BASE_SPEED *
    (EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_SPEED_BASE_FACTOR +
      Math.random() *
        EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_SPEED_RANDOM_FACTOR);

  // ランダムな方向に速度ベクトルを設定
  baseMesh.userData.velocity = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  )
    .normalize()
    .multiplyScalar(speed);

  baseMesh.userData.creationTime = creationTime;

  return baseMesh as ExplosionParticle;
}

/**
 * すべての爆発エフェクトを更新
 * パーティクルの移動、スケール変更、透明度変更、寿命管理を行う
 */
export function updateExplosions(): void {
  const currentTime = performance.now();

  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    let allParticlesExpired = true;

    // 各爆発の全パーティクルを更新
    for (let j = explosion.particles.length - 1; j >= 0; j--) {
      const particle = explosion.particles[j];
      const timeElapsedMs = currentTime - particle.userData.creationTime;
      const lifetimeMs =
        EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_LIFETIME_SECONDS * 1000;

      if (timeElapsedMs < lifetimeMs) {
        allParticlesExpired = false;

        // パーティクルを更新
        updateParticle(particle, timeElapsedMs, lifetimeMs);
      } else {
        // 寿命が尽きたパーティクルを削除
        removeParticle(particle);
        explosion.particles.splice(j, 1);
      }
    }

    // すべてのパーティクルが消滅した爆発を削除
    if (allParticlesExpired && explosion.particles.length === 0) {
      explosions.splice(i, 1);
    }
  }
}

/**
 * 個別のパーティクルを更新
 * @param particle 更新するパーティクル
 * @param timeElapsedMs 経過時間（ミリ秒）
 * @param lifetimeMs 寿命（ミリ秒）
 */
function updateParticle(
  particle: ExplosionParticle,
  timeElapsedMs: number,
  lifetimeMs: number
): void {
  // 速度を減衰させる
  particle.userData.velocity.multiplyScalar(
    EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_VELOCITY_DAMPING
  );

  // 位置を更新（60FPSを想定した固定時間ステップ）
  particle.position.addScaledVector(particle.userData.velocity, 0.016);

  // 寿命に基づく比率を計算
  const lifeRatio = timeElapsedMs / lifetimeMs;

  // スケールを時間とともに縮小
  const scale = Math.max(0.01, 1.0 - lifeRatio);
  particle.scale.set(scale, scale, scale);

  // 透明度を時間とともに減少（二次関数的に減衰）
  particle.material.opacity = Math.max(0, 1.0 - lifeRatio * lifeRatio);
}

/**
 * パーティクルをシーンから削除し、リソースを解放
 * @param particle 削除するパーティクル
 */
function removeParticle(particle: ExplosionParticle): void {
  if (scene) { // sceneがnullでないことを確認
    scene.remove(particle);
  }
  particle.geometry.dispose();

  // テクスチャがある場合は解放
  if (particle.material.map) {
    particle.material.map.dispose();
  }
  particle.material.dispose();
}

/**
 * 現在アクティブな爆発の数を取得
 */
export function getActiveExplosionCount(): number {
  return explosions.length;
}

/**
 * 現在アクティブなパーティクルの総数を取得
 */
export function getActiveParticleCount(): number {
  return explosions.reduce(
    (total, explosion) => total + explosion.particles.length,
    0
  );
}

/**
 * 爆発のパフォーマンス情報を取得
 * @returns アクティブな爆発とパーティクルの数を含むオブジェクト
 */
export function getExplosionStats(): {
  activeExplosions: number;
  activeParticles: number;
  averageParticlesPerExplosion: number;
} {
  const activeExplosions = getActiveExplosionCount();
  const activeParticles = getActiveParticleCount();
  const averageParticlesPerExplosion =
    activeExplosions > 0 ? activeParticles / activeExplosions : 0;

  return {
    activeExplosions,
    activeParticles,
    averageParticlesPerExplosion,
  };
}

/**
 * 爆発マネージャーの状態をリセット
 * すべての爆発エフェクトを削除し、リソースを解放
 */
export function resetExplosionManager(): void {
  explosions.forEach((explosion) => {
    explosion.particles.forEach((particle) => {
      removeParticle(particle);
    });
  });
  explosions.length = 0;
}

/**
 * クリーンアップ処理
 * すべてのリソースを解放し、参照をクリア
 */
export function cleanupExplosionManager(): void {
  resetExplosionManager();
  scene = null;
  camera = null;
}
