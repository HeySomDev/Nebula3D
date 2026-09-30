import * as THREE from 'three';
import { GameObject } from './GameObject';

export class Scene extends THREE.Scene {
  constructor(background: string | number = '#050816') {
    super();
    this.background = new THREE.Color(background);
    this.fog = new THREE.Fog(background, 10, 40);
  }

  addGameObject(gameObject: GameObject): GameObject {
    this.add(gameObject.root);
    return gameObject;
  }
}
