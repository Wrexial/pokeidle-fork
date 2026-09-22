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
