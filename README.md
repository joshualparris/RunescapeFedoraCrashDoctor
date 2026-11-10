# WILDY

[![tests](https://github.com/joshualparris/RunescapeFedoraCrashDoctor/actions/workflows/test.yml/badge.svg)](https://github.com/joshualparris/RunescapeFedoraCrashDoctor/actions/workflows/test.yml)
[![pages](https://github.com/joshualparris/RunescapeFedoraCrashDoctor/actions/workflows/pages.yml/badge.svg)](https://joshualparris.github.io/RunescapeFedoraCrashDoctor/)
[![license: MIT](https://img.shields.io/badge/license-MIT-e3b25c.svg)](LICENSE)

![WILDY title screen](docs/screenshot-title.png)

**Three minutes. One life. One more run.**

WILDY is a tiny browser survivor-like set in the Wilderness. Your staff casts on
its own; you move, collect rune shards, choose one of three blessings each level
and dash through the horde. Elites arrive every thirty seconds. The Greater
Demon arrives at 2:30. Survive to 3:00 — or kill it early for the greedy win.

**[Play WILDY](https://joshualparris.github.io/RunescapeFedoraCrashDoctor/)** ·
[Design notes](DESIGN.md) · [Report a bug](https://github.com/joshualparris/RunescapeFedoraCrashDoctor/issues)

No install, no account, no backend. It runs offline after the first load and can
be added to an Android or iOS home screen as a PWA.

| Mid-run | Choose a blessing |
| --- | --- |
| ![WILDY mid-run](docs/screenshot-game.png) | ![Three blessing cards](docs/screenshot-levelup.png) |

---

## Play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | `WASD` / arrow keys | drag anywhere on the arena |
| Dash | `Space` | the **DASH** rune button |
| Pick a blessing | `1` `2` `3` | tap a card |
| Pause | `P` / `Esc` | pause button |
| Mute | `M` | speaker button |

- **Auto-cast:** the staff targets the nearest enemy. You never aim.
- **Shards:** every kill drops one. Walk over them (or build the magnet).
- **Blessings:** eleven upgrades, three offered per level. Stack them; the build
  is the run.
- **Elites:** gold, chunky, worth a lot. They arrive on the half-minute.
- **Boss:** 1,900 HP of Greater Demon at 2:30. Killing it ends the run
  immediately with a bonus.

### On a phone

Open the live URL in Chrome (Android) or Safari (iOS), then **Add to Home
screen**. The service worker caches the whole game; after the first visit it
works with no network. Portrait and landscape both work, and the controls are
thumb-sized.

---

## The loop

```
 move → auto-cast → kill → collect shards → level up → choose blessing
   ↑                                                        │
   └──────────────────── die / survive ←───────────────────┘
```

A run is three minutes. Restarting is one tap. The score is local: the only
thing the game remembers is your best loot, best survival time, and how many
runs you have taken into the dark.

### Why it is fun

The short version, with the longer argument and sources in [DESIGN.md](DESIGN.md):

- **Flow** — one clear goal, a readable HUD, and a difficulty curve that rises
  smoothly instead of spiking without warning.
- **Competence** — kills, damage numbers, level-ups and a visibly faster clear
  make improvement legible. Auto-cast removes aiming friction; dash is the
  skill ceiling.
- **Autonomy** — every level is a real fork: damage, speed, split bolts, pierce,
  crit, life, magnet, regen, armour, dash. Two runs do not look the same.
- **Juice** — hit-stop, screen shake, particles, damage text, synth SFX and
  flashes, reserved for the moments that deserve them so the screen stays
  readable.
- **One more run** — three-minute sessions, a prominent retry button and a score
  that is worth beating.

---

## Under the hood

The game has **zero runtime dependencies**. Everything is drawn with the Canvas
2D API and every sound is synthesised with the Web Audio API.

```
index.html              screens + HUD
src/styles.css          field-instrument UI
src/main.js             state machine, input, HUD, screens, persistence
src/engine.js           deterministic simulation (no DOM, no canvas)
src/render.js           canvas renderer (no game rules)
src/audio.js            tiny oscillator sound kit
src/cases.js            (removed — the crash-triage prototype)
test/engine.test.mjs    14 simulation/balance tests
test/smoke.test.mjs     full page playthrough in jsdom
assets/                 PWA icons, favicon
sw.js                   offline cache
.github/workflows/      tests + GitHub Pages deploy
```

The simulation is separate from rendering on purpose: the engine can be
simulated headlessly at 60 Hz, which is how the spawn curve, boss timing and
upgrade caps are tested.

### Local development

```bash
npm install          # dev dependency: jsdom, for the smoke test
npm start            # http://localhost:8137
npm test             # engine + DOM tests
npm run check        # syntax checks
```

`npm start` uses Python's static server. Any static file server works; ES modules
need HTTP, not `file://`.

### Deploying

Push to `main`. `.github/workflows/pages.yml` stages the static files into
`dist/` and deploys them to GitHub Pages. No build step, no secrets, no server.

---

## Research and design

[DESIGN.md](DESIGN.md) contains the working notes behind the loop:

- MDA: mechanics → dynamics → aesthetics, and why "fun" is emergent.
- Flow: clear goals, immediate feedback, challenge–skill balance.
- Self-determination theory: competence and autonomy.
- Game feel / juice and its limits.
- The survivor-like reference point.
- The actual numbers: spawn curve, XP curve, scaling, boss timing.
- A playtest checklist and the questions still open.

Sources include the MDA paper, CHI 2024 game-feel research, the *Juice It or Lose It*
talk, and Ars Technica's write-up of *Vampire Survivors* — all linked in
[DESIGN.md](DESIGN.md).

---

## Credits and scope

- Code, vector art and sound synthesis are original for this project.
- RuneScape is a trademark of Jagex Ltd. WILDY is an independent,
  RuneScape-inspired arcade game. It is not affiliated with or endorsed by
  Jagex, and it contains no Jagex assets, accounts, or game data.
- The repository name is a leftover from the first prototype. The finished thing
  is WILDY.
- MIT licensed. See [LICENSE](LICENSE).
