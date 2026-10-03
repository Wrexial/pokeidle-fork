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
// The first entries are Galar's Wild Area, which shipped with only three of its
// habitats (#28b/#36).

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
  },
}
