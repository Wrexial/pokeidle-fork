// Paldea's Tera Raid, played as a full-stage scene while the reducer is in the
// `teraRaid` phase. A crystal boss with a Tera type and inflated HP; each healthy
// party member fights it in turn. Break the crystal and you catch the boss.
//
// A rotating Gigantamax raid event (`activeRaidEvent`) can also be challenged
// here: the featured `gx-` boss carries extra HP, a simulated ally joins the
// party and the clear pays event-only rewards. The player can switch between
// the event and a normal random Tera raid until the first attack.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { activeRaidEvent } from '../data/daily-events.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  createGmaxRaidBoss,
  createTeraRaidBoss,
  gmaxRaidAlly,
  gmaxRaidBoss,
  gmaxRaidPrize,
  simulateBattle,
  teraRaidBoss,
  teraRaidPrize,
  teraRaidScore,
  toBattlePokemon,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/**
 * @param {{ speciesKey: string, name: string, level?: number, hp: number, maxHp: number,
 *   stars?: number, teraType?: string, down?: boolean, empty?: boolean, ally?: boolean }} props
 */
function RaidFighter({ speciesKey, name, level, hp, maxHp, stars, teraType, down, empty, ally }) {
  if (empty) return jsx('div', { className: 'royal-fighter royal-empty', children: '?' })
  const id = pokemonSpecies[speciesKey]?.id ?? 0,
    ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  return jsxs('div', {
    className: `royal-fighter raid-fighter${down ? ' down' : ''}${ally ? ' raid-ally' : ''}`,
    children: [
      stars != null && jsx('span', { className: 'raid-stars', children: '\u2605'.repeat(stars) }),
      jsx('img', {
        className: 'royal-sprite',
        src: getPokemonSpriteUrl(id),
        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
          (event.target.src = getPokemonSpriteFallbackUrl(id)),
        alt: name,
      }),
      jsx('span', { className: 'royal-name', children: name }),
      ally && jsx('span', { className: 'raid-ally-chip', children: 'ALLY' }),
      teraType && jsx('span', { className: 'raid-tera-chip', children: `${teraType} Tera` }),
      level != null && jsx('span', { className: 'royal-level', children: `Lv.${level}` }),
      maxHp > 0 &&
        jsxs('div', {
          className: 'royal-hp',
          children: [
            jsx('span', { className: 'royal-hp-fill', style: { width: `${ratio * 100}%` } }),
            jsx('span', { className: 'royal-hp-text', children: `${Math.max(0, hp)}/${maxHp}` }),
          ],
        }),
    ],
  })
}

/**
 * Build the boss, fighters and opening log for a raid mode. The event mode adds
 * the Gigantamax boss and its simulated ally; the Tera mode is the original
 * random five-star-style crystal.
 * @param {'event' | 'tera'} mode
 * @param {any} event
 * @param {{ key: string, teraType: string }} rotation
 * @param {number} baseLevel
 * @param {any[]} party
 * @returns {{ info: any, boss: any, fighters: any[], log: string }}
 */
function buildRaidSetup(mode, event, rotation, baseLevel, party) {
  const isEvent = mode === 'event' && !!event,
    info = isEvent ? gmaxRaidBoss(rotation, baseLevel) : teraRaidBoss(baseLevel),
    ally = isEvent ? gmaxRaidAlly(event, baseLevel) : null,
    fighters = [
      ...party.map((member) => toBattlePokemon(member, { isPlayer: true })),
      ...(ally ? [ally] : []),
    ]
  return {
    info,
    boss: isEvent ? createGmaxRaidBoss(info) : createTeraRaidBoss(info),
    fighters,
    log: isEvent
      ? `${event.name}! A Gigantamax ${info.name} blocks the way!`
      : `A ${info.teraType}-Tera ${info.name} blocks the way!`,
  }
}

