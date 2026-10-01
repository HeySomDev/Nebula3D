import * as THREE from 'three';
import { Engine } from '../engine/core/Engine';
import { GameObject } from '../engine/core/GameObject';

type Enemy = {
  mesh: THREE.Group;
  type: 'obs' | 'orb';
  radius: number;
  spin: number;
  phase: number;
};

type Particle = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  ttl: number;
};

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class NebulaRunnerGame {
  private readonly engine: Engine;
  private readonly player: GameObject;
  private readonly enemies: Enemy[] = [];
  private readonly particles: Particle[] = [];
  private readonly lanes = [-3.0, -1.5, 0, 1.5, 3.0];
  private readonly spawnZ = -120;

  private score = 0;
  private best = Number(localStorage.getItem('nebula_runner_best') || 0);
  private hearts = 3;
  private invuln = 0;
  private elapsed = 0;
  private speed = 26;
  private spawnTimer = 0.8;
  private targetX = 0;
  private started = false;
  private pointerActive = false;
  private glowTexture: THREE.Texture | null = null;

  private hud: HTMLDivElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private scoreEl: HTMLDivElement | null = null;
  private bestEl: HTMLDivElement | null = null;
  private heartsEl: HTMLDivElement | null = null;
  private speedFill: HTMLDivElement | null = null;
  private hintEl: HTMLDivElement | null = null;
  private flashEl: HTMLDivElement | null = null;

  constructor(engine: Engine) {
    this.engine = engine;
    this.player = new GameObject('NebulaRunnerPlayer');

    this.initScene();
    this.buildShip();
    this.engine.scene.addGameObject(this.player);

    this.engine.addUpdateHandler(this.update);
  }

  load(): void {
    this.createHUD();
    this.refreshHearts();
    this.updateHud();
  }

  private initScene(): void {
    const ambient = new THREE.AmbientLight(0x2a3f66, 1.5);
    this.engine.scene.add(ambient);

    const key = new THREE.DirectionalLight(0x9ad8ff, 1.35);
    key.position.set(6, 12, 6);
    this.engine.scene.add(key);

    const rim = new THREE.DirectionalLight(0xff3fa0, 0.85);
    rim.position.set(-8, -3, 4);
    this.engine.scene.add(rim);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 1800;
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      pos[i * 3] = rand(-90, 90);
      pos[i * 3 + 1] = rand(-40, 40);
      pos[i * 3 + 2] = rand(-260, 20);

      const c = new THREE.Color();
      c.setHSL(rand(0.5, 0.75), rand(0.3, 0.9), rand(0.6, 1.0));
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        size: 0.75,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    stars.frustumCulled = false;
    this.engine.scene.add(stars);

    const grid = new THREE.GridHelper(400, 100, 0x00e5ff, 0x0d3550);
    grid.position.y = -4.5;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    (grid.material as THREE.Material).depthWrite = false;
    this.engine.scene.add(grid);

    for (let i = 0; i < 26; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(7.2, 0.055, 6, 56),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0x00e5ff : 0xff2fb0,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: true,
        }),
      );
      ring.position.z = -i * 9.5;
      ring.rotation.z = i * 0.24;
      this.engine.scene.add(ring);
    }
  }

  private makeGlowTexture(): THREE.Texture {
    if (this.glowTexture) return this.glowTexture;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(200,245,255,0.9)');
    gradient.addColorStop(0.45, 'rgba(90,190,255,0.35)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    this.glowTexture = new THREE.CanvasTexture(canvas);
    return this.glowTexture;
  }

  private buildShip(): void {
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x16324f,
      emissive: 0x0d5a7d,
      emissiveIntensity: 1.0,
      metalness: 0.95,
      roughness: 0.18,
    });

    const accentMat = new THREE.MeshBasicMaterial({ color: 0x66f2ff });

    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.75, 4), hullMat);
    hull.rotation.x = -Math.PI / 2;
    this.player.root.add(hull);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.085, 0.6), hullMat);
    wing.position.set(0, -0.02, 0.42);
    this.player.root.add(wing);

    const tipGeo = new THREE.BoxGeometry(0.09, 0.17, 0.52);
    const leftTip = new THREE.Mesh(tipGeo, accentMat);
    leftTip.position.set(-0.97, 0, 0.42);
    this.player.root.add(leftTip);

    const rightTip = leftTip.clone();
    rightTip.position.x = 0.97;
    this.player.root.add(rightTip);

    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.6), accentMat);
    fin.position.set(0, 0.28, 0.5);
    this.player.root.add(fin);

    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), accentMat);
    cockpit.position.set(0, 0.13, 0.28);
    cockpit.scale.set(1, 0.65, 1.7);
    this.player.root.add(cockpit);

    const glowTexture = this.makeGlowTexture();
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0x66e0ff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.95,
      }),
    );
    glow.scale.setScalar(1.8);
    glow.position.set(0, 0, 0.9);
    this.player.root.add(glow);

    const engLight = new THREE.PointLight(0x44ddff, 2.4, 10);
    engLight.position.set(0, 0, 0.9);
    this.player.root.add(engLight);

    this.player.root.position.set(0, 0, 0);
  }

  private createHUD(): void {
    this.hud = document.createElement('div');
    this.hud.id = 'nebula-runner-hud';
    this.hud.innerHTML = `
      <div class="top">
        <div>
          <div class="label">SCORE</div>
          <div class="val" id="nebula-score">0</div>
        </div>
        <div class="right">
          <div class="label">BEST</div>
          <div class="val" id="nebula-best" style="font-size:20px;opacity:.85">${this.best}</div>
          <div id="nebula-hearts"></div>
          <div id="nebula-speedbar"><div id="nebula-speedfill"></div></div>
        </div>
      </div>
      <div id="nebula-hint">← → / A D টানলে চলবে&nbsp;&nbsp;•&nbsp;&nbsp;স্ক্রিনে ড্র্যাগও কাজ করে</div>
    `;
    this.engine.container.appendChild(this.hud);

    this.scoreEl = this.hud.querySelector('#nebula-score') as HTMLDivElement;
    this.bestEl = this.hud.querySelector('#nebula-best') as HTMLDivElement;
    this.heartsEl = this.hud.querySelector('#nebula-hearts') as HTMLDivElement;
    this.speedFill = this.hud.querySelector('#nebula-speedfill') as HTMLDivElement;
    this.hintEl = this.hud.querySelector('#nebula-hint') as HTMLDivElement;

    this.overlay = document.createElement('div');
    this.overlay.id = 'nebula-runner-overlay';
    this.overlay.innerHTML = `
      <div class="panel" id="nebula-panel">
        <div class="title">নেবুলা রানার</div>
        <div class="sub">3D Space Dodger</div>
        <div class="desc">
          গ্রহাণু এড়িয়ে উড়ে চলো 🚀<br>
          নীল অরব সংগ্রহ করে স্কোর বাড়াও<br><br>
          <span class="key">←</span><span class="key">→</span> বা <span class="key">A</span><span class="key">D</span>
          &nbsp;— অথবা স্ক্রিনে ড্র্যাগ করো
        </div>
        <button class="btn" id="nebula-startBtn">শুরু করো</button>
      </div>
    `;
    this.engine.container.appendChild(this.overlay);

    this.flashEl = document.createElement('div');
    this.flashEl.className = 'flash';
    this.flashEl.id = 'nebula-runner-flash';
    this.engine.container.appendChild(this.flashEl);

    const startBtn = this.overlay.querySelector('#nebula-startBtn') as HTMLButtonElement;
    startBtn.addEventListener('click', () => this.startGame());

    this.bindInput();
    this.refreshHearts();
    this.updateHud();
  }

  private bindInput(): void {
    window.addEventListener('keydown', (event) => {
      const key = event.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        this.targetX -= 0.3;
      }
      if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        this.targetX += 0.3;
      }
      if ((key === ' ' || key === 'Enter') && !this.started) {
        event.preventDefault();
        this.startGame();
      }
    });

    this.engine.container.addEventListener('pointerdown', (event) => {
      this.pointerActive = true;
      this.pointerToX(event.clientX);
    });

    this.engine.container.addEventListener('pointermove', (event) => {
      if (this.pointerActive) {
        this.pointerToX(event.clientX);
      }
    });

    window.addEventListener('pointerup', () => {
      this.pointerActive = false;
    });

    window.addEventListener('pointercancel', () => {
      this.pointerActive = false;
    });
  }

  private pointerToX(clientX: number): void {
    const rect = this.engine.container.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.targetX = clamp(nx * 4.8, -3.5, 3.5);
  }

  private refreshHearts(): void {
    if (!this.heartsEl) return;
    const heartsHtml = Array.from({ length: 3 })
      .map((_, index) => `<div class="hp${index < this.hearts ? '' : ' off'}"></div>`)
      .join('');
    this.heartsEl.innerHTML = heartsHtml;
  }

  private updateHud(): void {
    if (this.scoreEl) this.scoreEl.textContent = String(this.score);
    if (this.bestEl) this.bestEl.textContent = String(this.best);
    if (this.speedFill) this.speedFill.style.width = '0%';
  }

  private startGame(): void {
    this.clearEntities();
    this.started = true;
    this.score = 0;
    this.hearts = 3;
    this.invuln = 0;
    this.elapsed = 0;
    this.speed = 26;
    this.spawnTimer = 0.8;
    this.targetX = 0;
    this.player.root.position.set(0, 0, 0);

    if (this.overlay) this.overlay.classList.add('hide');
    if (this.hintEl) {
      this.hintEl.style.opacity = '0.5';
      setTimeout(() => {
        if (this.started) this.hintEl.style.opacity = '0';
      }, 3500);
    }
    this.updateHud();
    this.refreshHearts();
  }

  private clearEntities(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      this.engine.scene.remove(enemy.mesh);
    }
    this.enemies.length = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      this.engine.scene.remove(particle.mesh);
    }
    this.particles.length = 0;
  }

  private spawnObstacle(x: number, z: number): void {
    const mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.72, 0),
      new THREE.MeshStandardMaterial({
        color: 0x3a0a14,
        emissive: 0xff2a3a,
        emissiveIntensity: 0.75,
        metalness: 0.75,
        roughness: 0.35,
        flatShading: true,
      }),
    );

    mesh.add(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.72, 0),
        new THREE.MeshBasicMaterial({
          color: 0xff6a7a,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        }),
      ),
    );

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.makeGlowTexture(),
        color: 0xff3355,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.75,
      }),
    );
    halo.scale.setScalar(3.0);

    const group = new THREE.Group();
    group.add(mesh);
    group.add(halo);
    group.position.set(x, rand(-0.2, 0.25), z);

    this.engine.scene.add(group);

    this.enemies.push({
      mesh: group,
      type: 'obs',
      radius: 0.78,
      spin: rand(-1.6, 1.6),
      phase: 0,
    });
  }

  private spawnOrb(x: number, z: number): void {
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshBasicMaterial({ color: 0xa8fbff }),
    );

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.makeGlowTexture(),
        color: 0x66e8ff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.9,
      }),
    );
    halo.scale.setScalar(1.9);

    const group = new THREE.Group();
    group.add(mesh);
    group.add(halo);
    group.position.set(x, 0.15, z);

    this.engine.scene.add(group);

    this.enemies.push({
      mesh: group,
      type: 'orb',
      radius: 0.62,
      spin: rand(1.5, 3.5),
      phase: rand(0, 6.3),
    });
  }

  private spawnRow(): void {
    const idx = [0, 1, 2, 3, 4];
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }

    let n = 1;
    if (this.elapsed < 14) n = 1;
    else if (this.elapsed < 35) n = Math.random() < 0.72 ? 2 : 1;
    else if (this.elapsed < 60) n = Math.random() < 0.55 ? 2 : (Math.random() < 0.5 ? 1 : 3);
    else n = Math.random() < 0.45 ? 3 : 2;

    const z = this.spawnZ;
    for (let i = 0; i < n; i++) {
      this.spawnObstacle(this.lanes[idx[i]], z + rand(-1.5, 1.5));
    }

    const free = idx.slice(n);
    const orbLanes = free.slice(0, Math.min(free.length, 1 + Math.floor(Math.random() * 2)));
    orbLanes.forEach((laneIndex) => {
      const count = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < count; j++) {
        this.spawnOrb(this.lanes[laneIndex], z - 5 - j * 2.4);
      }
    });
  }

  private emitParticle(x: number, y: number, z: number, color: number, size: number, life: number, vx: number, vy: number, vz: number): void {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      }),
    );
    p.position.set(x, y, z);

    this.engine.scene.add(p);

    this.particles.push({
      mesh: p,
      velocity: new THREE.Vector3(vx, vy, vz),
      ttl: life,
    });
  }

  private burst(x: number, y: number, z: number, color: number, amount: number, spread: number, size: number): void {
    for (let i = 0; i < amount; i++) {
      this.emitParticle(
        x,
        y,
        z,
        color,
        size * rand(0.6, 1.4),
        rand(0.35, 0.75),
        rand(-spread, spread),
        rand(-spread, spread),
        rand(-spread, spread),
      );
    }
  }

  private flash(alpha: number, dur: number): void {
    if (!this.flashEl) return;
    this.flashEl.style.transition = 'none';
    this.flashEl.style.opacity = String(alpha);
    requestAnimationFrame(() => {
      this.flashEl.style.transition = `opacity ${dur}ms ease-out`;
      this.flashEl.style.opacity = '0';
    });
  }

  private gameOver(): void {
    this.started = false;

    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('nebula_runner_best', String(this.best));
    }

    if (this.bestEl) this.bestEl.textContent = String(this.best);

    setTimeout(() => {
      if (!this.overlay) return;
      this.overlay.classList.remove('hide');
      this.overlay.innerHTML = `
        <div class="panel">
          <div class="title">খেলা শেষ</div>
          <div class="sub">Mission Failed</div>
          <div class="stats">
            <div class="stat"><div class="n">${this.score}</div><div class="t">SCORE</div></div>
            <div class="stat"><div class="n">${this.best}</div><div class="t">BEST</div></div>
          </div>
          <button class="btn" id="nebula-restartBtn">আবার খেলো</button>
        </div>
      `;
      const button = this.overlay.querySelector('#nebula-restartBtn') as HTMLButtonElement;
      button.addEventListener('click', () => this.startGame());
    }, 700);
  }

  private readonly update = (dt: number) => {
    const move = this.started ? this.speed * dt : 8 * dt;

    const starField = this.engine.scene.children.find((child) => child.type === 'Points');
    if (starField) {
      const pos = starField.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let z = pos.getZ(i) + move * 2.2;
        if (z > 25) z -= 285;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
    }

    const playerX = this.player.root.position.x;
    const dx = this.targetX - playerX;
    this.player.root.position.x += dx * Math.min(1, 13 * dt);

    this.player.root.position.y = Math.sin(this.engine.clock.elapsedTime * 2.4) * 0.075;
    this.player.root.rotation.z = clamp(-dx * 0.55, -0.6, 0.6);
    this.player.root.rotation.y = clamp(-dx * 0.28, -0.35, 0.35);
    this.player.root.rotation.x = Math.sin(this.engine.clock.elapsedTime * 1.7) * 0.045;

    if (this.started) {
      this.elapsed += dt;
      this.speed = 26 + Math.min(20, this.elapsed * 0.42);

      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnRow();
        const gap = 26 - Math.min(8, this.elapsed * 0.13);
        this.spawnTimer = gap / this.speed;
      }

      if (this.invuln > 0) {
        this.invuln -= dt;
        this.player.root.visible = (Math.floor(this.engine.clock.elapsedTime * 22) % 2) === 0;
      } else {
        this.player.root.visible = true;
      }

      if (this.speedFill) {
        this.speedFill.style.width = `${clamp(((this.speed - 26) / 20) * 100, 0, 100)}%`;
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const mesh = enemy.mesh;

      mesh.position.z += move;

      if (enemy.type === 'obs') {
        mesh.rotation.x += enemy.spin * dt;
        mesh.rotation.y += enemy.spin * 0.7 * dt;
      } else {
        mesh.rotation.y += enemy.spin * dt;
        mesh.rotation.x += enemy.spin * 0.55 * dt;
        mesh.position.y = 0.15 + Math.sin(this.engine.clock.elapsedTime * 3 + enemy.phase) * 0.18;
      }

      if (this.started && Math.abs(mesh.position.z) < 1.0) {
        const ddx = Math.abs(mesh.position.x - this.player.root.position.x);
        if (ddx < enemy.radius + 0.6) {
          if (enemy.type === 'orb') {
            this.engine.scene.remove(mesh);
            this.enemies.splice(i, 1);
            this.score += 10;
            if (this.scoreEl) this.scoreEl.textContent = String(this.score);
            this.burst(mesh.position.x, mesh.position.y, mesh.position.z, 0x8ff5ff, 12, 3.2, 0.55);
            continue;
          }

          if (this.invuln <= 0) {
            this.hearts -= 1;
            this.invuln = 1.7;
            this.flash(0.42, 380);
            this.burst(this.player.root.position.x, 0, 0.5, 0xff4466, 26, 5.5, 0.85);
            this.burst(this.player.root.position.x, 0, 0.5, 0xffaa33, 14, 4.5, 0.7);
            this.refreshHearts();

            if (this.hearts <= 0) {
              this.gameOver();
            }
          }

          this.engine.scene.remove(mesh);
          this.enemies.splice(i, 1);
          continue;
        }
      }

      if (mesh.position.z > 14) {
        this.engine.scene.remove(mesh);
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.ttl -= dt;
      if (particle.ttl <= 0) {
        this.engine.scene.remove(particle.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      particle.mesh.position.addScaledVector(particle.velocity, dt);
      const k = particle.ttl / 0.75;
      particle.mesh.material.opacity = Math.max(0, k * k);
      particle.mesh.scale.setScalar(1 * (0.35 + k * 0.9));
    }

    if (this.started) {
      this.score += Math.round(move * 1.1);
      if (this.scoreEl) this.scoreEl.textContent = String(this.score);
    }

    const tx = this.player.root.position.x * 0.55;
    this.engine.camera.position.x += (tx - this.engine.camera.position.x) * Math.min(1, 5 * dt);
    this.engine.camera.position.y = 3.0 + Math.sin(this.engine.clock.elapsedTime * 1.3) * 0.14;
    this.engine.camera.position.z = 8.5;

    this.engine.camera.lookAt(
      this.player.root.position.x * 0.45,
      0.55,
      -13,
    );

    if (!this.started) {
      this.player.root.position.x = Math.sin(this.engine.clock.elapsedTime * 0.9) * 1.6;
      this.player.root.rotation.z = -Math.cos(this.engine.clock.elapsedTime * 0.9) * 0.25;
      this.engine.camera.position.x = Math.sin(this.engine.clock.elapsedTime * 0.45) * 1.1;
      this.engine.camera.position.y = 2.9 + Math.sin(this.engine.clock.elapsedTime * 0.7) * 0.25;
      this.engine.camera.lookAt(0, 0.5, -12);
    }
  };
}
