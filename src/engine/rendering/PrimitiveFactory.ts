export class InputManager {
  private readonly pressed = new Set<string>();
  private readonly justPressed = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
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

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
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
}
