import * as THREE from 'three';
import { Engine } from '../engine/core/Engine';
import { GameObject } from '../engine/core/GameObject';
import { PrimitiveFactory } from '../engine/rendering/PrimitiveFactory';

type Enemy = {
  mesh: THREE.Mesh;
  alive: boolean;
  hp: number;
  speed: number;
};

type Bullet = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  ttl: number;
};

type Particle = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  ttl: number;
};

export class DemoGame {
  private readonly engine: Engine;
  private readonly player: GameObject;
  private readonly enemies: Enemy[] = [];
  private readonly bullets: Bullet[] = [];
  private readonly particles: Particle[] = [];
  private readonly arenaRadius = 12;
  private score = 0;
  private health = 100;
  private wave = 1;
  private shotsFired = 0;
  private shotCooldown = 0;
  private started = false;
  private hud: HTMLDivElement | null = null;
  private startPanel: HTMLDivElement | null = null;
  private scoreLabel: HTMLSpanElement | null = null;
  private healthLabel: HTMLSpanElement | null = null;
  private waveLabel: HTMLSpanElement | null = null;
  private statusLabel: HTMLParagraphElement | null = null;

  constructor(engine: Engine) {
    this.engine = engine;

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.engine.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(10, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    this.engine.scene.add(keyLight);

    const fill = new THREE.PointLight(0x38bdf8, 25, 40, 2);
    fill.position.set(0, 5, 0);
    this.engine.scene.add(fill);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(50, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x050b18, side: THREE.BackSide }),
    );
    this.engine.scene.add(sky);

