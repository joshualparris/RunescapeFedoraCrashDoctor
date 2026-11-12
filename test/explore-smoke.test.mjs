import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

test('explore mode: walk, talk, journal, waystone, boon and rift', async () => {
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
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
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
    width: 1200,
    height: 700,
    top: 0,
    left: 0,
    right: 1200,
    bottom: 700,
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

  await import(`${pathToFileURL(new URL('../src/main.js', import.meta.url).pathname).href}?explore-smoke=1`);

  const step = (ms = 16.6667) => {
    const callback = rafQueue.shift();
    assert.ok(callback, 'a frame is queued');
    now += ms;
    callback(now);
  };

  const doc = window.document;
  doc.getElementById('explore-btn').click();
  assert.equal(doc.getElementById('screen-title').hidden, true);
  assert.equal(doc.getElementById('explore-hud').hidden, false);
  step();
  step();

  assert.equal(doc.getElementById('interact-prompt').hidden, false, 'nearby NPC prompt appears');
  assert.match(doc.getElementById('interact-label').textContent, /Mira/);

  doc.getElementById('interact-btn').click();
  assert.equal(doc.getElementById('screen-dialogue').hidden, false);
  assert.equal(doc.getElementById('npc-name').textContent, 'Mira');
  assert.ok(doc.querySelectorAll('.dialogue-choice').length >= 3);

  doc.querySelector('.dialogue-choice').click();
  assert.match(doc.getElementById('dialogue-text').textContent, /wound/);
  doc.getElementById('dialogue-close').click();
  assert.equal(doc.getElementById('screen-dialogue').hidden, true);
  assert.equal(doc.getElementById('explore-hud').hidden, false);

  doc.getElementById('journal-btn').click();
  assert.equal(doc.getElementById('screen-journal').hidden, false);
  doc.getElementById('journal-close').click();
  assert.equal(doc.getElementById('screen-journal').hidden, true);

  // A waystone memory can be taken through the same dialogue system.
  window.__wildy.openSpeaker('ws-woods');
  assert.match(doc.getElementById('npc-name').textContent, /Listening Stone/);
  const take = [...doc.querySelectorAll('.dialogue-choice')].find((button) =>
    button.textContent.includes('Take the fragment'),
  );
  assert.ok(take);
  take.click();
  assert.ok(window.__wildy.progress.explore.fragments.includes('ws-woods'));
  doc.getElementById('dialogue-close').click();
  doc.getElementById('journal-btn').click();
  assert.match(doc.getElementById('journal-lore').textContent, /Listening Stone/);
  doc.getElementById('journal-close').click();

  // Mira still has the charm.
  window.__wildy.openSpeaker('mira');
  const charm = [...doc.querySelectorAll('.dialogue-choice')].find((button) =>
    button.textContent.includes('charm'),
  );
  charm.click();
  const takeCharm = [...doc.querySelectorAll('.dialogue-choice')].find((button) =>
    button.textContent.includes('Take the Keeper'),
  );
  takeCharm.click();
  assert.equal(window.__wildy.progress.explore.boons.keeper, true);
  doc.getElementById('dialogue-close').click();

  // Pip grants the reroll boon.
  window.__wildy.openSpeaker('pip');
  const shiny = [...doc.querySelectorAll('.dialogue-choice')].find((button) =>
    button.textContent.includes('shiny'),
  );
  shiny.click();
  const promise = [...doc.querySelectorAll('.dialogue-choice')].find((button) =>
    button.textContent.includes('I promise'),
  );
  promise.click();
  assert.equal(window.__wildy.progress.explore.boons.pip, true);
  doc.getElementById('dialogue-close').click();

  // With three fragments, the Warden opens the Rift and starts a run.
  window.__wildy.progress.explore.fragments = ['ws-woods', 'ws-circle', 'ws-ruins'];
  window.__wildy.openSpeaker('warden');
  const open = [...doc.querySelectorAll('.dialogue-choice')].find((button) =>
    button.textContent.includes('Open the Rift'),
  );
  open.click();
  assert.equal(window.__wildy.state.screen, 'playing');
  assert.equal(doc.getElementById('hud').hidden, false);
  assert.equal(window.__wildy.state.game.player.maxHp, 120, 'Keeper charm applies to the run');
  assert.equal(window.__wildy.state.rerolls, 1, 'Pip pebble grants one reroll');
  step();

  assert.deepEqual(errors, [], 'no page errors');
  dom.window.close();
});
