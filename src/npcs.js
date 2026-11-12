/**
 * The people, stones and half-buried things of the Wilderness.
 *
 * Dialogue is plain data: a speaker has a root() selector and a map of nodes.
 * A node has text, optional lore, and choices. A choice may carry an action
 * (`give:keeper`, `fragment:ws-woods`, `flag:branQuest`, `run`) and a `next`
 * node id, or `close`. The UI never executes arbitrary strings.
 */

export const MAP = { width: 2400, height: 1800 };

export const AREAS = [
  { id: 'camp', name: 'Ember Camp', test: (x, y) => x < 1000 && y > 700 && y < 1250 },
  { id: 'woods', name: 'Whispering Woods', test: (x, y) => y < 700 && x < 1400 },
  { id: 'circle', name: 'The Rune Circle', test: (x, y) => x > 1500 && y < 900 },
  { id: 'ruins', name: 'The Old Ruins', test: (x, y) => x > 1500 && y >= 900 },
  { id: 'rift', name: 'The Rift', test: (x, y) => y > 1250 && x > 800 && x < 1600 },
  { id: 'grass', name: 'The Long Grass', test: () => true },
];

export const BOONS = {
  keeper: {
    name: 'Keeper’s Charm',
    desc: '+20 max life',
    icon: '♥',
    lore: {
      id: 'boon-keeper',
      title: 'Keeper’s Charm',
      text: 'A smooth stone on a leather cord. It is warm even when the wind is not.',
    },
  },
  pip: {
    name: 'Lucky Pebble',
    desc: '+1 blessing reroll',
    icon: '◎',
    lore: {
      id: 'boon-pip',
      title: 'Lucky Pebble',
      text: 'Pip says it is lucky. It is mostly a pebble. Mostly.',
    },
  },
  bran: {
    name: 'Bran’s Ember',
    desc: '+15% bolt damage',
    icon: '✦',
    lore: {
      id: 'boon-bran',
      title: 'Bran’s Ember',
      text: 'A coal that has not gone out in forty years. It hums when you cast.',
    },
  },
  sable: {
    name: 'Scavenger’s Stride',
    desc: '+8% movement speed',
    icon: '⌁',
    lore: {
      id: 'boon-sable',
      title: 'Scavenger’s Stride',
      text: 'Boots with too many laces and exactly the right amount of grip.',
    },
  },
};

export const NPCS = [
  { id: 'mira', x: 640, y: 940 },
  { id: 'pip', x: 790, y: 1060 },
  { id: 'bran', x: 470, y: 440 },
  { id: 'sable', x: 1860, y: 1320 },
  { id: 'echo', x: 1940, y: 570 },
  { id: 'warden', x: 1200, y: 1390 },
  { id: 'moss', x: 340, y: 790, hideWhen: 'mossFound' },
];

export const WAYSTONES = [
  {
    id: 'ws-woods',
    x: 360,
    y: 315,
    name: 'The Listening Stone',
    color: '#7fe7d4',
    text:
      'The stone is furred with moss. When you touch it, the roots below the woods go quiet — all at once, as if a room had stopped talking about you.',
    lore: {
      id: 'stone-woods',
      title: 'The Listening Stone',
      text: 'The first waystone remembers a wood that listened. It is still listening.',
    },
  },
  {
    id: 'ws-circle',
    x: 2070,
    y: 330,
    name: 'The Sunken Rune',
    color: '#f6d28a',
    text:
      'A rune the size of a door lies half-swallowed by the hill. Its edge is warm. In the polished face you see a sky with two moons, neither of them yours.',
    lore: {
      id: 'stone-circle',
      title: 'The Sunken Rune',
      text: 'The second waystone remembers a sky that was borrowed and never returned.',
    },
  },
  {
    id: 'ws-ruins',
    x: 2140,
    y: 1510,
    name: 'The Broken Oath',
    color: '#ff9b7a',
    text:
      'The last stone is cracked down the middle. Something was promised here, and something did not keep it. The crack is warm to the touch.',
    lore: {
      id: 'stone-ruins',
      title: 'The Broken Oath',
      text: 'The third waystone remembers a promise made to the Greater Demon. It did not end well for the one who made it.',
    },
  },
];

