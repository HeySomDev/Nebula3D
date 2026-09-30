export class InputManager {
  private readonly pressed = new Set<string>();
  private readonly justPressed = new Set<string>();
  private readonly mouseButtons = new Set<string>();

  pointer = { x: 0, y: 0 };

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  update(): void {
    this.justPressed.clear();
  }

  isDown(key: string): boolean {
    return this.pressed.has(key.toLowerCase());
  }

  isPressed(key: string): boolean {
    return this.justPressed.has(key.toLowerCase());
  }

  isMouseDown(button: 'left' | 'right' | 'middle'): boolean {
    return this.mouseButtons.has(button);
  }

  setPointer(clientX: number, clientY: number, rect: DOMRect): void {
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (!this.pressed.has(key)) {
      this.justPressed.add(key);
    }
    this.pressed.add(key);
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.pressed.delete(event.key.toLowerCase());
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    const button = this.pointerButtonToKey(event.button);
    if (button) {
      this.mouseButtons.add(button);
    }
  };

  private readonly handlePointerUp = (event: PointerEvent) => {
    const button = this.pointerButtonToKey(event.button);
    if (button) {
      this.mouseButtons.delete(button);
    }
  };

  private pointerButtonToKey(button: number): 'left' | 'right' | 'middle' | null {
    if (button === 0) return 'left';
    if (button === 1) return 'middle';
    if (button === 2) return 'right';
    return null;
  }
}
