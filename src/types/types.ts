import * as THREE from 'three';

export interface AsteroidObject {
  mesh: THREE.Mesh;
  boundingBox: THREE.Box3;
}

export interface WormholeObject {
  mesh: THREE.Mesh;
  createdAt: number;
  passed: boolean;
}

export interface ExplosionParticle extends THREE.Mesh {
  userData: {
    velocity: THREE.Vector3;
    creationTime: number;
  };
  material: THREE.MeshBasicMaterial;
  geometry: THREE.SphereGeometry;
}

export interface Explosion {
  particles: ExplosionParticle[];
  startTime: number;
}

export interface CollisionResult {
  hit: boolean;
  impactPoint?: THREE.Vector3;
}

export type GameState = 'opening' | 'playing' | 'gameover';

export interface KeysPressed {
  [key: string]: boolean;
}

export interface GameConstants {
  SPACESHIP_MOVE_SPEED: number;
  FIELD_WIDTH: number;
  FIELD_HEIGHT: number;
  SMOOTHING_FACTOR: number;
  SWIPE_THRESHOLD: number;
}

export interface AsteroidConstants {
  INITIAL_ASTEROID_SPEED: number;
  ASTEROID_SPEED_INCREMENT_FACTOR: number;
  KMH_SCALING_FACTOR: number;
  INTERNAL_DISTANCE_INCREMENT_PER_FRAME: number;
  DISPLAY_DISTANCE_EXPONENT: number;
  SPEED_BONUS_FACTOR_FROM_DISTANCE: number;
  ASTEROID_SPEED_RANDOM_ADD_MAX: number;
  ASTEROID_XY_SWAY_FACTOR: number;
  ASTEROID_SPAWN_Z: number;
  ASTEROID_DESPAWN_Z: number;
  ASTEROID_SPAWN_INTERVAL: number;
}

export interface WormholeConstants {
  WORMHOLE_SPAWN_PROBABILITY: number;
  WORMHOLE_RADIUS: number;
  WORMHOLE_TUBE_RADIUS: number;
  WORMHOLE_BASE_SPEED: number;
  WORMHOLE_SPAWN_FIXED_Z: number;
  WORMHOLE_ACTIVE_DURATION: number;
  WORMHOLE_XY_SPAWN_RANGE_FACTOR: number;
  WORMHOLE_ROTATION_SPEED_MIN: number;
  WORMHOLE_ROTATION_SPEED_RANGE: number;
}

export interface ExplosionConstants {
  EXPLOSION_PARTICLE_COUNT: number;
  EXPLOSION_PARTICLE_BASE_SPEED: number;
  EXPLOSION_PARTICLE_LIFETIME_SECONDS: number;
  EXPLOSION_PARTICLE_VELOCITY_DAMPING: number;
  EXPLOSION_CENTER_DISTANCE_OFFSET: number;
  EXPLOSION_PARTICLE_SPEED_BASE_FACTOR: number;
  EXPLOSION_PARTICLE_SPEED_RANDOM_FACTOR: number;
}

export interface CosmicVelocityConstants {
  FIRST_COSMIC_VELOCITY_KMH: number;
  SECOND_COSMIC_VELOCITY_KMH: number;
  THIRD_COSMIC_VELOCITY_KMH: number;
}