export const CHESTS = [
  {
    id: 'chest-meadow',
    x: 300,
    y: 1480,
    name: 'A Moss-Covered Chest',
    text:
      'Half-sunk in the long grass, more of a suggestion of a chest than a chest. The lock gave up years ago.',
    lore: {
      id: 'chest-meadow',
      title: 'The Meadow Chest',
      text: 'A traveller buried their loot and their name. The loot was not very good, but they meant well.',
    },
  },
  {
    id: 'chest-ridge',
    x: 1320,
    y: 220,
    name: 'A Wind-Bitten Chest',
    text:
      'A chest on the ridge, sand-blasted down to the grain. It opens with a sound like a cough.',
    lore: {
      id: 'chest-ridge',
      title: 'The Ridge Chest',
      text: 'Whoever left this was in a hurry. The coins are stamped with a face no one recognises.',
    },
  },
  {
    id: 'chest-ruins',
    x: 2200,
    y: 1250,
    name: 'A Ruin Cache',
    text:
      'A cache tucked under a fallen arch. Sable has clearly been here, but she left the heavy things.',
    lore: {
      id: 'chest-ruins',
      title: 'The Ruin Cache',
      text: 'The ruins keep their own accounts. This cache is one of the smaller withdrawals.',
    },
  },
];

export const RIFT = { x: 1200, y: 1540 };

export const PATHS = [
  [
    [640, 950],
    [600, 790],
    [560, 680],
    [460, 520],
    [370, 350],
  ],
  [
    [640, 950],
    [860, 850],
    [1200, 690],
    [1580, 540],
    [1950, 420],
    [2070, 340],
  ],
  [
    [640, 950],
    [820, 1090],
    [1200, 1260],
    [1600, 1380],
    [1930, 1450],
    [2140, 1510],
  ],
  [
    [640, 950],
    [760, 1110],
    [980, 1280],
    [1200, 1430],
    [1200, 1540],
  ],
  [
    [640, 950],
    [530, 1130],
    [430, 1310],
    [300, 1480],
  ],
  [
    [1200, 690],
    [1320, 500],
    [1320, 240],
  ],
];

