// Ordinary wild areas the map scraper drops because they are not towns or
// numbered routes: caves, forests, tunnels, ruins and similar landmarks.
// Shared by `generate-regions.cjs` (merged into `POST_AREAS`, so a fresh
// generation agrees) and `apply-ordinary-areas.cjs` (which writes them onto the
// committed data without a regeneration).
//
// Each entry carries:
//   node       location id suffix; the region id is prepended by the consumer
//   name       display name
//   connects   existing location ids the area links to (its level band is the
//              average of their first wild level)
//   position   0-100 map coordinates, hand-picked to sit beside its connects
//              without overlapping a town/route
//   species    curated wild table (kept small; no generation slice)
//
// The species are all native to the area and already present in
// pokemon-species.json; validate-data.mjs checks them.

module.exports = {
  ORDINARY_AREAS: {
    johto: [
      {
        node: 'ilex-forest',
        name: 'Ilex Forest',
        connects: ['johto-azalea-town', 'johto-route-34'],
        position: { x: 31.9, y: 66.8 },
        species: ['caterpie', 'metapod', 'weedle', 'kakuna', 'paras', 'oddish', 'pineco', 'heracross'],
      },
      {
        node: 'union-cave',
        name: 'Union Cave',
        connects: ['johto-route-32', 'johto-route-33'],
        position: { x: 46.2, y: 67.3 },
        species: ['zubat', 'geodude', 'sandshrew', 'rattata', 'onix', 'wooper', 'lapras'],
      },
      {
        node: 'ruins-of-alph',
        name: 'Ruins of Alph',
        connects: ['johto-route-32', 'johto-violet-city'],
        position: { x: 53.1, y: 52.6 },
        species: ['unown', 'natu', 'wooper', 'smeargle'],
      },
      {
        node: 'dark-cave',
        name: 'Dark Cave',
        connects: ['johto-route-31', 'johto-route-45'],
        position: { x: 59.6, y: 41 },
        species: ['zubat', 'geodude', 'machop', 'teddiursa', 'wobbuffet'],
      },
      {
        node: 'slowpoke-well',
        name: 'Slowpoke Well',
        connects: ['johto-azalea-town', 'johto-route-33'],
        position: { x: 39.1, y: 78.6 },
        species: ['slowpoke', 'zubat', 'rattata', 'geodude'],
      },
      {
        node: 'ice-path',
        name: 'Ice Path',
        connects: ['johto-route-44', 'johto-blackthorn-city'],
        position: { x: 73.9, y: 21.6 },
        species: ['swinub', 'piloswine', 'delibird', 'sneasel', 'zubat', 'golbat'],
      },
      {
        node: 'dragons-den',
        name: "Dragon's Den",
        connects: ['johto-blackthorn-city', 'johto-route-45'],
        position: { x: 74.1, y: 32.8 },
        species: ['magikarp', 'dratini', 'dragonair', 'wooper'],
      },
    ],
    hoenn: [
      {
        node: 'granite-cave',
        name: 'Granite Cave',
        connects: ['hoenn-dewford-town', 'hoenn-route-106'],
        position: { x: 4.8, y: 80.1 },
        species: ['zubat', 'geodude', 'makuhita', 'aron', 'abra', 'sableye', 'nosepass'],
      },
      {
        node: 'meteor-falls',
        name: 'Meteor Falls',
        connects: ['hoenn-fallarbor-town', 'hoenn-route-114'],
        position: { x: 13.8, y: 31.6 },
        species: ['zubat', 'golbat', 'solrock', 'lunatone', 'bagon', 'clefairy', 'machop'],
      },
      {
        node: 'shoal-cave',
        name: 'Shoal Cave',
        connects: ['hoenn-route-125', 'hoenn-route-127'],
        position: { x: 95.3, y: 44.1 },
        species: ['spheal', 'snorunt', 'sealeo', 'zubat', 'golbat'],
      },
      {
        node: 'seafloor-cavern',
        name: 'Seafloor Cavern',
        connects: ['hoenn-route-128'],
        position: { x: 84, y: 51.6 },
        species: ['zubat', 'golbat', 'magikarp', 'tentacool'],
      },
      {
        node: 'sky-pillar',
        name: 'Sky Pillar',
        connects: ['hoenn-pacifidlog-town', 'hoenn-route-131'],
        position: { x: 68.2, y: 68.6 },
        species: ['golbat', 'sableye', 'duskull', 'dusclops', 'chimecho', 'claydol'],
      },
      {
        node: 'new-mauville',
        name: 'New Mauville',
        connects: ['hoenn-mauville-city', 'hoenn-route-110'],
        position: { x: 36.1, y: 51.9 },
        species: ['voltorb', 'magnemite'],
      },
    ],
    sinnoh: [
      {
        node: 'eterna-forest',
        name: 'Eterna Forest',
        connects: ['sinnoh-eterna-city', 'sinnoh-route-205'],
        position: { x: 23.1, y: 39.6 },
        species: ['buneary', 'budew', 'wurmple', 'silcoon', 'cascoon', 'bidoof', 'murkrow', 'misdreavus', 'abra'],
      },
      {
        node: 'mt-coronet',
        name: 'Mt. Coronet',
        connects: ['sinnoh-route-207', 'sinnoh-route-211'],
        position: { x: 35.3, y: 55.4 },
        species: ['zubat', 'geodude', 'machop', 'meditite', 'chingling', 'bronzor', 'sneasel', 'abra'],
      },
      {
        node: 'oreburgh-gate',
        name: 'Oreburgh Gate',
        connects: ['sinnoh-oreburgh-city', 'sinnoh-route-207'],
        position: { x: 28.3, y: 54 },
        species: ['zubat', 'geodude', 'machop', 'psyduck'],
      },
      {
        node: 'wayward-cave',
        name: 'Wayward Cave',
        connects: ['sinnoh-route-206', 'sinnoh-route-207'],
        position: { x: 31.1, y: 32.6 },
        species: ['zubat', 'geodude', 'machop', 'bronzor', 'gible'],
      },
      {
        node: 'solaceon-ruins',
        name: 'Solaceon Ruins',
        connects: ['sinnoh-solaceon-town', 'sinnoh-route-210'],
        position: { x: 58.5, y: 39.7 },
        species: ['unown', 'geodude', 'bronzor', 'meditite'],
      },
      {
        node: 'iron-island',
        name: 'Iron Island',
        connects: ['sinnoh-canalave-city', 'sinnoh-route-218'],
        position: { x: 5.9, y: 63.6 },
        species: ['zubat', 'geodude', 'onix', 'machop', 'sneasel'],
      },
      {
        node: 'snowpoint-temple',
        name: 'Snowpoint Temple',
        connects: ['sinnoh-snowpoint-city', 'sinnoh-route-217'],
        position: { x: 32.6, y: 16.3 },
        species: ['sneasel', 'snorunt', 'snover', 'golbat', 'bronzor'],
      },
      {
        node: 'stark-mountain',
        name: 'Stark Mountain',
        connects: ['sinnoh-route-227', 'sinnoh-route-228'],
        position: { x: 84, y: 13.3 },
        species: ['numel', 'slugma', 'magcargo', 'rhyhorn', 'skarmory'],
      },
    ],
    unova: [
      {
        node: 'pinwheel-forest',
        name: 'Pinwheel Forest',
        connects: ['unova-nacrene-city', 'unova-route-3'],
        position: { x: 80.8, y: 69.4 },
        species: ['sewaddle', 'pidove', 'tympole', 'venipede', 'cottonee', 'petilil', 'pansage', 'pansear', 'panpour'],
      },
      {
        node: 'chargestone-cave',
        name: 'Chargestone Cave',
        connects: ['unova-route-6', 'unova-mistralton-city'],
        position: { x: 16, y: 50.7 },
        species: ['joltik', 'ferroseed', 'klink', 'drilbur', 'roggenrola', 'nosepass', 'tynamo'],
      },
      {
        node: 'wellspring-cave',
        name: 'Wellspring Cave',
        connects: ['unova-route-3', 'unova-nacrene-city'],
        position: { x: 80.8, y: 57.4 },
        species: ['roggenrola', 'woobat', 'drilbur', 'tympole'],
      },
      {
        node: 'twist-mountain',
        name: 'Twist Mountain',
        connects: ['unova-icirrus-city', 'unova-route-7'],
        position: { x: 26.7, y: 42.3 },
        species: ['roggenrola', 'woobat', 'timburr', 'drilbur', 'cubchoo'],
      },
      {
        node: 'dragonspiral-tower',
        name: 'Dragonspiral Tower',
        connects: ['unova-route-8', 'unova-icirrus-city'],
        position: { x: 33.9, y: 37.1 },
        species: ['gothita', 'solosis', 'deino', 'golett', 'litwick'],
      },
      {
        node: 'relic-castle',
        name: 'Relic Castle',
        connects: ['unova-route-4', 'unova-nimbasa-city'],
        position: { x: 45.1, y: 55.7 },
        species: ['sandile', 'darumaka', 'yamask', 'sigilyph'],
      },
      {
        node: 'giant-chasm',
        name: 'Giant Chasm',
        connects: ['unova-route-13', 'unova-undella-town'],
        position: { x: 94.8, y: 41.8 },
        species: ['woobat', 'boldore', 'piloswine', 'vanillish', 'metang', 'absol'],
      },
    ],
    kalos: [
      {
        node: 'santalune-forest',
        name: 'Santalune Forest',
        connects: ['kalos-santalune-city', 'kalos-route-2'],
        position: { x: 65.7, y: 48.4 },
        species: ['scatterbug', 'pikachu', 'caterpie', 'weedle', 'pansage', 'pansear', 'panpour', 'fletchling'],
      },
      {
        node: 'connecting-cave',
        name: 'Connecting Cave',
        connects: ['kalos-route-7', 'kalos-route-8'],
        position: { x: 28.9, y: 60.5 },
        species: ['zubat', 'roselia', 'meditite', 'whismur', 'axew', 'litleo'],
      },
      {
        node: 'glittering-cave',
        name: 'Glittering Cave',
        connects: ['kalos-route-8', 'kalos-ambrette-town'],
        position: { x: 14.6, y: 62.8 },
        species: ['zubat', 'roggenrola', 'machop', 'meditite', 'onix'],
      },
      {
        node: 'reflection-cave',
        name: 'Reflection Cave',
        connects: ['kalos-route-10', 'kalos-geosenge-town'],
        position: { x: 5.5, y: 56 },
        species: ['zubat', 'roggenrola', 'meditite', 'carbink'],
      },
      {
        node: 'terminus-cave',
        name: 'Terminus Cave',
        connects: ['kalos-route-18', 'kalos-anistar-city'],
        position: { x: 83.6, y: 33.9 },
        species: ['geodude', 'graveler', 'durant', 'linoone'],
      },
      {
        node: 'frost-cavern',
        name: 'Frost Cavern',
        connects: ['kalos-route-17', 'kalos-dendemille-town'],
        position: { x: 73.9, y: 42.6 },
        species: ['snover', 'sneasel', 'vanillite', 'bergmite', 'cubchoo'],
      },
    ],
    alola: [
      {
        node: 'verdant-cavern',
        name: 'Verdant Cavern',
        connects: ['alola-melemele-island'],
        position: { x: 27.5, y: 10.3 },
        species: ['caterpie', 'grubbin', 'rattata', 'zubat', 'diglett', 'a-rattata', 'a-diglett'],
      },
      {
        node: 'wela-volcano-park',
        name: 'Wela Volcano Park',
        connects: ['alola-akala-island'],
        position: { x: 86.1, y: 15.1 },
        species: ['cubone', 'salandit', 'kangaskhan', 'fletchling', 'growlithe'],
      },
      {
        node: 'lush-jungle',
        name: 'Lush Jungle',
        connects: ['alola-akala-island'],
        position: { x: 92.1, y: 15.1 },
        species: ['caterpie', 'comfey', 'fomantis', 'oranguru', 'passimian', 'pikipek'],
      },
      {
        node: 'vast-poni-canyon',
        name: 'Vast Poni Canyon',
        connects: ['alola-poni-island'],
        position: { x: 29, y: 68 },
        species: ['mudbray', 'rockruff', 'boldore', 'gible'],
      },
      {
        node: 'mount-lanakila',
        name: 'Mount Lanakila',
        connects: ['alola-ulaula-island'],
        position: { x: 78, y: 68 },
        species: ['sneasel', 'snorunt', 'absol', 'golbat', 'sandshrew'],
      },
    ],
    galar: [
      {
        node: 'mine-no-2',
        name: 'Galar Mine No. 2',
        connects: ['galar-route-6', 'galar-stow-on-side'],
        position: { x: 32.1, y: 55.8 },
        species: ['g-meowth', 'g-corsola', 'chewtle', 'croagunk', 'scraggy', 'noibat', 'rolycoly', 'silicobra', 'g-stunfisk'],
      },
      {
        node: 'watchtower-ruins',
        name: 'Watchtower Ruins',
        connects: ['galar-wild-area'],
        position: { x: 60.5, y: 52.9 },
        species: ['rookidee', 'skwovet', 'g-zigzagoon', 'nickit', 'gossifleur', 'g-yamask'],
      },
    ],
    paldea: [
      {
        node: 'inlet-grotto',
        name: 'Inlet Grotto',
        connects: ['paldea-south-province'],
        position: { x: 33.5, y: 87.5 },
        species: ['lechonk', 'pawmi', 'tarountula', 'nymble', 'flamigo', 'scatterbug'],
      },
      {
        node: 'alfornada-cavern',
        name: 'Alfornada Cavern',
        connects: ['paldea-alfornada'],
        position: { x: 22.3, y: 79.8 },
        species: ['nacli', 'meditite', 'gible', 'dunsparce', 'teddiursa', 'zorua'],
      },
      {
        node: 'casseroya-lake',
        name: 'Casseroya Lake',
        connects: ['paldea-cascarrafa', 'paldea-medali'],
        position: { x: 36.9, y: 47.3 },
        species: ['magikarp', 'dondozo', 'tatsugiri', 'veluza'],
      },
      {
        node: 'glaseado-mountain',
        name: 'Glaseado Mountain',
        connects: ['paldea-montenevera', 'paldea-zapapico'],
        position: { x: 58.1, y: 32 },
        species: ['sneasel', 'snover', 'cetoddle', 'frigibax', 'nacli'],
      },
      {
        node: 'socarrat-trail',
        name: 'Socarrat Trail',
        connects: ['paldea-cascarrafa', 'paldea-porto-marinada'],
        position: { x: 20.1, y: 45.4 },
        species: ['flamigo', 'bombirdier', 'nacli', 'capsakid', 'numel'],
      },
    ],
  },
}
