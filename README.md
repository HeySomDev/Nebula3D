# Nebula3D

Nebula3D is a modular, open-source 3D web game engine framework built with TypeScript and Three.js. It is designed to help developers prototype and build complete browser-based 3D games with a clean architecture, reusable systems, and a production-ready project structure.

## Core features

- WebGL rendering powered by Three.js
- Scene, camera, and render loop management
- ECS-inspired game object model
- Input system for keyboard and mouse
- Primitive creation helpers for rapid prototyping
- Physics hook layer for future integration
- Reusable gameplay architecture
- Demo arena game with chasing enemies and shooting
- MIT open-source license

## Quick start

```bash
npm install
npm run dev -- --host
```

Then open the local Vite URL in your browser.

## How to play the demo

- Move: WASD
- Fire: Space
- Goal: survive as long as possible and destroy incoming enemies
- Score increases each time you hit a target

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
    DemoGame.ts
  main.ts
  style.css
```

## Architecture overview

Nebula3D is intentionally built as a developer-friendly framework:

- `Engine` manages the renderer, scene, camera, and update loop
- `GameObject` is the base entity in the world
- `Component` provides modular behavior hooks
- `InputManager` tracks keyboard and mouse interaction
- `PrimitiveFactory` creates quick meshes for gameplay prototyping
- `PhysicsWorld` acts as an extensible physics layer

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
