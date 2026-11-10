import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

test('the page boots, plays, pauses, levels up and dies', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost:8137/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
  const { window } = dom;

  let now = 1_000;
  const rafQueue = [];
  const gradient = { addColorStop() {} };
  const context = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
          return () => gradient;
        }
        if (prop === 'measureText') return () => ({ width: 10 });
        if (!(prop in target)) target[prop] = () => {};
        return target[prop];
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    },
  );

  window.HTMLCanvasElement.prototype.getContext = () => context;
  window.devicePixelRatio = 1;
  window.requestAnimationFrame = (callback) => {
    rafQueue.push(callback);
    return rafQueue.length;
  };
  window.cancelAnimationFrame = () => {};
  window.performance.now = () => now;

  const canvas = window.document.getElementById('game');
  canvas.getBoundingClientRect = () => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
  });

  const define = (key, value) =>
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });

  globalThis.window = window;
  globalThis.document = window.document;
  define('navigator', window.navigator);
  define('location', window.location);
  define('localStorage', window.localStorage);
  define('performance', window.performance);
  define('requestAnimationFrame', window.requestAnimationFrame);

  const errors = [];
  window.addEventListener('error', (event) => errors.push(event.error ?? event.message));

  await import(`${pathToFileURL(new URL('../src/main.js', import.meta.url).pathname).href}?smoke=1`);
  assert.ok(window.__wildy, 'debug handle is installed');

  const step = (ms = 16.6667) => {
    const callback = rafQueue.shift();
    assert.ok(callback, 'a frame is queued');
    now += ms;
    callback(now);
  };

  const start = window.document.getElementById('start-btn');
  start.click();
  assert.equal(window.document.getElementById('screen-title').hidden, true);
  assert.equal(window.document.getElementById('hud').hidden, false);

  for (let i = 0; i < 90; i += 1) step();
  assert.notEqual(window.document.getElementById('hud-time').textContent, '3:00');

  const pausedTime = window.document.getElementById('hud-time').textContent;
  window.document.getElementById('pause-btn').click();
  assert.equal(window.document.getElementById('screen-pause').hidden, false);
  for (let i = 0; i < 30; i += 1) step();
  assert.equal(window.document.getElementById('hud-time').textContent, pausedTime);

  window.document.getElementById('resume-btn').click();
  assert.equal(window.document.getElementById('screen-pause').hidden, true);
  for (let i = 0; i < 30; i += 1) step();

  // Force enough XP for at least one level, then pick every offered card.
  window.__wildy.state.game.addXp(600);
  step();
  assert.equal(window.document.getElementById('screen-levelup').hidden, false);
  assert.equal(window.document.querySelectorAll('.upgrade-card').length, 3);
  for (let i = 0; i < 30; i += 1) {
    const card = window.document.querySelector('.upgrade-card');
    if (!card) break;
    card.click();
  }
  assert.equal(window.document.getElementById('screen-levelup').hidden, true);

  // Die on purpose.
  const game = window.__wildy.state.game;
  game.player.hp = 1;
  game.player.invuln = 0;
  game.spawnEnemy('brute', game.player.x, game.player.y);
  for (let i = 0; i < 20 && window.document.getElementById('screen-end').hidden; i += 1) step();
  assert.equal(window.document.getElementById('screen-end').hidden, false);
  assert.match(window.document.getElementById('end-title').textContent, /YOU DIED/);

  window.document.getElementById('retry-btn').click();
  assert.equal(window.document.getElementById('hud').hidden, false);
  assert.equal(window.document.getElementById('screen-end').hidden, true);

  assert.deepEqual(errors, [], 'no page errors');
  dom.window.close();
});
