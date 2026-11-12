import { Game, RUN_SECONDS, upgradeById } from './engine.js';
import { Renderer } from './render.js';
import { ExploreRenderer } from './render-explore.js';
import { Explore } from './explore.js';
import { BOONS, WAYSTONES, CHESTS, rootNodeId, speakerFor } from './npcs.js';
import { initAudio, isMuted, setMuted, sfx } from './audio.js';

const STORAGE_KEY = 'wildy:progress:v1';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const renderer = new Renderer(canvas);
const exploreRenderer = new ExploreRenderer(canvas);

const ui = {
  title: $('screen-title'),
  hud: $('hud'),
  exploreHud: $('explore-hud'),
  levelup: $('screen-levelup'),
  pause: $('screen-pause'),
  end: $('screen-end'),
  dialogue: $('screen-dialogue'),
  journal: $('screen-journal'),
  start: $('start-btn'),
  exploreBtn: $('explore-btn'),
  soundToggle: $('sound-toggle'),
  titleBest: $('title-best'),
  titleRecord: $('title-record'),
  titleCamp: $('title-camp'),
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
  exploreJoystick: $('explore-joystick'),
  exploreStick: $('explore-stick'),
  levelupLevel: $('levelup-level'),
  cards: $('upgrade-cards'),
  rerollBtn: $('reroll-btn'),
  rerollCount: $('reroll-count'),
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
  campBtn: $('camp-btn'),
  home: $('home-btn'),
  touchHint: $('touch-hint'),
  areaName: $('area-name'),
  exploreObjective: $('explore-objective'),
  fragCount: $('frag-count'),
  fragDots: $('frag-dots'),
  minimap: $('minimap'),
  areaBanner: $('area-banner'),
  areaBannerName: $('area-banner-name'),
  interactPrompt: $('interact-prompt'),
  interactLabel: $('interact-label'),
  interactBtn: $('interact-btn'),
  journalBtn: $('journal-btn'),
  exploreHome: $('explore-home-btn'),
  npcPortrait: $('npc-portrait'),
  npcTitle: $('npc-title'),
  npcName: $('npc-name'),
  dialogueText: $('dialogue-text'),
  dialogueChoices: $('dialogue-choices'),
  dialogueClose: $('dialogue-close'),
  dialogueCard: $('dialogue-card'),
  journalClose: $('journal-close'),
  journalReset: $('journal-reset'),
  journalFrags: $('journal-frags'),
  journalBoonsCount: $('journal-boons-count'),
  journalChests: $('journal-chests'),
  journalLoot: $('journal-loot'),
  journalBoons: $('journal-boons'),
  journalStones: $('journal-stones'),
  journalLore: $('journal-lore'),
  toast: $('toast'),
};

const state = {
  screen: 'title',
  game: new Game({ width: renderer.width, height: renderer.height, seed: 1 }),
  explore: null,
  lastTime: performance.now(),
  dashQueued: false,
  interactQueued: false,
  endShown: false,
  lastCombo: 0,
  lastKillSfx: 0,
  levelupIds: [],
  dialogue: null,
  rerolls: 0,
  bannerTimer: null,
  toastTimer: null,
};

const keys = new Set();
const joy = { active: false, id: null, dx: 0, dy: 0, sx: 0, sy: 0 };

function defaultExploreState() {
  return {
    met: [],
    boons: {},
    fragments: [],
    chests: [],
    lore: [],
    loot: 0,
    flags: {},
  };
}

function mergeExplore(raw) {
  const fallback = defaultExploreState();
  if (!raw || typeof raw !== 'object') return fallback;
  return {
    met: Array.isArray(raw.met) ? raw.met.filter((id) => typeof id === 'string') : [],
    boons: raw.boons && typeof raw.boons === 'object' ? { ...raw.boons } : {},
    fragments: Array.isArray(raw.fragments) ? raw.fragments.filter((id) => typeof id === 'string') : [],
    chests: Array.isArray(raw.chests) ? raw.chests.filter((id) => typeof id === 'string') : [],
    lore: Array.isArray(raw.lore) ? raw.lore.filter((entry) => entry && entry.id && entry.title && entry.text) : [],
    loot: Number.isFinite(raw.loot) ? Math.max(0, raw.loot) : 0,
    flags: raw.flags && typeof raw.flags === 'object' ? { ...raw.flags } : {},
  };
}

