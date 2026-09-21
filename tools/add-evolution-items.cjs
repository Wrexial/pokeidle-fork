#!/usr/bin/env node
/**
 * Give evolution items a purpose.
 *
 * The original data recorded every evolution as a level-up, so the stones and
 * Link Cable sold in the Reward Shop did nothing. This rewrites the evolutions
 * that canonically use an item so they consume it instead: stones (Fire, Water,
 * Thunder, Leaf, Moon, Sun, Dusk, Shiny, Dawn, Ice, Oval), the trade-only
 * evolutions (Link Cable) and the held-item trade evolutions (King's Rock,
 * Metal Coat, Protector, ...).
 *
 * Each entry becomes `{ into, item }` (no `level`); the party panel already
 * requires the item to be owned and consumes it on use. Idempotent; missing
 * targets (Appletun, Ceruledge) are added, and duplicate evolutions repaired.
 *
 * Writes public/data/evolution-data.json.
 *
 * Usage: node tools/add-evolution-items.cjs
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
const evoPath = path.join(DATA, 'evolution-data.json')
const evolutionData = JSON.parse(fs.readFileSync(evoPath, 'utf8'))

/** @type {Record<string, Record<string, string[]>>} */
const ITEM_EVOLUTIONS = {
  // --- elemental stones -----------------------------------------------------
  fireStone: {
    vulpix: ['ninetales'],
    growlithe: ['arcanine'],
    'h-growlithe': ['h-arcanine'],
    pansear: ['simisear'],
    eevee: ['flareon'],
  },
  waterStone: {
    poliwhirl: ['poliwrath'],
    shellder: ['cloyster'],
    staryu: ['starmie'],
    lombre: ['ludicolo'],
    panpour: ['simipour'],
    eevee: ['vaporeon'],
  },
  thunderStone: {
    pikachu: ['raichu', 'a-raichu'],
    eelektrik: ['eelektross'],
    charjabug: ['vikavolt'],
    eevee: ['jolteon'],
  },
  leafStone: {
    gloom: ['vileplume'],
    weepinbell: ['victreebel'],
    exeggcute: ['exeggutor', 'a-exeggutor'],
    nuzleaf: ['shiftry'],
    pansage: ['simisage'],
    eevee: ['leafeon'],
  },
  moonStone: {
    nidorina: ['nidoqueen'],
    nidorino: ['nidoking'],
    clefairy: ['clefable'],
    jigglypuff: ['wigglytuff'],
    skitty: ['delcatty'],
    munna: ['musharna'],
  },
  sunStone: {
    gloom: ['bellossom'],
    sunkern: ['sunflora'],
    cottonee: ['whimsicott'],
    petilil: ['lilligant', 'h-lilligant'],
    helioptile: ['heliolisk'],
  },
  duskStone: {
    murkrow: ['honchkrow'],
    misdreavus: ['mismagius'],
    lampent: ['chandelure'],
    doublade: ['aegislash'],
  },
  shinyStone: {
    togetic: ['togekiss'],
    roselia: ['roserade'],
    minccino: ['cinccino'],
    floette: ['florges'],
  },
  dawnStone: {
    kirlia: ['gallade'],
    snorunt: ['froslass'],
  },
  iceStone: {
    'a-vulpix': ['a-ninetales'],
    'a-sandshrew': ['a-sandslash'],
    eevee: ['glaceon'],
    crabrawler: ['crabominable'],
  },
  ovalStone: {
    happiny: ['chansey'],
  },
  // --- trade evolutions -----------------------------------------------------
  linkCable: {
    kadabra: ['alakazam'],
    machoke: ['machamp'],
    graveler: ['golem'],
    'a-graveler': ['a-golem'],
    haunter: ['gengar'],
    boldore: ['gigalith'],
    gurdurr: ['conkeldurr'],
    phantump: ['trevenant'],
    pumpkaboo: ['gourgeist'],
    karrablast: ['escavalier'],
    shelmet: ['accelgor'],
  },
  // --- held-item "trade" evolutions -----------------------------------------
  kingsRock: {
    poliwhirl: ['politoed'],
    slowpoke: ['slowking'],
  },
  metalCoat: {
    onix: ['steelix'],
    scyther: ['scizor'],
  },
  dragonScale: {
    seadra: ['kingdra'],
  },
  upgrade: {
    porygon: ['porygon2'],
  },
  dubiousDisc: {
    porygon2: ['porygon-z'],
  },
  protector: {
    rhydon: ['rhyperior'],
  },
  electirizer: {
    electabuzz: ['electivire'],
  },
  magmarizer: {
    magmar: ['magmortar'],
  },
  razorClaw: {
    sneasel: ['weavile'],
    'h-sneasel': ['sneasler'],
  },
  razorFang: {
    gligar: ['gliscor'],
  },
  reaperCloth: {
    dusclops: ['dusknoir'],
  },
  deepSeaTooth: {
    clamperl: ['huntail'],
  },
  deepSeaScale: {
    clamperl: ['gorebyss'],
  },
  sachet: {
    spritzee: ['aromatisse'],
  },
  whippedDream: {
    swirlix: ['slurpuff'],
  },
  // --- modern items ---------------------------------------------------------
  sweetApple: {
    applin: ['appletun'],
  },
  tartApple: {
    applin: ['flapple'],
  },
  crackedPot: {
    sinistea: ['polteageist'],
  },
  strawberrySweet: {
    milcery: ['alcremie'],
  },
  galaricaCuff: {
    'g-slowpoke': ['g-slowbro'],
  },
  galaricaWreath: {
    'g-slowpoke': ['g-slowking'],
  },
  auspiciousArmor: {
    charcadet: ['armarouge'],
  },
  maliciousArmor: {
    charcadet: ['ceruledge'],
  },
}

let changed = 0
let removed = 0

// Repair duplicate targets (Applin listed Flapple twice, etc.).
for (const [from, evolutions] of Object.entries(evolutionData)) {
  const seen = new Set(),
    unique = evolutions.filter((evolution) => {
      if (seen.has(evolution.into)) return false
      seen.add(evolution.into)
      return true
    })
  if (unique.length !== evolutions.length) {
    removed += evolutions.length - unique.length
    evolutionData[from] = unique
  }
}

for (const [itemId, bySpecies] of Object.entries(ITEM_EVOLUTIONS)) {
  for (const [from, targets] of Object.entries(bySpecies)) {
    if (!species[from]) {
      console.warn(`unknown species ${from}`)
      continue
    }
    const evolutions = evolutionData[from] ?? (evolutionData[from] = [])
    for (const into of targets) {
      let evolution = evolutions.find((entry) => entry.into === into)
      if (!evolution) {
        if (!species[into]) {
          console.warn(`unknown target ${into}`)
          continue
        }
        evolution = { into }
        evolutions.push(evolution)
      }
      if (evolution.form) continue
      if (evolution.item !== itemId || evolution.level != null) changed++
      evolution.item = itemId
      delete evolution.level
    }
  }
}

fs.writeFileSync(evoPath, JSON.stringify(evolutionData, null, 2))
console.log(`evolution items: ${changed} entries set, ${removed} duplicate(s) removed`)
