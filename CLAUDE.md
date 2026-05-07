# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Asteroid Weave** is a browser-based 3D endless runner built with Three.js and TypeScript. The player controls a spaceship (rendered from a first-person camera viewpoint) and weaves through an oncoming stream of asteroids, occasionally passing through wormholes for distance bonuses. The game ends on the first asteroid collision.

- Bundler / dev server: **Vite**
- Rendering: **Three.js** (`three@^0.184.0`)
- Language: **TypeScript** (compiled with `tsc`, type-checked before `vite build`)
- Testing: **Vitest** with **jsdom**
- Linting / formatting: **ESLint** + **Prettier**

## Common Commands

```bash
npm install        # Install dependencies
npm run dev        # Start the Vite dev server
npm run build      # Type-check (tsc) then build with Vite
npm run serve      # Preview the production build
npm run test       # Run Vitest in watch mode
npm run coverage   # Run tests once with V8 coverage
npm run lint       # Lint src/ and test/ TypeScript sources
npm run format     # Format src/**/*.{ts,tsx} with Prettier
npm run clean      # Remove dist/
```

## Source Layout

The entry point is `src/main.ts`, which orchestrates feature modules:

```
src/
├── main.ts                       — Game loop, top-level state machine
├── core/
│   ├── sceneSetup.ts             — Three.js scene / camera / renderer / lights / starfield
│   ├── spaceship.ts              — Player ship (uses the camera as the ship) and AABB collision
│   └── inputHandler.ts           — Keyboard (WASD/arrows/Space) + touch swipe handling
├── managers/
│   ├── asteroidManager.ts        — Asteroid spawn / motion / despawn
│   ├── wormholeManager.ts        — Wormhole spawn, motion, pass detection, bonus payout
│   ├── explosionManager.ts       — Particle explosion on collision
│   ├── audioManager.ts           — BGM via WebAudio (public/bgm.mp3)
│   └── uiManager.ts              — DOM UI (HUD, screens, modal, i18n for privacy policy)
├── constants/
│   ├── constants.ts              — All gameplay tuning constants
│   └── privacyPolicy.ts          — Privacy policy strings (ja / en)
├── types/types.ts                — Shared interfaces and the `GameState` union
└── utils/utils.ts                — disposeMaterial, formatNumberWithCommas
```

Static assets (`bgm.mp3`, `logo.png`, `styles.css`) live in `public/` and are served from `/`.

## Architecture

### Module pattern

Every manager is a **module-scoped singleton** exposing plain functions plus internal state. There are no classes for game systems. Each manager follows the same lifecycle:

1. `initializeXxxManager(scene, …)` — wire the manager up with shared Three.js refs / callbacks.
2. Per-frame functions (`updateAsteroids`, `updateWormholes`, `updateExplosions`, …).
3. `resetXxxManager()` — drop and dispose all owned objects, return state to defaults (called on game restart).
4. `cleanupXxxManager()` — final teardown on `beforeunload`.

When adding a new manager, follow this same shape so `main.ts` can call it uniformly.

### Game loop and state machine

`main.ts` owns the global state:

- `gameState: 'opening' | 'playing' | 'gameover' | 'paused'`
- `gameOver: boolean`
- `internalDistanceTraveled` (raw progress counter)
- `displayedDistance` (post-curve, post-bonus score)
- `accumulatedWormholeBonus`

The loop is a single `requestAnimationFrame(animate)`:

- `paused` → render only, skip simulation.
- `playing` → handle input, move ship, advance asteroids/wormholes, evaluate collisions, update HUD.
- Spawn logic is mutually exclusive each frame: with probability `WORMHOLE_SPAWN_PROBABILITY` (and only if no wormhole is on screen) spawn a wormhole, otherwise call `handleAsteroidSpawning()`.

State transitions go through `InputHandler.updateGameState(...)` so input handlers and the UI stay in sync.

