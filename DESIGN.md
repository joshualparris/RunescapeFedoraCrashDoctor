# What makes a game fun? — research notes and WILDY's design

This is the working design document for **WILDY**, a three-minute browser
survivor-like. It records the research that shaped the game, the decisions that
followed, and the numbers behind the loop. It is a design argument, not a
peer-reviewed study.

---

## The short version

Fun is not a theme or a feature. It is an **emergent experience** produced when
a readable system gives the player:

1. **a clear goal** and immediate feedback on progress (flow),
2. **competence** — the feeling that skill and decisions visibly matter,
3. **autonomy** — meaningful choices that shape *this* run,
4. **sensation** — responsive, juicy feedback that makes cause and effect feel
   physical,
5. **discovery** — a world that withholds context and rewards attention,
6. **escalation and variety** — enough change to want one more run.

WILDY is a small machine for delivering those five things in three minutes.

---

## 1. Fun is emergent: mechanics → dynamics → aesthetics

The MDA framework (Hunicke, LeBlanc & Zubek) separates **mechanics** (rules and
data), **dynamics** (what happens when the player touches them) and
**aesthetics** (the emotional result). Designers author mechanics; players
experience aesthetics. The framework's taxonomy of fun includes challenge,
sensation, discovery and expression — four aesthetics that a survivor-like can
deliver with a very small content budget.

**Design consequence:** do not ask "is the game fun?" as a property of the
theme. Ask what dynamics the rules produce. WILDY's rules are intentionally
few: move, auto-cast, collect, choose, dash. The dynamics — kiting, build
synergy, risk/reward during a level-up, last-second dashes — are where the fun
lives.