export const SPEAKERS = {
  mira: {
    name: 'Mira',
    title: 'Keeper of Ember Camp',
    glyph: 'M',
    color: '#e3b25c',
    root(s) {
      if (s.fragments.length >= 3) return 'ready';
      if (s.boons.keeper) return 'after';
      if (s.met.includes('mira')) return 'again';
      return 'first';
    },
    nodes: {
      first: {
        text:
          '“You’re upright. That’s rarer than you’d think out here.” Mira is mending a boot with wire and patience. “Sit. You look like a rumour.”',
        choices: [
          { label: 'Where is this place?', next: 'place' },
          { label: 'How do I survive the Rift?', next: 'rift' },
          { label: 'I could use a charm.', next: 'charm' },
          { label: 'Just passing through.', next: 'close' },
        ],
      },
      place: {
        text:
          '“The Wilderness is a wound that never got the memo about healing. Adventurers come for the loot, the demon comes for the company, and the rest of us make camp where the ground is least honest.”',
        lore: {
          id: 'place-camp',
          title: 'Ember Camp',
          text: 'A ring of tents, a fire that never quite goes out, and the last safe ground before the Rift.',
        },
        choices: [
          { label: 'And the Rift?', next: 'rift' },
          { label: 'Tell me about the waystones.', next: 'stones' },
          { label: 'Back.', next: 'first' },
        ],
      },
      rift: {
        text:
          '“Three minutes is what the Rift gives you. It is not a place; it is a habit. Keep moving, collect the shards, and take the blessings it offers. The demon is just the bill collector.”',
        choices: [
          { label: 'A charm would help.', next: 'charm' },
          { label: 'Where are the waystones?', next: 'stones' },
          { label: 'I’ll manage.', next: 'close' },
        ],
      },
      stones: {
        text:
          '“Three stones keep the Rift shut: one in the woods to the north-west, one in the rune circle to the north-east, one in the ruins to the south-east. Touch them. They remember, even when we don’t.”',
        choices: [
          { label: 'I’ll light them.', next: 'close' },
          { label: 'About that charm…', next: 'charm' },
        ],
      },
      charm: {
        text:
          '“This was my mother’s. It is a rock. It is also the reason I am still alive, so do not laugh.” She holds out a smooth stone on a leather cord.',
        choices: [
          { label: 'Take the Keeper’s Charm.', action: 'give:keeper', next: 'charmed' },
          { label: 'Not yet.', next: 'first' },
        ],
      },
      charmed: {
        text:
          '“There. Now you have something to come back to.” She ties off the boot. “The Rift will still try to kill you. Try to be a disappointment.”',
        choices: [
          { label: 'What now?', next: 'rift' },
          { label: 'Thank you.', next: 'close' },
        ],
      },
      again: {
        text:
          '“Back already. The fire is still here. So am I.” Mira does not look up from her mending, which is how you know she is pleased.',
        choices: [
          { label: 'Any advice for the Rift?', next: 'rift' },
          { label: 'The waystones?', next: 'stones' },
          { label: 'I need that charm.', next: 'charm' },
          { label: 'Goodbye.', next: 'close' },
        ],
      },
      after: {
        text:
          '“The charm suits you. You still look like a rumour, but a better-dressed one.”',
        choices: [
          { label: 'The waystones?', next: 'stones' },
          { label: 'Rift advice?', next: 'rift' },
          { label: 'Goodbye.', next: 'close' },
        ],
      },
      ready: {
        text:
          'Mira stands when she sees you. “The stones are singing. I can hear them through the ground.” She points south. “The Warden will open the Rift. Whatever you do in there, come back and tell me.”',
        choices: [
          { label: 'I’m ready.', next: 'close' },
          { label: 'Tell me about the Rift.', next: 'rift' },
          { label: 'I still need a charm.', next: 'charm' },
        ],
      },
    },
  },

  pip: {
    name: 'Pip',
    title: 'A Friendly Imp',
    glyph: 'P',
    color: '#a9c46a',
    root(s) {
      if (s.boons.pip) return 'after';
      if (s.met.includes('pip')) return 'again';
      return 'first';
    },
    nodes: {
      first: {
        text:
          '“You’re not screaming!” The imp is about waist-high and vibrating with the effort of not stealing your boots. “I’m Pip. I’m not going to bite you. Probably. Do you have anything shiny?”',
        choices: [
          { label: 'What are you?', next: 'what' },
          { label: 'You want something shiny?', next: 'deal' },
          { label: 'Shoo.', next: 'shoo' },
        ],
      },
      what: {
        text:
          '“An imp! A small one. The big ones are rude and the demon is worse. I like it here. Mira gives me burnt bits and I give her the shiny things I find. It’s a system.”',
        choices: [
          { label: 'About that shiny thing…', next: 'deal' },
          { label: 'Fair enough.', next: 'close' },
        ],
      },
      deal: {
        text:
          'Pip produces a pebble from somewhere. It is warm. “Lucky pebble. Very lucky. You can have it if you promise not to squish me. Do you promise?”',
        choices: [
          { label: 'I promise.', action: 'give:pip', next: 'given' },
          { label: 'I can’t promise that.', next: 'first' },
        ],
      },
      given: {
        text:
          '“Good! The pebble likes you. It says you make bad decisions but your heart is okay.” Pip pats your boot with great solemnity.',
        lore: {
          id: 'lore-pip',
          title: 'Pip',
          text: 'A small imp with a large opinion of his own luck. The pebble is definitely just a pebble.',
        },
        choices: [{ label: 'Thanks, Pip.', next: 'close' }],
      },
      again: {
        text:
          '“You came back! Did you squish anyone? Don’t answer that. The pebble is listening.”',
        choices: [
          { label: 'About that pebble…', next: 'deal' },
          { label: 'Just saying hello.', next: 'close' },
        ],
      },
      after: {
        text:
          '“The pebble says you’re doing great. It also says you owe it a snack. I don’t make the rules.”',
        choices: [{ label: 'Noted.', next: 'close' }],
      },
      shoo: {
        text:
          'Pip deflates. “Fine. But if you find something shiny, you know where I live. I live here. This is my whole house.”',
        choices: [{ label: 'Goodbye, Pip.', next: 'close' }],
      },
    },
  },

  bran: {
    name: 'Old Bran',
    title: 'Woodsman',
    glyph: 'B',
    color: '#8fbf9f',
    root(s) {
      if (s.boons.bran) return 'after';
      if (s.flags.mossFound) return 'reunion';
      if (s.flags.branQuest) return 'waiting';
      return 'first';
    },
    nodes: {
      first: {
        text:
          '“The trees talk,” says the old man, without turning around. “Mostly about the demon. Some of them miss him, which tells you everything about trees.”',
        choices: [
          { label: 'What demon?', next: 'demon' },
          { label: 'You look like you’ve lost something.', next: 'moss' },
          { label: 'I’ll leave you to it.', next: 'close' },
        ],
      },
      demon: {
        text:
          '“The Greater Demon. It comes through the Rift when the stones are quiet. It is not evil, exactly. It is hungry in a way that has no bottom. The waystones are the only thing that keeps the door polite.”',
        lore: {
          id: 'lore-demon',
          title: 'The Greater Demon',
          text: 'It does not hate you. It simply has an appetite that considers you a course.',
        },
        choices: [
          { label: 'You lost something?', next: 'moss' },
          { label: 'I’ll light the stones.', next: 'close' },
        ],
      },
      moss: {
        text:
          'The woodsman finally turns. His eyes are red at the edges. “My hound. Moss. Went into the trees three nights ago and hasn’t come back. He’s old and he’s deaf and he’s the only thing I’ve got.”',
        choices: [
          { label: 'I’ll find him.', action: 'flag:branQuest', next: 'searching' },
          { label: 'I’m sorry. I can’t.', next: 'close' },
        ],
      },
      searching: {
        text:
          '“West. Past the listening stone, near the old stump. He’ll know you’re not me, so whistle. He likes being scratched behind the ears.” Bran presses a coal into your hand. “For later. When you find him.”',
        choices: [
          { label: 'I’ll bring him home.', next: 'close' },
          { label: 'What’s the coal for?', next: 'reward' },
        ],
      },
      waiting: {
        text:
          '“Any sign?” Bran is pretending to carve something and failing. “West, near the old stump. Try whistling. He’s stubborn, but he’s not gone.”',
        choices: [
          { label: 'I’m still looking.', next: 'close' },
          { label: 'What do I get for finding him?', next: 'reward' },
        ],
      },
      reward: {
        text:
          '“The ember. It’s kept my fire going through worse winters than this. It’ll make your casting bite harder.” He turns the coal over. “Moss first. The ember after.”',
        choices: [
          { label: 'Deal.', next: 'close' },
          { label: 'Tell me about the demon.', next: 'demon' },
        ],
      },
      reunion: {
        text:
          'Bran is on his knees in the grass, holding the hound’s face in both hands and saying nothing at all. Eventually he looks up. “You found him.”',
        choices: [
          { label: 'You promised me an ember.', action: 'give:bran', next: 'given' },
          { label: 'He found me.', next: 'close' },
        ],
      },
      given: {
        text:
          'The coal is heavier than it looks. “It’s yours. Cast like you mean it.” Moss thumps his tail once, which Bran assures you is a formal endorsement.',
        choices: [
          { label: 'Thank you, Bran.', next: 'close' },
          { label: 'I’ll light the stones.', next: 'close' },
        ],
      },
      after: {
        text:
          '“Moss is asleep by the fire. The trees are still talking.” Bran almost smiles. “They like you. That’s not always a compliment.”',
        choices: [
          { label: 'Take care, Bran.', next: 'close' },
        ],
      },
    },
  },

  sable: {
    name: 'Sable',
    title: 'Scavenger of the Ruins',
    glyph: 'S',
    color: '#c78a63',
    root(s) {
      if (s.boons.sable) return 'after';
      if (s.met.includes('sable')) return 'again';
      return 'first';
    },
    nodes: {
      first: {
        text:
          '“Everything out here is salvage,” says the woman on the fallen arch. “Including conversations. Especially conversations. You’re a new one.”',
        choices: [
          { label: 'What are you doing in the ruins?', next: 'ruins' },
          { label: 'Any waystones near here?', next: 'map', action: 'reveal' },
          { label: 'Can you make me faster?', next: 'boots' },
          { label: 'Just looking.', next: 'close' },
        ],
      },
      ruins: {
        text:
          '“Looking for the parts of this place that still work. The ruins are honest — everything is already broken, so nothing can disappoint you. The people are harder.”',
        lore: {
          id: 'lore-ruins',
          title: 'The Old Ruins',
          text: 'A town that made a promise to something it could not name. The arches are still standing. The promise is not.',
        },
        choices: [
          { label: 'Waystones?', next: 'map', action: 'reveal' },
          { label: 'About those boots…', next: 'boots' },
          { label: 'Goodbye.', next: 'close' },
        ],
      },
      map: {
        text:
          '“I marked the three stones on your map. Woods, circle, ruins. They’re all older than the camp and twice as stubborn.” She taps the map. “Touch them in any order. They don’t care about ceremony.”',
        choices: [
          { label: 'About those boots…', next: 'boots' },
          { label: 'Thanks.', next: 'close' },
        ],
      },
      boots: {
        text:
          '“These?” She looks down at her own boots, then at yours. “No. But I have a spare pair. Too many laces. Take them. You’ll move like you owe someone money.”',
        choices: [
          { label: "Take the Scavenger’s Stride.", action: 'give:sable', next: 'given' },
          { label: 'I’ll keep my own boots.', next: 'first' },
        ],
      },
      given: {
        text:
          'The boots fit, which is suspicious. Sable goes back to sorting a bag of hinges. “If you see a brass key out there, it’s mine. Everything is mine.”',
        choices: [{ label: 'Goodbye, Sable.', next: 'close' }],
      },
      again: {
        text:
          '“Back. The ruins are still here. So are the boots, if you changed your mind.”',
        choices: [
          { label: 'Waystones?', next: 'map', action: 'reveal' },
          { label: 'About those boots…', next: 'boots' },
          { label: 'Goodbye.', next: 'close' },
        ],
      },
      after: {
        text:
          '“Those boots look good on you. Don’t tell anyone I said that. I have a reputation.”',
        choices: [{ label: 'Your secret is safe.', next: 'close' }],
      },
    },
  },

  echo: {
    name: 'The Echo',
    title: 'A Voice in the Rune Circle',
    glyph: 'E',
    color: '#7fe7d4',
    root(s) {
      return s.fragments.length > 0 ? 'has' : 'first';
    },
    nodes: {
      first: {
        text:
          'There is no one in the circle. There is a voice, thin as a hair, moving between the stones. “You have not brought a memory. Come back when you have touched one.”',
        choices: [
          { label: 'What are you?', next: 'what' },
          { label: 'What happened here?', next: 'fall' },
          { label: 'I’ll come back.', next: 'close' },
        ],
      },
      has: {
        text:
          'The voice brightens when you enter. “You carry a stone’s memory. It is heavy, isn’t it? Set it down in your mind. I will not take it.”',
        choices: [
          { label: 'What are you?', next: 'what' },
          { label: 'What happened here?', next: 'fall' },
          { label: 'What is the Rift?', next: 'rift' },
          { label: 'Goodbye.', next: 'close' },
        ],
      },
      what: {
        text:
          '“A mage who was too slow. A spell that was too loud. The circle kept the argument, not the person. I am what is left when a memory refuses to be buried.”',
        lore: {
          id: 'lore-echo',
          title: 'The Echo',
          text: 'Not a ghost. A memory with enough momentum to keep speaking.',
        },
        choices: [
          { label: 'What happened here?', next: 'fall' },
          { label: 'What is the Rift?', next: 'rift' },
          { label: 'Back.', next: 'has' },
        ],
      },
      fall: {
        text:
          '“The town made a door and called it a promise. The door opened. The promise did not hold. The stones were raised to remember the difference. Most people forget. The stones do not.”',
        lore: {
          id: 'lore-fall',
          title: 'The Fall',
          text: 'A door, a promise, and a town that learned why you should read the terms.',
        },
        choices: [
          { label: 'What is the Rift?', next: 'rift' },
          { label: 'Back.', next: 'has' },
        ],
      },
      rift: {
        text:
          '“The Rift is the door’s bad habit. It opens for three minutes at a time. The demon comes through because it is lonely, and hunger is the only company it knows. Light the stones and the door learns some manners.”',
        lore: {
          id: 'lore-rift',
          title: 'The Rift',
          text: 'A three-minute door. The demon uses it because no one ever taught it to knock.',
        },
        choices: [
          { label: 'I’ll light the stones.', next: 'close' },
          { label: 'What are you?', next: 'what' },
        ],
      },
    },
  },

  warden: {
    name: 'The Warden',
    title: 'Keeper of the Rift',
    glyph: 'W',
    color: '#ff9b7a',
    root(s) {
      return s.fragments.length >= 3 ? 'ready' : 'waiting';
    },
    nodes: {
      waiting: {
        text:
          'The Warden is a tall shape in a hood, and the hood is full of weather. “Three stones. Three memories. The Rift stays shut until it has heard them all.”',
        choices: [
          { label: 'Where are the stones?', next: 'hints' },
          { label: 'What happens if I open it?', next: 'inside' },
          { label: 'I’ll come back.', next: 'close' },
        ],
      },
      hints: {
        text:
          '“Woods, north-west. Rune circle, north-east. Ruins, south-east. Touch them and listen. The stones do not care about ceremony, only attention.”',
        choices: [
          { label: 'Understood.', next: 'close' },
          { label: 'What waits inside?', next: 'inside' },
        ],
      },
      ready: {
        text:
          'The Warden turns. The hood keeps raining, quietly. “You carry the whole song. The Rift will open for you, and it will try to keep you. Three minutes. The demon at the half. Do not be late.”',
        choices: [
          { label: 'Open the Rift.', action: 'run', next: 'close' },
          { label: 'What waits inside?', next: 'inside' },
          { label: 'Not yet.', next: 'close' },
        ],
      },
      inside: {
        text:
          '“A field of teeth and shards. Three minutes of it. The demon is not the worst thing in there — the worst thing is how much you will want to stay.”',
        lore: {
          id: 'lore-warden',
          title: 'The Warden',
          text: 'The Warden does not open the Rift. It reminds the Rift what it is for.',
        },
        choices: [
          { label: 'Open the Rift.', action: 'run', next: 'close' },
          { label: 'Not yet.', next: 'close' },
        ],
      },
    },
  },

  moss: {
    name: 'Moss',
    title: 'A Very Good Hound',
    glyph: 'M',
    color: '#b9a37a',
    root(s) {
      return s.flags.mossFound ? 'found' : 'first';
    },
    nodes: {
      first: {
        text:
          'A scruffy hound is wedged under a root, pretending this was the plan all along. He thumps his tail once and does not get up.',
        choices: [
          { label: 'Whistle.', next: 'whistle' },
          { label: 'Scratch behind the ears.', action: 'flag:mossFound', next: 'found' },
          { label: 'Leave him be.', next: 'close' },
        ],
      },
      whistle: {
        text:
          'One ear comes up. Then the other. He sneezes, offended by the concept of being called.',
        choices: [
          { label: 'Scratch behind the ears.', action: 'flag:mossFound', next: 'found' },
          { label: 'Leave him be.', next: 'close' },
        ],
      },
      found: {
        text:
          'Moss leans his entire weight against your leg. He smells of wet leaves and terrible decisions. “He’ll follow you back to Bran,” says a voice in your head, which you decide not to examine.',
        lore: {
          id: 'lore-moss',
          title: 'Moss',
          text: 'Old, deaf, and absolutely certain he is helping. Bran’s entire world, on four legs.',
        },
        choices: [{ label: 'Come on, Moss.', next: 'close' }],
      },
    },
  },
};

