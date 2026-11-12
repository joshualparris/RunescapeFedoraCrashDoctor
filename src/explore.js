/**
 * Explore mode simulation: a walkable Wilderness, no combat.
 *
 * The map is a single 2400×1800 field with a smooth camera, collision against
 * trees/rocks/water, and proximity prompts for NPCs, waystones and chests.
 * Progression lives in `progress.explore` and is mutated only through the
 * small methods here; main.js owns persistence and dialogue.
 */

import { MAP, NPCS, WAYSTONES, CHESTS, RIFT, PATHS, areaAt, speakerFor } from './npcs.js';
import { mulberry32 } from './engine.js';

const TAU = Math.PI * 2;
const START = { x: 700, y: 980 };
const INTERACT_RANGE = 82;

function segmentPointDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function nearPath(x, y, threshold = 62) {
  for (const path of PATHS) {
    for (let i = 1; i < path.length; i += 1) {
      if (segmentPointDistance(x, y, path[i - 1][0], path[i - 1][1], path[i][0], path[i][1]) < threshold) {
        return true;
      }
    }
  }
  return false;
}

function keyPoints() {
  return [
    START,
    ...NPCS.map((npc) => ({ x: npc.x, y: npc.y })),
    ...WAYSTONES.map((stone) => ({ x: stone.x, y: stone.y })),
    ...CHESTS.map((chest) => ({ x: chest.x, y: chest.y })),
    RIFT,
  ];
}

function nearKeyPoint(x, y, threshold = 95) {
  return keyPoints().some((point) => Math.hypot(x - point.x, y - point.y) < threshold);
}

function makeObstacles() {
  const rng = mulberry32(377);
  const obstacles = [];
  const push = (type, x, y, radius, extra = {}) => {
    if (nearKeyPoint(x, y, 92) || nearPath(x, y)) return;
    obstacles.push({ type, x, y, radius, ...extra });
  };

  // Dense, darker woods to the north-west.
  for (let i = 0; i < 105; i += 1) {
    push('tree', 90 + rng() * 1180, 90 + rng() * 560, 20 + rng() * 12, {
      hue: rng(),
      sway: rng() * TAU,
    });
  }

  // A tree line around the camp meadow.
  for (let i = 0; i < 46; i += 1) {
    const edge = Math.floor(rng() * 4);
    let x;
    let y;
    if (edge === 0) {
      x = 90 + rng() * (MAP.width - 180);
      y = 70 + rng() * 120;
    } else if (edge === 1) {
      x = MAP.width - 70 - rng() * 120;
      y = 80 + rng() * (MAP.height - 160);
    } else if (edge === 2) {
      x = 90 + rng() * (MAP.width - 180);
      y = MAP.height - 70 - rng() * 120;
    } else {
      x = 70 + rng() * 120;
      y = 80 + rng() * (MAP.height - 160);
    }
    push('tree', x, y, 18 + rng() * 14, { hue: rng(), sway: rng() * TAU });
  }

  // Rocks and broken masonry in the ruins and around the circle.
  for (let i = 0; i < 34; i += 1) {
    push(
      i % 3 === 0 ? 'ruin' : 'rock',
      1500 + rng() * 820,
      1000 + rng() * 720,
      12 + rng() * 18,
      { angle: rng() * TAU },
    );
  }
  for (let i = 0; i < 18; i += 1) {
    push('rock', 1700 + rng() * 700, 80 + rng() * 760, 10 + rng() * 16, {
      angle: rng() * TAU,
    });
  }

  obstacles.push({ type: 'water', x: 1035, y: 1605, radius: 132, ripple: 0.2 });
  return obstacles;
}

export class Explore {
  constructor({ width = 1200, height = 700, state }) {
    this.width = width;
    this.height = height;
    this.state = state;
    this.player = {
      x: START.x,
      y: START.y,
      radius: 14,
      speed: 236,
      facing: 1,
      walk: 0,
    };
    this.camera = { x: 0, y: 0 };
    this.obstacles = makeObstacles();
    this.area = areaAt(this.player.x, this.player.y);
    this.areaChanged = false;
    this.prompt = null;
    this.time = 0;
    this.npcs = NPCS;
    this.waystones = WAYSTONES;
    this.chests = CHESTS;
    this.rift = RIFT;
    this.snapCamera();
  }

  resize(width, height) {
    this.width = Math.max(320, width);
    this.height = Math.max(320, height);
    this.player.x = Math.min(Math.max(this.player.radius, this.player.x), MAP.width - this.player.radius);
    this.player.y = Math.min(Math.max(this.player.radius, this.player.y), MAP.height - this.player.radius);
    this.snapCamera();
  }

