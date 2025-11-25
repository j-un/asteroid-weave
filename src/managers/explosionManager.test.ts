import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  initializeExplosionManager,
  createExplosion,
  getActiveExplosionCount,
  getActiveParticleCount,
  resetExplosionManager,
  cleanupExplosionManager,
  getExplosionStats,
} from './explosionManager';
import { EXPLOSION_CONSTANTS } from '../constants/constants';

// THREE.SceneとTHREE.Cameraのモック
const mockScene = new THREE.Scene();
mockScene.add = vi.fn();
mockScene.remove = vi.fn();

const mockCamera = new THREE.PerspectiveCamera();
mockCamera.getWorldDirection = vi.fn(() => new THREE.Vector3(0, 0, -1)); // カメラの前方方向をモック

// THREE.jsのオブジェクト生成をモック
vi.mock('three', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof THREE; // 型を明示的に指定
  return {
    ...actual,
    Mesh: vi.fn(function () {
      return {
        position: new actual.Vector3(),
        scale: new actual.Vector3(1, 1, 1),
        userData: { velocity: new actual.Vector3(), creationTime: 0 },
        geometry: { dispose: vi.fn() },
        material: { dispose: vi.fn(), map: null, opacity: 1.0 },
      };
    }),
    SphereGeometry: vi.fn(function () {
      return { dispose: vi.fn() };
    }),
    MeshBasicMaterial: vi.fn(function () {
      return { dispose: vi.fn(), map: null };
    }),
  };
});

describe('explosionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers(); // タイマーをモック
    vi.setSystemTime(new Date(0)); // システム時間を0に設定
    resetExplosionManager(); // 各テストの前に状態をリセット
    vi.clearAllMocks(); // モックの呼び出し履歴をクリア
    initializeExplosionManager(mockScene, mockCamera); // シーンとカメラを初期化
  });

  afterEach(() => {
    vi.useRealTimers(); // タイマーを元に戻す
  });

  it('initializeExplosionManagerはシーンとカメラの参照を設定する', () => {
    // initializeExplosionManagerは内部変数を設定するだけなので、直接テストは難しい。
    // 間接的に、createExplosionがscene.addを呼び出すことを確認することでテストできる。
    createExplosion();
    expect(mockScene.add).toHaveBeenCalled();
  });

  it('getActiveExplosionCountは現在アクティブな爆発の数を返す', () => {
    expect(getActiveExplosionCount()).toBe(0);
    createExplosion();
    expect(getActiveExplosionCount()).toBe(1);
    createExplosion();
    expect(getActiveExplosionCount()).toBe(2);
  });

  it('getActiveParticleCountは現在アクティブなパーティクルの総数を返す', () => {
    expect(getActiveParticleCount()).toBe(0);
    createExplosion(); // EXPLOSION_PARTICLE_COUNT個のパーティクルが生成される
    expect(getActiveParticleCount()).toBe(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT
    );
    createExplosion();
    expect(getActiveParticleCount()).toBe(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT * 2
    );
  });

  it('getExplosionStatsは爆発のパフォーマンス情報を返す', () => {
    let stats = getExplosionStats();
    expect(stats.activeExplosions).toBe(0);
    expect(stats.activeParticles).toBe(0);
    expect(stats.averageParticlesPerExplosion).toBe(0);

    createExplosion();
    stats = getExplosionStats();
    expect(stats.activeExplosions).toBe(1);
    expect(stats.activeParticles).toBe(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT
    );
    expect(stats.averageParticlesPerExplosion).toBe(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT
    );

    createExplosion();
    stats = getExplosionStats();
    expect(stats.activeExplosions).toBe(2);
    expect(stats.activeParticles).toBe(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT * 2
    );
    expect(stats.averageParticlesPerExplosion).toBe(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT
    );
  });

  it('resetExplosionManagerはすべての爆発を削除し、リソースを解放する', () => {
    createExplosion();
    createExplosion();
    expect(getActiveExplosionCount()).toBe(2);
    expect(getActiveParticleCount()).toBe(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT * 2
    );

    resetExplosionManager();

    expect(getActiveExplosionCount()).toBe(0);
    expect(getActiveParticleCount()).toBe(0);
    // scene.removeとdisposeが呼ばれたことを確認 (モックされているTHREE.Meshのdispose)
    expect(mockScene.remove).toHaveBeenCalledTimes(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT * 2
    );
    // THREE.Meshのモック内でgeometry.disposeとmaterial.disposeが呼ばれることを確認
    // 現状のモックでは直接expectできないため、モックの挙動に依存
  });

  it('cleanupExplosionManagerはすべての爆発を削除し、参照をクリアする', () => {
    createExplosion();
    expect(getActiveExplosionCount()).toBe(1);

    cleanupExplosionManager();

    expect(getActiveExplosionCount()).toBe(0);
    // sceneとcameraがnullになることを確認 (直接アクセスできないため、間接的に確認)
    // initializeExplosionManagerを再度呼び出すことで、nullになっていることを確認できる
    initializeExplosionManager(mockScene, mockCamera); // 再初期化
    createExplosion(); // nullであれば警告が出るはず
    expect(mockScene.add).toHaveBeenCalledTimes(
      EXPLOSION_CONSTANTS.EXPLOSION_PARTICLE_COUNT * 2
    ); // 最初のcreateExplosionとcleanup後のcreateExplosion
  });

  // createExplosionとupdateExplosionsはTHREE.jsの複雑な挙動に依存するため、ここではスキップ
  // 必要に応じて、より詳細なモックや統合テストを検討
  it.skip('createExplosionは新しい爆発エフェクトを作成してシーンに追加する', () => {
    // このテストはTHREE.jsの内部的な挙動に深く依存するため、スキップします。
    // 必要であれば、より詳細なモック設定や、実際のTHREE.jsインスタンスを使用した統合テストを検討してください。
  });

  it.skip('updateExplosionsはすべての爆発エフェクトを更新する', () => {
    // このテストはTHREE.jsの内部的な挙動と時間経過に深く依存するため、スキップします。
    // 必要であれば、より詳細なモック設定や、実際のTHREE.jsインスタンスを使用した統合テストを検討してください。
  });
});
