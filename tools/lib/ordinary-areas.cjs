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
    ],
  },
}
