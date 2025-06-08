import { GameState, KeysPressed } from '../types/types';
import { GAME_CONSTANTS } from '../constants/constants';

// --- 入力状態管理 ---
export const keysPressed: KeysPressed = {};

let touchStartX: number = 0;
let touchStartY: number = 0;
let isTouching: boolean = false;
let touchDirectionX: number = 0;
let touchDirectionY: number = 0;

// --- コールバック関数の型定義 ---
type StartGameCallback = () => void;

// --- コールバック関数の保持 ---
let startGameCallback: StartGameCallback | null = null;

// --- ゲッター関数 ---
export function getTouchState() {
  return {
    isTouching,
    touchDirectionX,
    touchDirectionY,
  };
}

// --- キーボードイベントハンドラー ---
function onGameKeyDown(
  event: KeyboardEvent,
  gameState: GameState,
  gameOver: boolean
): void {
  if (gameState === 'playing' && !gameOver) {
    keysPressed[event.key.toLowerCase()] = true;
    event.preventDefault();
  }
}

function onGameKeyUp(event: KeyboardEvent): void {
  keysPressed[event.key.toLowerCase()] = false;
  event.preventDefault();
}

function handleOpeningScreenKey(
  event: KeyboardEvent,
  gameState: GameState
): void {
  if (
    (gameState === 'opening' || gameState === 'gameover') &&
    event.key === ' '
  ) {
    event.preventDefault();
    if (startGameCallback) {
      startGameCallback();
    }
  }
}

// --- タッチイベントハンドラー ---
function onTouchStart(
  event: TouchEvent,
  gameState: GameState,
  gameOver: boolean
): void {
  if (gameState !== 'playing' || gameOver) return;
  event.preventDefault();
  if (event.touches.length > 0) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isTouching = true;
    touchDirectionX = 0;
    touchDirectionY = 0;
  }
}

function onTouchMove(
  event: TouchEvent,
  gameState: GameState,
  gameOver: boolean
): void {
  if (gameState !== 'playing' || gameOver || !isTouching) return;
  event.preventDefault();
  if (event.touches.length > 0) {
    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;

    const deltaX = currentX - touchStartX;
    const deltaY = currentY - touchStartY;

    touchDirectionX = 0;
    touchDirectionY = 0;

    if (Math.abs(deltaX) > GAME_CONSTANTS.SWIPE_THRESHOLD) {
      touchDirectionX = Math.sign(deltaX);
    }
    if (Math.abs(deltaY) > GAME_CONSTANTS.SWIPE_THRESHOLD) {
      touchDirectionY = -Math.sign(deltaY); // Y軸は逆方向
    }
  }
}

function onTouchEnd(): void {
  isTouching = false;
  touchDirectionX = 0;
  touchDirectionY = 0;
}

// --- 入力状態リセット関数 ---
export function resetInputState(): void {
  for (const key in keysPressed) {
    keysPressed[key] = false;
  }

  isTouching = false;
  touchDirectionX = 0;
  touchDirectionY = 0;
}

// --- イベントリスナー管理 ---
let gameState: GameState = 'opening';
let gameOver: boolean = false;
let domElement: HTMLElement | null = null;

// バインドされたイベントハンドラーを保持する変数
let boundOnGameKeyDown: ((event: KeyboardEvent) => void) | null = null;
let boundOnGameKeyUp: ((event: KeyboardEvent) => void) | null = null;
let boundOnTouchStart: ((event: TouchEvent) => void) | null = null;
let boundOnTouchMove: ((event: TouchEvent) => void) | null = null;
let boundOnTouchEnd: ((event: TouchEvent) => void) | null = null;
let boundHandleOpeningScreenKey: ((event: KeyboardEvent) => void) | null = null;

export function initializeInputHandlers(
  element: HTMLElement,
  onStartGame: StartGameCallback
): void {
  domElement = element;
  startGameCallback = onStartGame;

  // イベントハンドラーをバインド
  boundOnGameKeyDown = (event) => onGameKeyDown(event, gameState, gameOver);
  boundOnGameKeyUp = onGameKeyUp;
  boundOnTouchStart = (event) => onTouchStart(event, gameState, gameOver);
  boundOnTouchMove = (event) => onTouchMove(event, gameState, gameOver);
  boundOnTouchEnd = onTouchEnd;
  boundHandleOpeningScreenKey = (event) =>
    handleOpeningScreenKey(event, gameState);

  // キーボードイベントリスナー
  element.addEventListener('keydown', boundOnGameKeyDown, false);
  element.addEventListener('keyup', boundOnGameKeyUp, false);

  // タッチイベントリスナー
  element.addEventListener('touchstart', boundOnTouchStart, { passive: false });
  element.addEventListener('touchmove', boundOnTouchMove, { passive: false });
  element.addEventListener('touchend', boundOnTouchEnd);

  // グローバルキーイベントリスナー（オープニング画面用）
  window.addEventListener('keydown', boundHandleOpeningScreenKey);
}

export function updateGameState(
  newGameState: GameState,
  newGameOver: boolean
): void {
  gameState = newGameState;
  gameOver = newGameOver;
}

export function cleanupInputHandlers(): void {
  if (domElement) {
    if (boundOnGameKeyDown)
      domElement.removeEventListener('keydown', boundOnGameKeyDown);
    if (boundOnGameKeyUp)
      domElement.removeEventListener('keyup', boundOnGameKeyUp);
    if (boundOnTouchStart)
      domElement.removeEventListener('touchstart', boundOnTouchStart as EventListenerOrEventListenerObject);
    if (boundOnTouchMove)
      domElement.removeEventListener('touchmove', boundOnTouchMove as EventListenerOrEventListenerObject);
    if (boundOnTouchEnd)
      domElement.removeEventListener('touchend', boundOnTouchEnd);
  }

  if (boundHandleOpeningScreenKey)
    window.removeEventListener('keydown', boundHandleOpeningScreenKey);

  domElement = null;
  startGameCallback = null;
  boundOnGameKeyDown = null;
  boundOnGameKeyUp = null;
  boundOnTouchStart = null;
  boundOnTouchMove = null;
  boundOnTouchEnd = null;
  boundHandleOpeningScreenKey = null;
}
