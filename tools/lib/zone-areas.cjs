// Extra sub-areas for an existing `type: 'zone'` hub. Kept in a shared table so
// `generate-regions.cjs` (which merges them into the matching `ZONES` entry) and
// `apply-zone-areas.cjs` (which writes them onto the committed data) agree.
//
// Keyed by the fully-qualified hub location id. Each entry is a zone sub-area:
//
//   node       location id suffix; the region id is prepended by the consumer
//   name       display name
//   position   0-100 map coordinates (sub-areas are hidden from the Town Map,
//              but the data is ready for a zoomed-in area map, see #60)
//   species    curated wild table (topped up with the region's wider pool by
//              the route-variety pass)
//
// The Galar Wild Area and the four DLC zones ship with only three habitats
// each; the rest of their real areas are listed here (#28b/#36).

module.exports = {
  ZONE_AREAS: {
    'galar-wild-area': [
      {
        node: 'wild-area-stony-wilderness',
        name: 'Stony Wilderness',
        position: { x: 48, y: 60 },
        species: ['rolycoly', 'silicobra', 'cufant', 'stonjourner', 'g-meowth', "g-farfetch'd", 'hippopotas', 'rhyhorn'],
      },
      {
        node: 'wild-area-north-lake-miloch',
        name: 'North Lake Miloch',
        position: { x: 49, y: 54 },
        species: ['wooloo', 'skwovet', 'nickit', 'g-zigzagoon', 'gossifleur', 'blipbug'],
      },
      {
        node: 'wild-area-bridge-field',
        name: 'Bridge Field',
        position: { x: 50, y: 58 },
        species: ['rolycoly', 'g-yamask', 'g-corsola', 'g-darumaka', 'g-stunfisk', 'hippopotas'],
      },
      {
        node: 'wild-area-dusty-bowl',
        name: 'Dusty Bowl',
        position: { x: 44, y: 52 },
        species: ['hippopotas', 'rhyhorn', 'g-darumaka', 'g-stunfisk', 'g-ponyta', 'swinub'],
      },
      {
        node: 'wild-area-giants-seat',
        name: "Giant's Seat",
        position: { x: 56, y: 57 },
        species: ['rolycoly', 'cufant', 'stonjourner', 'g-meowth', 'g-corsola', 'g-yamask', 'silicobra'],
      },
      {
        node: 'wild-area-hammerlocke-hills',
        name: 'Hammerlocke Hills',
        position: { x: 55, y: 52 },
        species: ['rolycoly', 'g-meowth', 'g-ponyta', 'hippopotas', 'rhyhorn', 'cufant'],
      },
      {
        node: 'wild-area-lake-of-outrage',
        name: 'Lake of Outrage',
        position: { x: 57, y: 50 },
        species: ['deino', 'goomy', 'jangmo-o', 'dreepy', 'larvitar'],
      },
      {
        node: 'wild-area-east-lake-axewell',
        name: 'East Lake Axewell',
        position: { x: 54, y: 60 },
        species: ['blipbug', 'rolycoly', 'gossifleur', 'g-zigzagoon', 'nickit', 'skwovet'],
      },
    ],
    'galar-isle-of-armor': [
      {
        node: 'isle-of-armor-forest-of-focus',
        name: 'Forest of Focus',
        position: { x: 68, y: 63 },
        species: ['gossifleur', 'blipbug', 'applin', 'g-slowpoke', 'g-mr. mime', 'hatenna', 'impidimp'],
      },
      {
        node: 'isle-of-armor-challenge-beach',
        name: 'Challenge Beach',
        position: { x: 72, y: 61 },
        species: ['chewtle', 'arrokuda', 'wingull', 'g-slowpoke', 'g-mr. mime'],
      },
      {
        node: 'isle-of-armor-loop-lagoon',
        name: 'Loop Lagoon',
        position: { x: 67, y: 58 },
        species: ['chewtle', 'arrokuda', 'pincurchin', 'clobbopus', 'g-slowpoke'],
      },
      {
        node: 'isle-of-armor-potbottom-desert',
        name: 'Potbottom Desert',
        position: { x: 71, y: 64 },
        species: ["g-farfetch'd", 'g-darumaka', 'g-stunfisk', 'silicobra', 'rolycoly', 'cufant'],
      },
      {
        node: 'isle-of-armor-training-lowlands',
        name: 'Training Lowlands',
        position: { x: 73, y: 60 },
        species: ['falinks', 'g-meowth', 'g-mr. mime', 'g-slowpoke', 'blipbug'],
      },
      {
        node: 'isle-of-armor-workout-sea',
        name: 'Workout Sea',
        position: { x: 66, y: 60 },
        species: ['arrokuda', 'chewtle', 'clobbopus', 'pincurchin', 'g-slowpoke'],
      },
    ],
    'galar-crown-tundra': [
      {
        node: 'crown-tundra-slippery-slope',
        name: 'Slippery Slope',
        position: { x: 58, y: 9 },
        species: ['snom', 'h-sneasel', 'snover', 'swinub', 'g-darumaka'],
      },
      {
        node: 'crown-tundra-frostpoint-field',
        name: 'Frostpoint Field',
        position: { x: 61, y: 9 },
        species: ['snom', 'g-darumaka', 'g-stunfisk', 'swinub', 'morpeko'],
      },
      {
        node: 'crown-tundra-old-cemetery',
        name: 'Old Cemetery',
        position: { x: 60, y: 15 },
        species: ['gastly', 'g-yamask', 'drifloon', 'duskull'],
      },
      {
        node: 'crown-tundra-giants-foot',
        name: "Giant's Foot",
        position: { x: 56, y: 12 },
        species: ['stonjourner', 'cufant', 'rolycoly', 'g-stunfisk', 'h-sneasel'],
      },
      {
        node: 'crown-tundra-roaring-sea-caves',
        name: 'Roaring-Sea Caves',
        position: { x: 63, y: 10 },
        species: ['h-sneasel', 'g-stunfisk', 'rolycoly', 'cufant'],
      },
      {
        node: 'crown-tundra-ballimere-lake',
        name: 'Ballimere Lake',
        position: { x: 62, y: 16 },
        species: ['magikarp', 'g-slowpoke', 'basculin-w', 'arrokuda', 'g-corsola'],
      },
      {
        node: 'crown-tundra-three-point-pass',
        name: 'Three-Point Pass',
        position: { x: 57, y: 16 },
        species: ['stonjourner', 'cufant', 'rolycoly', 'g-stunfisk', 'h-sneasel'],
      },
    ],
    'paldea-kitakami': [
      {
        node: 'kitakami-wistful-fields',
        name: 'Wistful Fields',
        position: { x: 4, y: 2 },
        species: ['nymble', 'tarountula', 'fidough', 'applin', 'poltchageist'],
      },
      {
        node: 'kitakami-fellhorn-gorge',
        name: 'Fellhorn Gorge',
        position: { x: 7, y: 5 },
        species: ['nacli', 'charcadet', 'frigibax', 'tadbulb', 'nymble'],
      },
      {
        node: 'kitakami-crystal-pool',
        name: 'Crystal Pool',
        position: { x: 8, y: 6 },
        species: ['poltchageist', 'applin', 'tadbulb', 'magikarp'],
      },
      {
        node: 'kitakami-timeless-woods',
        name: 'Timeless Woods',
        position: { x: 4, y: 7 },
        species: ['applin', 'poltchageist', 'seedot', 'shroomish'],
      },
      {
        node: 'kitakami-paradise-barrens',
        name: 'Paradise Barrens',
        position: { x: 10, y: 4 },
        species: ['nacli', 'charcadet', 'tadbulb', 'numel'],
      },
      {
        node: 'kitakami-infernal-pass',
        name: 'Infernal Pass',
        position: { x: 6, y: 8 },
        species: ['charcadet', 'nacli', 'frigibax', 'tadbulb'],
      },
    ],
    'paldea-terarium': [
      {
        node: 'terarium-canyon-biome',
        name: 'Canyon Biome',
        position: { x: 94, y: 25 },
        species: ['nacli', 'meditite', 'gible', 'rolycoly', 'rockruff'],
      },
      {
        node: 'terarium-chargestone-cavern',
        name: 'Chargestone Cavern',
        position: { x: 98, y: 21 },
        species: ['joltik', 'tynamo', 'magnemite', 'klink'],
      },
      {
        node: 'terarium-torchlit-labyrinth',
        name: 'Torchlit Labyrinth',
        position: { x: 98, y: 24 },
        species: ['zubat', 'houndour', 'litwick', 'golett'],
      },
      {
        node: 'terarium-central-plaza',
        name: 'Central Plaza',
        position: { x: 96, y: 21 },
        species: ['eevee', 'minccino', 'pachirisu'],
      },
    ],
  },
}