### Spaceship as camera

`spaceship.ts` deliberately **uses the `PerspectiveCamera` itself as the ship**. Player movement modifies camera `position.x` / `position.y` (Z is fixed at 5); the world (asteroids, wormholes) flows toward the camera in +Z. Collision uses an AABB (`THREE.Box3.intersectsBox`) sized by `spaceshipColliderSize`.

If a separate ship mesh is ever added, decouple it from the camera carefully — many systems assume the camera position **is** the ship position (e.g. `ExplosionManager.createExplosion()` reads `camera.position` and `camera.getWorldDirection()`).

### Score and speed formulas

Defined in `ASTEROID_CONSTANTS` and applied in `main.ts`:

- `baseDisplayedDistance = internalDistanceTraveled ** DISPLAY_DISTANCE_EXPONENT` (1.65)
- `displayedDistance = floor(baseDisplayedDistance + accumulatedWormholeBonus)`
- `displaySpeed = floor(currentAsteroidSpeed * KMH_SCALING_FACTOR) + floor(baseDisplayedDistance * SPEED_BONUS_FACTOR_FROM_DISTANCE)`
- Asteroid speed grows quadratically: `INITIAL_ASTEROID_SPEED + internalDistance² * ASTEROID_SPEED_INCREMENT_FACTOR`.

Cosmic-velocity HUD messages (`COSMIC_VELOCITY_CONSTANTS`) trigger when `displaySpeed` crosses 28,400 / 40,300 / 60,100 km/h.

### Wormhole bonus

`WormholeManager.checkWormholeCollision()` reports a hit when the ship is within tube distance in Z **and** within `(WORMHOLE_RADIUS - WORMHOLE_TUBE_RADIUS)` in XY. On hit it awards a bonus of `currentDisplayedDistance * (0.10 + random*0.05)` and invokes the `WormholePassCallback` registered from `main.ts`. The callback is the only intended way to feed the bonus back into the score and HUD.

### Resource disposal

Three.js geometries / materials are explicitly disposed when objects leave the scene. Use `utils/disposeMaterial()` (handles single material or material array, plus `material.map`) instead of calling `.dispose()` directly. Any new mesh created in a manager must be released in both the per-frame despawn path and `resetXxxManager()`.

### UI layer

`uiManager.ts` is plain DOM manipulation against IDs declared in `index.html`. There is no framework. UI elements are cached once in `cacheUIElements()`. The HUD is shown/hidden by toggling `style.display`. Privacy policy text is keyed by language (`ja` / `en`) in `constants/privacyPolicy.ts`.

### Audio

`audioManager.ts` uses the WebAudio API directly: it `fetch`es `/bgm.mp3`, decodes it once into an `AudioBuffer`, and plays it via a looping `AudioBufferSourceNode` through a `GainNode` (volume 0.5). Browsers require a user gesture before audio starts — playback is therefore kicked off from `startGame()`, not from `init()`.

## Testing

Tests live next to the code they cover (e.g. `src/core/spaceship.test.ts`). Vitest runs in **jsdom** (`vitest.config.ts`), which is what makes DOM-touching modules testable. When adding tests:

- Mock Three.js objects only as far as the assertion requires (most existing tests construct real `THREE` primitives).
- For DOM-dependent code, set up the relevant elements in the test rather than loading `index.html`.

## Conventions

- **TypeScript strictness**: prefer explicit return types on exported functions, matching the existing style.
- **No new files unless needed**: edit existing modules first; only add a new module if it introduces a clearly distinct responsibility.
- **Tuning values belong in `constants/constants.ts`**, typed via the interfaces in `types/types.ts`. Don't sprinkle magic numbers into managers.
- **Comments are sparse and in Japanese in existing code.** Match the surrounding language when editing a file; do not translate existing comments unless asked.
- **Formatting**: run `npm run format` before committing if you've touched many files; `npm run lint` should pass.
