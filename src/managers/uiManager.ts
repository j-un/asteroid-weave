import { formatNumberWithCommas } from '../utils/utils';

// --- UI状態管理の変数 ---
let firstCosmicVelocityMessageShown: boolean = false;
let secondCosmicVelocityMessageShown: boolean = false;
let thirdCosmicVelocityMessageShown: boolean = false;
let wormholeBonusCount: number = 0;

// UI要素のキャッシュ
interface UIElements {
  openingScreen: HTMLElement | null;
  gameOverContainer: HTMLElement | null;
  cockpitOverlay: HTMLElement | null;
  uiContainer: HTMLElement | null;
  instructions: HTMLElement | null;
  logoContainer: HTMLElement | null;
  scoreContainer: HTMLElement | null;
  speedContainer: HTMLElement | null;
  finalScoreDetails: HTMLElement | null;
  wormholeBonusMessage: HTMLElement | null;
  cosmicVelocityMessage: HTMLElement | null;
  startButton: HTMLElement | null;
  restartButton: HTMLElement | null;
}

const uiElements: UIElements = {
  openingScreen: null,
  gameOverContainer: null,
  cockpitOverlay: null,
  uiContainer: null,
  instructions: null,
  logoContainer: null,
  scoreContainer: null,
  speedContainer: null,
  finalScoreDetails: null,
  wormholeBonusMessage: null,
  cosmicVelocityMessage: null,
  startButton: null,
  restartButton: null,
};

// ゲーム開始コールバック関数の型定義
export interface GameStartCallback {
  (): void;
}

let gameStartCallback: GameStartCallback | null = null;

/**
 * UIマネージャーを初期化
 * DOM要素の参照を取得し、イベントリスナーを設定
 */
export function initializeUIManager(): void {
  // DOM要素の参照を取得してキャッシュ
  cacheUIElements();

  // イベントリスナーを設定
  setupEventListeners();
}

/**
 * DOM要素の参照を取得してキャッシュ
 */