Source: [MDA framework](https://en.wikipedia.org/wiki/MDA_framework) ·
[Hunicke, LeBlanc & Zubek, *MDA: A Formal Approach*](http://www.cs.northwestern.edu/~hunicke/pubs/MDA.pdf)

## 2. Flow: clear goal, constant feedback, rising challenge

Flow research describes the state where challenge and skill are balanced, goals
are clear, and feedback is immediate. A game keeps a player in flow by making
the next action legible and the result of that action visible without delay.

**Design consequence:**

- The goal is one sentence: **survive three minutes.**
- The HUD answers "how am I doing?" at a glance: timer, life, level, XP, dash.
- The player never aims — the staff auto-casts. That removes a source of
  friction that is not the point of the game, leaving movement and positioning
  as the skill expression.
- Difficulty rises continuously (spawn rate, enemy HP, elites) instead of
  stepping abruptly. The boss at 2:30 is a spike with a warning.
- The dash has a short cooldown and i-frames: mastery is available immediately,
  but the ceiling is high.

Source: [Flow (psychology)](https://en.wikipedia.org/wiki/Flow_(psychology))

## 3. Competence and autonomy: choices that change the run

Self-determination theory identifies **competence**, **autonomy** and
**relatedness** as basic psychological needs. A single-player arcade game can
serve the first two very directly: the player must feel effective, and must feel
that the run is *theirs*.

**Design consequence:**

- Every level offers **three blessings from a pool of eleven**. Choices stack
  multiplicatively (damage × cast speed × split bolts × pierce × crit), so two
  runs diverge.
- The build is visible: level pips on each card, a live stat effect, damage
  numbers, and a noticeably faster clear.
- There is no meta currency or permanent power grind. Autonomy is inside the
  run, not gated behind a shop. (This is a deliberate scope choice, not a claim
  that meta progression is bad.)
- Failure still shows kills, level, best combo and score, so the player can see
  what improved even when they die.

Source: [Self-determination theory](https://en.wikipedia.org/wiki/Self-determination_theory)

## 4. Juice: make cause and effect feel physical

"Game feel" or "juice" is the tactile result of responsive input, animation,
sound and feedback. A 2024 CHI paper on juicy feedback frames it as motivating
through curiosity, competence and effectance — the sense that your action caused
something. The classic *Juice It or Lose It* talk demonstrates the same idea with
before/after clips.

**Design consequence — the juice checklist:**

| Feedback | Where it appears |
| --- | --- |
| Hit-stop | Brief freeze on elite/boss death; tiny frame of impact on big hits |
| Screen shake | Scaled by event: crit 4.5, hurt 9, elite death 8, boss 18 |
| Particles | Muzzle sparks, impacts, deaths, dash trail, gem pickups |
| Damage numbers | White normally, gold + `!` on crit |
| Flash | Red screen flash on hurt; gold flash on level-up |
| Sound | Synthesised cast, hit, kill, dash, hurt, level, boss, win/lose |
| Motion | Gem bob, fog drift, orbiting rune ring, spawn scale-in |
| Readability guard | Short shakes, capped particles, palette separation, no screen-filling effects |

More juice is not always better: if every hit shakes the camera, the player
cannot read the swarm. The strong effects are reserved for rare events.

Sources: [How does Juicy Game Feedback Motivate? (CHI 2024)](https://dl.acm.org/doi/10.1145/3613904.3642656) ·
[Cornell CIS 5152 game-feel critique](https://www.cs.cornell.edu/courses/cs5152/2025sp/assignments/critique4/) ·
[Juice It or Lose It](https://youtu.be/Fy0aCDmgnxg)

## 5. The survivor-like loop is a proven fun engine

*Vampire Survivors* is a useful reference because its loop is so compact: kill
monsters, pick up XP gems, upgrade the character. Runs are short, the screen
fills with enemies, and the build snowballs. The result is the "one more run"
feeling that made the genre explode.

WILDY borrows the skeleton, not the content:

- **Auto-attack** lowers the input floor and keeps the focus on movement.
- **Shards** make every kill a small reward and pull the player into danger.
- **Three-card level-ups** turn a kill count into a decision.
- **A 3:00 run** fits a phone session; restart is one tap.
- **Elites every 30 s and a boss at 2:30** provide a rhythm of spikes inside the
  smooth ramp.

Source: [Ars Technica on Vampire Survivors](https://arstechnica.com/gaming/2022/10/vampire-survivors-a-cheap-minimalistic-indie-game-is-my-game-of-the-year/)

## 6. Risk, reward and the "one more run" ending

Two pressures keep a run tense:

- **Greed:** shards pull you toward the swarm; the magnet radius rewards a
  dangerous line.
- **Timing:** a level-up is a safe pause, but the next wave is already queued.
  Choosing offense is a bet on killing faster; choosing life is a bet on
  surviving the next spike.

A run ends with a clear diagnosis: score, time, kills, level, best combo, and a
new-best flag. The restart button is the most prominent element on the end
screen. The loop is designed to make the next attempt feel like a choice, not a
punishment.

## 7. Exploration: curiosity, autonomy and a safe counterweight

Exploration is not "combat with the enemies removed". It serves different
aesthetics: discovery, fantasy, narrative and expression. Three ideas shaped the
explore mode.

**Curiosity is an information gap.** Information-gap theory describes curiosity
as the discomfort of noticing that you know less than you want to. The design
therefore withholds the whole map and refuses to dump a quest log. Mira gives
directions; Sable marks the stones; the Echo explains the Rift; the journal only
records what you have actually learned. A locked Rift is a question, not a
chore.

**Autonomy needs real choices.** Conversations are not cosmetic. A few replies
decide which camp blessing you can earn, and the player chooses which characters
to seek out and in what order to light the stones. The rewards are small and
permanent rather than a power spiral: +20 life, one reroll, +15% damage, +8%
speed, plus buried loot.

**Pacing needs a quiet half.** A calm mode makes the Rift's noise legible. The
player can walk with no health bar and no timer, then opt into a three-minute
spike. The contrast is the point: the Rift is frightening because the camp is
not. Exploration has no fail state; the Rift is where failure has teeth.

**The halves must touch.** Boons and loot cross the boundary, so the quiet mode
matters to the loud one. A player who talks to everyone and opens every cache
starts the Rift with a visibly different character.

Implementation: a 2400×1800 map with a smooth camera, collision against
trees/rocks/water, proximity prompts, seven characters, branching dialogue, three
waystones, three caches, four boons, and a journal. The minimap deliberately
hides unrevealed waystones until Sable marks them.

Source: Loewenstein, *The psychology of curiosity* (1994) —
[doi](https://doi.org/10.1037/0033-2909.116.1.75) ·
[overview](https://en.wikipedia.org/wiki/Curiosity)

## 8. What we deliberately left out

Scope is a design tool. For this build:

- no story campaign, cutscenes, inventory, shops or meta currency;
- no multiplayer, accounts, analytics or network calls;
- no procedural maps, fast travel or content pipeline;
- no combat in explore mode — the calm half stays calm;
- no permanent upgrades that make a bad run feel like wasted time. The four camp
  boons are small, earned, and capped.

These are good features for a larger game. They would dilute the three-minute
loop here.

---

## Implementation map

| Player experience | System | Value |
| --- | --- | --- |
| A run is short enough to retry | Run length | 180 s; boss at 150 s |
| The goal is legible | HUD | countdown, life, level/XP, dash, boss bar |
| Skill matters | Movement + dash | 216 px/s; dash 0.16 s at 3.3×, 0.30 s i-frames, 2.6 s cooldown |
| Kills feel good | Combat | auto-cast at nearest enemy; 12 base damage; 2.4 casts/s; crit 6% |
| Choices diverge | Blessings | 11 stacking upgrades, 3 offered per level, max 3–5 ranks |
| The screen escalates | Spawning | `max(0.36, 0.9 − 0.0028t)` s interval; `1 + floor(t/65)` per tick |
| Enemies stay threatening | Scaling | HP ×`(1 + 0.011t)`, damage ×`(1 + 0.0022t)`, speed ×`min(1.35, 1 + 0.0012t)` |
| Death is a spike, not a wall | Elites / boss | elite every 30 s; boss 1900 HP at 150 s |
| The run has a shape | Win | survive to 180 s **or** kill the boss early |
| Failure is informative | End screen | score, time, kills, level, best combo, best score |
| The world rewards looking | Explore | 2400×1800 map, 7 characters, 3 waystones, 3 caches, journal |
| Conversation has weight | Dialogue | branching nodes; boons, flags and lore |
| The quiet half matters | Carry-over | 4 camp boons and 750 buried loot into the Rift |

XP curve: `xpNeeded(level) = 10 + 5 × level`. Drop values: imp 3, skeleton 5,
brute 12, elite 30. A typical run reaches level 15–25 depending on how greedily
the player collects.

### Balance notes

- The player's base DPS is intentionally modest. The first minute should feel
  manageable; the last minute should feel like the screen is winning.
- The boss can be skipped by surviving to 3:00. Killing it is the "greedy" win
  and pays a 2,500 loot bonus.
- The enemy cap (150) protects mobile frame rate. When the cap is reached,
  spawning pauses rather than deleting enemies.
- The Rift DOM smoke test runs the whole loop (boot → play → pause → level-up →
  death → retry) in jsdom; the explore DOM smoke test runs explore → talk →
  waystone → boon → Rift. The engine tests cover the spawn curve, XP, upgrades,
  boss timing, contact damage, determinism, movement/collision, dialogue links
  and a full simulated run.
- Explore pace: 236 px/s on a 2400×1800 map. The three waystones are all
  reachable in any order; no timer, no fail state, no combat.
- The minimap shows met NPCs and unlocked stones; unlit stones appear only after
  Sable's reveal, so talking to her changes how the world reads.

## Playtest questions

The next round of tuning should answer:

1. Do players understand auto-cast within the first 10 seconds?
2. Is the first elite (0:30) a surprise or a spike that feels unfair?
3. Which blessing is picked most, and is there a dominant build?
4. Does the dash get used for damage avoidance or only for travel?
5. On a phone, is the joystick comfortable in portrait and landscape?
6. Does the 3:00 length leave the player wanting one more run, or relief?
7. Do players find the first waystone from Mira's directions, or wander too long?
8. Does Sable's map reveal feel useful, or does it arrive too late?
9. Which NPC is approached first, and do the conversations hold attention?
10. Does the switch from camp to Rift feel like a deliberate choice?
11. Is the map too empty between landmarks, or does the quiet space help?
12. Do players read the journal, or only collect the mechanical rewards?

Instrumentation is intentionally absent. Playtests should be observed, not
tracked, until the loop is fun without a dashboard.

## Sources consulted

- Hunicke, LeBlanc & Zubek, *MDA: A Formal Approach to Game Design and Game
  Research* — [PDF](http://www.cs.northwestern.edu/~hunicke/pubs/MDA.pdf) ·
  [overview](https://en.wikipedia.org/wiki/MDA_framework)
- *Flow (psychology)* — [overview](https://en.wikipedia.org/wiki/Flow_(psychology))
- *Self-determination theory* —
  [overview](https://en.wikipedia.org/wiki/Self-determination_theory)
- *How does Juicy Game Feedback Motivate? Testing Curiosity, Competence, and
  Effectance* (CHI 2024) — [paper](https://dl.acm.org/doi/10.1145/3613904.3642656)
- Cornell CIS 5152, *Gamefeel Critique* (juice/game-feel framing) —
  [course page](https://www.cs.cornell.edu/courses/cs5152/2025sp/assignments/critique4/)
- *Juice It or Lose It* (Martin Jonasson & Petri Purho) —
  [video](https://youtu.be/Fy0aCDmgnxg)
- Loewenstein, *The psychology of curiosity: A review and reinterpretation*
  (1994) — [doi](https://doi.org/10.1037/0033-2909.116.1.75)
- Ars Technica, *Vampire Survivors … is my game of the year* —
  [article](https://arstechnica.com/gaming/2022/10/vampire-survivors-a-cheap-minimalistic-indie-game-is-my-game-of-the-year/)
