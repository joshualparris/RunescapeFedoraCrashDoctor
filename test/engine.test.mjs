import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BOSS_TIME,
  ENEMY_TYPES,
  Game,
  MAX_ENEMIES,
  MAX_PARTICLES,
  RUN_SECONDS,
  UPGRADES,
  mulberry32,
  pickEnemyType,
  spawnCountAt,
  spawnIntervalAt,
  upgradeById,
  xpNeeded,
} from '../src/engine.js';

const makeGame = (opts = {}) => new Game({ width: 800, height: 600, seed: 7, ...opts });

test('xp curve rises every level and stays legible', () => {
  let previous = 0;
  for (let level = 1; level <= 30; level += 1) {
    const needed = xpNeeded(level);
    assert.ok(needed > previous, 'xp requirement grows');
    previous = needed;
  }
  assert.equal(xpNeeded(1), 15);
  assert.ok(xpNeeded(20) < 200);
});

test('the spawn curve tightens over the run and never stops', () => {
  const samples = [0, 30, 90, 150, 179].map(spawnIntervalAt);
  for (let i = 1; i < samples.length; i += 1) assert.ok(samples[i] <= samples[i - 1]);
  assert.ok(spawnIntervalAt(179) >= 0.3);
  assert.equal(spawnCountAt(0), 1);
  assert.equal(spawnCountAt(130), 3);
  assert.ok(spawnCountAt(179) >= spawnCountAt(100));
});

test('enemy selection gets nastier with time', () => {
  const rng = mulberry32(3);
  assert.equal(pickEnemyType(5, rng), 'imp');
  const late = new Set();
  for (let i = 0; i < 200; i += 1) late.add(pickEnemyType(150, rng));
  assert.ok(late.has('brute'));
  assert.ok(!late.has('boss'), 'the boss is spawned by the clock, not the pool');
});

test('the staff auto-casts at the nearest enemy and can kill it', () => {
  const game = makeGame();
  game.enemies = [];
  const enemy = game.spawnEnemy('imp', game.player.x + 120, game.player.y);
  for (let i = 0; i < 20; i += 1) game.update(1 / 60, { x: 0, y: 0 });
  assert.ok(game.projectiles.length >= 1, 'a bolt is in the air');

  for (let i = 0; i < 120 && !enemy.dead; i += 1) {
    game.update(1 / 60, { x: 0, y: 0 });
  }
  assert.ok(enemy.dead, 'the imp eventually dies');
  assert.equal(game.kills, 1);
  assert.ok(game.score > 0);
  assert.ok(game.gems.length >= 1, 'a shard drops');
});

test('collecting shards levels the player and offers three distinct blessings', () => {
  const game = makeGame();
  game.addXp(500);
  assert.ok(game.pendingLevels > 0);
  const choices = game.rollUpgrades();
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices).size, 3);
  for (const id of choices) assert.ok(upgradeById(id));
});

test('choosing a blessing applies its effect and consumes one pending level', () => {
  const game = makeGame();
  game.addXp(500);
  const before = game.player.damage;
  const pending = game.pendingLevels;
  const ok = game.chooseUpgrade('damage');
  assert.equal(ok, true);
  assert.ok(game.player.damage > before);
  assert.equal(game.pendingLevels, pending - 1);
  assert.equal(game.upgrades.damage, 1);
});

test('a blessing cannot be taken past its cap', () => {
  const game = makeGame();
  game.pendingLevels = 99;
  const max = upgradeById('damage').max;
  for (let i = 0; i < max; i += 1) assert.equal(game.chooseUpgrade('damage'), true);
  assert.equal(game.chooseUpgrade('damage'), false);
  assert.equal(game.upgrades.damage, max);
  assert.equal(UPGRADES.filter((u) => u.id === 'damage').length, 1);
});

