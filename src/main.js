import { Game, RUN_SECONDS, upgradeById } from './engine.js';
import { Renderer } from './render.js';
import { initAudio, isMuted, setMuted, sfx } from './audio.js';

const STORAGE_KEY = 'wildy:progress:v1';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const renderer = new Renderer(canvas);

const ui = {
  title: $('screen-title'),
  hud: $('hud'),
  levelup: $('screen-levelup'),
  pause: $('screen-pause'),
  end: $('screen-end'),
  start: $('start-btn'),
  soundToggle: $('sound-toggle'),
  titleBest: $('title-best'),
  titleRecord: $('title-record'),
  score: $('hud-score'),
  time: $('hud-time'),
  timerFill: $('timer-fill'),
  kills: $('hud-kills'),
  level: $('hud-level'),
  xpFill: $('xp-fill'),
  xpText: $('xp-text'),
  hpFill: $('hp-fill'),
  hpText: $('hp-text'),
  dashFill: $('dash-fill'),
  dashText: $('dash-text'),
  combo: $('combo-badge'),
  comboCount: $('combo-count'),
  bossBar: $('boss-bar'),
  bossFill: $('boss-fill'),
  mute: $('mute-btn'),
  pauseBtn: $('pause-btn'),
  dashBtn: $('dash-btn'),
  joystick: $('joystick'),
  stick: $('stick'),
  levelupLevel: $('levelup-level'),
  cards: $('upgrade-cards'),
  resume: $('resume-btn'),
  restart: $('restart-btn'),
  quit: $('quit-btn'),
  endKicker: $('end-kicker'),
  endTitle: $('end-title'),
  endLine: $('end-line'),
  endScore: $('end-score'),
  endTime: $('end-time'),
  endKills: $('end-kills'),
  endLevel: $('end-level'),
  endCombo: $('end-combo'),
  newBest: $('new-best'),
  retry: $('retry-btn'),
  home: $('home-btn'),
  touchHint: $('touch-hint'),
};

const state = {
  screen: 'title',
  game: new Game({ width: renderer.width, height: renderer.height, seed: 1 }),
  lastTime: performance.now(),
  dashQueued: false,
  endShown: false,
  lastCombo: 0,
  lastKillSfx: 0,
  levelupIds: [],
};

const keys = new Set();
const joy = { active: false, id: null, dx: 0, dy: 0, sx: 0, sy: 0 };

function loadProgress() {
  const fallback = { best: 0, bestTime: 0, runs: 0, wins: 0, muted: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      best: Number.isFinite(parsed.best) ? Math.max(0, parsed.best) : 0,
      bestTime: Number.isFinite(parsed.bestTime) ? Math.max(0, parsed.bestTime) : 0,
      runs: Number.isFinite(parsed.runs) ? Math.max(0, parsed.runs) : 0,
      wins: Number.isFinite(parsed.wins) ? Math.max(0, parsed.wins) : 0,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return fallback;
  }
}

const progress = loadProgress();

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* private mode: the run still works, it just will not be remembered */
  }
}