function loadProgress() {
  const fallback = {
    best: 0,
    bestTime: 0,
    runs: 0,
    wins: 0,
    muted: false,
    explore: defaultExploreState(),
  };
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
      explore: mergeExplore(parsed.explore),
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
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
  ui.title.hidden = name !== 'title';
  ui.hud.hidden = !['playing', 'levelup', 'paused'].includes(name);
  ui.exploreHud.hidden = !['explore', 'dialogue', 'journal'].includes(name);
  ui.levelup.hidden = name !== 'levelup';
  ui.pause.hidden = name !== 'paused';
  ui.end.hidden = !['over', 'win'].includes(name);
  ui.dialogue.hidden = name !== 'dialogue';
  ui.journal.hidden = name !== 'journal';

  if (name !== 'explore') {
    ui.interactPrompt.hidden = true;
    ui.interactBtn.hidden = true;
  }
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => ui.toast.classList.remove('show'), 2600);
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

  const ex = progress.explore;
  const boons = Object.keys(ex.boons).length;
  const touched = ex.met.length > 0 || ex.fragments.length > 0 || ex.chests.length > 0 || boons > 0;
  ui.titleCamp.hidden = !touched;
  if (touched) {
    ui.titleCamp.textContent = `${ex.fragments.length}/3 waystones · ${boons} blessing${boons === 1 ? '' : 's'} · ${ex.chests.length}/3 caches · ${ex.loot} buried loot`;
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
  state.interactQueued = false;
  joy.active = false;
  joy.id = null;
  joy.dx = 0;
  joy.dy = 0;
  ui.joystick.hidden = true;
  ui.exploreJoystick.hidden = true;
}

