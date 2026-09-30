import * as THREE from 'three';
import { Component } from '../ecs/Component';

export class GameObject {
  readonly root: THREE.Object3D;
  readonly components: Component[] = [];

  constructor(name = 'GameObject') {
    this.root = new THREE.Object3D();
    this.root.name = name;
  }

  addComponent<T extends Component>(component: T): T {
    this.components.push(component);
    return component;
  }

  removeComponent(component: Component): void {
    const index = this.components.indexOf(component);
    if (index >= 0) {
      this.components.splice(index, 1);
    }
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.root);
  }

  update(dt: number): void {
    for (const component of this.components) {
      component.onUpdate(dt);
    }
  }
}
