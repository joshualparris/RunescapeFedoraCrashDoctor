/**
 * Canvas renderer. Vector shapes only — no image assets, no web fonts.
 * Everything is drawn in CSS pixels; the backing store is scaled for DPR.
 */

import { BOSS_TIME, mulberry32 } from './engine.js';

const TAU = Math.PI * 2;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.bg = document.createElement('canvas');
    this.time = 0;
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(240, Math.round(rect.width || 960));
    const height = Math.max(240, Math.round(rect.height || 540));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.buildBackground();
    this.vignette = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.25,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72,
    );
    this.vignette.addColorStop(0, 'rgba(0,0,0,0)');
    this.vignette.addColorStop(1, 'rgba(0,0,0,0.62)');

    return { width, height };
  }

  buildBackground() {
    const { width, height, dpr } = this;
    this.bg.width = Math.round(width * dpr);
    this.bg.height = Math.round(height * dpr);
    const ctx = this.bg.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#08120c');
    sky.addColorStop(0.45, '#0c1a11');
    sky.addColorStop(1, '#071009');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Moon glow in the upper right; the title screen also draws a disc.
    const moonX = width * 0.82;
    const moonY = height * 0.16;
    const moon = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, Math.max(width, height) * 0.34);
    moon.addColorStop(0, 'rgba(198, 220, 186, 0.16)');
    moon.addColorStop(0.35, 'rgba(143, 191, 159, 0.05)');
    moon.addColorStop(1, 'rgba(143, 191, 159, 0)');
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, width, height);

    const rng = mulberry32(377);
    // Grass tufts.
    for (let i = 0; i < Math.floor((width * height) / 5200); i += 1) {
      const x = rng() * width;
      const y = rng() * height;
      const h = 3 + rng() * 9;
      ctx.strokeStyle = `rgba(120, 168, 118, ${0.05 + rng() * 0.12})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 2, y - h * 0.6, x + (rng() - 0.5) * 5, y - h);
      ctx.stroke();
    }

    // Worn stones and dirt patches.
    for (let i = 0; i < 26; i += 1) {
      const x = rng() * width;
      const y = rng() * height;
      const r = 1 + rng() * 3;
      ctx.fillStyle = `rgba(170, 178, 156, ${0.04 + rng() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r, rng() * TAU, 0, TAU);
      ctx.fill();
    }

    // A faint stone circle around the arena centre.
    const cx = width / 2;
    const cy = height / 2;
    const ring = Math.min(width, height) * 0.37;
    ctx.strokeStyle = 'rgba(143, 191, 159, 0.055)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, ring, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, ring * 0.96, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * TAU;
      const x1 = cx + Math.cos(a) * ring * 0.96;
      const y1 = cy + Math.sin(a) * ring * 0.96;
      const x2 = cx + Math.cos(a) * ring;
      const y2 = cy + Math.sin(a) * ring;
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(227, 178, 92, 0.1)' : 'rgba(143, 191, 159, 0.06)';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Standing stones near the edges.
    const stones = [
      [width * 0.08, height * 0.24, 14],
      [width * 0.93, height * 0.38, 18],
      [width * 0.15, height * 0.86, 16],
      [width * 0.86, height * 0.9, 12],
    ];
    for (const [x, y, size] of stones) {
      ctx.fillStyle = 'rgba(11, 17, 12, 0.9)';
      ctx.strokeStyle = 'rgba(143, 191, 159, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.55, size, -0.08, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }

    // Corner shadows frame the play field.
    const edge = ctx.createRadialGradient(cx, cy, Math.min(width, height) * 0.3, cx, cy, Math.max(width, height) * 0.75);
    edge.addColorStop(0, 'rgba(0,0,0,0)');
    edge.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);
  }

  draw(game, t) {
    const { ctx, width, height } = this;
    this.time = t;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.bg, 0, 0, width, height);
    this.drawFog(t);

    ctx.save();
    if (game.shake > 0.1) {
      const s = game.shake;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    this.drawArenaRunes(game.player, t);
    this.drawGems(game.gems, t);
    for (const enemy of game.enemies) {
      if (!enemy.dead) this.drawEnemy(enemy, game.player, t);
    }
    this.drawProjectiles(game.projectiles, t);
    if (!game.over) this.drawPlayer(game.player, t, game.won);
    this.drawParticles(game.particles);
    this.drawTexts(game.texts);
    ctx.restore();

    this.drawBossWarning(game);

    const danger = 1 - game.player.hp / game.player.maxHp;
    if (danger > 0.68) {
      const pulse = 0.12 + Math.sin(t * 5) * 0.05;
      const red = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7,
      );
      red.addColorStop(0, 'rgba(120, 16, 10, 0)');
      red.addColorStop(1, `rgba(120, 16, 10, ${Math.min(0.55, pulse + danger * 0.35)})`);
      ctx.fillStyle = red;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, width, height);

    if (game.flash > 0) {
      ctx.globalAlpha = Math.min(0.5, game.flash * 0.55);
      ctx.fillStyle = game.flashColor;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  }

  drawBossWarning(game) {
    const since = game.time - (BOSS_TIME - 3);
    if (since < 0 || since > 5 || game.bossDefeated) return;
    const { ctx, width, height } = this;
    const fadeIn = Math.min(1, since / 0.8);
    const fadeOut = Math.min(1, (5 - since) / 1.2);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut)) * 0.9;
    const pulse = 0.75 + Math.sin(this.time * 6) * 0.25;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 90, 60, 0.1)';
    ctx.fillRect(0, height * 0.2, width, height * 0.13);
    ctx.strokeStyle = `rgba(255, 91, 69, ${0.35 * pulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.18, height * 0.2);
    ctx.lineTo(width * 0.82, height * 0.2);
    ctx.moveTo(width * 0.18, height * 0.33);
    ctx.lineTo(width * 0.82, height * 0.33);
    ctx.stroke();
    ctx.font = '600 11px ui-monospace, "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#ff8a6b';
    ctx.fillText('THE WILDERNESS HOLDS ITS BREATH', width / 2, height * 0.225);
    ctx.font = '500 26px ui-serif, Georgia, serif';
    ctx.fillStyle = '#ffd2b8';
    ctx.fillText('THE GREATER DEMON APPROACHES', width / 2, height * 0.285);
    ctx.restore();
  }

  drawFog(t) {
    const { ctx, width, height } = this;
    for (let i = 0; i < 3; i += 1) {
      const x = ((t * (7 + i * 3) + width * (0.2 + i * 0.3)) % (width + 500)) - 250;
      const y = height * (0.25 + i * 0.27) + Math.sin(t * 0.3 + i) * 22;
      const r = Math.max(width, height) * (0.22 + i * 0.05);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(122, 168, 138, ${0.022 + i * 0.006})`);
      grad.addColorStop(1, 'rgba(122, 168, 138, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }

  drawArenaRunes(player, t) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(t * 0.12);
    ctx.strokeStyle = 'rgba(143, 191, 159, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 11]);
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(227, 178, 92, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer(player, t, won) {
    const { ctx } = this;
    const { x, y, radius } = player;
    const blink = player.invuln > 0 && Math.floor(t * 20) % 2 === 0;
    if (blink) return;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.75, radius * 0.95, radius * 0.38, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Soft aura. A few translucent rings are cheaper than a per-frame gradient.
    ctx.fillStyle = won ? 'rgba(246, 210, 138, 0.08)' : 'rgba(143, 191, 159, 0.07)';
    ctx.beginPath();
    ctx.arc(x, y, radius * 3.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = won ? 'rgba(246, 210, 138, 0.09)' : 'rgba(143, 191, 159, 0.08)';
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.9, 0, TAU);
    ctx.fill();

    // Cloak.
    ctx.fillStyle = '#1a2b20';
    ctx.strokeStyle = '#8fbf9f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.9, y + radius * 0.85);
    ctx.quadraticCurveTo(x - radius * 1.15, y - radius * 0.5, x, y - radius * 1.2);
    ctx.quadraticCurveTo(x + radius * 1.15, y - radius * 0.5, x + radius * 0.9, y + radius * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hood shadow and eyes.
    ctx.fillStyle = '#0a120c';
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.25, radius * 0.52, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f6d28a';
    ctx.beginPath();
    ctx.arc(x - 4, y - radius * 0.3, 1.7, 0, TAU);
    ctx.arc(x + 4, y - radius * 0.3, 1.7, 0, TAU);
    ctx.fill();

    // Staff, aimed at the nearest enemy.
    const aim = player.aim;
    const sx = x + Math.cos(aim) * (radius + 12);
    const sy = y + Math.sin(aim) * (radius + 12);
    ctx.strokeStyle = '#7a5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(aim) * 4, y + Math.sin(aim) * 4);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.fillStyle = '#f6d28a';
    ctx.beginPath();
    ctx.arc(sx, sy, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(246, 210, 138, 0.18)';
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, TAU);
    ctx.fill();

    if (player.hitFlash > 0) {
      ctx.strokeStyle = `rgba(255, 120, 100, ${player.hitFlash * 5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, TAU);
      ctx.stroke();
    }
  }

  drawEnemy(enemy, player, t) {
    const { ctx } = this;
    const scale = enemy.spawnT > 0 ? Math.max(0.15, 1 - enemy.spawnT / 0.3) : 1;
    const r = enemy.radius * scale;
    if (r < 1) return;
    const x = enemy.x;
    const y = enemy.y;
    const angle = Math.atan2(player.y - y, player.x - x);

    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.7, r * 0.9, r * 0.32, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (enemy.type === 'boss') {
      const aura = 0.1 + Math.sin(t * 4) * 0.03;
      ctx.fillStyle = `rgba(255, 90, 50, ${aura})`;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.4, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = enemy.flash > 0 ? '#fff6e8' : enemy.color;
    ctx.strokeStyle = enemy.dark;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (enemy.type === 'brute' || enemy.type === 'boss') {
      ctx.ellipse(x, y, r * 1.08, r * 0.96, 0, 0, TAU);
    } else {
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.fill();
    ctx.stroke();

    if (enemy.type === 'imp') {
      ctx.fillStyle = enemy.dark;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, y - r * 0.55);
      ctx.lineTo(x - r * 1.2, y - r * 1.35);
      ctx.lineTo(x - r * 0.25, y - r * 0.9);
      ctx.closePath();
      ctx.moveTo(x + r * 0.7, y - r * 0.55);
      ctx.lineTo(x + r * 1.2, y - r * 1.35);
      ctx.lineTo(x + r * 0.25, y - r * 0.9);
      ctx.closePath();
      ctx.fill();
    }

    if (enemy.type === 'skeleton') {
      ctx.fillStyle = enemy.dark;
      ctx.beginPath();
      ctx.arc(x - r * 0.38, y - r * 0.12, r * 0.2, 0, TAU);
      ctx.arc(x + r * 0.38, y - r * 0.12, r * 0.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = enemy.dark;
      ctx.lineWidth = 1.4;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + i * 3.5, y + r * 0.38);
        ctx.lineTo(x + i * 3.5, y + r * 0.62);
        ctx.stroke();
      }
    } else if (enemy.type === 'elite' || enemy.type === 'boss') {
      ctx.fillStyle = '#1b1208';
      ctx.beginPath();
      ctx.arc(x - r * 0.36, y - r * 0.12, r * 0.15, 0, TAU);
      ctx.arc(x + r * 0.36, y - r * 0.12, r * 0.15, 0, TAU);
      ctx.fill();
      ctx.fillStyle = enemy.type === 'boss' ? '#ffb18a' : '#ffe6b0';
      ctx.beginPath();
      ctx.arc(x - r * 0.34, y - r * 0.12, r * 0.07, 0, TAU);
      ctx.arc(x + r * 0.38, y - r * 0.12, r * 0.07, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#151d12';
      const ex = Math.cos(angle) * 2;
      const ey = Math.sin(angle) * 2;
      ctx.beginPath();
      ctx.arc(x - r * 0.3 + ex, y - r * 0.08 + ey, r * 0.15, 0, TAU);
      ctx.arc(x + r * 0.3 + ex, y - r * 0.08 + ey, r * 0.15, 0, TAU);
      ctx.fill();
    }

    if (enemy.type === 'brute') {
      ctx.fillStyle = enemy.dark;
      ctx.beginPath();
      ctx.arc(x - r * 0.85, y + r * 0.35, r * 0.32, 0, TAU);
      ctx.arc(x + r * 0.85, y + r * 0.35, r * 0.32, 0, TAU);
      ctx.fill();
    }

    if (enemy.type === 'elite' || enemy.type === 'boss') {
      // Crown / horns.
      ctx.fillStyle = enemy.type === 'boss' ? '#ffd0b0' : '#f6d28a';
      const horn = enemy.type === 'boss' ? r * 1.35 : r * 0.95;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, y - r * 0.65);
      ctx.lineTo(x - r * 1.05, y - horn);
      ctx.lineTo(x - r * 0.3, y - r * 0.85);
      ctx.closePath();
      ctx.moveTo(x + r * 0.7, y - r * 0.65);
      ctx.lineTo(x + r * 1.05, y - horn);
      ctx.lineTo(x + r * 0.3, y - r * 0.85);
      ctx.closePath();
      ctx.fill();

      // Health bar.
      const w = r * 2;
      const pct = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x - w / 2, y - r - 13, w, 4);
      ctx.fillStyle = enemy.type === 'boss' ? '#ff7a45' : '#e3b25c';
      ctx.fillRect(x - w / 2, y - r - 13, w * pct, 4);
    }
    ctx.restore();
  }

  drawProjectiles(projectiles) {
    const { ctx } = this;
    for (const bolt of projectiles) {
      const tx = bolt.x - bolt.vx * 0.025;
      const ty = bolt.y - bolt.vy * 0.025;
      ctx.strokeStyle = 'rgba(246, 210, 138, 0.45)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(bolt.x, bolt.y);
      ctx.stroke();
      ctx.fillStyle = bolt.color;
      ctx.beginPath();
      ctx.arc(bolt.x, bolt.y, bolt.radius, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 240, 200, 0.22)';
      ctx.beginPath();
      ctx.arc(bolt.x, bolt.y, bolt.radius * 2.2, 0, TAU);
      ctx.fill();
    }
  }

  drawGems(gems, t) {
    const { ctx } = this;
    for (const gem of gems) {
      const bob = Math.sin(t * 4 + gem.phase) * 2;
      ctx.save();
      ctx.translate(gem.x, gem.y + bob);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = 'rgba(127, 231, 212, 0.18)';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = '#7fe7d4';
      ctx.fillRect(-3.2, -3.2, 6.4, 6.4);
      ctx.restore();
    }
  }

  drawParticles(particles) {
    const { ctx } = this;
    for (const particle of particles) {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (0.4 + alpha * 0.6), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawTexts(texts) {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const text of texts) {
      const alpha = Math.max(0, text.life / 0.7);
      ctx.globalAlpha = alpha;
      ctx.font = `600 ${text.size}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(text.text, text.x, text.y);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.globalAlpha = 1;
  }

  drawTitle(t) {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.bg, 0, 0, width, height);

    // Moon disc.
    const mx = width * 0.78;
    const my = height * 0.2;
    const mr = Math.max(36, Math.min(width, height) * 0.075);
    ctx.fillStyle = 'rgba(214, 228, 198, 0.09)';
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d8e4c6';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(12, 24, 15, 0.18)';
    ctx.beginPath();
    ctx.arc(mx - mr * 0.25, my - mr * 0.2, mr * 0.18, 0, TAU);
    ctx.arc(mx + mr * 0.3, my + mr * 0.25, mr * 0.12, 0, TAU);
    ctx.fill();

    this.drawFog(t);

    // Big rune circle behind the title card.
    const cx = width / 2;
    const cy = height * 0.52;
    const ring = Math.min(width, height) * 0.32;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.04);
    ctx.strokeStyle = 'rgba(143, 191, 159, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, ring, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, ring * 0.86, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 24; i += 1) {
      const a = (i / 24) * TAU;
      const r1 = ring * 0.86;
      const r2 = ring * (i % 3 === 0 ? 0.98 : 0.92);
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(227, 178, 92, 0.18)' : 'rgba(143, 191, 159, 0.09)';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();

    // Hero silhouette on the left of the title card.
    const hx = width * 0.2;
    const hy = height * 0.64;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 22, 7, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#16261c';
    ctx.strokeStyle = 'rgba(143, 191, 159, 0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-13, 20);
    ctx.quadraticCurveTo(-16, -16, 0, -30);
    ctx.quadraticCurveTo(16, -16, 13, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0a120c';
    ctx.beginPath();
    ctx.arc(0, -14, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f6d28a';
    ctx.beginPath();
    ctx.arc(-3, -15, 1.4, 0, TAU);
    ctx.arc(3, -15, 1.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#7a5a2b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8, -2);
    ctx.lineTo(20, -22);
    ctx.stroke();
    ctx.fillStyle = '#f6d28a';
    ctx.beginPath();
    ctx.arc(20, -22, 3.2, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Fireflies.
    for (let i = 0; i < 26; i += 1) {
      const x = ((i * 173 + t * (8 + (i % 5))) % width);
      const y = height * 0.25 + ((i * 97) % Math.floor(height * 0.6)) + Math.sin(t * 0.7 + i) * 8;
      const a = 0.15 + (Math.sin(t * 2 + i * 1.7) + 1) * 0.12;
      ctx.fillStyle = `rgba(246, 210, 138, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
