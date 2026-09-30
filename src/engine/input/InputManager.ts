import { GameObject } from '../core/GameObject';

export abstract class Component {
  protected readonly owner: GameObject;

  constructor(owner: GameObject) {
    this.owner = owner;
  }

  onStart(): void {
    // Abstract lifecycle hook
  }

  onUpdate(_dt: number): void {
    // Abstract lifecycle hook
  }

  onDestroy(): void {
    // Abstract lifecycle hook
  }
}
