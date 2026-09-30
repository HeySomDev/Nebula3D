import * as THREE from 'three';

export type PrimitiveOptions = {
  size?: number;
  color?: number;
  wireframe?: boolean;
  opacity?: number;
  transparent?: boolean;
};

export class PrimitiveFactory {
  static createBox(options: PrimitiveOptions = {}): THREE.Mesh {
    const { size = 1, color = 0x5eead4, wireframe = false, opacity = 1, transparent = false } = options;

    return new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({
        color,
        wireframe,
        opacity,
        transparent,
      }),
    );
  }

  static createSphere(options: PrimitiveOptions = {}): THREE.Mesh {
    const { size = 1, color = 0x8b5cf6, wireframe = false, opacity = 1, transparent = false } = options;

    return new THREE.Mesh(
      new THREE.SphereGeometry(size, 32, 32),
      new THREE.MeshStandardMaterial({
        color,
        wireframe,
        opacity,
        transparent,
      }),
    );
  }

  static createPlane(options: PrimitiveOptions = {}): THREE.Mesh {
    const { size = 10, color = 0x1e293b, wireframe = false, opacity = 1, transparent = false } = options;

    return new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshStandardMaterial({
        color,
        wireframe,
        opacity,
        transparent,
      }),
    );
  }
}
