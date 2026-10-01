import './style.css';
import { Engine } from './engine/core/Engine';
import { NebulaRunnerGame } from './game/NebulaRunnerGame';

const app = document.getElementById('app');

if (!app) {
  throw new Error('Root application element not found.');
}

const engine = new Engine(app, {
  background: '#03010a',
  antialias: true,
  cameraFov: 72,
  cameraNear: 0.1,
  cameraFar: 400,
  enableOrbitControls: false,
});

const game = new NebulaRunnerGame(engine);
game.load();
engine.start();

window.addEventListener('beforeunload', () => {
  engine.stop();
  engine.dispose();
});
