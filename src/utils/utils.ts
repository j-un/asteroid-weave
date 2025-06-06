import * as THREE from 'three';

// --- ユーティリティ関数 ---
export function disposeMaterial(
  material: THREE.Material | THREE.Material[]
): void {
  if (Array.isArray(material)) {
    material.forEach((mat) => {
      if ('map' in mat && mat.map instanceof THREE.Texture) {
        mat.map.dispose();
      }
      mat.dispose();
    });
  } else {
    if ('map' in material && material.map instanceof THREE.Texture) {
      material.map.dispose();
    }
    material.dispose();
  }
}

export function formatNumberWithCommas(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
