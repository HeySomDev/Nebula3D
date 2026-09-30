export class PhysicsWorld {
  private readonly bodies: Array<{ position: number; velocity: number }> = [];

  addBody(position = 0, velocity = 0): void {
    this.bodies.push({ position, velocity });
  }

  update(dt: number): void {
    for (const body of this.bodies) {
      body.position += body.velocity * dt;
    }
  }
}
