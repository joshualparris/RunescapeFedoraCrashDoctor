import test from 'node:test';
import assert from 'node:assert/strict';

import { Explore, START } from '../src/explore.js';
import {
  BOONS,
  CHESTS,
  MAP,
  NPCS,
  SPEAKERS,
  WAYSTONES,
  areaAt,
  rootNodeId,
  speakerFor,
} from '../src/npcs.js';

const makeState = () => ({
  met: [],
  boons: {},
  fragments: [],
  chests: [],
  lore: [],
  loot: 0,
  flags: {},
});

const makeExplore = (state = makeState()) => new Explore({ width: 1200, height: 700, state });

test('the explore map starts at camp near Mira and prompts for a chat', () => {
  const explore = makeExplore();
  explore.update(1 / 60, { x: 0, y: 0 });
  assert.equal(explore.area, 'Ember Camp');
  assert.ok(explore.prompt, 'a prompt is available at camp');
  assert.equal(explore.prompt.kind, 'npc');
  assert.equal(explore.prompt.id, 'mira');
  assert.match(explore.prompt.label, /Mira/);
});

test('walking moves the player and changes the region', () => {
  const explore = makeExplore();
  const startX = explore.player.x;
  for (let i = 0; i < 180; i += 1) explore.update(1 / 60, { x: 1, y: 0 });
  assert.ok(explore.player.x > startX, 'player moved east');
  assert.notEqual(explore.area, 'Ember Camp');
  assert.ok(explore.player.x <= MAP.width);
});

test('trees and rocks push the player out instead of letting them overlap', () => {
  const explore = makeExplore();
  const tree = explore.obstacles.find((obstacle) => obstacle.type === 'tree');
  assert.ok(tree);
  const sum = tree.radius + explore.player.radius;
  explore.player.x = tree.x - sum - 2;
  explore.player.y = tree.y;
  for (let i = 0; i < 10; i += 1) explore.update(1 / 60, { x: 1, y: 0 });
  const distance = Math.hypot(explore.player.x - tree.x, explore.player.y - tree.y);
  assert.ok(distance >= sum - 0.5, 'player is outside the trunk');
});

test('progression methods are idempotent and drive the rift state', () => {
  const state = makeState();
  const explore = makeExplore(state);
  assert.equal(explore.riftOpen, false);

  assert.equal(explore.addFragment('ws-woods'), true);
  assert.equal(explore.addFragment('ws-woods'), false);
  assert.equal(explore.fragmentCount, 1);
  assert.equal(explore.addChest('chest-meadow'), true);
  assert.equal(state.loot, 250);
  assert.equal(explore.addChest('chest-meadow'), false);
  assert.equal(state.loot, 250);

  assert.equal(explore.markFlag('branQuest'), true);
  assert.equal(explore.markFlag('branQuest'), false);
  assert.equal(explore.grantBoon('keeper'), true);
  assert.equal(explore.grantBoon('keeper'), false);
  assert.equal(explore.hasBoon('keeper'), true);

  explore.addFragment('ws-circle');
  explore.addFragment('ws-ruins');
  assert.equal(explore.riftOpen, true);
});

test('every speaker root resolves and every dialogue next pointer exists', () => {
  const states = [
    makeState(),
    { ...makeState(), met: Object.keys(SPEAKERS), boons: { keeper: true, pip: true, bran: true, sable: true }, fragments: WAYSTONES.map((s) => s.id), chests: CHESTS.map((c) => c.id), flags: { branQuest: true, mossFound: true, revealed: true } },
    { ...makeState(), flags: { branQuest: true } },
    { ...makeState(), flags: { mossFound: true } },
    { ...makeState(), met: Object.keys(SPEAKERS) },
  ];

  for (const state of states) {
    for (const [id, speaker] of Object.entries(SPEAKERS)) {
      const root = rootNodeId(speaker, state);
      assert.ok(root, `${id} has a root`);
      assert.ok(speaker.nodes[root], `${id} root ${root} exists`);
      for (const [nodeId, node] of Object.entries(speaker.nodes)) {
        const choices = typeof node.choices === 'function' ? node.choices(state) : node.choices ?? [];
        for (const choice of choices) {
          assert.ok(choice.label, `${id}.${nodeId} choice label`);
          if (choice.next && choice.next !== 'close') {
            assert.ok(speaker.nodes[choice.next], `${id}.${nodeId} next ${choice.next} exists`);
          }
          if (choice.action) {
            const [kind, arg] = choice.action.split(':');
            if (kind === 'give') assert.ok(BOONS[arg], `${id} gives a real boon`);
            if (kind === 'fragment') assert.ok(WAYSTONES.some((stone) => stone.id === arg));
            if (kind === 'chest') assert.ok(CHESTS.some((chest) => chest.id === arg));
            if (kind === 'run') assert.equal(arg, undefined);
          }
        }
      }
    }
  }
});

test('NPCs, chests and waystones are inside the map and have speakers', () => {
  for (const npc of NPCS) {
    assert.ok(npc.x > 0 && npc.x < MAP.width && npc.y > 0 && npc.y < MAP.height, `${npc.id} in bounds`);
    assert.ok(speakerFor(npc.id), `${npc.id} has a speaker`);
  }
  for (const stone of WAYSTONES) {
    assert.ok(stone.x > 0 && stone.x < MAP.width && stone.y > 0 && stone.y < MAP.height);
    assert.ok(speakerFor(stone.id), `${stone.id} has a speaker`);
    assert.ok(stone.lore && stone.lore.id);
  }
  for (const chest of CHESTS) {
    assert.ok(chest.x > 0 && chest.x < MAP.width && chest.y > 0 && chest.y < MAP.height);
    assert.ok(speakerFor(chest.id), `${chest.id} has a speaker`);
  }
  assert.equal(areaAt(START.x, START.y), 'Ember Camp');
  assert.equal(areaAt(200, 200), 'Whispering Woods');
  assert.equal(areaAt(2100, 400), 'The Rune Circle');
  assert.equal(areaAt(2000, 1400), 'The Old Ruins');
  assert.equal(areaAt(1200, 1400), 'The Rift');
});
