/**
 * WILDY — simulation core.
 *
 * No DOM, no canvas, no audio. The engine is deterministic for a given seed and
 * input sequence, which makes the balance testable in Node.
 */

export const RUN_SECONDS = 180;
export const BOSS_TIME = 150;
export const MAX_ENEMIES = 150;
export const MAX_PARTICLES = 320;
export const MAX_TEXTS = 48;

export const ENEMY_TYPES = {
  imp: {
    name: 'Imp',
    hp: 14,
    speed: 62,
    radius: 10,
    damage: 7,
    xp: 3,
    score: 12,
    color: '#a9c46a',
    dark: '#445c24',
  },
  skeleton: {
    name: 'Skeleton',
    hp: 26,
    speed: 84,
    radius: 12,
    damage: 11,
    xp: 5,
    score: 24,
    color: '#d8d2c0',
    dark: '#5f5c51',
  },
  brute: {
    name: 'Brute',
    hp: 72,
    speed: 44,
    radius: 18,
    damage: 18,
    xp: 12,
    score: 60,
    color: '#c78a63',
    dark: '#5f2f1d',
  },
  elite: {
    name: 'Rune Elite',
    hp: 230,
    speed: 58,
    radius: 23,
    damage: 24,
    xp: 30,
    score: 220,
    color: '#e3b25c',
    dark: '#6b430d',
  },
  boss: {
    name: 'Greater Demon',
    hp: 1900,
    speed: 36,
    radius: 38,
    damage: 38,
    xp: 0,
    score: 2500,
    color: '#ff7a45',
    dark: '#5e150c',
  },
};

/** Eleven stacking blessings, offered three at a time on level-up. */
export const UPGRADES = [
  {
    id: 'damage',
    name: 'Sharpened Runes',
    desc: '+20% bolt damage',
    icon: '✦',
    max: 5,
    apply: (game) => {
      game.player.damage *= 1.2;
    },
  },
  {
    id: 'haste',
    name: 'Quick Cast',
    desc: '+15% cast speed',
    icon: '⟡',
    max: 5,
    apply: (game) => {
      game.player.fireRate *= 1.15;
    },
  },
  {
    id: 'split',
    name: 'Split Bolt',
    desc: '+1 bolt per cast',
    icon: '⋔',
    max: 3,
    apply: (game) => {
      game.player.multishot += 1;
    },
  },
  {
    id: 'pierce',
    name: 'Piercing Rune',
    desc: 'Bolts pass through +1 enemy',
    icon: '➶',
    max: 3,
    apply: (game) => {
      game.player.pierce += 1;
    },
  },
  {
    id: 'speed',
    name: 'Fleetfoot',
    desc: '+7% movement speed',
    icon: '⌁',
    max: 4,
    apply: (game) => {
      game.player.speed *= 1.07;
    },
  },
  {
    id: 'vitality',
    name: 'Vitality',
    desc: '+20 max life and heal 25',
    icon: '♥',
    max: 5,
    apply: (game) => {
      game.player.maxHp += 20;
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 25);
    },
  },
  {
    id: 'magnet',
    name: 'Rune Magnet',
    desc: '+45 pickup radius',
    icon: '◎',
    max: 3,
    apply: (game) => {
      game.player.magnet += 45;
    },
  },
  {
    id: 'crit',
    name: 'Critical Eye',
    desc: '+6% critical chance',
    icon: '✹',
    max: 4,
    apply: (game) => {
      game.player.crit += 0.06;
    },
  },
  {
    id: 'regen',
    name: 'Slow Mending',
    desc: '+0.7 life per second',
    icon: '✚',
    max: 3,
    apply: (game) => {
      game.player.regen += 0.7;
    },
  },
  {
    id: 'dash',
    name: 'Shadow Step',
    desc: 'Dash recharges 15% faster',
    icon: '↯',
    max: 3,
    apply: (game) => {
      game.player.dashMax = Math.max(1.1, game.player.dashMax * 0.85);
    },
  },
  {
    id: 'armor',
    name: 'Bone Ward',
    desc: 'Take 2 less damage per hit',
    icon: '◈',
    max: 3,
    apply: (game) => {
      game.player.armor += 2;
    },
  },
];

const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, upgrade]));

