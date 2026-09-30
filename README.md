# Nebula3D

Nebula3D is a modular, open-source 3D web game engine framework built with TypeScript and Three.js. It is designed to help developers prototype and build complete browser-based 3D games with a clean architecture, reusable systems, and a production-ready project structure.

## Highlights

- WebGL-powered rendering via Three.js
- Scene, camera, and render loop management
- ECS-inspired game object model
- Input system for keyboard and mouse
- Primitive factory for generated geometry
- Component-based gameplay architecture
- Physics hook layer for future extension
- Sample playable demo scene
- Open-source MIT license

## Quick start

```bash
npm install
npm run dev -- --host
```

Then open the local Vite URL in the browser.

## Project structure

```text
src/
  engine/
    core/
    ecs/
    input/
    physics/
    rendering/
    utils/
  game/
  main.ts
  style.css
```

## Sample architecture

Nebula3D is intentionally designed as a developer-friendly framework:

- `Engine` owns timing, renderer, scene, and update loop
- `GameObject` is the base entity in the world
- `Component` allows modular behavior injection
- `InputManager` tracks keyboard and mouse state
- `PrimitiveFactory` creates mesh data quickly
- `PhysicsWorld` provides an extendable integration point for physics

## Example usage

```ts
import { Engine } from './engine';
import { GameObject } from './engine/core/GameObject';
import { PrimitiveFactory } from './engine/rendering/PrimitiveFactory';

const engine = new Engine(document.getElementById('app')!);
engine.start();

const box = new GameObject('Box');
box.root.add(PrimitiveFactory.createBox({ size: 1, color: 0x00aaff }));
engine.scene.addGameObject(box);
```

## License

MIT
