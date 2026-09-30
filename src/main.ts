import './style.css';
import { Engine } from './engine';
import { DemoGame } from './game/DemoGame';

const app = document.getElementById('app');

if (!app) {
  throw new Error('Root application element not found.');
}

const engine = new Engine(app, {
  background: '#050816',
  antialias: true,
});

const demo = new DemoGame(engine);
demo.load();
engine.start();

window.addEventListener('beforeunload', () => {
  engine.stop();
  engine.dispose();
});