export function xpNeeded(level) {
  return Math.round(10 + level * 5);
}

/** Spawns per second rise smoothly, with a hard floor so it never stalls. */
export function spawnIntervalAt(time) {
  return Math.max(0.36, 0.9 - time * 0.0028);
}

export function spawnCountAt(time) {
  return 1 + Math.floor(time / 65);
}

export function pickEnemyType(time, rng) {
  const roll = rng();
  if (time < 20) return 'imp';
  if (time < 60) return roll < 0.72 ? 'imp' : 'skeleton';
  if (time < 120) return roll < 0.5 ? 'imp' : roll < 0.82 ? 'skeleton' : 'brute';
  return roll < 0.38 ? 'imp' : roll < 0.74 ? 'skeleton' : 'brute';
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distanceSq = (ax, ay, bx, by) => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};

export class Game {
  constructor({ width = 960, height = 540, seed = 1 } = {}) {
    this.width = width;
    this.height = height;
    this.rng = mulberry32(seed);
    this.seed = seed;
    this.reset();
  }

  reset() {
    const { width, height } = this;
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNext = xpNeeded(this.level);
    this.pendingLevels = 0;
    this.upgrades = {};
    this.choices = [];

    this.player = {
      x: width / 2,
      y: height / 2,
      radius: 14,
      hp: 100,
      maxHp: 100,
      speed: 216,
      damage: 12,
      fireRate: 2.4,
      cooldown: 0.25,
      projectileSpeed: 660,
      pierce: 0,
      multishot: 1,
      crit: 0.06,
      magnet: 85,
      regen: 0,
      armor: 0,
      invuln: 0,
      aim: -Math.PI / 2,
      dashMax: 2.6,
      dashCd: 0,
      dashT: 0,
      dashDx: 1,
      dashDy: 0,
      hitFlash: 0,
    };

    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.particles = [];
    this.texts = [];
    this.events = [];
    this.nextId = 1;

    this.spawnTimer = 0.7;
    this.nextElite = 30;
    this.boss = null;
    this.bossSpawned = false;
    this.bossDefeated = false;

    this.combo = 0;
    this.comboTimer = 0;
    this.bestCombo = 0;

    this.shake = 0;
    this.freeze = 0;
    this.flash = 0;
    this.flashColor = '#ff7a45';
    this.hurt = 0;
    this.over = false;
    this.won = false;
    this.deathX = null;
    this.deathY = null;

    // Two opening imps so the first second has something to do.
    this.spawnAtEdge('imp');
    this.spawnAtEdge('imp');
  }

  resize(width, height) {
    this.width = Math.max(240, width);
    this.height = Math.max(240, height);
    const p = this.player;
    p.x = clamp(p.x, p.radius, this.width - p.radius);
    p.y = clamp(p.y, p.radius, this.height - p.radius);
  }

  event(type, data = {}) {
    this.events.push({ type, ...data });
    if (this.events.length > 64) this.events.shift();
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  get isRunning() {
    return !this.over && !this.won;
  }

  update(dt, input = {}) {
    if (!this.isRunning) return;
    if (this.freeze > 0) {
      this.freeze = Math.max(0, this.freeze - dt);
      this.shake *= 0.92;
      return;
    }

    dt = Math.min(dt, 1 / 30);
    this.time += dt;

    this.updatePlayer(dt, input);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateGems(dt);
    this.spawn(dt);
    this.updateFx(dt);

    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) this.combo = 0;

    if (!this.over && this.time >= RUN_SECONDS) this.win();
  }

  updatePlayer(dt, input) {
    const p = this.player;
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt);

    let dx = Number(input.x) || 0;
    let dy = Number(input.y) || 0;
    const length = Math.hypot(dx, dy);
    if (length > 1) {
      dx /= length;
      dy /= length;
    }

    if (input.dash && p.dashCd <= 0) {
      if (length < 0.1) {
        dx = Math.cos(p.aim);
        dy = Math.sin(p.aim);
      }
      const l = Math.hypot(dx, dy) || 1;
      p.dashDx = dx / l;
      p.dashDy = dy / l;
      p.dashT = 0.16;
      p.dashCd = p.dashMax;
      p.invuln = Math.max(p.invuln, 0.3);
      this.shake = Math.max(this.shake, 3);
      this.burst(p.x, p.y, '#8fbf9f', 10, 150, 2.5);
      this.event('dash');
    }