// The waystones and chests talk too, in their own way.
for (const stone of WAYSTONES) {
  SPEAKERS[stone.id] = {
    name: stone.name,
    title: 'A Waystone',
    glyph: '◈',
    color: stone.color,
    root: (s) => (s.fragments.includes(stone.id) ? 'taken' : 'first'),
    nodes: {
      first: {
        text: stone.text,
        lore: stone.lore,
        choices: [
          { label: 'Take the fragment.', action: `fragment:${stone.id}`, next: 'taken' },
          { label: 'Step back.', next: 'close' },
        ],
      },
      taken: {
        text:
          'The stone is quiet now, the way a room is quiet after everyone has said what they needed to say. Its memory is yours.',
        choices: [{ label: 'Leave.', next: 'close' }],
      },
    },
  };
}

for (const chest of CHESTS) {
  SPEAKERS[chest.id] = {
    name: chest.name,
    title: 'Half-buried',
    glyph: '▣',
    color: '#c78a63',
    root: (s) => (s.chests.includes(chest.id) ? 'opened' : 'first'),
    nodes: {
      first: {
        text: chest.text,
        choices: [
          { label: 'Open it.', action: `chest:${chest.id}`, next: 'opened' },
          { label: 'Leave it for someone else.', next: 'close' },
        ],
      },
      opened: {
        text:
          'Inside: a handful of old coins, a button, and a folded map of somewhere that is not here. You pocket the loot — 250 pieces of it — and leave the button.',
        lore: chest.lore,
        choices: [{ label: 'Close the lid.', next: 'close' }],
      },
    },
  };
}

export const SPEAKER_LIST = Object.values(SPEAKERS);

export function speakerFor(id) {
  return SPEAKERS[id] ?? null;
}

export function rootNodeId(speaker, state) {
  if (!speaker) return null;
  return typeof speaker.root === 'function' ? speaker.root(state) : speaker.root;
}

export function areaAt(x, y) {
  return (AREAS.find((area) => area.test(x, y)) ?? AREAS[AREAS.length - 1]).name;
}
