// Daily / periodic events. One event is active per real calendar day (chosen
// deterministically from the date, so it is the same for everyone and survives a
// reload). The player can also claim a one-off gift from the Daily button.
//
// The battle effects are applied in a handful of places via the small
// multipliers below, so they stay easy to reason about and test:
//   - dailyExpMultiplier    -> awardExperience (hooks.js)
//   - dailyPrizeMultiplier  -> trainer prize payout (hooks.js)
//   - dailyDropMultiplier   -> wild item-drop rolls (reducer.js)
//   - dailyShinyMultiplier  -> wild shiny rolls (progression.js, via hooks.js)

/**
 * @type {{ key: string, name: string, icon: string, description: string, gift: { money: number, items: Record<string, number> } }[]}
 */
export const DAILY_EVENTS = [
  {
    key: 'harvest',
    name: 'Harvest Day',
    icon: '🍀',
    description: 'Wild Pokemon drop items twice as often today.',
    gift: { money: 1000, items: { pokeball: 15, greatball: 5 } },
  },
  {
    key: 'fortune',
    name: 'Fortune Day',
    icon: '💰',
    description: 'Trainer prize money is doubled today.',
    gift: { money: 4000, items: { nugget: 1 } },
  },
  {
    key: 'training',
    name: 'Training Day',
    icon: '💪',
    description: 'Battles award double EXP today.',
    gift: { money: 1500, items: { rareCandy: 1, pokeball: 5 } },
  },
  {
    key: 'lucky',
    name: 'Lucky Day',
    icon: '✨',
    description: 'Wild Pokemon are twice as likely to be shiny today.',
    gift: { money: 1500, items: { ultraball: 3 } },
  },
]

/** @type {Record<string, typeof DAILY_EVENTS[number]>} */
export const dailyEventByKey = Object.fromEntries(DAILY_EVENTS.map((event) => [event.key, event]))

/**
 * The rotating Gigantamax raid events. One entry is featured per week (the week
 * number picks a slot, so the whole world sees the same boss), while the
 * crystal's Tera type rotates daily. `boss` is a base species that has a
 * Gigantamax form (`gx-...`), resolved when the raid scene builds the boss;
 * `ally` is the simulated partner that joins the raid for free; `drops` are the
 * event-only rewards on top of the guaranteed Gigantamax Factor Pokemon.
 * @type {{ key: string, name: string, boss: string, ally: string, teraTypes: string[], drops: { itemId: string, quantity: number }[] }[]}
 */
export const RAID_EVENT_ROTATION = [
  {
    key: 'charizard',
    name: 'Charizard the Unrivaled',
    boss: 'charizard',
    ally: 'pikachu',
    teraTypes: ['Fire', 'Flying', 'Dragon'],
    drops: [{ itemId: 'cometShard', quantity: 1 }],
  },
  {
    key: 'gengar',
    name: 'Gengar the Unrivaled',
    boss: 'gengar',
    ally: 'alakazam',
    teraTypes: ['Ghost', 'Poison'],
    drops: [{ itemId: 'starPiece', quantity: 2 }],
  },
  {
    key: 'snorlax',
    name: 'Snorlax the Unrivaled',
    boss: 'snorlax',
    ally: 'machamp',
    teraTypes: ['Normal'],
    drops: [{ itemId: 'bigNugget', quantity: 1 }],
  },
  {
    key: 'lapras',
    name: 'Lapras the Unrivaled',
    boss: 'lapras',
    ally: 'kingler',
    teraTypes: ['Water', 'Ice'],
    drops: [{ itemId: 'bigPearl', quantity: 1 }],
  },
  {
    key: 'copperajah',
    name: 'Copperajah the Unrivaled',
    boss: 'copperajah',
    ally: 'duraludon',
    teraTypes: ['Steel'],
    drops: [{ itemId: 'nugget', quantity: 3 }],
  },
  {
    key: 'grimmsnarl',
    name: 'Grimmsnarl the Unrivaled',
    boss: 'grimmsnarl',
    ally: 'hatterene',
    teraTypes: ['Dark', 'Fairy'],
    drops: [{ itemId: 'bigNugget', quantity: 1 }],
  },
  {
    key: 'corviknight',
    name: 'Corviknight the Unrivaled',
    boss: 'corviknight',
    ally: 'drednaw',
    teraTypes: ['Flying', 'Steel'],
    drops: [{ itemId: 'starPiece', quantity: 2 }],
  },
  {
    key: 'toxtricity',
    name: 'Toxtricity the Unrivaled',
    boss: 'toxtricity',
    ally: 'centiskorch',
    teraTypes: ['Electric', 'Poison'],
    drops: [{ itemId: 'cometShard', quantity: 1 }],
  },
]