    const ground = PrimitiveFactory.createPlane({ size: 36, color: 0x182335 });
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.engine.scene.add(ground);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(12, 0.4, 8, 80),
      new THREE.MeshStandardMaterial({ color: 0x334155, emissive: 0x0f172a, emissiveIntensity: 0.5 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    this.engine.scene.add(ring);

    for (let i = 0; i < 12; i += 1) {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35 + Math.random() * 0.25, 0),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xf59e0b : 0x8b5cf6,
          emissive: i % 2 === 0 ? 0x7c2d12 : 0x312e81,
          emissiveIntensity: 0.8,
        }),
      );

      crystal.position.set(
        (Math.random() - 0.5) * 24,
        0.9 + Math.random() * 3,
        (Math.random() - 0.5) * 24,
      );
      crystal.castShadow = true;
      this.engine.scene.add(crystal);
    }

    this.player = new GameObject('Player');
    const playerBody = PrimitiveFactory.createBox({ size: 1, color: 0x38bdf8 });
    playerBody.castShadow = true;
    playerBody.position.y = 0.5;
    this.player.root.add(playerBody);
    this.player.root.position.set(0, 0, 0);
    this.engine.scene.addGameObject(this.player);

    for (let i = 0; i < 6; i += 1) {
      this.spawnEnemy();
    }

    this.engine.addUpdateHandler(this.update);
  }

  load(): void {
    this.hud = document.createElement('div');
    this.hud.className = 'hud';
    this.hud.innerHTML = `
      <h1>Nebula3D</h1>
      <div class="stats">
        <span>Score: <strong id="nebula-score">0</strong></span>
        <span>Health: <strong id="nebula-health">100</strong></span>
        <span>Wave: <strong id="nebula-wave">1</strong></span>
      </div>
      <p id="nebula-status">Ready</p>
    `;

    this.scoreLabel = this.hud.querySelector('#nebula-score');
    this.healthLabel = this.hud.querySelector('#nebula-health');
    this.waveLabel = this.hud.querySelector('#nebula-wave');
    this.statusLabel = this.hud.querySelector('#nebula-status');
    this.engine.container.appendChild(this.hud);

    this.startPanel = document.createElement('div');
    this.startPanel.className = 'start-panel';
    this.startPanel.innerHTML = `
      <div class="panel-card">
        <h2>Nova Arena</h2>
        <p>Move with WASD, aim with mouse, and fire with click or space.</p>
        <button id="start-game-btn">Start Mission</button>
      </div>
    `;

    const button = this.startPanel.querySelector('#start-game-btn') as HTMLButtonElement;
    button.addEventListener('click', () => {
      this.started = true;
      this.startPanel?.remove();
      this.statusLabel && (this.statusLabel.textContent = 'Combat live');
    });

    this.engine.container.appendChild(this.startPanel);
    this.updateHud();
  }

  private readonly update = (dt: number) => {
    if (!this.started) {
      this.engine.camera.position.lerp(new THREE.Vector3(0, 10, 12), 0.04);
      this.engine.camera.lookAt(0, 0, 0);
      return;
    }

    this.shotCooldown = Math.max(0, this.shotCooldown - dt);

    const move = new THREE.Vector3();
    if (this.engine.input.isDown('w')) move.z -= 1;
    if (this.engine.input.isDown('s')) move.z += 1;
    if (this.engine.input.isDown('a')) move.x -= 1;
    if (this.engine.input.isDown('d')) move.x += 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(5.2 * dt);
      this.player.root.position.add(move);
    }

    this.player.root.position.x = THREE.MathUtils.clamp(this.player.root.position.x, -this.arenaRadius, this.arenaRadius);
    this.player.root.position.z = THREE.MathUtils.clamp(this.player.root.position.z, -this.arenaRadius, this.arenaRadius);

    const aimX = this.engine.input.pointer.x;
    const aimY = this.engine.input.pointer.y;
    const angle = Math.atan2(aimX, aimY || 1);
    this.player.root.rotation.y = -angle;

    if (this.engine.input.isPressed(' ') || this.engine.input.isMouseDown('left')) {
      this.fireBullet();
    }

    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets[i];
      bullet.mesh.position.addScaledVector(bullet.velocity, dt);
      bullet.ttl -= dt;

      if (bullet.ttl <= 0 || Math.abs(bullet.mesh.position.x) > this.arenaRadius + 3 || Math.abs(bullet.mesh.position.z) > this.arenaRadius + 3) {
        this.engine.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      for (let j = this.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = this.enemies[j];
        if (!enemy.alive) continue;

        if (enemy.mesh.position.distanceTo(bullet.mesh.position) < 0.8) {
          enemy.hp -= 1;
          this.engine.scene.remove(bullet.mesh);
          this.bullets.splice(i, 1);

          if (enemy.hp <= 0) {
            this.createExplosion(enemy.mesh.position);
            this.engine.scene.remove(enemy.mesh);
            enemy.alive = false;
            this.enemies.splice(j, 1);
            this.score += 15;
            this.spawnEnemy();
          }
          break;
        }
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const toPlayer = new THREE.Vector3().subVectors(this.player.root.position, enemy.mesh.position);
      const distance = toPlayer.length();
      if (distance > 0.001) {
        toPlayer.normalize().multiplyScalar(enemy.speed * dt);
        enemy.mesh.position.add(toPlayer);
      }

      if (distance < 1.1) {
        this.health = Math.max(0, this.health - 22 * dt);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.ttl -= dt;
      particle.mesh.material.opacity = Math.max(0, particle.ttl / 0.5);

      if (particle.ttl <= 0) {
        this.engine.scene.remove(particle.mesh);
        this.particles.splice(i, 1);
      }
    }

    if (this.enemies.length < 1 + this.wave) {
      this.spawnEnemy();
    }

    if (this.score > this.wave * 150) {
      this.wave += 1;
      this.statusLabel && (this.statusLabel.textContent = `Wave ${this.wave} incoming`);
    }

    if (this.health <= 0) {
      this.health = 100;
      this.score = 0;
      this.wave = 1;
      this.resetArena();
      this.statusLabel && (this.statusLabel.textContent = 'Mission failed. Regrouping...');
    }

    this.updateHud();
    this.engine.camera.position.lerp(new THREE.Vector3(this.player.root.position.x * 0.25, 10, 12 + this.player.root.position.z * 0.18), 0.08);
    this.engine.camera.lookAt(this.player.root.position.x, 0.5, this.player.root.position.z);
  };

  private fireBullet(): void {
    if (this.shotCooldown > 0) {
      return;
    }

    this.shotCooldown = 0.18;
    this.shotsFired += 1;

    const direction = new THREE.Vector3(Math.sin(this.player.root.rotation.y), 0, Math.cos(this.player.root.rotation.y));
    direction.normalize();

    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xfacc15,
        emissiveIntensity: 0.8,
      }),
    );

    bullet.position.copy(this.player.root.position);
    bullet.position.y = 0.8;
    bullet.position.add(direction.clone().multiplyScalar(0.8));

    this.engine.scene.add(bullet);
    this.bullets.push({
      mesh: bullet,
      velocity: direction.clone().multiplyScalar(14),
      ttl: 1.5,
    });
  }

  private spawnEnemy(): void {
    const enemyMesh = PrimitiveFactory.createSphere({ size: 0.7, color: 0xf43f5e });
    enemyMesh.castShadow = true;

    const angle = Math.random() * Math.PI * 2;
    const radius = 9 + Math.random() * 3.2;
    enemyMesh.position.set(
      Math.cos(angle) * radius,
      0.75,
      Math.sin(angle) * radius,
    );

    this.engine.scene.add(enemyMesh);
    this.enemies.push({
      mesh: enemyMesh,
      alive: true,
      hp: 2 + Math.min(3, this.wave),
      speed: 1.4 + this.wave * 0.18,
    });
  }

  private resetArena(): void {
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        this.engine.scene.remove(enemy.mesh);
      }
    }

    this.enemies.length = 0;
    this.player.root.position.set(0, 0, 0);

    for (let i = 0; i < 6; i += 1) {
      this.spawnEnemy();
    }
  }

  private createExplosion(position: THREE.Vector3): void {
    for (let i = 0; i < 10; i += 1) {
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xfbbf24 : 0xf97316,
          transparent: true,
          opacity: 1,
        }),
      );

      spark.position.copy(position);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        1 + Math.random() * 1.5,
        (Math.random() - 0.5) * 4,
      );

      this.engine.scene.add(spark);
      this.particles.push({ mesh: spark, velocity, ttl: 0.5 + Math.random() * 0.4 });
    }
  }

  private updateHud(): void {
    if (this.scoreLabel) {
      this.scoreLabel.textContent = String(this.score);
    }

    if (this.healthLabel) {
      this.healthLabel.textContent = String(Math.max(0, Math.round(this.health)));
    }

    if (this.waveLabel) {
      this.waveLabel.textContent = String(this.wave);
    }
  }
}