function joystickElements() {
  if (state.screen === 'explore') return { base: ui.exploreJoystick, stick: ui.exploreStick };
  return { base: ui.joystick, stick: ui.stick };
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

function ensureExplore() {
  if (!state.explore) {
    state.explore = new Explore({
      width: renderer.width,
      height: renderer.height,
      state: progress.explore,
    });
    state.explore.resize(renderer.width, renderer.height);
  }
  return state.explore;
}

function startExplore() {
  initAudio();
  const explore = ensureExplore();
  explore.resize(renderer.width, renderer.height);
  state.dialogue = null;
  state.lastTime = performance.now();
  resetInput();
  setScreen('explore');
  syncExploreHud();
  showAreaBanner(explore.area);
  sfx('start');
}

function showAreaBanner(name) {
  ui.areaBannerName.textContent = name;
  ui.areaBanner.hidden = false;
  ui.areaBanner.classList.remove('show');
  void ui.areaBanner.offsetWidth;
  ui.areaBanner.classList.add('show');
  clearTimeout(state.bannerTimer);
  state.bannerTimer = window.setTimeout(() => {
    ui.areaBanner.classList.remove('show');
    window.setTimeout(() => {
      if (!ui.areaBanner.classList.contains('show')) ui.areaBanner.hidden = true;
    }, 420);
  }, 2200);
}

function startRun() {
  initAudio();
  const game = new Game({
    width: renderer.width,
    height: renderer.height,
    seed: Math.floor(Math.random() * 2 ** 31),
  });

  const ex = progress.explore;
  if (ex.boons.keeper) {
    game.player.maxHp += 20;
    game.player.hp = game.player.maxHp;
  }
  if (ex.boons.bran) game.player.damage *= 1.15;
  if (ex.boons.sable) game.player.speed *= 1.08;
  game.score += ex.loot;
  state.rerolls = ex.boons.pip ? 1 : 0;

  state.game = game;
  state.dialogue = null;
  state.endShown = false;
  state.levelupIds = [];
  state.lastCombo = 0;
  state.lastTime = performance.now();
  resetInput();
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

function syncExploreHud() {
  const explore = state.explore;
  if (!explore) return;

  ui.areaName.textContent = explore.area;
  const lit = explore.fragmentCount;
  ui.fragCount.textContent = `${lit} / 3`;
  ui.exploreObjective.textContent = lit >= 3 ? 'The Rift is open' : 'Light the waystones';
  [...ui.fragDots.children].forEach((dot, index) => dot.classList.toggle('lit', index < lit));

  if (explore.prompt) {
    ui.interactPrompt.hidden = false;
    ui.interactLabel.textContent = explore.prompt.label;
    ui.interactBtn.hidden = false;
    ui.interactBtn.textContent =
      explore.prompt.kind === 'npc' ? 'TALK' : explore.prompt.kind === 'waystone' ? 'TOUCH' : 'OPEN';
  } else {
    ui.interactPrompt.hidden = true;
    ui.interactBtn.hidden = true;
  }

  exploreRenderer.drawMinimap(ui.minimap, explore);
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

function updateRerollButton() {
  ui.rerollBtn.hidden = state.rerolls <= 0;
  ui.rerollCount.textContent = String(state.rerolls);
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
  updateRerollButton();
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

function rerollUpgrades() {
  if (state.screen !== 'levelup' || state.rerolls <= 0) return;
  state.rerolls -= 1;
  const ids = state.game.rollUpgrades();
  if (ids.length === 0) {
    updateRerollButton();
    return;
  }
  state.levelupIds = ids;
  buildCards(ids);
  updateRerollButton();
  sfx('click');
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
  state.dialogue = null;
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
  ui.campBtn.hidden = false;
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

function addLore(entry) {
  if (!entry || !entry.id || !entry.title || !entry.text) return false;
  if (progress.explore.lore.some((item) => item.id === entry.id)) return false;
  progress.explore.lore.push({ id: entry.id, title: entry.title, text: entry.text });
  saveProgress();
  return true;
}

function applyAction(action) {
  if (!action) return true;
  const [kind, ...rest] = action.split(':');
  const arg = rest.join(':');
  const explore = ensureExplore();

  switch (kind) {
    case 'give': {
      const boon = BOONS[arg];
      if (!boon) return true;
      if (explore.grantBoon(arg)) {
        addLore(boon.lore);
        saveProgress();
        syncExploreHud();
        updateTitle();
        toast(`${boon.name} — ${boon.desc}`);
        sfx('level');
      }
      return true;
    }
    case 'flag': {
      explore.markFlag(arg);
      saveProgress();
      syncExploreHud();
      return true;
    }
    case 'fragment': {
      const stone = WAYSTONES.find((item) => item.id === arg);
      if (explore.addFragment(arg) && stone) {
        addLore(stone.lore);
        saveProgress();
        syncExploreHud();
        updateTitle();
        toast(`${stone.name} remembers. ${explore.fragmentCount}/3 waystones lit.`);
        sfx('choose');
        if (explore.fragmentCount >= 3) {
          window.setTimeout(() => toast('The Rift is open. Find the Warden to the south.'), 1200);
        }
      }
      return true;
    }
    case 'chest': {
      const chest = CHESTS.find((item) => item.id === arg);
      if (explore.addChest(arg) && chest) {
        addLore(chest.lore);
        saveProgress();
        syncExploreHud();
        updateTitle();
        toast('+250 buried loot. The Rift will pay out when you enter.');
        sfx('choose');
      }
      return true;
    }
    case 'reveal': {
      explore.markFlag('revealed');
      saveProgress();
      syncExploreHud();
      toast('Sable marks the waystones on your map.');
      sfx('click');
      return true;
    }
    case 'run': {
      if (explore.fragmentCount < 3) {
        toast('The Rift is still sealed. Three waystones.');
        return true;
      }
      closeDialogue();
      startRun();
      return false;
    }
    default:
      return true;
  }
}

function openSpeaker(speakerId) {
  const speaker = speakerFor(speakerId);
  if (!speaker) return;
  const explore = ensureExplore();
  const root = rootNodeId(speaker, progress.explore);
  if (!root || !speaker.nodes[root]) return;

  explore.markMet(speakerId);
  saveProgress();
  updateTitle();

  state.dialogue = { speakerId, nodeId: root, choices: [] };
  state.lastTime = performance.now();
  resetInput();
  setScreen('dialogue');
  renderDialogue();
  sfx('click');
}

function renderDialogue() {
  const dialogue = state.dialogue;
  if (!dialogue) return;
  const speaker = speakerFor(dialogue.speakerId);
  const node = speaker?.nodes?.[dialogue.nodeId];
  if (!speaker || !node) {
    closeDialogue();
    return;
  }

  const text = typeof node.text === 'function' ? node.text(progress.explore) : node.text;
  ui.npcName.textContent = speaker.name;
  ui.npcTitle.textContent = speaker.title;
  ui.npcPortrait.textContent = speaker.glyph;
  ui.npcPortrait.style.color = speaker.color;
  ui.npcPortrait.style.borderColor = speaker.color;
  ui.npcPortrait.style.background = `color-mix(in srgb, ${speaker.color} 12%, transparent)`;
  ui.dialogueText.textContent = text;

  if (node.lore) addLore(node.lore);

  const choices =
    typeof node.choices === 'function' ? node.choices(progress.explore) : node.choices ?? [];
  const normalized = choices.length > 0 ? choices : [{ label: 'Close.', next: 'close' }];
  dialogue.choices = normalized;
  ui.dialogueChoices.replaceChildren();

  normalized.forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dialogue-choice';
    button.dataset.choice = String(index);
    const key = document.createElement('span');
    key.textContent = String(index + 1);
    const label = document.createElement('b');
    label.textContent = choice.label;
    button.append(key, label);
    ui.dialogueChoices.append(button);
  });
}

function selectChoice(index) {
  const dialogue = state.dialogue;
  if (!dialogue) return;
  const choice = dialogue.choices[index];
  if (!choice) return;

  if (choice.action) {
    const stays = applyAction(choice.action);
    if (!stays) return;
    if (state.screen !== 'dialogue') return;
  }

  if (!choice.next || choice.next === 'close') {
    closeDialogue();
    return;
  }
  dialogue.nodeId = choice.next;
  renderDialogue();
}

function closeDialogue() {
  state.dialogue = null;
  if (state.explore) {
    setScreen('explore');
    state.lastTime = performance.now();
    resetInput();
    syncExploreHud();
  } else {
    goHome();
  }
}

function tryInteract() {
  if (state.screen !== 'explore' || !state.explore) return;
  const prompt = state.explore.interact();
  if (!prompt) return;
  openSpeaker(prompt.id);
}

function renderJournal() {
  const ex = progress.explore;
  ui.journalFrags.textContent = `${ex.fragments.length} / 3`;
  ui.journalBoonsCount.textContent = String(Object.keys(ex.boons).length);
  ui.journalChests.textContent = `${ex.chests.length} / 3`;
  ui.journalLoot.textContent = ex.loot.toLocaleString('en-AU');

  ui.journalBoons.replaceChildren();
  const boonIds = Object.keys(ex.boons).filter((id) => BOONS[id]);
  if (boonIds.length === 0) {
    ui.journalBoons.append(emptyNote('No blessings yet. Talk to the people at camp.'));
  } else {
    for (const id of boonIds) {
      const boon = BOONS[id];
      const item = document.createElement('div');
      item.className = 'journal-item';
      item.innerHTML = `<span class="j-icon">${boon.icon}</span><span><span class="j-name">${boon.name}</span><br /><span class="j-desc">${boon.desc}</span></span>`;
      ui.journalBoons.append(item);
    }
  }

  ui.journalStones.replaceChildren();
  for (const stone of WAYSTONES) {
    const lit = ex.fragments.includes(stone.id);
    const item = document.createElement('div');
    item.className = 'journal-item';
    item.innerHTML = `<span class="j-icon" style="color:${lit ? stone.color : 'var(--muted-2)'}">◈</span><span><span class="j-name">${stone.name}</span><br /><span class="j-desc">${lit ? 'Remembered. The Rift has heard it.' : 'Still waiting in the Wilderness.'}</span></span>`;
    ui.journalStones.append(item);
  }

  ui.journalLore.replaceChildren();
  if (ex.lore.length === 0) {
    ui.journalLore.append(emptyNote('Nothing written yet. Touch a waystone or ask a local.'));
  } else {
    for (const entry of ex.lore) {
      const item = document.createElement('div');
      item.className = 'lore-entry';
      const title = document.createElement('b');
      title.textContent = entry.title;
      const text = document.createElement('span');
      text.textContent = entry.text;
      item.append(title, text);
      ui.journalLore.append(item);
    }
  }
}

function emptyNote(text) {
  const note = document.createElement('p');
  note.className = 'journal-empty';
  note.textContent = text;
  return note;
}

function openJournal() {
  if (state.screen !== 'explore') return;
  renderJournal();
  setScreen('journal');
  state.lastTime = performance.now();
  resetInput();
  sfx('click');
}

function closeJournal() {
  if (state.screen !== 'journal') return;
  setScreen('explore');
  state.lastTime = performance.now();
  syncExploreHud();
}

function resetJourney() {
  const confirmed = window.confirm('Reset the whole journey? Waystones, blessings, lore and buried loot will be lost.');
  if (!confirmed) return;
  progress.explore = defaultExploreState();
  state.explore = null;
  saveProgress();
  ensureExplore();
  updateTitle();
  closeJournal();
  syncExploreHud();
  toast('Journey reset. The Wilderness forgets you too.');
}

function setJoystickVisual(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const { base } = joystickElements();
  base.style.left = `${clientX - rect.left}px`;
  base.style.top = `${clientY - rect.top}px`;
}

function updateStick() {
  const { stick } = joystickElements();
  stick.style.transform = `translate(calc(-50% + ${joy.dx}px), calc(-50% + ${joy.dy}px))`;
}

function onPointerDown(event) {
  if (!['playing', 'explore'].includes(state.screen)) return;
  if (joy.active) return;
  initAudio();
  joy.active = true;
  joy.id = event.pointerId;
  joy.sx = event.clientX;
  joy.sy = event.clientY;
  joy.dx = 0;
  joy.dy = 0;
  const { base } = joystickElements();
  base.hidden = false;
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
  ui.exploreJoystick.hidden = true;
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
  } else if (state.screen === 'explore') {
    const vector = inputVector();
    state.explore.update(dt, vector);
    if (state.explore.areaChanged) showAreaBanner(state.explore.area);
    syncExploreHud();
    if (state.interactQueued) {
      state.interactQueued = false;
      tryInteract();
    }
  } else {
    state.dashQueued = false;
    state.interactQueued = false;
    if (state.game.isRunning) drainEvents();
  }

  if (state.screen === 'title') {
    renderer.drawTitle(now / 1000);
  } else if (['explore', 'dialogue', 'journal'].includes(state.screen)) {
    exploreRenderer.draw(state.explore, now / 1000);
  } else {
    renderer.draw(state.game, now / 1000);
  }

  requestAnimationFrame(frame);
}

function handleResize() {
  const { width, height } = renderer.resize();
  exploreRenderer.resize();
  state.game.resize(width, height);
  if (state.explore) state.explore.resize(width, height);
  resetInput();
  if (['playing', 'levelup', 'paused'].includes(state.screen)) syncHud();
  if (['explore', 'dialogue', 'journal'].includes(state.screen)) syncExploreHud();
}

// ---------------------------------------------------------------- listeners

ui.exploreBtn.addEventListener('click', () => {
  initAudio();
  startExplore();
});

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
ui.campBtn.addEventListener('click', startExplore);
ui.home.addEventListener('click', goHome);

ui.cards.addEventListener('click', (event) => {
  const card = event.target.closest('[data-upgrade]');
  if (card) chooseUpgrade(card.dataset.upgrade);
});

ui.rerollBtn.addEventListener('click', rerollUpgrades);

ui.dashBtn.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (state.screen === 'playing') state.dashQueued = true;
});

