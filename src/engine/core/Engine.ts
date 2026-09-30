import * as THREE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InputManager } from '../input/InputManager';
import { Scene } from './Scene';

export type EngineOptions = {
  antialias?: boolean;
  background?: string | number;
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  enableOrbitControls?: boolean;
};

export class Engine {
  readonly container: HTMLElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly input: InputManager;
  readonly clock = new THREE.Clock();

  private updateHandlers = new Set<(dt: number) => void>();
  private animationFrameId = 0;
  private controls?: OrbitControlsType;

  constructor(container: HTMLElement, options: EngineOptions = {}) {
    this.container = container;

    const {
      antialias = true,
      background = '#050816',
      cameraFov = 60,
      cameraNear = 0.1,
      cameraFar = 500,
      enableOrbitControls = true,
    } = options;

    this.renderer = new THREE.WebGLRenderer({ antialias });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(background);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new Scene(background);

    this.camera = new THREE.PerspectiveCamera(cameraFov, this.container.clientWidth / this.container.clientHeight, cameraNear, cameraFar);
    this.camera.position.set(0, 10, 12);

    this.container.appendChild(this.renderer.domElement);
    this.container.classList.add('canvas-shell');

    this.input = new InputManager();

    this.container.addEventListener('pointermove', this.handlePointerMove);
    this.container.addEventListener('pointerdown', this.handlePointerMove);

    if (enableOrbitControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.enablePan = false;
      this.controls.enableZoom = true;
      this.controls.dampingFactor = 0.08;
      this.controls.target.set(0, 1.5, 0);
      this.controls.maxPolarAngle = Math.PI / 2.08;
      this.controls.minDistance = 8;
      this.controls.maxDistance = 18;
    }

    window.addEventListener('resize', this.handleResize);
  }

  addUpdateHandler(handler: (dt: number) => void): void {
    this.updateHandlers.add(handler);
  }

  removeUpdateHandler(handler: (dt: number) => void): void {
    this.updateHandlers.delete(handler);
  }

  start(): void {
    if (this.animationFrameId !== 0) {
      return;
    }

    const tick = () => {
      this.animationFrameId = window.requestAnimationFrame(tick);
      const dt = Math.min(this.clock.getDelta(), 0.033);
      this.input.update();

      for (const handler of this.updateHandlers) {
        handler(dt);
      }

      this.controls?.update();
      this.renderer.render(this.scene, this.camera);
    };

    tick();
  }

  stop(): void {
    if (this.animationFrameId !== 0) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.container.removeEventListener('pointermove', this.handlePointerMove);
    this.container.removeEventListener('pointerdown', this.handlePointerMove);
    this.renderer.dispose();
    this.input.dispose();
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.input.setPointer(event.clientX, event.clientY, rect);
  };

  private readonly handleResize = () => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };
}
