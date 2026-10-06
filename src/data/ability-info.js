// Curated ability descriptions, shared by the in-game hover tooltips and the
// generated Battle Reference page (tools/generate-reference.cjs requires this
// module). Anything in public/data/ability-data.json that is not listed here is
// inert: it is rolled and displayed but has no battle effect. When you wire up a
// new ability in src/game, add it here too.

/**
 * @type {Record<string, { group: string, text: string }>}
 */
export const abilityInfo = {
  'intimidate': {
    'group': 'entry',
    'text': 'Lowers the foe’s Attack by one stage on entry.'
  },
  'drizzle': {
    'group': 'entry',
    'text': 'Summons rain for five turns on entry.'
  },
  'drought': {
    'group': 'entry',
    'text': 'Summons harsh sunlight for five turns on entry.'
  },
  'sandStream': {
    'group': 'entry',
    'text': 'Summons a sandstorm for five turns on entry.'
  },
  'snowWarning': {
    'group': 'entry',
    'text': 'Summons snow for five turns on entry.'
  },
  'desolateLand': {
    'group': 'entry',
    'text': 'Summons extremely harsh sunlight; Water moves fail.'
  },
  'primordialSea': {
    'group': 'entry',
    'text': 'Summons a heavy downpour; Fire moves fail.'
  },
  'deltaStream': {
    'group': 'entry',
    'text': 'Summons strong winds that cancel Flying-type weaknesses.'
  },
  'electricSurge': {
    'group': 'entry',
    'text': 'Sets Electric Terrain for five turns on entry.'
  },
  'grassySurge': {
    'group': 'entry',
    'text': 'Sets Grassy Terrain for five turns on entry.'
  },
  'mistySurge': {
    'group': 'entry',
    'text': 'Sets Misty Terrain for five turns on entry.'
  },
  'psychicSurge': {
    'group': 'entry',
    'text': 'Sets Psychic Terrain for five turns on entry.'
  },
  'hadronEngine': {
    'group': 'entry',
    'text': 'Sets Electric Terrain and boosts Sp. Atk ×1.33.'
  },
  'orichalcumPulse': {
    'group': 'entry',
    'text': 'Sets sunlight and boosts physical Attack ×1.33 in sun.'
  },
  'intrepidSword': {
    'group': 'entry',
    'text': 'Raises Attack by one stage on entry.'
  },
  'dauntlessShield': {
    'group': 'entry',
    'text': 'Raises Defense by one stage on entry.'
  },
  'download': {
    'group': 'entry',
    'text': 'Raises Attack or Sp. Atk, whichever the foe’s defenses favour.'
  },
  'trace': {
    'group': 'entry',
    'text': 'Copies the foe’s ability on entry.'
  },
  'imposter': {
    'group': 'entry',
    'text': 'Transforms into the foe — its types and stats, but not HP.'
  },
  'slowStart': {
    'group': 'entry',
    'text': 'Halves Attack and Speed for the first five turns.'
  },
  'screenCleaner': {
    'group': 'entry',
    'text': 'Removes Reflect, Light Screen and Aurora Veil from both sides.'
  },
  'neutralizingGas': {
    'group': 'entry',
    'text': 'Suppresses every other Pokémon’s ability while on the field.'
  },
  'airLock': {
    'group': 'entry',
    'text': 'Suppresses all weather effects while on the field.'
  },
  'cloudNine': {
    'group': 'entry',
    'text': 'Suppresses all weather effects while on the field.'
  },
  'moldBreaker': {
    'group': 'entry',
    'text': 'Ignores the defender’s ability when attacking.'
  },
  'teravolt': {
    'group': 'entry',
    'text': 'Ignores the defender’s ability when attacking.'
  },
  'turboblaze': {
    'group': 'entry',
    'text': 'Ignores the defender’s ability when attacking.'
  },
  'levitate': {
    'group': 'absorb',
    'text': 'Immune to Ground-type moves.'
  },
  'waterAbsorb': {
    'group': 'absorb',
    'text': 'Absorbs Water moves and heals 1/4 max HP.'
  },
  'drySkin': {
    'group': 'absorb',
    'text': 'Absorbs Water (heals 1/4); takes 25% extra Fire damage, heals in rain, hurt in sun.'
  },
  'voltAbsorb': {
    'group': 'absorb',
    'text': 'Absorbs Electric moves and heals 1/4 max HP.'
  },
  'lightningRod': {
    'group': 'absorb',
    'text': 'Absorbs Electric moves and heals 1/4 max HP.'
  },
  'motorDrive': {
    'group': 'absorb',
    'text': 'Absorbs Electric moves and heals 1/4 max HP.'
  },
  'flashFire': {
    'group': 'absorb',
    'text': 'Absorbs Fire moves (and the engine heals 1/4 max HP).'
  },
  'wellBakedBody': {
    'group': 'absorb',
    'text': 'Absorbs Fire moves and heals 1/4 max HP.'
  },
  'sapSipper': {
    'group': 'absorb',
    'text': 'Absorbs Grass moves and heals 1/4 max HP.'
  },
  'stormDrain': {
    'group': 'absorb',
    'text': 'Absorbs Water moves and heals 1/4 max HP.'
  },
  'earthEater': {
    'group': 'absorb',
    'text': 'Absorbs Ground moves and heals 1/4 max HP.'
  },
  'wonderGuard': {
    'group': 'absorb',
    'text': 'Only super-effective damaging moves can land.'
  },
  'soundproof': {
    'group': 'absorb',
    'text': 'Blocks sound-based moves.'
  },
  'bulletproof': {
    'group': 'absorb',
    'text': 'Blocks ball- and bomb-based moves.'
  },
  'damp': {
    'group': 'absorb',
    'text': 'Blocks Self-Destruct, Explosion and similar moves.'
  },
  'overcoat': {
    'group': 'absorb',
    'text': 'Blocks powder moves and weather chip damage.'
  },
  'magicGuard': {
    'group': 'absorb',
    'text': 'Immune to indirect damage (poison, burn, Leech Seed, weather, hazards).'
  },
  'goodAsGold': {
    'group': 'absorb',
    'text': 'Immune to the foe’s status moves.'
  },
  'disguise': {
    'group': 'absorb',
    'text': 'Absorbs the first hit it takes (Mimikyu).'
  },
  'iceFace': {
    'group': 'absorb',
    'text': 'Absorbs the first physical hit; reforms in snow or hail (Eiscue).'
  },
  'sturdy': {
    'group': 'absorb',
    'text': 'Survives a KO from full HP with 1 HP.'
  },
  'noGuard': {
    'group': 'absorb',
    'text': 'All attacks from both sides always hit.'
  },
  'scrappy': {
    'group': 'absorb',
    'text': 'Normal- and Fighting-type moves can hit Ghost-types.'
  },
  'infiltrator': {
    'group': 'absorb',
    'text': 'Ignores Reflect, Light Screen and Aurora Veil.'
  },
  'swiftSwim': {
    'group': 'weather',
    'text': 'Doubles Speed in rain.'
  },
  'chlorophyll': {
    'group': 'weather',
    'text': 'Doubles Speed in harsh sunlight.'
  },
  'sandRush': {
    'group': 'weather',
    'text': 'Doubles Speed in a sandstorm.'
  },
  'slushRush': {
    'group': 'weather',
    'text': 'Doubles Speed in snow.'
  },
  'rainDish': {
    'group': 'weather',
    'text': 'Restores 1/16 max HP each turn in rain.'
  },
  'iceBody': {
    'group': 'weather',
    'text': 'Restores 1/16 max HP each turn in snow.'
  },
  'solarPower': {
    'group': 'weather',
    'text': 'Boosts Sp. Atk ×1.5 in harsh sunlight.'
  },
  'flowerGift': {
    'group': 'weather',
    'text': 'Boosts Attack ×1.5 in harsh sunlight.'
  },
  'forecast': {
    'group': 'weather',
    'text': 'Castform changes form — and type — with the weather.'
  },
  'protosynthesis': {
    'group': 'weather',
    'text': 'Boosts Speed ×1.5 in harsh sunlight.'
  },
  'sandForce': {
    'group': 'weather',
    'text': 'Boosts Rock, Ground and Steel moves ×1.3 in a sandstorm.'
  },
  'sandVeil': {
    'group': 'weather',
    'text': 'Raises evasion by one stage in a sandstorm.'
  },
  'snowCloak': {
    'group': 'weather',
    'text': 'Raises evasion by one stage in snow or hail.'
  },
  'hydration': {
    'group': 'weather',
    'text': 'Cures its own status at the end of each turn in rain.'
  },
  'grassPelt': {
    'group': 'weather',
    'text': 'Boosts Defense ×1.5 in Grassy Terrain.'
  },
  'surgeSurfer': {
    'group': 'weather',
    'text': 'Doubles Speed in Electric Terrain.'
  },
  'quarkDrive': {
    'group': 'weather',
    'text': 'Boosts Speed ×1.5 and attacking stats ×1.3 in Electric Terrain.'
  },
  'mimicry': {
    'group': 'weather',
    'text': 'Changes its type to match the active terrain.'
  },
  'harvest': {
    'group': 'weather',
    'text': 'Restores a consumed berry (always in sun, otherwise 50%).'
  },
  'hugePower': {
    'group': 'offense',
    'text': 'Doubles Attack.'
  },
  'purePower': {
    'group': 'offense',
    'text': 'Doubles Attack.'
  },
  'adaptability': {
    'group': 'offense',
    'text': 'Same-type attacks are ×2 instead of ×1.5.'
  },
  'technician': {
    'group': 'offense',
    'text': 'Moves of 60 power or less are ×1.5.'
  },
  'toughClaws': {
    'group': 'offense',
    'text': 'Contact moves are ×1.3.'
  },
  'ironFist': {
    'group': 'offense',
    'text': 'Punching moves are ×1.2.'
  },
  'strongJaw': {
    'group': 'offense',
    'text': 'Biting moves are ×1.5.'
  },
  'megaLauncher': {
    'group': 'offense',
    'text': 'Pulse and aura moves are ×1.5.'
  },
  'sharpness': {
    'group': 'offense',
    'text': 'Slicing moves are ×1.5.'
  },
  'punkRock': {
    'group': 'offense',
    'text': 'Sound moves are ×1.3 and sound damage taken is halved.'
  },
  'reckless': {
    'group': 'offense',
    'text': 'Recoil moves are ×1.2.'
  },
  'sheerForce': {
    'group': 'offense',
    'text': 'Moves with a secondary effect are ×1.3.'
  },
  'tintedLens': {
    'group': 'offense',
    'text': 'Not-very-effective hits are ×2.'
  },
  'neuroforce': {
    'group': 'offense',
    'text': 'Super-effective hits are ×1.25.'
  },
  'sniper': {
    'group': 'offense',
    'text': 'Critical hits deal ×2.25 instead of ×2.'
  },
  'superLuck': {
    'group': 'offense',
    'text': 'Raises its critical-hit stage by one.'
  },
  'merciless': {
    'group': 'offense',
    'text': 'Always lands a critical hit on a statused foe.'
  },
  'analytic': {
    'group': 'offense',
    'text': 'Deals ×1.3 when it moves last.'
  },
  'waterBubble': {
    'group': 'offense',
    'text': 'Water moves are ×2 and Fire damage taken is halved.'
  },
  'steelworker': {
    'group': 'offense',
    'text': 'Steel moves are ×1.5.'
  },
  'dragonsMaw': {
    'group': 'offense',
    'text': 'Dragon moves are ×1.5.'
  },
  'transistor': {
    'group': 'offense',
    'text': 'Electric moves are ×1.5.'
  },
  'rockyPayload': {
    'group': 'offense',
    'text': 'Rock moves are ×1.5.'
  },
  'blaze': {
    'group': 'offense',
    'text': 'Fire moves are ×1.5 below a third HP.'
  },
  'torrent': {
    'group': 'offense',
    'text': 'Water moves are ×1.5 below a third HP.'
  },
  'overgrow': {
    'group': 'offense',
    'text': 'Grass moves are ×1.5 below a third HP.'
  },
  'swarm': {
    'group': 'offense',
    'text': 'Bug moves are ×1.5 below a third HP.'
  },
  'guts': {
    'group': 'offense',
    'text': 'Boosts Attack ×1.5 while statused.'
  },
  'hustle': {
    'group': 'offense',
    'text': 'Boosts Attack ×1.5.'
  },
  'gorillaTactics': {
    'group': 'offense',
    'text': 'Boosts Attack ×1.5.'
  },
  'toxicBoost': {
    'group': 'offense',
    'text': 'Boosts physical Attack ×1.5 while poisoned.'
  },
  'flareBoost': {
    'group': 'offense',
    'text': 'Boosts Sp. Atk ×1.5 while statused.'
  },
  'darkAura': {
    'group': 'offense',
    'text': 'Dark moves are ×1.33 for both sides.'
  },
  'fairyAura': {
    'group': 'offense',
    'text': 'Fairy moves are ×1.33 for both sides.'
  },
  'auraBreak': {
    'group': 'offense',
    'text': 'Turns Dark and Fairy Aura into a ×0.75 drop.'
  },
  'parentalBond': {
    'group': 'offense',
    'text': 'Strikes twice; the second hit deals 25% damage.'
  },
  'skillLink': {
    'group': 'offense',
    'text': 'Multi-hit moves always land their maximum number of hits.'
  },
  'sereneGrace': {
    'group': 'offense',
    'text': 'Doubles the chance of added effects.'
  },
  'armorTail': {
    'group': 'offense',
    'text': 'Blocks priority moves aimed at it.'
  },
  'dazzling': {
    'group': 'offense',
    'text': 'Blocks priority moves aimed at it.'
  },
  'queenlyMajesty': {
    'group': 'offense',
    'text': 'Blocks priority moves aimed at it.'
  },
  'galeWings': {
    'group': 'offense',
    'text': 'Flying moves gain +1 priority at full HP.'
  },
  'prankster': {
    'group': 'offense',
    'text': 'Status moves gain +1 priority.'
  },
  'triage': {
    'group': 'offense',
    'text': 'Healing moves gain +3 priority.'
  },
  'myceliumMight': {
    'group': 'offense',
    'text': 'Status moves go last (−1 priority).'
  },
  'stall': {
    'group': 'offense',
    'text': 'Always moves last (−1 priority).'
  },
  'unseenFist': {
    'group': 'offense',
    'text': 'Contact moves hit through Protect.'
  },
  'normalize': {
    'group': 'offense',
    'text': 'All of its moves become Normal-type.'
  },
  'aerilate': {
    'group': 'offense',
    'text': 'Normal moves become Flying-type and gain 20% power.'
  },
  'pixilate': {
    'group': 'offense',
    'text': 'Normal moves become Fairy-type and gain 20% power.'
  },
  'refrigerate': {
    'group': 'offense',
    'text': 'Normal moves become Ice-type and gain 20% power.'
  },
  'galvanize': {
    'group': 'offense',
    'text': 'Normal moves become Electric-type and gain 20% power.'
  },
  'dragonize': {
    'group': 'offense',
    'text': 'Normal moves become Dragon-type and gain 20% power.'
  },
  'liquidVoice': {
    'group': 'offense',
    'text': 'Sound moves become Water-type.'
  },
  'protean': {
    'group': 'offense',
    'text': 'Changes its type to match the move it uses.'
  },
  'libero': {
    'group': 'offense',
    'text': 'Changes its type to match the move it uses.'
  },
  'unnerve': {
    'group': 'offense',
    'text': 'The foe cannot eat its held berry.'
  },
  'thickFat': {
    'group': 'defense',
    'text': 'Halves Fire- and Ice-type damage taken.'
  },
  'multiscale': {
    'group': 'defense',
    'text': 'Halves damage taken at full HP.'
  },
  'shadowShield': {
    'group': 'defense',
    'text': 'Halves damage taken at full HP.'
  },
  'fluffy': {
    'group': 'defense',
    'text': 'Halves contact damage, but takes double Fire damage.'
  },
  'heatproof': {
    'group': 'defense',
    'text': 'Halves Fire-type damage taken.'
  },
  'iceScales': {
    'group': 'defense',
    'text': 'Halves special damage taken.'
  },
  'purifyingSalt': {
    'group': 'defense',
    'text': 'Immune to all status conditions; halves Ghost damage.'
  },
  'furCoat': {
    'group': 'defense',
    'text': 'Halves physical damage taken.'
  },
  'marvelScale': {
    'group': 'defense',
    'text': 'Boosts Defense ×1.5 while statused.'
  },
  'filter': {
    'group': 'defense',
    'text': 'Halves damage from super-effective hits.'
  },
  'solidRock': {
    'group': 'defense',
    'text': 'Halves damage from super-effective hits.'
  },
  'prismArmor': {
    'group': 'defense',
    'text': 'Halves damage from super-effective hits.'
  },
  'battleArmor': {
    'group': 'defense',
    'text': 'Prevents critical hits against it.'
  },
  'shellArmor': {
    'group': 'defense',
    'text': 'Prevents critical hits against it.'
  },
  'tabletsOfRuin': {
    'group': 'defense',
    'text': 'Lowers every other Pokémon’s physical Attack by 25%.'
  },
  'beadsOfRuin': {
    'group': 'defense',
    'text': 'Lowers every other Pokémon’s Sp. Atk by 25%.'
  },
  'swordOfRuin': {
    'group': 'defense',
    'text': 'Lowers every other Pokémon’s physical Defense by 25%.'
  },
  'vesselOfRuin': {
    'group': 'defense',
    'text': 'Lowers every other Pokémon’s Sp. Def by 25%.'
  },
  'rockHead': {
    'group': 'defense',
    'text': 'Prevents recoil damage from its own moves.'
  },
  'defeatist': {
    'group': 'defense',
    'text': 'Halves Attack and Speed below half HP.'
  },
  'speedBoost': {
    'group': 'speed',
    'text': 'Raises Speed by one stage at the end of each turn.'
  },
  'quickFeet': {
    'group': 'speed',
    'text': 'Boosts Speed ×1.5 while statused.'
  },
  'unburden': {
    'group': 'speed',
    'text': 'Doubles Speed once its held item is consumed.'
  },
  'immunity': {
    'group': 'status',
    'text': 'Cannot be poisoned.'
  },
  'limber': {
    'group': 'status',
    'text': 'Cannot be paralyzed.'
  },
  'waterVeil': {
    'group': 'status',
    'text': 'Cannot be burned.'
  },
  'insomnia': {
    'group': 'status',
    'text': 'Cannot be put to sleep.'
  },
  'vitalSpirit': {
    'group': 'status',
    'text': 'Cannot be put to sleep.'
  },
  'sweetVeil': {
    'group': 'status',
    'text': 'Cannot be put to sleep.'
  },
  'magmaArmor': {
    'group': 'status',
    'text': 'Cannot be frozen.'
  },
  'comatose': {
    'group': 'status',
    'text': 'Cannot be afflicted by any status condition.'
  },
  'pastelVeil': {
    'group': 'status',
    'text': 'Cannot be poisoned.'
  },
  'ownTempo': {
    'group': 'status',
    'text': 'Cannot be confused.'
  },
  'oblivious': {
    'group': 'status',
    'text': 'Cannot be infatuated, and ignores Intimidate.'
  },
  'aromaVeil': {
    'group': 'status',
    'text': 'Cannot be infatuated.'
  },
  'innerFocus': {
    'group': 'status',
    'text': 'Cannot be made to flinch.'
  },
  'shieldDust': {
    'group': 'status',
    'text': 'Blocks the secondary effects of moves that hit it.'
  },
  'earlyBird': {
    'group': 'status',
    'text': 'Wakes from sleep twice as quickly.'
  },
  'steadfast': {
    'group': 'status',
    'text': 'Raises Speed by one stage when it flinches.'
  },
  'tangledFeet': {
    'group': 'status',
    'text': 'Raises evasion by one stage while confused.'
  },
  'shedSkin': {
    'group': 'status',
    'text': '33% chance to cure its status each turn.'
  },
  'poisonHeal': {
    'group': 'status',
    'text': 'While poisoned it heals 1/8 max HP instead of taking damage.'
  },
  'badDreams': {
    'group': 'status',
    'text': 'A sleeping foe loses 1/8 max HP each turn.'
  },
  'corrosion': {
    'group': 'status',
    'text': 'Can poison Steel- and Poison-type Pokémon.'
  },
  'poisonPuppeteer': {
    'group': 'status',
    'text': 'Confuses a foe poisoned by Toxic Chain.'
  },
  'liquidOoze': {
    'group': 'status',
    'text': 'Drain moves hurt the attacker instead of healing it.'
  },
  'naturalCure': {
    'group': 'status',
    'text': 'Cures its status when the battle ends.'
  },
  'regenerator': {
    'group': 'status',
    'text': 'Restores 1/3 max HP when the battle ends.'
  },
  'klutz': {
    'group': 'status',
    'text': 'Ignores its own held item.'
  },
  'static': {
    'group': 'contact',
    'text': '30% chance to paralyze an attacker on contact.'
  },
  'flameBody': {
    'group': 'contact',
    'text': '30% chance to burn an attacker on contact.'
  },
  'poisonPoint': {
    'group': 'contact',
    'text': '30% chance to poison an attacker on contact.'
  },
  'poisonTouch': {
    'group': 'contact',
    'text': '30% chance to poison the target with a contact move.'
  },
  'effectSpore': {
    'group': 'contact',
    'text': '30% chance to poison, paralyze or sleep an attacker on contact.'
  },
  'cuteCharm': {
    'group': 'contact',
    'text': '30% chance to infatuate an attacker on contact.'
  },
  'roughSkin': {
    'group': 'contact',
    'text': 'Contact costs the attacker 1/8 of its max HP.'
  },
  'ironBarbs': {
    'group': 'contact',
    'text': 'Contact costs the attacker 1/8 of its max HP.'
  },
  'gooey': {
    'group': 'contact',
    'text': 'Lowers an attacker’s Speed by one stage on contact.'
  },
  'tanglingHair': {
    'group': 'contact',
    'text': 'Lowers an attacker’s Speed by one stage on contact.'
  },
  'stamina': {
    'group': 'contact',
    'text': 'Raises its Defense by one stage when hit.'
  },
  'mummy': {
    'group': 'contact',
    'text': 'Contact changes the attacker’s ability to Mummy.'
  },
  'wanderingSpirit': {
    'group': 'contact',
    'text': 'Contact swaps abilities with the attacker.'
  },
  'perishBody': {
    'group': 'contact',
    'text': 'Contact gives both Pokémon a three-turn Perish Song countdown.'
  },
  'justified': {
    'group': 'onhit',
    'text': 'Raises Attack by one stage when hit by a Dark move.'
  },
  'rattled': {
    'group': 'onhit',
    'text': 'Raises Speed by one stage when hit by Bug, Dark or Ghost.'
  },
  'thermalExchange': {
    'group': 'onhit',
    'text': 'Raises Attack by one stage when hit by a Fire move.'
  },
  'waterCompaction': {
    'group': 'onhit',
    'text': 'Raises Defense by two stages when hit by a Water move.'
  },
  'steamEngine': {
    'group': 'onhit',
    'text': 'Raises Speed by six stages when hit by Water or Fire.'
  },
  'weakArmor': {
    'group': 'onhit',
    'text': 'When hit physically: Defense −1, Speed +2.'
  },
  'angerPoint': {
    'group': 'onhit',
    'text': 'Maxes Attack (+6) when it takes a critical hit.'
  },
  'berserk': {
    'group': 'onhit',
    'text': 'Raises Sp. Atk by one stage when it drops below half HP.'
  },
  'angerShell': {
    'group': 'onhit',
    'text': 'Below half HP: Sp. Atk +1, Speed +1, Def −1, Sp. Def −1.'
  },
  'cursedBody': {
    'group': 'onhit',
    'text': '30% chance to disable the move that hit it.'
  },
  'cottonDown': {
    'group': 'onhit',
    'text': 'Lowers an attacker’s Speed by one stage when hit.'
  },
  'sandSpit': {
    'group': 'onhit',
    'text': 'Summons a sandstorm when hit.'
  },
  'seedSower': {
    'group': 'onhit',
    'text': 'Sets Grassy Terrain when hit.'
  },
  'toxicDebris': {
    'group': 'onhit',
    'text': 'Sets a layer of Toxic Spikes when hit physically.'
  },
  'toxicChain': {
    'group': 'onhit',
    'text': '30% chance to badly poison the target when it lands a hit.'
  },
  'stench': {
    'group': 'onhit',
    'text': '10% chance to make the target flinch.'
  },
  'colorChange': {
    'group': 'onhit',
    'text': 'Changes its type to the move that hit it.'
  },
  'pickpocket': {
    'group': 'onhit',
    'text': 'Steals the attacker’s item on contact.'
  },
  'magician': {
    'group': 'onhit',
    'text': 'Steals the target’s item when it lands a hit.'
  },
  'aftermath': {
    'group': 'onko',
    'text': 'A contact KO costs the attacker 1/4 of its max HP.'
  },
  'innardsOut': {
    'group': 'onko',
    'text': 'Deals its remaining HP as damage to whoever KOs it.'
  },
  'moxie': {
    'group': 'onko',
    'text': 'Raises Attack by one stage after a KO.'
  },
  'chillingNeigh': {
    'group': 'onko',
    'text': 'Raises Attack by one stage after a KO.'
  },
  'grimNeigh': {
    'group': 'onko',
    'text': 'Raises Sp. Atk by one stage after a KO.'
  },
  'soulHeart': {
    'group': 'onko',
    'text': 'Raises Sp. Atk by one stage whenever any Pokémon faints.'
  },
  'beastBoost': {
    'group': 'onko',
    'text': 'Raises its highest stat by one stage after a KO.'
  },
  'battleBond': {
    'group': 'onko',
    'text': 'Greninja becomes Ash-Greninja after a KO.'
  },
  'clearBody': {
    'group': 'stats',
    'text': 'Prevents its stats from being lowered.'
  },
  'whiteSmoke': {
    'group': 'stats',
    'text': 'Prevents its stats from being lowered.'
  },
  'fullMetalBody': {
    'group': 'stats',
    'text': 'Prevents its stats from being lowered.'
  },
  'mirrorArmor': {
    'group': 'stats',
    'text': 'Reflects stat-lowering effects back at the foe.'
  },
  'hyperCutter': {
    'group': 'stats',
    'text': 'Prevents its Attack from being lowered.'
  },
  'bigPecks': {
    'group': 'stats',
    'text': 'Prevents its Defense from being lowered.'
  },
  'keenEye': {
    'group': 'stats',
    'text': 'Prevents its accuracy from being lowered.'
  },
  'contrary': {
    'group': 'stats',
    'text': 'Reverses stat changes — drops become boosts.'
  },
  'simple': {
    'group': 'stats',
    'text': 'Doubles the effect of any stat change it receives.'
  },
  'defiant': {
    'group': 'stats',
    'text': 'Raises Attack by two stages when any stat is lowered.'
  },
  'competitive': {
    'group': 'stats',
    'text': 'Raises Sp. Atk by two stages when any stat is lowered.'
  },
  'opportunist': {
    'group': 'stats',
    'text': 'Copies the foe’s stat boosts.'
  },
  'unaware': {
    'group': 'stats',
    'text': 'Ignores the foe’s stat stages when attacking or defending.'
  },
  'guardDog': {
    'group': 'stats',
    'text': 'Intimidate raises its Attack instead; blocks forced switching.'
  },
  'moody': {
    'group': 'stats',
    'text': 'Each turn: one stat +2, another −1, at random.'
  },
  'hungerSwitch': {
    'group': 'form',
    'text': 'Morpeko alternates forms each turn; Aura Wheel becomes Dark in Hangry form.'
  },
  'powerConstruct': {
    'group': 'form',
    'text': 'Zygarde becomes Complete Forme below half HP.'
  },
  'zenMode': {
    'group': 'form',
    'text': 'Darmanitan becomes Zen Mode below half HP.'
  },
  'shieldsDown': {
    'group': 'form',
    'text': 'Minior switches between Meteor and Core form at half HP.'
  },
  'schooling': {
    'group': 'form',
    'text': 'Wishiwashi becomes School Form at Lv.20+ and above 1/4 HP.'
  },
  'stanceChange': {
    'group': 'form',
    'text': 'Aegislash changes form based on the move it uses.'
  },
  'zeroToHero': {
    'group': 'form',
    'text': 'Palafin becomes its Hero form on entry.'
  },
  'gluttony': {
    'group': 'item',
    'text': 'Its berry triggers at half HP instead of the usual threshold.'
  },
  'cheekPouch': {
    'group': 'item',
    'text': 'Restores 1/3 max HP when it eats a berry.'
  },
  'cudChew': {
    'group': 'item',
    'text': 'Re-eats its last berry at the end of the next turn.'
  },
  'ripen': {
    'group': 'item',
    'text': 'Doubles the effect of berries it eats.'
  },
  'stickyHold': {
    'group': 'item',
    'text': 'Its held item cannot be stolen.'
  },
  'pickup': {
    'group': 'item',
    'text': 'Chance to find an item after a wild win.'
  },
  'ballFetch': {
    'group': 'item',
    'text': 'Chance to recover a thrown Poké Ball after a wild win.'
  },
  'honeyGather': {
    'group': 'item',
    'text': 'Chance to gather Honey after a wild win.'
  },
  'truant': {
    'group': 'misc',
    'text': 'Loafs around every other turn, skipping its move.'
  },
  'victoryStar': {
    'group': 'misc',
    'text': 'Boosts its accuracy by 10%.'
  },
  'compoundEyes': {
    'group': 'misc',
    'text': 'Boosts its accuracy by 30%.'
  },
  'magicBounce': {
    'group': 'defense',
    'text': 'Reflects status moves and opponent-inflicted stat drops back at the user.'
  },
  'synchronize': {
    'group': 'status',
    'text': 'Passes burn, poison or paralysis to the opponent that inflicted it.'
  },
  'rivalry': {
    'group': 'offense',
    'text': 'More damage against the same gender (1.25x), less against the opposite (0.75x).'
  },
  'quickDraw': {
    'group': 'offense',
    'text': '30% chance to move first within its priority bracket.'
  },
  'stakeout': {
    'group': 'offense',
    'text': 'Doubles damage against a foe that switched in this turn.'
  },
  'supremeOverlord': {
    'group': 'offense',
    'text': 'Boosts Attack and Sp. Atk by 10% for each fainted party member (max 5).'
  },
  'battery': {
    'group': 'offense',
    'text': 'In Double Battles, boosts an ally\u2019s Attack and Sp. Atk by 30%.'
  },
  'powerSpot': {
    'group': 'offense',
    'text': 'In Double Battles, boosts an ally\u2019s Attack and Sp. Atk by 30%.'
  },
  'friendGuard': {
    'group': 'defense',
    'text': 'In Double Battles, reduces the damage an ally takes by 25%.'
  },
  'healer': {
    'group': 'status',
    'text': 'In Double Battles, has a 30% chance to cure an ally\u2019s status each round.'
  },
  'anticipation': {
    'group': 'entry',
    'text': 'Shudders on entry if the foe has a super-effective or one-hit KO move.'
  },
  'forewarn': {
    'group': 'entry',
    'text': 'Reveals the foe\u2019s strongest move on entry.'
  },
  'frisk': {
    'group': 'entry',
    'text': 'Reveals the foe\u2019s held item on entry.'
  },
  'supersweetSyrup': {
    'group': 'entry',
    'text': 'Lowers the foe\u2019s evasiveness by one stage on entry.'
  },
  'longReach': {
    'group': 'contact',
    'text': 'The holder\u2019s moves never make contact.'
  },
  'lingeringAroma': {
    'group': 'contact',
    'text': 'Contact replaces the attacker\u2019s ability with Lingering Aroma.'
  },
  'spicySpray': {
    'group': 'onhit',
    'text': 'Lowers the attacker\u2019s Attack when the holder is hit.'
  },
  'wonderSkin': {
    'group': 'status',
    'text': 'Halves the accuracy of status moves aimed at the holder.'
  },
  'leafGuard': {
    'group': 'status',
    'text': 'Prevents status conditions while the sun is shining.'
  },
  'electromorphosis': {
    'group': 'offense',
    'text': 'Becomes charged when hit, doubling the power of its next Electric move.'
  },
  'windPower': {
    'group': 'offense',
    'text': 'Becomes charged when hit by a wind move, doubling its next Electric move.'
  },
  'windRider': {
    'group': 'absorb',
    'text': 'Immune to wind moves and raises Attack when hit by one.'
  },
  'mindsEye': {
    'group': 'misc',
    'text': 'Lets its Normal and Fighting moves hit Ghost-types.'
  },
  'heavyMetal': {
    'group': 'stats',
    'text': 'Doubles its weight.'
  },
  'lightMetal': {
    'group': 'stats',
    'text': 'Halves its weight.'
  },
  'asOneGlastrier': {
    'group': 'onko',
    'text': 'Combines Unnerve with Chilling Neigh (Attack rises after a KO).'
  },
  'asOneSpectrier': {
    'group': 'onko',
    'text': 'Combines Unnerve with Grim Neigh (Sp. Atk rises after a KO).'
  },
  'teraShift': {
    'group': 'form',
    'text': 'Transforms Terapagos into its Terastal Forme on entry.'
  },
  'teraShell': {
    'group': 'defense',
    'text': 'Halves the damage of every move while the holder is at full HP.'
  },
  'teraformZero': {
    'group': 'entry',
    'text': 'Clears the weather and terrain on entry.'
  },
  'eelevate': {
    'group': 'absorb',
    'text': 'Airborne, so Ground moves miss. After a KO, raises its best stat.'
  },
  'piercingDrill': {
    'group': 'contact',
    'text': 'Contact moves go straight through Protect and Detect.'
  },
  'fireMane': {
    'group': 'offense',
    'text': 'Boosts the power of its Fire-type moves by 50%.'
  },
  'auraGuard': {
    'group': 'defense',
    'text': 'Halves the damage of contact moves.'
  },
  'megaSol': {
    'group': 'offense',
    'text': 'Acts as if the sun were shining for its own moves (boosts Fire, weakens Water).'
  },
  'gulpMissile': {
    'group': 'onhit',
    'text': 'Surf or Dive makes it swallow a catch; being hit spits it back for 25% damage plus a Defense drop (Gulping) or paralysis (Gorging).'
  },
  'hospitality': {
    'group': 'entry',
    'text': 'In Double Battles, heals an ally when it enters.'
  },
  'costar': {
    'group': 'entry',
    'text': 'In Double Battles, copies an ally\u2019s stat boosts on entry.'
  },
  'curiousMedicine': {
    'group': 'entry',
    'text': 'In Double Battles, clears an ally\u2019s stat drops on entry.'
  },
  'steelySpirit': {
    'group': 'offense',
    'text': 'In Double Battles, boosts an ally\u2019s Steel-type moves by 50%.'
  },
  'plus': {
    'group': 'offense',
    'text': 'In Double Battles, boosts Sp. Atk by 50% while an ally has Plus or Minus.'
  },
  'minus': {
    'group': 'offense',
    'text': 'In Double Battles, boosts Sp. Atk by 50% while an ally has Plus or Minus.'
  },
  'propellerTail': {
    'group': 'misc',
    'text': 'In Double Battles, ignores redirection and hits its chosen target.'
  },
  'stalwart': {
    'group': 'misc',
    'text': 'In Double Battles, ignores redirection and hits its chosen target.'
  }
}

/**
 * Hover-tooltip text for an ability. Implemented abilities get their curated
 * description; anything else says so rather than showing nothing.
 * @param {string | null | undefined} abilityKey
 * @returns {string | null}
 */
export function abilityTooltip(abilityKey) {
  if (!abilityKey) return null
  return abilityInfo[abilityKey]?.text ?? 'No battle effect implemented yet.'
}