ui.interactBtn.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  tryInteract();
});

ui.journalBtn.addEventListener('click', openJournal);
ui.exploreHome.addEventListener('click', goHome);
ui.dialogueClose.addEventListener('click', closeDialogue);
ui.journalClose.addEventListener('click', closeJournal);
ui.journalReset.addEventListener('click', resetJourney);

ui.dialogueChoices.addEventListener('click', (event) => {
  const choice = event.target.closest('[data-choice]');
  if (!choice) return;
  selectChoice(Number(choice.dataset.choice));
});

ui.dialogueCard.addEventListener('click', (event) => {
  // Clicking the card body does not advance; choices are explicit.
  event.stopPropagation();
});

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);
canvas.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    if (['playing', 'levelup', 'explore'].includes(state.screen)) event.preventDefault();
  }

  if (state.screen === 'dialogue') {
    if (key === 'escape') closeDialogue();
    else if (['1', '2', '3', '4', '5', '6'].includes(key)) selectChoice(Number(key) - 1);
    return;
  }

  if (state.screen === 'journal') {
    if (key === 'escape' || key === 'j') closeJournal();
    return;
  }

  if (state.screen === 'explore') {
    if (key === 'e' && !event.repeat) {
      tryInteract();
      return;
    }
    if (key === 'j' && !event.repeat) {
      openJournal();
      return;
    }
    if (key === 'escape') {
      goHome();
      return;
    }
  }

  if (state.screen === 'levelup' && ['1', '2', '3'].includes(key)) {
    const id = state.levelupIds[Number(key) - 1];
    if (id) chooseUpgrade(id);
    return;
  }

  if (key === 'enter') {
    if (state.screen === 'title') {
      initAudio();
      startExplore();
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

  if (key === 'e' && state.screen === 'playing') {
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

const params = new URLSearchParams(location.search);
if (params.has('explore')) {
  startExplore();
} else if (params.has('play')) {
  startRun();
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// A small handle for debugging and automated smoke tests. Harmless in play.
if (typeof window !== 'undefined') {
  window.__wildy = {
    state,
    progress,
    startRun,
    startExplore,
    openSpeaker,
    selectChoice,
    closeDialogue,
    chooseUpgrade,
    rerollUpgrades,
    getExplore: () => state.explore,
  };
}