export function TeraRaidScene() {
  const { state, dispatch } = useGame(),
    baseLevel = Math.max(...state.party.map((member) => member.level ?? 5), 5),
    [rotation] = React.useState(() => activeRaidEvent()),
    event = rotation.event,
    [mode, setMode] = React.useState(/** @type {'event' | 'tera'} */ (event ? 'event' : 'tera')),
    [game, setGame] = React.useState(() =>
      buildRaidSetup(event ? 'event' : 'tera', event, rotation, baseLevel, state.party)
    ),
    [activeIndex, setActiveIndex] = React.useState(() =>
      game.fighters.findIndex((member) => member.currentHp > 0)
    ),
    [phase, setPhase] = React.useState(/** @type {'ready' | 'done'} */ ('ready')),
    [started, setStarted] = React.useState(false),
    [last, setLast] = React.useState(
      /** @type {{ ally: string, won: boolean, turns: number } | null} */ (null)
    ),
    [result, setResult] = React.useState(
      () => /** @type {ReturnType<typeof gmaxRaidPrize> | ReturnType<typeof teraRaidPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(false)

  const { info, boss, fighters, log } = game,
    active = activeIndex >= 0 ? fighters[activeIndex] : null

  /**
   * Switch between the event and a normal Tera raid, resetting the whole stage.
   * Only allowed before the first attack so a paid entry can't reroll the boss.
   * @param {'event' | 'tera'} nextMode
   */
  function chooseMode(nextMode) {
    if (nextMode === mode || started) return
    const next = buildRaidSetup(nextMode, event, rotation, baseLevel, state.party)
    setMode(nextMode)
    setGame(next)
    setActiveIndex(next.fighters.findIndex((member) => member.currentHp > 0))
    setLast(null)
    setResult(null)
    setPhase('ready')
    settledRef.current = false
  }

  /**
   * @param {boolean} won
   * @param {any} currentBoss
   */
  function finish(won, currentBoss) {
    if (settledRef.current) return
    settledRef.current = true
    if (state.sfxEnabled) playSfx(won ? 'catch' : 'miss')
    const prize =
      mode === 'event' && event
        ? gmaxRaidPrize(event, won, info.level)
        : teraRaidPrize(info.stars, won, info.speciesKey, info.level)
    setResult(prize)
    setGame((current) => ({
      ...current,
      log: won
        ? `${prize.label} ${info.name} was caught!`
        : `The crystal held \u2014 ${info.name} was left at ${Math.max(0, currentBoss.currentHp)}/${currentBoss.maxHp} HP.`,
    }))
    setPhase('done')
  }

  function attack() {
    if (phase !== 'ready' || !active) return
    setStarted(true)
    const nextFighters = fighters.map((member) => ({ ...member })),
      nextBoss = { ...boss },
      attacker = nextFighters[activeIndex],
      outcome = simulateBattle(attacker, nextBoss)
    setLast({ ally: attacker.name, won: outcome.won, turns: outcome.turns })
    if (state.sfxEnabled) playSfx(outcome.won ? 'good' : 'miss')
    if (nextBoss.currentHp <= 0) {
      setGame({ ...game, boss: nextBoss, fighters: nextFighters })
      finish(true, nextBoss)
      return
    }
    const nextIndex = nextFighters.findIndex(
      (member, index) => index !== activeIndex && member.currentHp > 0
    )
    if (attacker.currentHp <= 0 && nextIndex === -1) {
      setGame({ ...game, boss: nextBoss, fighters: nextFighters })
      finish(false, nextBoss)
      return
    }
    if (nextIndex !== -1) {
      setActiveIndex(nextIndex)
      setGame({
        ...game,
        boss: nextBoss,
        fighters: nextFighters,
        log: `${attacker.name} fell back \u2014 ${info.name} at ${Math.max(0, nextBoss.currentHp)}/${nextBoss.maxHp} HP. ${nextFighters[nextIndex].name} steps in!`,
      })
    } else {
      setGame({
        ...game,
        boss: nextBoss,
        fighters: nextFighters,
        log: `${attacker.name} couldn't break it \u2014 ${info.name} at ${nextBoss.currentHp}/${nextBoss.maxHp} HP.`,
      })
    }
  }

  function leave() {
    collect(
      {
        type: 'END_MINIGAME',
        payload: {
          minigame: 'teraRaid',
          score: teraRaidScore(info.stars, !!result?.pokemon),
          completed: !!result?.pokemon,
          raidEvent: mode === 'event' && event ? event.key : null,
        },
      },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  const bossRatio = boss.maxHp > 0 ? Math.max(0, boss.currentHp / boss.maxHp) : 0,
    isEventMode = mode === 'event' && !!event

  return jsxs('div', {
    className: `minigame-scene tera-raid-scene${isEventMode ? ' gmax-raid-scene' : ''}`,
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', {
            className: 'minigame-scene-title',
            children: isEventMode ? 'Gigantamax Raid' : 'Tera Raid',
          }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              '\u2605'.repeat(info.stars),
              ` \u00b7 ${info.teraType} Tera \u00b7 ${Math.max(0, Math.round(bossRatio * 100))}%`,
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children:
          phase === 'done'
            ? jsx(MinigameRewardScreen, {
                prize: result,
                onCollect: leave,
                summary: jsx('span', {
                  className: 'raid-summary',
                  children: result?.pokemon
                    ? `${info.name} caught at Lv.${info.level}`
                    : `${info.name} escaped the ball`,
                }),
              })
            : [
                isEventMode &&
                  jsx('div', {
                    className: 'raid-event-banner',
                    children: [
                      jsx('span', { className: 'raid-event-name', children: event.name }),
                      jsx('span', {
                        className: 'raid-event-sub',
                        children: 'Limited-time Gigantamax raid',
                      }),
                    ],
                  }),
                !started &&
                  event &&
                  jsxs('div', {
                    className: 'raid-mode-toggle',
                    children: [
                      jsx('button', {
                        className: `raid-mode-btn${mode === 'event' ? ' active' : ''}`,
                        onClick: () => chooseMode('event'),
                        children: 'EVENT',
                      }),
                      jsx('button', {
                        className: `raid-mode-btn${mode === 'tera' ? ' active' : ''}`,
                        onClick: () => chooseMode('tera'),
                        children: 'TERA',
                      }),
                    ],
                  }),
                jsxs('div', {
                  className: 'royal-arena',
                  children: [
                    active
                      ? jsx(RaidFighter, {
                          speciesKey: active.speciesKey,
                          name: active.name,
                          level: active.level,
                          hp: active.currentHp,
                          maxHp: active.maxHp,
                          down: active.currentHp <= 0,
                          ally: !!active.isAlly,
                        })
                      : jsx(RaidFighter, { speciesKey: '', name: '', hp: 0, maxHp: 0, empty: true }),
                    jsx('span', { className: 'royal-versus', children: 'VS' }),
                    jsx(RaidFighter, {
                      speciesKey: info.speciesKey,
                      name: info.name,
                      level: info.level,
                      hp: boss.currentHp,
                      maxHp: boss.maxHp,
                      stars: info.stars,
                      teraType: info.teraType,
                      down: boss.currentHp <= 0,
                    }),
                  ],
                }),
                last &&
                  jsxs('div', {
                    className: `royal-result${last.won ? ' win' : ' loss'}`,
                    children: [
                      jsx('span', {
                        className: 'royal-result-title',
                        children: last.won
                          ? 'The crystal cracks!'
                          : `${last.ally} was knocked out`,
                      }),
                      jsx('span', {
                        className: 'royal-result-sub',
                        children: `${last.turns} turn${last.turns === 1 ? '' : 's'}`,
                      }),
                    ],
                  }),
                jsxs('div', {
                  className: 'royal-party',
                  children: fighters.map((member, index) =>
                    jsxs(
                      'div',
                      {
                        className: `royal-member${member.currentHp <= 0 ? ' fainted' : ''}${
                          index === activeIndex ? ' active' : ''
                        }${member.isAlly ? ' raid-ally' : ''}`,
                        children: [
                          jsx('img', {
                            className: 'royal-member-sprite',
                            src: getPokemonSpriteUrl(pokemonSpecies[member.speciesKey]?.id ?? 0),
                            onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                              (event.target.src = getPokemonSpriteFallbackUrl(
                                pokemonSpecies[member.speciesKey]?.id ?? 0
                              )),
                            alt: member.name,
                          }),
                          jsxs('span', {
                            className: 'royal-member-info',
                            children: [
                              jsxs('span', {
                                className: 'royal-member-name',
                                children: [
                                  member.name,
                                  member.currentHp <= 0 && jsx('span', { className: 'royal-ko', children: 'KO' }),
                                  index === activeIndex &&
                                    member.currentHp > 0 &&
                                    jsx('span', {
                                      className: 'royal-in',
                                      children: member.isAlly ? 'ALLY' : 'IN',
                                    }),
                                ],
                              }),
                              jsxs('span', {
                                className: 'royal-member-hp',
                                children: [
                                  jsx('span', {
                                    className: 'royal-hp-fill',
                                    style: {
                                      width: `${Math.max(0, (member.currentHp / member.maxHp) * 100)}%`,
                                    },
                                  }),
                                  `${Math.max(0, member.currentHp)}/${member.maxHp}`,
                                ],
                              }),
                            ],
                          }),
                        ],
                      },
                      `${member.name}-${index}`
                    )
                  ),
                }),
                jsx('div', { className: 'minigame-scene-log', children: log }),
              ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          phase !== 'done' &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: leave,
              children: 'FLEE',
            }),
          phase === 'ready' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              disabled: !active,
              onClick: attack,
              children: active ? `ATTACK (${active.name})` : 'NO PARTY',
            }),
        ],
      }),
    ],
  })
}