  snapCamera() {
    this.camera.x = this.clampCamera(this.player.x - this.width / 2, MAP.width - this.width);
    this.camera.y = this.clampCamera(this.player.y - this.height / 2, MAP.height - this.height);
  }

  clampCamera(value, max) {
    return Math.max(0, Math.min(value, Math.max(0, max)));
  }

  get fragmentCount() {
    return this.state.fragments.length;
  }

  hidNpc(npc) {
    return Boolean(npc.hideWhen && this.state.flags[npc.hideWhen]);
  }

  update(dt, input = {}) {
    this.time += dt;
    const player = this.player;
    let dx = Number(input.x) || 0;
    let dy = Number(input.y) || 0;
    const length = Math.hypot(dx, dy);
    if (length > 1) {
      dx /= length;
      dy /= length;
    }

    if (Math.abs(dx) > 0.08) player.facing = dx < 0 ? -1 : 1;
    const speed = player.speed * (this.fragmentCount >= 3 ? 1.04 : 1);
    player.x += dx * speed * dt;
    player.y += dy * speed * dt;
    player.walk += Math.hypot(dx, dy) * speed * dt;

    this.collide(player);
    player.x = Math.min(Math.max(player.radius, player.x), MAP.width - player.radius);
    player.y = Math.min(Math.max(player.radius, player.y), MAP.height - player.radius);

    const nextArea = areaAt(player.x, player.y);
    this.areaChanged = nextArea !== this.area;
    if (this.areaChanged) this.area = nextArea;

    const targetX = this.clampCamera(player.x - this.width / 2, MAP.width - this.width);
    const targetY = this.clampCamera(player.y - this.height / 2, MAP.height - this.height);
    const ease = 1 - Math.exp(-dt * 7);
    this.camera.x += (targetX - this.camera.x) * ease;
    this.camera.y += (targetY - this.camera.y) * ease;

    this.prompt = this.findPrompt();
  }

  collide(player) {
    // Two passes keep the player out of corners where two trunks overlap.
    for (let pass = 0; pass < 2; pass += 1) {
      for (const obstacle of this.obstacles) {
        const rr = obstacle.radius + player.radius;
        const dx = player.x - obstacle.x;
        const dy = player.y - obstacle.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= rr * rr || distSq === 0) continue;
        const dist = Math.sqrt(distSq) || 1;
        const push = rr - dist;
        player.x += (dx / dist) * push;
        player.y += (dy / dist) * push;
      }
    }
  }

  findPrompt() {
    const player = this.player;
    let best = null;
    let bestDist = INTERACT_RANGE * INTERACT_RANGE;

    const consider = (kind, id, x, y, label) => {
      const dist = (player.x - x) ** 2 + (player.y - y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = { kind, id, x, y, label };
      }
    };

    for (const npc of this.npcs) {
      if (this.hidNpc(npc)) continue;
      const speaker = speakerFor(npc.id);
      if (!speaker) continue;
      const label = npc.id === 'moss' ? 'Greet Moss' : `Talk to ${speaker.name}`;
      consider('npc', npc.id, npc.x, npc.y, label);
    }
    for (const stone of this.waystones) {
      consider('waystone', stone.id, stone.x, stone.y, `Touch ${stone.name}`);
    }
    for (const chest of this.chests) {
      const opened = this.state.chests.includes(chest.id);
      consider('chest', chest.id, chest.x, chest.y, opened ? `Inspect ${chest.name}` : `Open ${chest.name}`);
    }
    return best;
  }

  interact() {
    return this.prompt;
  }

  markMet(id) {
    if (!this.state.met.includes(id)) {
      this.state.met.push(id);
      return true;
    }
    return false;
  }

  addFragment(id) {
    if (!this.state.fragments.includes(id)) {
      this.state.fragments.push(id);
      return true;
    }
    return false;
  }

  addChest(id) {
    if (!this.state.chests.includes(id)) {
      this.state.chests.push(id);
      this.state.loot += 250;
      return true;
    }
    return false;
  }

  markFlag(id) {
    if (!this.state.flags[id]) {
      this.state.flags[id] = true;
      return true;
    }
    return false;
  }

  grantBoon(id) {
    if (!this.state.boons[id]) {
      this.state.boons[id] = true;
      return true;
    }
    return false;
  }

  hasBoon(id) {
    return Boolean(this.state.boons[id]);
  }

  get riftOpen() {
    return this.fragmentCount >= 3;
  }
}

export { START, INTERACT_RANGE };