    let speed = p.speed;
    if (p.dashT > 0) {
      p.dashT = Math.max(0, p.dashT - dt);
      speed *= 3.3;
      dx = p.dashDx;
      dy = p.dashDy;
      if (this.rng() < 0.7) {
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          life: 0.24,
          maxLife: 0.24,
          size: 7,
          color: '#8fbf9f',
        });
      }
    }

    p.x = clamp(p.x + dx * speed * dt, p.radius, this.width - p.radius);
    p.y = clamp(p.y + dy * speed * dt, p.radius, this.height - p.radius);

    if (p.regen > 0 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    }

    const target = this.nearestEnemy(p.x, p.y, 680);
    if (target) {
      p.aim = Math.atan2(target.y - p.y, target.x - p.x);
      if (p.cooldown <= 0) this.cast(target);
    }
  }

  cast(target) {
    const p = this.player;
    const count = Math.max(1, p.multishot);
    const spread = 0.1;
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread;
      const angle = p.aim + offset;
      this.projectiles.push({
        x: p.x + Math.cos(angle) * (p.radius + 8),
        y: p.y + Math.sin(angle) * (p.radius + 8),
        vx: Math.cos(angle) * p.projectileSpeed,
        vy: Math.sin(angle) * p.projectileSpeed,
        radius: 4,
        damage: p.damage,
        pierce: p.pierce,
        life: 1.25,
        hit: new Set(),
        color: '#f6d28a',
      });
    }
    p.cooldown = 1 / p.fireRate;
    this.burst(p.x + Math.cos(p.aim) * 18, p.y + Math.sin(p.aim) * 18, '#f6d28a', 3, 70, 2);
    this.event('shoot');
  }

  nearestEnemy(x, y, maxDistance = Infinity) {
    let best = null;
    let bestDist = maxDistance * maxDistance;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const d = distanceSq(x, y, enemy.x, enemy.y);
      if (d < bestDist) {
        bestDist = d;
        best = enemy;
      }
    }
    return best;
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const bolt = this.projectiles[i];
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      bolt.life -= dt;

      if (
        bolt.life <= 0 ||
        bolt.x < -80 ||
        bolt.y < -80 ||
        bolt.x > this.width + 80 ||
        bolt.y > this.height + 80
      ) {
        this.projectiles.splice(i, 1);
        continue;
      }

      let consumed = false;
      for (const enemy of this.enemies) {
        if (enemy.dead || bolt.hit.has(enemy.id)) continue;
        const rr = enemy.radius + bolt.radius;
        if (distanceSq(bolt.x, bolt.y, enemy.x, enemy.y) > rr * rr) continue;

        bolt.hit.add(enemy.id);
        const crit = this.rng() < this.player.crit;
        const damage = bolt.damage * (crit ? 2 : 1);
        this.hitEnemy(enemy, damage, crit, bolt.x, bolt.y);
        const boltLength = Math.hypot(bolt.vx, bolt.vy) || 1;
        enemy.x += (bolt.vx / boltLength) * 3.4;
        enemy.y += (bolt.vy / boltLength) * 3.4;

        if (bolt.pierce > 0) {
          bolt.pierce -= 1;
        } else {
          consumed = true;
        }
        break;
      }

      if (consumed) this.projectiles.splice(i, 1);
    }
  }

  hitEnemy(enemy, damage, crit, x, y) {
    if (enemy.dead) return;
    enemy.hp -= damage;
    enemy.flash = 0.09;
    this.text(x, y - 6, `${Math.round(damage)}${crit ? '!' : ''}`, crit ? '#ffe1a0' : '#f1e7d4', crit ? 18 : 13);
    this.burst(x, y, crit ? '#f6d28a' : '#d9e6cf', crit ? 10 : 4, crit ? 170 : 90, crit ? 3.4 : 2.4);
    this.shake = Math.max(this.shake, crit ? 4.5 : 1.6);
    this.event('hit', { crit });
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    this.kills += 1;
    this.combo = this.comboTimer > 0 ? this.combo + 1 : 1;
    this.comboTimer = 2.4;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const multiplier = 1 + Math.min(20, this.combo) * 0.1;
    this.score += enemy.score * multiplier;

    this.burst(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 60 : 14, enemy.type === 'boss' ? 320 : 170, enemy.type === 'boss' ? 5 : 3);
    this.burst(enemy.x, enemy.y, '#ff7a45', enemy.type === 'boss' ? 20 : 4, 120, 2);

    const drops = enemy.type === 'elite' ? 3 : enemy.type === 'brute' ? 2 : 1;
    if (enemy.xp > 0) {
      const value = Math.max(1, Math.round(enemy.xp / drops));
      for (let i = 0; i < drops; i += 1) {
        this.gems.push({
          x: enemy.x + (i - (drops - 1) / 2) * 9,
          y: enemy.y + (this.rng() - 0.5) * 8,
          value,
          phase: this.rng() * Math.PI * 2,
        });
      }
    }

    this.event('kill', { kind: enemy.type });
    if (enemy.type === 'elite') {
      this.freeze = 0.045;
      this.shake = Math.max(this.shake, 8);
    }
    if (enemy.type === 'boss') {
      this.bossDefeated = true;
      this.freeze = 0.12;
      this.shake = 18;
      this.score += 2500;
      this.win();
    }
  }

  updateEnemies(dt) {
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    const p = this.player;

    for (const enemy of this.enemies) {
      if (this.over) break;
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      const wobble = Math.sin(this.time * 3.2 + enemy.phase) * 0.24;
      const speed = enemy.speed;
      enemy.x += ((dx / dist) * speed + (-dy / dist) * wobble * speed * 0.25) * dt;
      enemy.y += ((dy / dist) * speed + (dx / dist) * wobble * speed * 0.25) * dt;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.spawnT = Math.max(0, enemy.spawnT - dt);

      const rr = enemy.radius + p.radius - 2;
      if (distanceSq(p.x, p.y, enemy.x, enemy.y) < rr * rr) {
        this.damagePlayer(enemy.damage);
        const push = 16;
        p.x = clamp(p.x + (dx / dist) * push, p.radius, this.width - p.radius);
        p.y = clamp(p.y + (dy / dist) * push, p.radius, this.height - p.radius);
      }
    }
  }

  damagePlayer(rawAmount) {
    const p = this.player;
    if (p.invuln > 0 || this.over || this.won) return false;
    const amount = Math.max(1, rawAmount - p.armor);
    p.hp -= amount;
    p.invuln = 0.72;
    p.hitFlash = 0.2;
    this.shake = Math.max(this.shake, 9);
    this.flash = 0.32;
    this.flashColor = '#ff3b2f';
    this.hurt = 1;
    this.burst(p.x, p.y, '#ff6b5a', 12, 150, 3);
    this.text(p.x, p.y - 24, `-${Math.round(amount)}`, '#ff9b8a', 16);
    this.event('hurt');
    if (p.hp <= 0) {
      p.hp = 0;
      this.over = true;
      this.deathX = p.x;
      this.deathY = p.y;
      this.shake = 18;
      this.event('lose');
    }
    return true;
  }

  updateGems(dt) {
    const p = this.player;
    for (let i = this.gems.length - 1; i >= 0; i -= 1) {
      const gem = this.gems[i];
      gem.phase += dt * 4;
      const dx = p.x - gem.x;
      const dy = p.y - gem.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < p.magnet) {
        const pull = 240 + (p.magnet - dist) * 5;
        gem.x += (dx / dist) * pull * dt;
        gem.y += (dy / dist) * pull * dt;
      }

      if (dist < p.radius + 11) {
        this.gems.splice(i, 1);
        this.addXp(gem.value);
        this.burst(gem.x, gem.y, '#7fe7d4', 3, 60, 2);
      }
    }
  }

  addXp(value) {
    this.xp += value;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level += 1;
      this.xpNext = xpNeeded(this.level);
      this.pendingLevels += 1;
    }
    if (this.pendingLevels > 0) this.event('level');
  }

  spawn(dt) {
    if (this.enemies.length < MAX_ENEMIES) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = spawnIntervalAt(this.time);
        const count = spawnCountAt(this.time);
        for (let i = 0; i < count && this.enemies.length < MAX_ENEMIES; i += 1) {
          this.spawnAtEdge(pickEnemyType(this.time, this.rng));
        }
      }
    }

    if (!this.bossSpawned && this.time >= BOSS_TIME) {
      this.bossSpawned = true;
      const boss = this.spawnEnemy('boss', this.width / 2, -60);
      this.boss = boss;
      this.shake = 12;
      this.event('boss');
    }

    if (this.time >= this.nextElite) {
      this.nextElite += 30;
      this.spawnAtEdge('elite');
      this.event('elite');
    }
  }

  spawnAtEdge(type) {
    const edge = Math.floor(this.rng() * 4);
    const pad = 50;
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = this.rng() * this.width;
      y = -pad;
    } else if (edge === 1) {
      x = this.width + pad;
      y = this.rng() * this.height;
    } else if (edge === 2) {
      x = this.rng() * this.width;
      y = this.height + pad;
    } else {
      x = -pad;
      y = this.rng() * this.height;
    }
    return this.spawnEnemy(type, x, y);
  }

  spawnEnemy(type, x, y) {
    const base = ENEMY_TYPES[type];
    if (!base) throw new Error(`Unknown enemy type: ${type}`);
    const hpScale = type === 'boss' ? 1 : 1 + this.time * 0.011;
    const damageScale = type === 'boss' ? 1 : 1 + this.time * 0.0022;
    const speedScale = type === 'boss' ? 1 : Math.min(1.35, 1 + this.time * 0.0012);
    const enemy = {
      id: this.nextId++,
      type,
      x,
      y,
      radius: base.radius,
      hp: base.hp * hpScale,
      maxHp: base.hp * hpScale,
      speed: base.speed * speedScale,
      damage: base.damage * damageScale,
      xp: base.xp,
      score: base.score,
      color: base.color,
      dark: base.dark,
      dead: false,
      flash: 0,
      spawnT: type === 'boss' ? 0.8 : 0.3,
      phase: this.rng() * Math.PI * 2,
    };
    this.enemies.push(enemy);
    return enemy;
  }

  updateFx(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
    }

    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const text = this.texts[i];
      text.life -= dt;
      text.y -= 30 * dt;
      if (text.life <= 0) this.texts.splice(i, 1);
    }

    this.shake *= 0.88;
    if (this.shake < 0.05) this.shake = 0;
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.hurt = Math.max(0, this.hurt - dt * 1.4);
  }

  burst(x, y, color, count, speed, size) {
    for (let i = 0; i < count; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const angle = this.rng() * Math.PI * 2;
      const velocity = speed * (0.35 + this.rng() * 0.9);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.25 + this.rng() * 0.4,
        maxLife: 0.65,
        size: size * (0.6 + this.rng() * 0.8),
        color,
      });
    }
  }

  text(x, y, value, color, size = 13) {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ x, y, text: value, color, size, life: 0.7 });
  }

  rollUpgrades() {
    const available = UPGRADES.filter(
      (upgrade) => (this.upgrades[upgrade.id] ?? 0) < upgrade.max,
    );
    const pool = [...available];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.choices = pool.slice(0, 3).map((upgrade) => upgrade.id);
    return this.choices;
  }

  chooseUpgrade(id) {
    const upgrade = UPGRADE_BY_ID[id];
    if (!upgrade || this.pendingLevels <= 0) return false;
    const taken = this.upgrades[id] ?? 0;
    if (taken >= upgrade.max) return false;
    upgrade.apply(this);
    this.upgrades[id] = taken + 1;
    this.pendingLevels -= 1;
    this.choices = [];
    this.event('upgrade', { id });
    return true;
  }

  win() {
    if (this.won || this.over) return;
    this.won = true;
    this.score += 1500 + Math.round(this.time * 6);
    this.shake = 10;
    this.event('win');
  }

  summary() {
    return {
      time: Math.min(RUN_SECONDS, this.time),
      kills: this.kills,
      level: this.level,
      score: Math.round(this.score),
      bestCombo: this.bestCombo,
      won: this.won,
      over: this.over,
      seed: this.seed,
    };
  }
}

export function upgradeById(id) {
  return UPGRADE_BY_ID[id] ?? null;
}