test('the boss arrives at the boss clock and defeating it wins the run', () => {
  const game = makeGame();
  game.time = BOSS_TIME;
  game.update(1 / 60, {});
  assert.ok(game.boss, 'the boss spawned');
  assert.equal(game.boss.type, 'boss');
  assert.ok(game.boss.hp > 1000);

  game.hitEnemy(game.boss, game.boss.maxHp + 10, false, game.boss.x, game.boss.y);
  assert.equal(game.won, true);
});

test('surviving to the clock is also a win', () => {
  const game = makeGame();
  game.player.hp = 1e9;
  game.player.maxHp = 1e9;
  game.time = RUN_SECONDS - 0.01;
  game.update(1 / 60, {});
  assert.equal(game.won, true);
  assert.equal(game.summary().won, true);
});

test('contact damage respects i-frames and ends the run at zero life', () => {
  const game = makeGame();
  game.player.hp = 8;
  game.player.invuln = 0;
  game.spawnEnemy('brute', game.player.x, game.player.y);
  game.update(1 / 60, {});
  assert.equal(game.over, true);
  assert.equal(game.player.hp, 0);

  const fresh = makeGame();
  fresh.player.hp = 100;
  fresh.spawnEnemy('imp', fresh.player.x, fresh.player.y);
  fresh.update(1 / 60, {});
  const afterFirst = fresh.player.hp;
  fresh.update(1 / 60, {});
  assert.equal(fresh.player.hp, afterFirst, 'the i-frame window blocks the second hit');
});

test('resize clamps the player inside the new arena', () => {
  const game = makeGame();
  game.player.x = 790;
  game.player.y = 590;
  game.resize(400, 300);
  assert.ok(game.player.x <= 400 - game.player.radius);
  assert.ok(game.player.y <= 300 - game.player.radius);
});

test('a full simulated run stays finite and within entity caps', () => {
  const game = makeGame({ seed: 11 });
  game.player.hp = 1e9;
  game.player.maxHp = 1e9;
  let steps = 0;
  while (game.isRunning && steps < RUN_SECONDS * 60 + 5) {
    game.update(1 / 60, { x: 0, y: 0 });
    while (game.pendingLevels > 0) {
      const choices = game.rollUpgrades();
      if (choices.length === 0) {
        game.pendingLevels = 0;
        break;
      }
      game.chooseUpgrade(choices[0]);
    }
    steps += 1;
  }
  assert.equal(game.won, true, 'an invincible player survives the full run');
  assert.ok(game.enemies.length <= MAX_ENEMIES + 4, `enemy cap held (${game.enemies.length})`);
  assert.ok(game.particles.length <= MAX_PARTICLES);
  assert.ok(game.kills > 50, 'combat actually happens');
  assert.ok(Number.isFinite(game.score));
  assert.ok(Number.isFinite(game.player.x));
  for (const enemy of game.enemies) {
    assert.ok(Number.isFinite(enemy.x) && Number.isFinite(enemy.y) && Number.isFinite(enemy.hp));
  }
  assert.ok(game.summary().time <= RUN_SECONDS + 0.01);
});

test('two runs with the same seed and input are deterministic', () => {
  const run = () => {
    const game = makeGame({ seed: 42 });
    game.player.hp = 1e9;
    game.player.maxHp = 1e9;
    for (let i = 0; i < 60 * 25; i += 1) {
      game.update(1 / 60, { x: Math.sin(i / 30), y: Math.cos(i / 40) });
      if (!game.isRunning) break;
    }
    return game.summary();
  };
  assert.deepEqual(run(), run());
});

test('every enemy archetype has complete presentation and balance data', () => {
  for (const [id, type] of Object.entries(ENEMY_TYPES)) {
    assert.ok(type.name && type.color && type.dark, `${id} has presentation data`);
    assert.ok(type.hp > 0 && type.speed > 0 && type.damage > 0 && type.radius > 0, `${id} has stats`);
  }
  assert.ok(ENEMY_TYPES.boss.hp > ENEMY_TYPES.elite.hp * 4);
});
