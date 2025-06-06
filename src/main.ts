import { GameState } from './types/types';
import * as Constants from './constants/constants';
import { formatNumberWithCommas } from './utils/utils';
import * as SceneSetup from './core/sceneSetup';
import * as Spaceship from './core/spaceship';
import * as InputHandler from './core/inputHandler';
import * as AsteroidManager from './managers/asteroidManager';
import * as WormholeManager from './managers/wormholeManager';
import * as ExplosionManager from './managers/explosionManager';
import * as UIManager from './managers/uiManager';

// --- グローバル変数 ---
let internalDistanceTraveled: number = 0;
let displayedDistance: number = 0;
let accumulatedWormholeBonus: number = 0;

let gameOver: boolean = false;
let gameState: GameState = 'opening';

// ウィンドウリサイズ処理
function onWindowResize(): void {
  SceneSetup.camera.aspect = window.innerWidth / window.innerHeight;
  SceneSetup.camera.updateProjectionMatrix();
  SceneSetup.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ワームホール通過時のコールバック関数
function handleWormholePass(
  bonusAmount: number,
  newWormholeBonusCount: number
): void {
  UIManager.updateWormholeBonusCount(newWormholeBonusCount);

  // 累積ボーナスを更新
  accumulatedWormholeBonus += bonusAmount;

  // ボーナスメッセージを表示
  UIManager.showWormholeBonusMessage(
    'Wormhole Bonus!<br>Distance +' +
      formatNumberWithCommas(Math.floor(bonusAmount)) +
      ' km'
  );
}

// 初期化
async function init(): Promise<void> {
  // 1. UIマネージャーの初期化
  UIManager.initializeUIManager();

  // 2. SVGロゴを読み込み
  await UIManager.loadLogo();

  // 3. Three.js基本環境の初期化
  SceneSetup.initializeThreeJS();

  // 4. 小惑星マネージャーの初期化
  AsteroidManager.initializeAsteroidManager(SceneSetup.scene);

  // 5. ワームホールマネージャーの初期化
  WormholeManager.initializeWormholeManager(SceneSetup.scene);
  WormholeManager.setWormholePassCallback(handleWormholePass);

  // 6. 爆発エフェクトマネージャーの初期化
  ExplosionManager.initializeExplosionManager(
    SceneSetup.scene,
    SceneSetup.camera
  );

  // 7. 宇宙船の初期化
  Spaceship.initializeSpaceship(SceneSetup.camera);

  // 8. 入力ハンドラーの初期化
  InputHandler.initializeInputHandlers(
    SceneSetup.renderer.domElement,
    attemptStartGame
  );

  // 9. UIのゲーム開始コールバックを設定
  UIManager.setGameStartCallback(attemptStartGame);

  // 初期UI状態の設定
  if (gameState === 'opening') {
    UIManager.showOpeningScreen();
  } else {
    startGame();
  }

  // ウィンドウリサイズイベントリスナーを追加
  window.addEventListener('resize', onWindowResize, false);

  resetGame();
  animate();
}

function attemptStartGame(): void {
  if (gameState === 'opening' || gameState === 'gameover') {
    startGame();
  }
}

function startGame(): void {
  gameState = 'playing';
  gameOver = false;

  // 入力ハンドラーにゲーム状態を通知
  InputHandler.updateGameState(gameState, gameOver);

  // UI表示をゲーム画面に切り替え
  UIManager.showGameScreen();
  resetGame();

  if (SceneSetup.renderer && SceneSetup.renderer.domElement) {
    SceneSetup.renderer.domElement.focus();
  }
}

// ゲームのリセット
function resetGame(): void {
  internalDistanceTraveled = 0;
  displayedDistance = 0;
  accumulatedWormholeBonus = 0;

  Spaceship.resetSpaceshipPosition();
  InputHandler.resetInputState();
  AsteroidManager.resetAsteroidManager();
  WormholeManager.resetWormholeManager();
  ExplosionManager.resetExplosionManager();
  UIManager.resetUIState();

  // 初期表示の更新
  const baseSpeedForDisplay = Math.floor(
    AsteroidManager.getCurrentAsteroidSpeed() *
      Constants.ASTEROID_CONSTANTS.KMH_SCALING_FACTOR
  );
  const baseDisplayedDistanceForReset = Math.pow(
    internalDistanceTraveled,
    Constants.ASTEROID_CONSTANTS.DISPLAY_DISTANCE_EXPONENT
  );
  const bonusSpeedFromDistance = Math.floor(
    baseDisplayedDistanceForReset *
      Constants.ASTEROID_CONSTANTS.SPEED_BONUS_FACTOR_FROM_DISTANCE
  );
  const initialFinalDisplaySpeed = baseSpeedForDisplay + bonusSpeedFromDistance;

  UIManager.updateScoreDisplay(displayedDistance);
  UIManager.updateSpeedDisplay(initialFinalDisplaySpeed);
}

// アニメーションループ
function animate(): void {
  requestAnimationFrame(animate);

  // 爆発エフェクトの更新
  ExplosionManager.updateExplosions();

  if (gameState === 'opening') {
    // Opening screen logic
  } else if (gameState === 'playing') {
    if (!gameOver) {
      // inputHandlerから入力状態を取得
      const touchState = InputHandler.getTouchState();

      // 宇宙船の移動処理
      Spaceship.handleContinuousMovement(
        InputHandler.keysPressed,
        touchState.isTouching,
        touchState.touchDirectionX,
        touchState.touchDirectionY
      );
      Spaceship.updateSpaceshipPosition();

      AsteroidManager.updateAsteroidSpeed(internalDistanceTraveled);
      WormholeManager.updateWormholes();

      // 表示Distanceの基礎値 (ボーナス抜き) : internalDistanceTraveled の DISPLAY_DISTANCE_EXPONENT 乗算
      const baseDisplayedDistance = Math.pow(
        internalDistanceTraveled,
        Constants.ASTEROID_CONSTANTS.DISPLAY_DISTANCE_EXPONENT
      );
      // 最終的な表示Distance (ワームホールボーナス込み)
      displayedDistance = Math.floor(
        baseDisplayedDistance + accumulatedWormholeBonus
      );

      // 表示Speedの計算 (ボーナス抜きのDistance基礎値を使用)
      const baseSpeedForDisplay = Math.floor(
        AsteroidManager.getCurrentAsteroidSpeed() *
          Constants.ASTEROID_CONSTANTS.KMH_SCALING_FACTOR
      );
      const speedBonusFromBaseDistance = Math.floor(
        baseDisplayedDistance *
          Constants.ASTEROID_CONSTANTS.SPEED_BONUS_FACTOR_FROM_DISTANCE
      );
      const finalDisplaySpeed =
        baseSpeedForDisplay + speedBonusFromBaseDistance;

      // UI表示を更新
      UIManager.updateSpeedDisplay(finalDisplaySpeed);
      UIManager.updateScoreDisplay(displayedDistance);

      // 内部的な進行度を更新
      internalDistanceTraveled +=
        Constants.ASTEROID_CONSTANTS.INTERNAL_DISTANCE_INCREMENT_PER_FRAME;

      // 宇宙速度到達メッセージ表示判定
      if (
        finalDisplaySpeed >=
        Constants.COSMIC_VELOCITY_CONSTANTS.FIRST_COSMIC_VELOCITY_KMH
      ) {
        UIManager.showFirstCosmicVelocityMessage();
      }

      if (
        finalDisplaySpeed >=
        Constants.COSMIC_VELOCITY_CONSTANTS.SECOND_COSMIC_VELOCITY_KMH
      ) {
        UIManager.showSecondCosmicVelocityMessage();
      }

      if (
        finalDisplaySpeed >=
        Constants.COSMIC_VELOCITY_CONSTANTS.THIRD_COSMIC_VELOCITY_KMH
      ) {
        UIManager.showThirdCosmicVelocityMessage();
      }

      // 小惑星とワームホールのスポーン処理
      if (
        Math.random() <
          Constants.WORMHOLE_CONSTANTS.WORMHOLE_SPAWN_PROBABILITY &&
        WormholeManager.getWormholeCount() < 1
      ) {
        WormholeManager.createWormhole();
      } else {
        AsteroidManager.handleAsteroidSpawning();
      }

      AsteroidManager.updateAsteroids();

      // ワームホール衝突判定を実行
      const wormholeCollisionResult = WormholeManager.checkWormholeCollision(
        Spaceship.spaceship.position,
        internalDistanceTraveled,
        accumulatedWormholeBonus,
        UIManager.getWormholeBonusCount()
      );

      // ワームホールに衝突した場合の処理
      if (wormholeCollisionResult.hit) {
        // ワームホール通過時の処理をここに追加
        // handleWormholePassはWormholeManager内で呼び出されるため、ここでは追加の処理は不要
      }

      // 小惑星との衝突判定
      // spaceshipモジュールを使用、asteroidManagerから小惑星配列を取得
      const collisionResult = Spaceship.checkCollisions(
        AsteroidManager.getAsteroids()
      );
      if (collisionResult.hit && collisionResult.impactPoint) {
        gameOver = true;
        gameState = 'gameover';

        InputHandler.updateGameState(gameState, gameOver);
        ExplosionManager.createExplosion();
        UIManager.showGameOverScreen(
          displayedDistance,
          finalDisplaySpeed,
          UIManager.getWormholeBonusCount()
        );
      }
    }
  } else if (gameState === 'gameover') {
    // Game over specific logic
  }

  SceneSetup.renderer.render(SceneSetup.scene, SceneSetup.camera);
}

// クリーンアップ
function cleanup(): void {
  InputHandler.cleanupInputHandlers();
  AsteroidManager.cleanupAsteroidManager();
  WormholeManager.cleanupWormholeManager();
  ExplosionManager.cleanupExplosionManager();
  UIManager.cleanupUIManager();
  window.removeEventListener('resize', onWindowResize);
}

// ページ読み込み時に初期化
window.addEventListener('load', init);

// ページアンロード時にクリーンアップ
window.addEventListener('beforeunload', cleanup);