function formatClock(seconds) {
  const clamped = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatStatTime(seconds) {
  const clamped = Math.max(0, Math.floor(seconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function setScreen(name) {
  state.screen = name;
  ui.title.hidden = name !== 'title';
  ui.hud.hidden = !['playing', 'levelup', 'paused'].includes(name);
  ui.levelup.hidden = name !== 'levelup';
  ui.pause.hidden = name !== 'paused';
  ui.end.hidden = !['over', 'win'].includes(name);
}

function updateTitle() {
  ui.titleBest.textContent = progress.best.toLocaleString('en-AU');
  if (progress.runs === 0) {
    ui.titleRecord.textContent = 'no runs yet';
  } else {
    const winText = `${progress.wins} win${progress.wins === 1 ? '' : 's'}`;
    const timeText = progress.bestTime > 0 ? `best ${formatStatTime(progress.bestTime)}` : '';
    ui.titleRecord.textContent = `${winText} · ${progress.runs} run${progress.runs === 1 ? '' : 's'}${timeText ? ` · ${timeText}` : ''}`;
  }
}

function updateSoundUI() {
  const muted = isMuted();
  ui.soundToggle.textContent = muted ? 'Sound off' : 'Sound on';
  ui.soundToggle.setAttribute('aria-pressed', String(!muted));
  ui.mute.setAttribute('aria-pressed', String(muted));
  ui.mute.classList.toggle('is-muted', muted);
}

function toggleMute() {
  progress.muted = !isMuted();
  setMuted(progress.muted);
  saveProgress();
  updateSoundUI();
  if (!progress.muted) sfx('click');
}

function resetInput() {
  keys.clear();
  state.dashQueued = false;
  joy.active = false;
  joy.id = null;
  joy.dx = 0;
  joy.dy = 0;
  ui.joystick.hidden = true;
}

function inputVector() {
  if (joy.active) return { x: joy.dx / 52, y: joy.dy / 52 };
  let x = 0;
  let y = 0;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) y -= 1;
  if (keys.has('s') || keys.has('arrowdown')) y += 1;
  const length = Math.hypot(x, y);
  if (length > 1) {
    x /= length;
    y /= length;
  }
  return { x, y };
}

function startRun() {
  initAudio();
  state.game = new Game({
    width: renderer.width,
    height: renderer.height,
    seed: Math.floor(Math.random() * 2 ** 31),
  });
  state.endShown = false;
  state.levelupIds = [];
  state.lastCombo = 0;
  state.lastTime = performance.now();
  resetInput();
  ui.end.hidden = true;
  ui.pause.hidden = true;
  ui.levelup.hidden = true;
  setScreen('playing');
  ui.touchHint.classList.add('show');
  window.setTimeout(() => ui.touchHint.classList.remove('show'), 6000);
  syncHud();
  sfx('start');
}

function syncHud() {
  const game = state.game;
  const p = game.player;
  const remaining = Math.max(0, RUN_SECONDS - game.time);

  ui.score.textContent = Math.round(game.score).toLocaleString('en-AU');
  ui.kills.textContent = game.kills.toLocaleString('en-AU');
  ui.time.textContent = formatClock(remaining);
  ui.timerFill.style.width = `${Math.max(0, Math.min(100, (remaining / RUN_SECONDS) * 100))}%`;
  ui.timerFill.classList.toggle('urgent', remaining <= 15);

  const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
  ui.hpFill.style.width = `${hpPct}%`;
  ui.hpFill.classList.toggle('low', hpPct <= 30);
  ui.hpText.textContent = String(Math.ceil(p.hp));

  const xpPct = Math.max(0, Math.min(100, (game.xp / game.xpNext) * 100));
  ui.xpFill.style.width = `${xpPct}%`;
  ui.level.textContent = `LV ${game.level}`;
  ui.xpText.textContent = `${game.xp} / ${game.xpNext}`;

  if (p.dashCd <= 0.02) {
    ui.dashFill.style.width = '100%';
    ui.dashText.textContent = 'READY';
    ui.dashBtn.classList.add('ready');
  } else {
    const pct = Math.max(0, Math.min(100, (1 - p.dashCd / p.dashMax) * 100));
    ui.dashFill.style.width = `${pct}%`;
    ui.dashText.textContent = `${p.dashCd.toFixed(1)}s`;
    ui.dashBtn.classList.remove('ready');
  }

  if (game.combo > 1) {
    ui.combo.hidden = false;
    ui.comboCount.textContent = String(game.combo);
    if (game.combo !== state.lastCombo) {
      ui.combo.classList.remove('pop');
      void ui.combo.offsetWidth;
      ui.combo.classList.add('pop');
      state.lastCombo = game.combo;
    }
  } else {
    ui.combo.hidden = true;
    state.lastCombo = 0;
  }

  const bossAlive = game.boss && !game.boss.dead && game.boss.hp > 0;
  ui.bossBar.hidden = !bossAlive;
  if (bossAlive) {
    ui.bossFill.style.width = `${Math.max(0, Math.min(100, (game.boss.hp / game.boss.maxHp) * 100))}%`;
  }
}

function playEvent(event) {
  const now = performance.now();
  switch (event.type) {
    case 'shoot':
      sfx('shoot');
      break;
    case 'kill':
      if (now - state.lastKillSfx > 45) {
        state.lastKillSfx = now;
        sfx('kill');
      }
      break;
    case 'hurt':
      sfx('hurt');
      break;
    case 'dash':
      sfx('dash');
      break;
    case 'elite':
      sfx('elite');
      break;
    case 'boss':
      sfx('boss');
      break;
    default:
      break;
  }
}

function drainEvents() {
  for (const event of state.game.drainEvents()) playEvent(event);
}

function openLevelUp() {
  if (!['playing', 'levelup'].includes(state.screen)) return;
  const ids = state.game.rollUpgrades();
  if (ids.length === 0) {
    state.game.pendingLevels = 0;
    if (state.screen === 'levelup') {
      ui.levelup.hidden = true;
      setScreen('playing');
      state.lastTime = performance.now();
    }
    return;
  }
  state.levelupIds = ids;
  ui.levelupLevel.textContent = String(state.game.level);
  buildCards(ids);
  setScreen('levelup');
  syncHud();
  sfx('level');
}

function buildCards(ids) {
  ui.cards.replaceChildren();
  ids.forEach((id, index) => {
    const upgrade = upgradeById(id);
    if (!upgrade) return;
    const level = state.game.upgrades[id] ?? 0;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'upgrade-card';
    card.dataset.upgrade = id;
    card.style.setProperty('--i', String(index));

    const key = document.createElement('span');
    key.className = 'upgrade-key';
    key.textContent = String(index + 1);

    const icon = document.createElement('span');
    icon.className = 'upgrade-icon';
    icon.textContent = upgrade.icon;

    const name = document.createElement('span');
    name.className = 'upgrade-name';
    name.textContent = upgrade.name;

    const desc = document.createElement('span');
    desc.className = 'upgrade-desc';
    desc.textContent = upgrade.desc;

    const pips = document.createElement('span');
    pips.className = 'upgrade-pips';
    for (let i = 0; i < upgrade.max; i += 1) {
      const pip = document.createElement('i');
      if (i < level) pip.className = 'on';
      pips.append(pip);
    }

    const tag = document.createElement('span');
    tag.className = `upgrade-tag${level === 0 ? ' new' : ''}`;
    tag.textContent = level === 0 ? 'NEW' : `LV ${level + 1}`;

    card.append(key, icon, name, desc, pips, tag);
    ui.cards.append(card);
  });
}

function chooseUpgrade(id) {
  if (state.screen !== 'levelup') return;
  if (!state.game.chooseUpgrade(id)) return;
  sfx('choose');
  if (state.game.pendingLevels > 0) {
    openLevelUp();
  } else {
    ui.levelup.hidden = true;
    setScreen('playing');
    state.lastTime = performance.now();
  }
  syncHud();
}

function pauseGame() {
  if (state.screen !== 'playing') return;
  setScreen('paused');
  state.lastTime = performance.now();
  resetInput();
}

function resumeGame() {
  if (state.screen !== 'paused') return;
  setScreen('playing');
  state.lastTime = performance.now();
  syncHud();
}

function goHome() {
  resetInput();
  setScreen('title');
  updateTitle();
  updateSoundUI();
}

function showEnd(won) {
  if (state.endShown) return;
  state.endShown = true;
  const summary = state.game.summary();
  const isBest = summary.score > progress.best;
  progress.runs += 1;
  if (won) progress.wins += 1;
  if (isBest) progress.best = summary.score;
  progress.bestTime = Math.max(progress.bestTime, summary.time);
  saveProgress();

  setScreen(won ? 'win' : 'over');
  ui.end.dataset.won = String(won);
  ui.endKicker.textContent = won ? 'Dawn breaks over the Wilderness' : 'The Wilderness wins';
  ui.endTitle.replaceChildren(
    document.createTextNode(won ? 'YOU LIVED' : 'YOU DIED'),
    Object.assign(document.createElement('span'), { textContent: '.' }),
  );
  ui.endLine.textContent = won
    ? 'Three minutes. The demon is ash. The Wilderness remembers your name.'
    : 'The horde took another one. The loot stays where it fell.';
  ui.endTime.textContent = formatStatTime(summary.time);
  ui.endKills.textContent = summary.kills.toLocaleString('en-AU');
  ui.endLevel.textContent = String(summary.level);
  ui.endCombo.textContent = String(summary.bestCombo);
  ui.newBest.hidden = !isBest;
  animateScore(ui.endScore, summary.score);
  sfx(won ? 'win' : 'lose');
}

function animateScore(element, target) {
  const started = performance.now();
  const duration = 850;
  function step(now) {
    const t = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - t) ** 3;
    element.textContent = Math.round(target * eased).toLocaleString('en-AU');
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function setJoystickVisual(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  ui.joystick.style.left = `${clientX - rect.left}px`;
  ui.joystick.style.top = `${clientY - rect.top}px`;
}

function updateStick() {
  ui.stick.style.transform = `translate(calc(-50% + ${joy.dx}px), calc(-50% + ${joy.dy}px))`;
}

function onPointerDown(event) {
  if (state.screen !== 'playing') return;
  if (joy.active) return;
  initAudio();
  joy.active = true;
  joy.id = event.pointerId;
  joy.sx = event.clientX;
  joy.sy = event.clientY;
  joy.dx = 0;
  joy.dy = 0;
  ui.joystick.hidden = false;
  setJoystickVisual(event.clientX, event.clientY);
  updateStick();
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function onPointerMove(event) {
  if (!joy.active || event.pointerId !== joy.id) return;
  let dx = event.clientX - joy.sx;
  let dy = event.clientY - joy.sy;
  const length = Math.hypot(dx, dy);
  if (length > 52) {
    dx = (dx / length) * 52;
    dy = (dy / length) * 52;
  }
  joy.dx = dx;
  joy.dy = dy;
  updateStick();
  event.preventDefault();
}

function onPointerUp(event) {
  if (!joy.active || event.pointerId !== joy.id) return;
  joy.active = false;
  joy.id = null;
  joy.dx = 0;
  joy.dy = 0;
  ui.joystick.hidden = true;
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - state.lastTime) / 1000));
  state.lastTime = now;

  if (state.screen === 'playing') {
    const vector = inputVector();
    state.game.update(dt, { ...vector, dash: state.dashQueued });
    state.dashQueued = false;
    drainEvents();
    syncHud();

    if (state.game.pendingLevels > 0) openLevelUp();
    else if (state.game.over) showEnd(false);
    else if (state.game.won) showEnd(true);
  } else {
    state.dashQueued = false;
    if (state.game.isRunning) drainEvents();
  }

  if (state.screen === 'title') {
    renderer.drawTitle(now / 1000);
  } else {
    renderer.draw(state.game, now / 1000);
  }

  requestAnimationFrame(frame);
}

function handleResize() {
  const { width, height } = renderer.resize();
  state.game.resize(width, height);
  resetInput();
  if (['playing', 'levelup', 'paused'].includes(state.screen)) syncHud();
}

// ---------------------------------------------------------------- listeners

ui.start.addEventListener('click', () => {
  initAudio();
  startRun();
});

ui.soundToggle.addEventListener('click', () => {
  initAudio();
  toggleMute();
});

ui.mute.addEventListener('click', () => {
  initAudio();
  toggleMute();
});

ui.pauseBtn.addEventListener('click', () => {
  if (state.screen === 'playing') pauseGame();
  else if (state.screen === 'paused') resumeGame();
});

ui.resume.addEventListener('click', resumeGame);
ui.restart.addEventListener('click', startRun);
ui.quit.addEventListener('click', goHome);
ui.retry.addEventListener('click', startRun);
ui.home.addEventListener('click', goHome);

ui.cards.addEventListener('click', (event) => {
  const card = event.target.closest('[data-upgrade]');
  if (card) chooseUpgrade(card.dataset.upgrade);
});

ui.dashBtn.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (state.screen === 'playing') state.dashQueued = true;
});

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);
canvas.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    if (state.screen === 'playing' || state.screen === 'levelup') event.preventDefault();
  }

  if (state.screen === 'levelup' && ['1', '2', '3'].includes(key)) {
    const id = state.levelupIds[Number(key) - 1];
    if (id) chooseUpgrade(id);
    return;
  }

  if (key === 'enter') {
    if (state.screen === 'title') {
      initAudio();
      startRun();
      return;
    }
    if (state.screen === 'over' || state.screen === 'win') {
      startRun();
      return;
    }
  }

  if (key === 'p' || key === 'escape') {
    if (state.screen === 'playing') pauseGame();
    else if (state.screen === 'paused') resumeGame();
    return;
  }

  if (key === 'm') {
    initAudio();
    toggleMute();
    return;
  }

  if (key === ' ' && state.screen === 'playing') {
    if (!event.repeat) state.dashQueued = true;
    event.preventDefault();
    return;
  }

  keys.add(key);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => {
  keys.clear();
  resetInput();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    keys.clear();
    if (state.screen === 'playing') pauseGame();
  }
});

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => window.setTimeout(handleResize, 120));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => window.setTimeout(handleResize, 80));
}

// ---------------------------------------------------------------- boot

setMuted(progress.muted);
updateSoundUI();
updateTitle();
state.game.resize(renderer.width, renderer.height);
setScreen('title');
requestAnimationFrame(frame);

// Skip the title for quick sharing/screenshot links: ?play
if (new URLSearchParams(location.search).has('play')) {
  startRun();
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// A small handle for debugging and automated smoke tests. Harmless in play.
if (typeof window !== 'undefined') {
  window.__wildy = { state, startRun, chooseUpgrade };
}