function cacheUIElements(): void {
  uiElements.openingScreen = document.getElementById('opening-screen');
  uiElements.gameOverContainer = document.getElementById('game-over-container');
  uiElements.cockpitOverlay = document.getElementById('cockpit-overlay');
  uiElements.uiContainer = document.querySelector(
    '.ui-container'
  ) as HTMLElement;
  uiElements.instructions = document.getElementById('instructions');
  uiElements.logoContainer = document.getElementById('logo-container');
  uiElements.scoreContainer = document.getElementById('score-container');
  uiElements.speedContainer = document.getElementById('speed-container');
  uiElements.finalScoreDetails = document.getElementById('final-score-details');
  uiElements.wormholeBonusMessage = document.getElementById(
    'wormhole-bonus-message'
  );
  uiElements.cosmicVelocityMessage = document.getElementById(
    'cosmic-velocity-message'
  );
  uiElements.startButton = document.getElementById('start-button');
  uiElements.restartButton = document.getElementById('restart-button');
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners(): void {
  if (uiElements.startButton) {
    uiElements.startButton.addEventListener('click', handleGameStart);
  }
  if (uiElements.restartButton) {
    uiElements.restartButton.addEventListener('click', handleGameStart);
  }

  // キーボードイベントリスナー
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * ゲーム開始ボタンのクリックハンドラー
 */
function handleGameStart(): void {
  if (gameStartCallback) {
    gameStartCallback();
  }
}

/**
 * キーボードイベントハンドラー
 */
function handleKeyDown(event: KeyboardEvent): void {
  // スペースキーでゲーム開始
  if (event.key === ' ') {
    const openingVisible = uiElements.openingScreen?.style.display !== 'none';
    const gameOverVisible =
      uiElements.gameOverContainer?.style.display !== 'none';

    if (openingVisible || gameOverVisible) {
      event.preventDefault();
      if (gameStartCallback) {
        gameStartCallback();
      }
    }
  }
}

/**
 * ゲーム開始時のコールバック関数を設定
 */
export function setGameStartCallback(callback: GameStartCallback): void {
  gameStartCallback = callback;
}

/**
 * SVGロゴを読み込んで表示
 */
export async function loadLogo(): Promise<void> {
  try {
    const response = await fetch('logo.svg');
    const svgText = await response.text();
    if (uiElements.logoContainer) {
      uiElements.logoContainer.innerHTML = svgText;
    }
  } catch (error) {
    console.error('SVGロゴの読み込みに失敗しました:', error);
    // フォールバック: テキストロゴを表示
    if (uiElements.logoContainer) {
      uiElements.logoContainer.innerHTML =
        '<h1 style="font-family: \'Press Start 2P\', cursive; color: #ffd900;">ASTEROID RUSH</h1>';
    }
  }
}

/**
 * オープニング画面を表示
 */
export function showOpeningScreen(): void {
  if (uiElements.openingScreen) uiElements.openingScreen.style.display = 'flex';
  if (uiElements.cockpitOverlay)
    uiElements.cockpitOverlay.style.display = 'none';
  if (uiElements.uiContainer) uiElements.uiContainer.style.display = 'none';
  if (uiElements.instructions) uiElements.instructions.style.display = 'none';
  if (uiElements.gameOverContainer)
    uiElements.gameOverContainer.style.display = 'none';
  if (uiElements.wormholeBonusMessage)
    uiElements.wormholeBonusMessage.style.display = 'none';
  if (uiElements.cosmicVelocityMessage)
    uiElements.cosmicVelocityMessage.style.display = 'none';

  // スコア・速度表示を非表示
  hideScoreAndSpeedDisplay();
}

/**
 * ゲーム画面を表示
 */
export function showGameScreen(): void {
  if (uiElements.openingScreen) uiElements.openingScreen.style.display = 'none';
  if (uiElements.gameOverContainer)
    uiElements.gameOverContainer.style.display = 'none';
  if (uiElements.wormholeBonusMessage)
    uiElements.wormholeBonusMessage.style.display = 'none';
  if (uiElements.cosmicVelocityMessage)
    uiElements.cosmicVelocityMessage.style.display = 'none';
  if (uiElements.cockpitOverlay)
    uiElements.cockpitOverlay.style.display = 'block';
  if (uiElements.uiContainer) uiElements.uiContainer.style.display = 'flex';
  if (uiElements.instructions) {
    uiElements.instructions.style.display = 'block';
    uiElements.instructions.innerText =
      'Arrow keys, WASD keys, or swipe to move';
  }

  // スコア・速度表示を表示
  showScoreAndSpeedDisplay();
}

/**
 * ゲームオーバー画面を表示
 */
export function showGameOverScreen(
  distance: number,
  maxSpeed: number,
  wormholeBonus: number
): void {
  if (uiElements.finalScoreDetails) {
    uiElements.finalScoreDetails.innerHTML =
      'Distance: ' +
      formatNumberWithCommas(distance) +
      ' km<br>' +
      'Max Speed: ' +
      formatNumberWithCommas(maxSpeed) +
      ' km/h<br>' +
      'Wormhole Bonus: x' +
      wormholeBonus;
  }
  if (uiElements.gameOverContainer) {
    uiElements.gameOverContainer.style.display = 'flex';
  }
  if (uiElements.instructions) {
    uiElements.instructions.style.display = 'none';
  }

  // ゲームオーバー画面では左上のスコア・速度表示を非表示
  hideScoreAndSpeedDisplay();
}

/**
 * スコア・速度表示を表示
 */
function showScoreAndSpeedDisplay(): void {
  if (uiElements.scoreContainer) {
    uiElements.scoreContainer.style.display = 'block';
  }
  if (uiElements.speedContainer) {
    uiElements.speedContainer.style.display = 'block';
  }
}

/**
 * スコア・速度表示を非表示
 */
function hideScoreAndSpeedDisplay(): void {
  if (uiElements.scoreContainer) {
    uiElements.scoreContainer.style.display = 'none';
  }
  if (uiElements.speedContainer) {
    uiElements.speedContainer.style.display = 'none';
  }
}

/**
 * スコア表示を更新
 */
export function updateScoreDisplay(distance: number): void {
  if (uiElements.scoreContainer) {
    uiElements.scoreContainer.innerText =
      'Distance: ' + formatNumberWithCommas(distance) + ' km';
  }
}

/**
 * 速度表示を更新
 */
export function updateSpeedDisplay(speed: number): void {
  if (uiElements.speedContainer) {
    uiElements.speedContainer.innerText =
      'Speed: ' + formatNumberWithCommas(speed) + ' km/h';
  }
}

/**
 * ワームホールボーナスメッセージを表示
 */
export function showWormholeBonusMessage(message: string): void {
  if (uiElements.wormholeBonusMessage) {
    uiElements.wormholeBonusMessage.innerHTML = message;
    uiElements.wormholeBonusMessage.style.display = 'block';
    uiElements.wormholeBonusMessage.classList.remove('fade-in-out');
    // リフローを強制してアニメーションをリセット
    void uiElements.wormholeBonusMessage.offsetWidth;
    uiElements.wormholeBonusMessage.classList.add('fade-in-out');

    setTimeout(() => {
      if (uiElements.wormholeBonusMessage) {
        uiElements.wormholeBonusMessage.style.display = 'none';
      }
    }, 2000);
  }
}

/**
 * 宇宙速度到達メッセージを表示
 */
export function showCosmicVelocityMessage(message: string): void {
  if (uiElements.cosmicVelocityMessage) {
    uiElements.cosmicVelocityMessage.innerHTML = message;
    uiElements.cosmicVelocityMessage.style.display = 'block';
    uiElements.cosmicVelocityMessage.classList.add('blink-active');

    setTimeout(() => {
      if (uiElements.cosmicVelocityMessage) {
        uiElements.cosmicVelocityMessage.style.display = 'none';
        uiElements.cosmicVelocityMessage.classList.remove('blink-active');
      }
    }, 3000);
  }
}

/**
 * 第一宇宙速度到達メッセージを表示
 */
export function showFirstCosmicVelocityMessage(): boolean {
  if (!firstCosmicVelocityMessageShown) {
    showCosmicVelocityMessage('First Cosmic Velocity(28,400 km/h)<br>Reached!');
    firstCosmicVelocityMessageShown = true;
    return true;
  }
  return false;
}

/**
 * 第二宇宙速度到達メッセージを表示
 */
export function showSecondCosmicVelocityMessage(): boolean {
  if (!secondCosmicVelocityMessageShown) {
    showCosmicVelocityMessage(
      'Second Cosmic Velocity(40,320 km/h)<br>Reached!'
    );
    secondCosmicVelocityMessageShown = true;
    return true;
  }
  return false;
}

/**
 * 第三宇宙速度到達メッセージを表示）
 */
export function showThirdCosmicVelocityMessage(): boolean {
  if (!thirdCosmicVelocityMessageShown) {
    showCosmicVelocityMessage('Third Cosmic Velocity(60,120 km/h)<br>Reached!');
    thirdCosmicVelocityMessageShown = true;
    return true;
  }
  return false;
}

/**
 * ワームホールボーナスカウントを更新
 */
export function updateWormholeBonusCount(count: number): void {
  wormholeBonusCount = count;
}

/**
 * 現在のワームホールボーナスカウントを取得
 */
export function getWormholeBonusCount(): number {
  return wormholeBonusCount;
}

/**
 * UI状態をリセット
 */
export function resetUIState(): void {
  firstCosmicVelocityMessageShown = false;
  secondCosmicVelocityMessageShown = false;
  thirdCosmicVelocityMessageShown = false;
  wormholeBonusCount = 0;

  // 初期スコア表示
  updateScoreDisplay(0);
  updateSpeedDisplay(0);
}

/**
 * クリーンアップ処理
 */
export function cleanupUIManager(): void {
  // イベントリスナーを削除
  if (uiElements.startButton) {
    uiElements.startButton.removeEventListener('click', handleGameStart);
  }
  if (uiElements.restartButton) {
    uiElements.restartButton.removeEventListener('click', handleGameStart);
  }

  document.removeEventListener('keydown', handleKeyDown);

  // コールバック参照をクリア
  gameStartCallback = null;

  // UI要素のキャッシュをクリア
  Object.keys(uiElements).forEach((key) => {
    uiElements[key as keyof UIElements] = null;
  });
}
