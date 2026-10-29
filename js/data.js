/* Static game content: trash types, areas and upgrades. */
window.GameData = {
  trash: {
    paper:     { value: 1 },
    banana:    { value: 1 },
    can:       { value: 2 },
    bottle:    { value: 3 },
    cup:       { value: 2 },
    bag:       { value: 2 },
    net:       { value: 5 },
    box:       { value: 4 },
    tire:      { value: 8 },
    barrel:    { value: 12 },
    scrap:     { value: 6 },
    bolt:      { value: 5 },
    panel:     { value: 10 },
    satellite: { value: 30 },
  },

  zones: [
    {
      id: 'park', name: 'City Park', icon: '\u{1F333}', cost: 0, mult: 1,
      ground: ['#86c96f', '#7dc066'], edge: '#4f8a3e', line: '#3f7531',
      depot: '#2e9e5b',
      decor: { flower: 45, bush: 22, tree: 20, bench: 5 },
      trash: [['paper', 4], ['can', 3], ['banana', 3], ['bottle', 2]],
    },
    {
      id: 'beach', name: 'Sunny Beach', icon: '\u{1F3D6}\u{FE0F}', cost: 2000, mult: 5,
      ground: ['#f3dc9b', '#eed38c'], edge: '#3fa7d6', line: '#e6c370',
      depot: '#1e88c9',
      decor: { shell: 35, starfish: 14, palm: 14, umbrella: 9 },
      trash: [['bottle', 4], ['bag', 3], ['cup', 3], ['net', 2]],
    },
    {
      id: 'city', name: 'Downtown', icon: '\u{1F3D9}\u{FE0F}', cost: 40000, mult: 30,
      ground: ['#a7afb8', '#9ea6af'], edge: '#5d646c', line: '#4f555c',
      depot: '#7a4fc9',
      decor: { crack: 24, manhole: 10, cone: 12, hydrant: 9, lamp: 16 },
      trash: [['box', 4], ['bag', 3], ['can', 3], ['tire', 2]],
    },
    {
      id: 'factory', name: 'Old Factory', icon: '\u{1F3ED}', cost: 900000, mult: 200,
      ground: ['#8f8472', '#877c6a'], edge: '#4a4236', line: '#3d362c',
      depot: '#c9542e',
      decor: { puddle: 18, crack: 16, crate: 14, cone: 8, pipe: 8 },
      trash: [['scrap', 4], ['barrel', 3], ['tire', 3], ['box', 2]],
    },
    {
      id: 'space', name: 'Orbit Station', icon: '\u{1F680}', cost: 25000000, mult: 1500,
      ground: ['#2d3352', '#282d4a'], edge: '#0b0d1a', line: '#5a6bd6',
      depot: '#2bb3a6',
      decor: { star: 90, crater: 14, light: 12 },
      trash: [['bolt', 4], ['panel', 3], ['scrap', 2], ['satellite', 1]],
    },
  ],

  upgrades: [
    { id: 'speed',    name: 'Running Shoes',  icon: '\u{1F45F}', desc: 'Move faster',                   base: 15,  growth: 1.5,  max: 25 },
    { id: 'capacity', name: 'Bigger Bag',     icon: '\u{1F392}', desc: 'Carry more trash per trip',     base: 20,  growth: 1.55, max: 40 },
    { id: 'magnet',   name: 'Trash Magnet',   icon: '\u{1F9F2}', desc: 'Grab trash from farther away',  base: 35,  growth: 1.6,  max: 25 },
    { id: 'value',    name: 'Recycling Tech', icon: '\u{267B}\u{FE0F}', desc: 'Earn more for every item', base: 60,  growth: 1.65, max: 50 },
    { id: 'spawn',    name: 'Litter Radar',   icon: '\u{1F4E1}', desc: 'More trash appears, faster',    base: 45,  growth: 1.6,  max: 25 },
    { id: 'bots',     name: 'Helper Bots',    icon: '\u{1F916}', desc: 'Bots collect trash for you',    base: 250, growth: 2.6,  max: 8 },
    { id: 'botlvl',   name: 'Bot Upgrades',   icon: '\u{1F527}', desc: 'Bots carry more & move faster', base: 400, growth: 1.8,  max: 30, requires: 'bots' },
  ],
};
