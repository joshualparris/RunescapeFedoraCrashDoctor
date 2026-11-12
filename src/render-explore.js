/**
 * Explore-mode canvas renderer: ground, paths, landmarks and people.
 * The arena renderer stays separate; both draw to the same canvas when active.
 */

import { MAP, PATHS, WAYSTONES, CHESTS, RIFT } from './npcs.js';
import { mulberry32 } from './engine.js';

const TAU = Math.PI * 2;
const CAMP = { x: 640, y: 950 };
const CIRCLE = { x: 1980, y: 480, radius: 210 };

export class ExploreRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(240, Math.round(rect.width || 1200));
    const height = Math.max(240, Math.round(rect.height || 700));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.vignette = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.3,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75,
    );
    this.vignette.addColorStop(0, 'rgba(0,0,0,0)');
    this.vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    this.buildDecor();
  }

  buildDecor() {
    const rng = mulberry32(3770);
    this.patches = [];
    for (let i = 0; i < 260; i += 1) {
      this.patches.push({
        x: rng() * MAP.width,
        y: rng() * MAP.height,
        r: 20 + rng() * 90,
        alpha: 0.02 + rng() * 0.05,
        hue: rng(),
      });
    }
    this.tufts = [];
    for (let i = 0; i < 520; i += 1) {
      this.tufts.push({
        x: rng() * MAP.width,
        y: rng() * MAP.height,
        h: 4 + rng() * 9,
        lean: (rng() - 0.5) * 5,
        alpha: 0.22 + rng() * 0.35,
      });
    }
    this.fireflies = [];
    for (let i = 0; i < 44; i += 1) {
      this.fireflies.push({
        x: rng() * MAP.width,
        y: rng() * MAP.height,
        phase: rng() * TAU,
        speed: 0.3 + rng() * 0.7,
        amp: 6 + rng() * 16,
      });
    }
    this.walls = [
      { x: 1720, y: 1080, w: 300, h: 26, rot: 0.03 },
      { x: 1700, y: 1080, w: 26, h: 260, rot: -0.02 },
      { x: 1700, y: 1490, w: 240, h: 24, rot: 0.06 },
      { x: 2200, y: 1180, w: 26, h: 280, rot: 0.02 },
      { x: 1960, y: 1620, w: 280, h: 24, rot: -0.04 },
      { x: 2040, y: 1430, w: 140, h: 22, rot: 0.1 },
      { x: 1780, y: 1320, w: 120, h: 20, rot: -0.08 },
    ];
    this.circleStones = [];
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * TAU;
      this.circleStones.push({
        x: CIRCLE.x + Math.cos(a) * CIRCLE.radius,
        y: CIRCLE.y + Math.sin(a) * CIRCLE.radius * 0.7,
        a,
        h: 26 + (i % 3) * 10,
      });
    }
    this.campTents = [
      { x: 540, y: 860, hue: '#8fbf9f' },
      { x: 760, y: 890, hue: '#e3b25c' },
    ];
  }

  visible(x, y, pad = 100) {
    const { x: cx, y: cy } = this.camera ?? { x: 0, y: 0 };
    return x > cx - pad && x < cx + this.width + pad && y > cy - pad && y < cy + this.height + pad;
  }

  draw(explore, t) {
    const { ctx, width, height } = this;
    this.camera = explore.camera;
    this.time = t;
    const cam = explore.camera;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

    const ground = ctx.createLinearGradient(0, 0, 0, MAP.height);
    ground.addColorStop(0, '#0b1710');
    ground.addColorStop(0.5, '#0d1b12');
    ground.addColorStop(1, '#0a140d');
    ctx.fillStyle = ground;
    ctx.fillRect(cam.x - 40, cam.y - 40, width + 80, height + 80);

    this.drawPatches(ctx);
    this.drawPaths(ctx);
    this.drawWater(ctx, t);
    this.drawRuinsFloor(ctx);
    this.drawRuneCircle(ctx, t);
    this.drawCamp(ctx, t);
    this.drawRift(ctx, t, explore);
    this.drawObstacles(ctx, t, explore);
    this.drawChests(ctx, explore);
    this.drawWaystones(ctx, t, explore);
    this.drawNpcs(ctx, t, explore);
    this.drawMoss(ctx, t, explore);
    this.drawPlayer(ctx, t, explore);
    this.drawAmbient(ctx, t, explore);
    this.drawLabels(ctx, explore);
    this.drawPrompt(ctx, explore);

    ctx.restore();

    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, width, height);
  }

  drawPatches(ctx) {
    const cam = this.camera;
    for (const patch of this.patches) {
      if (!this.visible(patch.x, patch.y, patch.r)) continue;
      ctx.fillStyle =
        patch.hue > 0.6
          ? `rgba(53, 82, 50, ${patch.alpha})`
          : patch.hue > 0.3
            ? `rgba(36, 62, 39, ${patch.alpha})`
            : `rgba(72, 64, 36, ${patch.alpha})`;
      ctx.beginPath();
      ctx.ellipse(patch.x, patch.y, patch.r, patch.r * 0.55, 0, 0, TAU);
      ctx.fill();
    }
    for (const tuft of this.tufts) {
      if (!this.visible(tuft.x, tuft.y, 20)) continue;
      ctx.strokeStyle = `rgba(126, 160, 116, ${tuft.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tuft.x, tuft.y);
      ctx.quadraticCurveTo(tuft.x + 2, tuft.y - tuft.h * 0.5, tuft.x + tuft.lean, tuft.y - tuft.h);
      ctx.stroke();
    }
    // A little atmospheric ground fog.
    for (let i = 0; i < 4; i += 1) {
      const x = ((this.time * (5 + i * 2) + i * 611) % (MAP.width + 600)) - 300;
      const y = 300 + i * 380;
      if (!this.visible(x, y, 500)) continue;
      const fog = ctx.createRadialGradient(x, y, 0, x, y, 420);
      fog.addColorStop(0, 'rgba(126, 170, 138, 0.035)');
      fog.addColorStop(1, 'rgba(126, 170, 138, 0)');
      ctx.fillStyle = fog;
      ctx.beginPath();
      ctx.arc(x, y, 420, 0, TAU);
      ctx.fill();
    }
  }

  drawPaths(ctx) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const path of PATHS) {
      ctx.strokeStyle = 'rgba(37, 42, 27, 0.85)';
      ctx.lineWidth = 54;
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i += 1) ctx.lineTo(path[i][0], path[i][1]);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(74, 72, 44, 0.5)';
      ctx.lineWidth = 38;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(180, 160, 96, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 16]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawWater(ctx, t) {
    const { x, y, radius } = { x: 1035, y: 1605, radius: 132 };
    if (!this.visible(x, y, radius + 60)) return;
    const water = ctx.createRadialGradient(x, y, 10, x, y, radius);
    water.addColorStop(0, 'rgba(31, 78, 71, 0.8)');
    water.addColorStop(0.7, 'rgba(18, 45, 40, 0.9)');
    water.addColorStop(1, 'rgba(10, 22, 18, 0.2)');
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.78, -0.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(127, 231, 212, 0.12)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i += 1) {
      const r = radius * (0.35 + i * 0.18) + Math.sin(t * 1.2 + i) * 4;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.58, -0.1, 0, TAU);
      ctx.stroke();
    }
  }

  drawRuinsFloor(ctx) {
    if (!this.visible(1960, 1350, 500)) return;
    ctx.fillStyle = 'rgba(46, 47, 39, 0.35)';
    ctx.beginPath();
    ctx.ellipse(1960, 1370, 330, 280, -0.1, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 18; i += 1) {
      const x = 1680 + (i % 6) * 92 + (i % 2) * 12;
      const y = 1170 + Math.floor(i / 6) * 130;
      if (!this.visible(x, y, 60)) continue;
      ctx.fillStyle = 'rgba(91, 92, 78, 0.12)';
      ctx.fillRect(x, y, 64, 46);
      ctx.strokeStyle = 'rgba(160, 156, 118, 0.08)';
      ctx.strokeRect(x, y, 64, 46);
    }
  }

  drawRuneCircle(ctx, t) {
    if (!this.visible(CIRCLE.x, CIRCLE.y, 400)) return;
    ctx.fillStyle = 'rgba(30, 63, 55, 0.22)';
    ctx.beginPath();
    ctx.ellipse(CIRCLE.x, CIRCLE.y, CIRCLE.radius, CIRCLE.radius * 0.7, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(127, 231, 212, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(CIRCLE.x, CIRCLE.y, CIRCLE.radius * 0.86, CIRCLE.radius * 0.6, 0, 0, TAU);
    ctx.stroke();
    for (const stone of this.circleStones) {
      if (!this.visible(stone.x, stone.y, 60)) continue;
      ctx.fillStyle = '#1b2c25';
      ctx.strokeStyle = 'rgba(127, 231, 212, 0.18)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(stone.x, stone.y, 13, stone.h, stone.a, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(127, 231, 212, ${0.18 + Math.sin(t * 2 + stone.a) * 0.08})`;
      ctx.beginPath();
      ctx.arc(stone.x, stone.y - stone.h * 0.2, 2.5, 0, TAU);
      ctx.fill();
    }
  }

  drawCamp(ctx, t) {
    if (!this.visible(CAMP.x, CAMP.y, 400)) return;
    ctx.fillStyle = 'rgba(45, 58, 35, 0.28)';
    ctx.beginPath();
    ctx.ellipse(CAMP.x, CAMP.y, 290, 200, 0, 0, TAU);
    ctx.fill();

    for (const tent of this.campTents) {
      if (!this.visible(tent.x, tent.y, 120)) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(tent.x, tent.y + 18, 42, 12, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#18261b';
      ctx.strokeStyle = 'rgba(227, 178, 92, 0.2)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(tent.x - 46, tent.y + 16);
      ctx.lineTo(tent.x, tent.y - 54);
      ctx.lineTo(tent.x + 46, tent.y + 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(143, 191, 159, 0.2)';
      ctx.beginPath();
      ctx.moveTo(tent.x, tent.y - 54);
      ctx.lineTo(tent.x, tent.y + 16);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.moveTo(tent.x - 12, tent.y + 16);
      ctx.lineTo(tent.x, tent.y - 8);
      ctx.lineTo(tent.x + 12, tent.y + 16);
      ctx.fill();
    }

    // Campfire.
    const fx = CAMP.x;
    const fy = CAMP.y + 70;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(fx, fy + 12, 48, 16, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#5b452d';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(fx - 26, fy + 6);
    ctx.lineTo(fx + 26, fy - 2);
    ctx.moveTo(fx - 24, fy - 4);
    ctx.lineTo(fx + 22, fy + 8);
    ctx.stroke();
    const flicker = Math.sin(t * 11) * 5 + Math.sin(t * 17 + 2) * 3;
    for (let i = 0; i < 3; i += 1) {
      const h = 46 + i * 12 + flicker * (i + 1) * 0.5;
      ctx.fillStyle = i === 0 ? 'rgba(255, 122, 69, 0.85)' : i === 1 ? 'rgba(255, 190, 90, 0.6)' : 'rgba(127, 231, 212, 0.18)';
      ctx.beginPath();
      ctx.moveTo(fx - 18 + i * 8, fy + 2);
      ctx.quadraticCurveTo(fx - 8 + i * 4, fy - h * 0.5, fx + 2 + flicker * 0.4, fy - h);
      ctx.quadraticCurveTo(fx + 16 - i * 2, fy - h * 0.4, fx + 16 - i * 6, fy + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(246, 210, 138, 0.7)';
    for (let i = 0; i < 5; i += 1) {
      const px = fx + Math.sin(t * 3 + i * 7) * (12 + i * 6);
      const py = fy - 30 - ((t * 22 + i * 37) % 90);
      ctx.globalAlpha = Math.max(0, 1 - (fy - py) / 110);
      ctx.beginPath();
      ctx.arc(px, py, 1.4, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Crates and a log.
    ctx.fillStyle = 'rgba(90, 69, 43, 0.5)';
    ctx.fillRect(CAMP.x + 120, CAMP.y + 30, 26, 18);
    ctx.fillRect(CAMP.x + 152, CAMP.y + 36, 20, 14);
  }

  drawRift(ctx, t, explore) {
    if (!this.visible(RIFT.x, RIFT.y, 260)) return;
    const open = explore.riftOpen;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(RIFT.x, RIFT.y + 18, 90, 26, 0, 0, TAU);
    ctx.fill();

    for (const side of [-1, 1]) {
      const x = RIFT.x + side * 62;
      ctx.fillStyle = '#1a201b';
      ctx.strokeStyle = open ? 'rgba(255, 155, 122, 0.5)' : 'rgba(180, 190, 170, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 18, RIFT.y + 20);
      ctx.lineTo(x - 12, RIFT.y - 90);
      ctx.lineTo(x + 2, RIFT.y - 112);
      ctx.lineTo(x + 16, RIFT.y - 80);
      ctx.lineTo(x + 18, RIFT.y + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    const glow = open ? 0.5 + Math.sin(t * 4) * 0.12 : 0.06;
    const portal = ctx.createRadialGradient(RIFT.x, RIFT.y - 42, 3, RIFT.x, RIFT.y - 42, 64);
    portal.addColorStop(0, `rgba(255, 220, 180, ${glow})`);
    portal.addColorStop(0.35, `rgba(255, 122, 69, ${glow * 0.7})`);
    portal.addColorStop(0.75, `rgba(127, 60, 90, ${glow * 0.4})`);
    portal.addColorStop(1, 'rgba(20, 10, 14, 0)');
    ctx.fillStyle = portal;
    ctx.beginPath();
    ctx.ellipse(RIFT.x, RIFT.y - 42, 52, 78, 0, 0, TAU);
    ctx.fill();

    if (open) {
      ctx.strokeStyle = `rgba(255, 200, 160, ${0.35 + Math.sin(t * 3) * 0.1})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        const a = t * (0.5 + i * 0.2) + i * 2.1;
        ctx.beginPath();
        ctx.ellipse(
          RIFT.x + Math.cos(a) * 10,
          RIFT.y - 42 + Math.sin(a) * 18,
          30 + i * 8,
          50 + i * 8,
          a * 0.2,
          0,
          TAU,
        );
        ctx.stroke();
      }
    }

    this.label(ctx, open ? 'THE RIFT IS OPEN' : 'THE RIFT IS SEALED', RIFT.x, RIFT.y - 132, open ? '#ff9b7a' : '#6f806f', 11);
  }

  drawObstacles(ctx, t, explore) {
    for (const obstacle of explore.obstacles) {
      if (!this.visible(obstacle.x, obstacle.y, obstacle.radius + 70)) continue;
      if (obstacle.type === 'water') continue;
      if (obstacle.type === 'tree') this.drawTree(ctx, obstacle, t);
      else if (obstacle.type === 'rock') this.drawRock(ctx, obstacle);
      else this.drawRuin(ctx, obstacle);
    }
  }

  drawTree(ctx, tree, t) {
    const sway = Math.sin(t * 0.6 + tree.sway) * 2.2;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(tree.x + 5, tree.y + 10, tree.radius * 1.3, tree.radius * 0.45, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3d2f20';
    ctx.fillRect(tree.x - 3, tree.y - 14, 6, 28);
    const r = tree.radius;
    const green = tree.hue > 0.55 ? '#23482c' : tree.hue > 0.25 ? '#1d3d26' : '#1a3420';
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.arc(tree.x + sway, tree.y - r * 0.85, r * 0.9, 0, TAU);
    ctx.arc(tree.x - r * 0.55 + sway, tree.y - r * 0.45, r * 0.65, 0, TAU);
    ctx.arc(tree.x + r * 0.6 + sway, tree.y - r * 0.55, r * 0.7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(143, 191, 159, 0.07)';
    ctx.beginPath();
    ctx.arc(tree.x + sway - r * 0.25, tree.y - r * 1.1, r * 0.45, 0, TAU);
    ctx.fill();
  }

  drawRock(ctx, rock) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(rock.x + 4, rock.y + 6, rock.radius * 1.1, rock.radius * 0.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3c4438';
    ctx.strokeStyle = 'rgba(160, 166, 140, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(rock.x, rock.y, rock.radius, rock.radius * 0.7, rock.angle ?? 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }

  drawRuin(ctx, ruin) {
    ctx.save();
    ctx.translate(ruin.x, ruin.y);
    ctx.rotate(ruin.angle ?? 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-ruin.radius, -ruin.radius * 0.4, ruin.radius * 2.2, ruin.radius * 0.7);
    ctx.fillStyle = '#343a31';
    ctx.strokeStyle = 'rgba(180, 176, 140, 0.14)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-ruin.radius, -ruin.radius * 0.8, ruin.radius * 2, ruin.radius * 1.4);
    ctx.strokeRect(-ruin.radius, -ruin.radius * 0.8, ruin.radius * 2, ruin.radius * 1.4);
    ctx.strokeStyle = 'rgba(20,20,15,0.4)';
    ctx.beginPath();
    ctx.moveTo(-ruin.radius * 0.3, -ruin.radius * 0.8);
    ctx.lineTo(-ruin.radius * 0.1, 0);
    ctx.lineTo(-ruin.radius * 0.4, ruin.radius * 0.6);
    ctx.stroke();
    ctx.restore();
  }

  drawWaystones(ctx, t, explore) {
    for (const stone of WAYSTONES) {
      if (!this.visible(stone.x, stone.y, 120)) continue;
      const lit = explore.state.fragments.includes(stone.id);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(stone.x, stone.y + 20, 30, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = lit ? '#26392f' : '#222b24';
      ctx.strokeStyle = lit ? stone.color : 'rgba(180, 190, 170, 0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(stone.x - 18, stone.y + 18);
      ctx.lineTo(stone.x - 14, stone.y - 48);
      ctx.lineTo(stone.x, stone.y - 62);
      ctx.lineTo(stone.x + 15, stone.y - 44);
      ctx.lineTo(stone.x + 18, stone.y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const glow = lit ? 0.6 + Math.sin(t * 3) * 0.2 : 0.14;
      ctx.fillStyle = `rgba(127, 231, 212, ${glow})`;
      ctx.beginPath();
      ctx.arc(stone.x, stone.y - 26, 4 + (lit ? Math.sin(t * 4) * 1.2 : 0), 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(127, 231, 212, ${glow * 0.18})`;
      ctx.beginPath();
      ctx.arc(stone.x, stone.y - 26, 16, 0, TAU);
      ctx.fill();
    }
  }

  drawChests(ctx, explore) {
    for (const chest of CHESTS) {
      if (!this.visible(chest.x, chest.y, 80)) continue;
      const opened = explore.state.chests.includes(chest.id);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(chest.x, chest.y + 10, 22, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = opened ? '#2b2318' : '#5a452b';
      ctx.strokeStyle = opened ? 'rgba(180, 190, 170, 0.15)' : 'rgba(227, 178, 92, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(chest.x - 18, chest.y - 10, 36, 22);
      ctx.strokeRect(chest.x - 18, chest.y - 10, 36, 22);
      if (!opened) {
        ctx.fillStyle = '#7a5c2e';
        ctx.fillRect(chest.x - 19, chest.y - 15, 38, 7);
        ctx.fillStyle = '#e3b25c';
        ctx.fillRect(chest.x - 2, chest.y - 2, 4, 6);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(chest.x - 15, chest.y - 7, 30, 8);
      }
    }
  }

  drawNpcs(ctx, t, explore) {
    for (const npc of explore.npcs) {
      if (explore.hidNpc(npc)) continue;
      if (!this.visible(npc.x, npc.y, 100)) continue;
      if (npc.id === 'moss') continue;
      const near = Math.hypot(npc.x - explore.player.x, npc.y - explore.player.y) < 240;
      if (npc.id === 'echo') this.drawEcho(ctx, npc, t, near);
      else if (npc.id === 'pip') this.drawPip(ctx, npc, t, near);
      else if (npc.id === 'warden') this.drawWarden(ctx, npc, t, near);
      else this.drawPerson(ctx, npc, t, near);
    }
  }

  drawPerson(ctx, npc, t, near) {
    const bob = Math.sin(t * 1.6 + npc.x) * 1.4;
    const color = npc.id === 'mira' ? '#e3b25c' : npc.id === 'bran' ? '#8fbf9f' : npc.id === 'sable' ? '#c78a63' : '#b9c4b3';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(npc.x, npc.y + 16, 17, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#101a12';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(npc.x - 14, npc.y + 18);
    ctx.quadraticCurveTo(npc.x - 18, npc.y - 16, npc.x, npc.y - 34 + bob);
    ctx.quadraticCurveTo(npc.x + 18, npc.y - 16, npc.x + 14, npc.y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0a120c';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y - 24 + bob, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(npc.x - 2.6, npc.y - 25 + bob, 1.1, 0, TAU);
    ctx.arc(npc.x + 2.6, npc.y - 25 + bob, 1.1, 0, TAU);
    ctx.fill();
    if (npc.id === 'bran') {
      ctx.fillStyle = 'rgba(143, 191, 159, 0.25)';
      ctx.beginPath();
      ctx.ellipse(npc.x, npc.y - 38 + bob, 14, 4, 0, 0, TAU);
      ctx.fill();
    }
    if (near) this.label(ctx, npc.id === 'mira' ? 'Mira' : npc.id === 'bran' ? 'Old Bran' : npc.id === 'sable' ? 'Sable' : npc.id, npc.x, npc.y - 58, color, 10);
  }

  drawPip(ctx, npc, t, near) {
    const bob = Math.sin(t * 3 + 1) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(npc.x, npc.y + 10, 12, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#7e9a4c';
    ctx.strokeStyle = '#a9c46a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(npc.x, npc.y - 6 + bob, 12, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4b5e2d';
    ctx.beginPath();
    ctx.moveTo(npc.x - 8, npc.y - 13 + bob);
    ctx.lineTo(npc.x - 14, npc.y - 25 + bob);
    ctx.lineTo(npc.x - 3, npc.y - 17 + bob);
    ctx.closePath();
    ctx.moveTo(npc.x + 8, npc.y - 13 + bob);
    ctx.lineTo(npc.x + 14, npc.y - 25 + bob);
    ctx.lineTo(npc.x + 3, npc.y - 17 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6d28a';
    ctx.beginPath();
    ctx.arc(npc.x - 4, npc.y - 7 + bob, 1.6, 0, TAU);
    ctx.arc(npc.x + 4, npc.y - 7 + bob, 1.6, 0, TAU);
    ctx.fill();
    if (near) this.label(ctx, 'Pip', npc.x, npc.y - 38, '#a9c46a', 10);
  }

  drawEcho(ctx, npc, t, near) {
    const float = Math.sin(t * 1.3) * 4;
    ctx.strokeStyle = 'rgba(127, 231, 212, 0.55)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i += 1) {
      const r = 18 + i * 8 + Math.sin(t * 2 + i) * 3;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y - 20 + float, r, t * 0.4 + i, t * 0.4 + i + 2.1);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(127, 231, 212, 0.14)';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y - 20 + float, 24, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(200, 255, 244, 0.8)';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y - 20 + float, 3, 0, TAU);
    ctx.fill();
    if (near) this.label(ctx, 'The Echo', npc.x, npc.y - 62, '#7fe7d4', 10);
  }

  drawWarden(ctx, npc, t, near) {
    const bob = Math.sin(t * 0.9) * 1.2;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(npc.x, npc.y + 20, 20, 7, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1b0f11';
    ctx.strokeStyle = 'rgba(255, 155, 122, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(npc.x - 22, npc.y + 22);
    ctx.quadraticCurveTo(npc.x - 24, npc.y - 30, npc.x, npc.y - 58 + bob);
    ctx.quadraticCurveTo(npc.x + 24, npc.y - 30, npc.x + 22, npc.y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 155, 122, 0.5)';
    ctx.beginPath();
    ctx.arc(npc.x - 5, npc.y - 34 + bob, 1.6, 0, TAU);
    ctx.arc(npc.x + 5, npc.y - 34 + bob, 1.6, 0, TAU);
    ctx.fill();
    if (near) this.label(ctx, 'The Warden', npc.x, npc.y - 76, '#ff9b7a', 10);
  }

  drawMoss(ctx, t, explore) {
    const npc = explore.npcs.find((item) => item.id === 'moss');
    if (!npc || explore.hidNpc(npc) || !this.visible(npc.x, npc.y, 80)) return;
    const bob = Math.sin(t * 2) * 1.2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(npc.x, npc.y + 8, 16, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8a7654';
    ctx.beginPath();
    ctx.ellipse(npc.x - 4, npc.y, 14, 8, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(npc.x + 10, npc.y - 7 + bob, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#5f5038';
    ctx.beginPath();
    ctx.moveTo(npc.x + 4, npc.y - 12 + bob);
    ctx.lineTo(npc.x + 1, npc.y - 22 + bob);
    ctx.lineTo(npc.x + 9, npc.y - 14 + bob);
    ctx.closePath();
    ctx.moveTo(npc.x + 14, npc.y - 12 + bob);
    ctx.lineTo(npc.x + 18, npc.y - 21 + bob);
    ctx.lineTo(npc.x + 18, npc.y - 11 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a7654';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(npc.x - 16, npc.y - 2);
    ctx.quadraticCurveTo(npc.x - 25, npc.y - 8 + Math.sin(t * 4) * 3, npc.x - 20, npc.y - 16);
    ctx.stroke();
    if (Math.hypot(npc.x - explore.player.x, npc.y - explore.player.y) < 190) {
      this.label(ctx, 'Moss', npc.x, npc.y - 34, '#b9a37a', 10);
    }
  }

  drawPlayer(ctx, t, explore) {
    const p = explore.player;
    const moving = Math.sin(p.walk * 0.05) !== 0;
    const bob = moving ? Math.sin(p.walk * 0.08) * 2 : Math.sin(t * 2) * 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 14, 17, 6, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(143, 191, 159, 0.08)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 34, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(p.facing, 1);
    ctx.fillStyle = '#1a2b20';
    ctx.strokeStyle = '#8fbf9f';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-13, 18);
    ctx.quadraticCurveTo(-17, -12, 0, -28);
    ctx.quadraticCurveTo(17, -12, 13, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0a120c';
    ctx.beginPath();
    ctx.arc(0, -20, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f6d28a';
    ctx.beginPath();
    ctx.arc(3, -21, 1.4, 0, TAU);
    ctx.fill();
    // Staff.
    ctx.strokeStyle = '#7a5a2b';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(10, 12);
    ctx.lineTo(21, -22);
    ctx.stroke();
    ctx.fillStyle = `rgba(127, 231, 212, ${0.6 + Math.sin(t * 3) * 0.15})`;
    ctx.beginPath();
    ctx.arc(21, -22, 3.2, 0, TAU);
    ctx.fill();
    // Pack.
    ctx.fillStyle = '#3d3324';
    ctx.fillRect(-16, -4, 7, 13);
    ctx.restore();
  }

  drawAmbient(ctx, t, explore) {
    for (const fly of this.fireflies) {
      if (!this.visible(fly.x, fly.y, 60)) continue;
      const x = fly.x + Math.sin(t * fly.speed + fly.phase) * fly.amp;
      const y = fly.y + Math.cos(t * fly.speed * 0.8 + fly.phase) * fly.amp * 0.6;
      const alpha = 0.25 + (Math.sin(t * 2 + fly.phase) + 1) * 0.25;
      ctx.fillStyle = `rgba(246, 210, 138, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, TAU);
      ctx.fill();
    }
    // The waystones pulse a faint line toward the sky when all three are lit.
    if (explore.riftOpen) {
      ctx.strokeStyle = `rgba(127, 231, 212, ${0.05 + Math.sin(t * 2) * 0.02})`;
      ctx.lineWidth = 1;
      for (const stone of WAYSTONES) {
        ctx.beginPath();
        ctx.moveTo(stone.x, stone.y - 60);
        ctx.lineTo(stone.x + Math.sin(t + stone.x) * 20, stone.y - 240);
        ctx.stroke();
      }
    }
  }

  drawLabels(ctx, explore) {
    // A subtle horizon label for the region you are standing in.
    if (explore.prompt) return;
  }

  drawPrompt(ctx, explore) {
    const prompt = explore.prompt;
    if (!prompt) return;
    const pulse = 0.5 + Math.sin(this.time * 4) * 0.2;
    ctx.strokeStyle = `rgba(246, 210, 138, ${pulse})`;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(prompt.x, prompt.y, 28, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    this.label(ctx, prompt.label, prompt.x, prompt.y - 48, '#f6d28a', 11);
  }

  label(ctx, text, x, y, color, size = 10) {
    ctx.font = `500 ${size}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(4, 9, 6, 0.72)';
    ctx.fillRect(x - w / 2 - 6, y - size / 2 - 3, w + 12, size + 6);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 0.5);
  }

  drawMinimap(canvas, explore) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const sx = w / MAP.width;
    const sy = h / MAP.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(5, 11, 7, 0.82)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(210, 226, 196, 0.12)';
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    ctx.strokeStyle = 'rgba(180, 160, 96, 0.18)';
    ctx.lineWidth = 2;
    for (const path of PATHS) {
      ctx.beginPath();
      ctx.moveTo(path[0][0] * sx, path[0][1] * sy);
      for (let i = 1; i < path.length; i += 1) ctx.lineTo(path[i][0] * sx, path[i][1] * sy);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(31, 78, 71, 0.5)';
    ctx.beginPath();
    ctx.ellipse(1035 * sx, 1605 * sy, 132 * sx * 1.6, 132 * sy * 1.2, 0, 0, TAU);
    ctx.fill();

    for (const npc of explore.npcs) {
      if (explore.hidNpc(npc)) continue;
      const met = explore.state.met.includes(npc.id);
      ctx.fillStyle = met ? (npc.id === 'pip' ? '#a9c46a' : npc.id === 'warden' ? '#ff9b7a' : '#e3b25c') : 'rgba(180, 190, 170, 0.35)';
      ctx.beginPath();
      ctx.arc(npc.x * sx, npc.y * sy, met ? 2.4 : 1.6, 0, TAU);
      ctx.fill();
    }

    const revealed = Boolean(explore.state.flags.revealed);
    for (const stone of WAYSTONES) {
      const lit = explore.state.fragments.includes(stone.id);
      if (!lit && !revealed) continue;
      ctx.strokeStyle = lit ? stone.color : 'rgba(127, 231, 212, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(stone.x * sx, stone.y * sy, lit ? 3.4 : 2.2, 0, TAU);
      ctx.stroke();
      if (lit) {
        ctx.fillStyle = stone.color;
        ctx.beginPath();
        ctx.arc(stone.x * sx, stone.y * sy, 1.6, 0, TAU);
        ctx.fill();
      }
    }

    for (const chest of CHESTS) {
      if (explore.state.chests.includes(chest.id)) continue;
      ctx.fillStyle = 'rgba(199, 138, 99, 0.6)';
      ctx.fillRect(chest.x * sx - 1.5, chest.y * sy - 1.5, 3, 3);
    }

    ctx.fillStyle = explore.riftOpen ? '#ff9b7a' : 'rgba(255, 155, 122, 0.3)';
    ctx.beginPath();
    ctx.arc(RIFT.x * sx, RIFT.y * sy, 3, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#eaf7ee';
    ctx.beginPath();
    ctx.arc(explore.player.x * sx, explore.player.y * sy, 2.6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(234, 247, 238, 0.3)';
    ctx.beginPath();
    ctx.arc(explore.player.x * sx, explore.player.y * sy, 5.5, 0, TAU);
    ctx.stroke();
  }
}