/** @type {Record<string, typeof RAID_EVENT_ROTATION[number]>} */
export const raidEventByKey = Object.fromEntries(
  RAID_EVENT_ROTATION.map((event) => [event.key, event])
)

/**
 * Local calendar date as `YYYY-MM-DD` (the day rolls over at local midnight).
 * @param {Date} [date]
 * @returns {string}
 */
export function todayKey(date = new Date()) {
  const year = date.getFullYear(),
    month = String(date.getMonth() + 1).padStart(2, '0'),
    day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** @param {string} value */
function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index++)
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  return hash
}

/**
 * Whole days since the Unix epoch at local midnight for a `YYYY-MM-DD` key.
 * @param {string} dateKey
 * @returns {number}
 */
function dayNumberForDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number),
    date = new Date(year, month - 1, day)
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000)
}

/**
 * The daily event for a date key. Deterministic, so a reload during the day
 * keeps the same event (the reducer only re-rolls when the date changes).
 * @param {string} [dateKey]
 * @returns {{ date: string, kind: string, claimed: boolean }}
 */
export function rollDailyEvent(dateKey = todayKey()) {
  const event = DAILY_EVENTS[hashString(dateKey) % DAILY_EVENTS.length]
  return { date: dateKey, kind: event.key, claimed: false }
}

/** @param {{ kind?: string } | null | undefined} dailyEvent */
export function dailyExpMultiplier(dailyEvent) {
  return dailyEvent?.kind === 'training' ? 2 : 1
}

/** @param {{ kind?: string } | null | undefined} dailyEvent */
export function dailyPrizeMultiplier(dailyEvent) {
  return dailyEvent?.kind === 'fortune' ? 2 : 1
}

/** @param {{ kind?: string } | null | undefined} dailyEvent */
export function dailyDropMultiplier(dailyEvent) {
  return dailyEvent?.kind === 'harvest' ? 2 : 1
}

/** @param {{ kind?: string } | null | undefined} dailyEvent */
export function dailyShinyMultiplier(dailyEvent) {
  return dailyEvent?.kind === 'lucky' ? 2 : 1
}

/**
 * The Gigantamax raid event featured for a date. The boss rotates weekly (a new
 * slot every seven days) and the crystal's Tera type rotates daily, so a reload
 * during the same day keeps the same event. Deterministic, like the daily one.
 * @param {string} [dateKey]
 * @returns {{ date: string, key: string, teraType: string }}
 */
export function rollRaidEvent(dateKey = todayKey()) {
  const dayNumber = dayNumberForDateKey(dateKey),
    weekNumber = Math.floor(dayNumber / 7),
    event = RAID_EVENT_ROTATION[
      ((weekNumber % RAID_EVENT_ROTATION.length) + RAID_EVENT_ROTATION.length) %
        RAID_EVENT_ROTATION.length
    ],
    teraIndex =
      ((dayNumber % event.teraTypes.length) + event.teraTypes.length) % event.teraTypes.length
  return { date: dateKey, key: event.key, teraType: event.teraTypes[teraIndex] }
}

/**
 * The featured raid event plus its rotation data, ready for the raid scene.
 * @param {string} [dateKey]
 * @returns {{ date: string, key: string, teraType: string, event: typeof RAID_EVENT_ROTATION[number] }}
 */
export function activeRaidEvent(dateKey = todayKey()) {
  const rotation = rollRaidEvent(dateKey),
    event = raidEventByKey[rotation.key] ?? RAID_EVENT_ROTATION[0]
  return { ...rotation, event }
}
