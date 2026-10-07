// Paldea's Tera Raid, played as a full-stage scene while the reducer is in the
// `teraRaid` phase. A crystal boss with a Tera type and inflated HP; each healthy
// party member fights it in turn. Break the crystal and you catch the boss.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  createTeraRaidBoss,
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
 *   stars?: number, teraType?: string, down?: boolean, empty?: boolean }} props
 */
function RaidFighter({ speciesKey, name, level, hp, maxHp, stars, teraType, down, empty }) {
  if (empty) return jsx('div', { className: 'royal-fighter royal-empty', children: '?' })
  const id = pokemonSpecies[speciesKey]?.id ?? 0,
    ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  return jsxs('div', {
    className: `royal-fighter raid-fighter${down ? ' down' : ''}`,
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

export function TeraRaidScene() {
  const { state, dispatch } = useGame(),
    [squad, setSquad] = React.useState(() =>
      state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
    ),
    [info] = React.useState(() =>
      teraRaidBoss(Math.max(...state.party.map((member) => member.level ?? 5), 5))
    ),
    [boss, setBoss] = React.useState(() => createTeraRaidBoss(info)),
    [activeIndex, setActiveIndex] = React.useState(() =>
      state.party.findIndex((member) => member.currentHp > 0)
    ),
    [phase, setPhase] = React.useState(/** @type {'ready' | 'done'} */ ('ready')),
    [log, setLog] = React.useState(`A ${info.teraType}-Tera ${info.name} blocks the way!`),
    [last, setLast] = React.useState(
      /** @type {{ ally: string, won: boolean, turns: number } | null} */ (null)
    ),
    [result, setResult] = React.useState(
      () => /** @type {ReturnType<typeof teraRaidPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(false)

  const active = activeIndex >= 0 ? squad[activeIndex] : null

  /** @param {boolean} won */
  function finish(won) {
    if (settledRef.current) return
    settledRef.current = true
    if (state.sfxEnabled) playSfx(won ? 'catch' : 'miss')
    const prize = teraRaidPrize(info.stars, won, info.speciesKey, info.level)
    setResult(prize)
    setLog(
      won
        ? `${prize.label} ${info.name} was caught!`
        : `The crystal held \u2014 ${info.name} was left at ${Math.max(0, boss.currentHp)}/${boss.maxHp} HP.`
    )
    setPhase('done')
  }

  function attack() {
    if (phase !== 'ready' || !active) return
    const nextSquad = squad.map((member) => ({ ...member })),
      nextBoss = { ...boss },
      ally = nextSquad[activeIndex],
      outcome = simulateBattle(ally, nextBoss)
    setSquad(nextSquad)
    setBoss(nextBoss)
    setLast({ ally: ally.name, won: outcome.won, turns: outcome.turns })
    if (state.sfxEnabled) playSfx(outcome.won ? 'good' : 'miss')
    if (nextBoss.currentHp <= 0) {
      finish(true)
      return
    }
    const nextIndex = nextSquad.findIndex(
      (member, index) => index !== activeIndex && member.currentHp > 0
    )
    if (ally.currentHp <= 0 && nextIndex === -1) {
      finish(false)
      return
    }
    if (nextIndex !== -1) {
      setActiveIndex(nextIndex)
      setLog(
        `${ally.name} fell back \u2014 ${info.name} at ${Math.max(0, nextBoss.currentHp)}/${nextBoss.maxHp} HP. ${nextSquad[nextIndex].name} steps in!`
      )
    } else {
      setLog(`${ally.name} couldn't break it \u2014 ${info.name} at ${nextBoss.currentHp}/${nextBoss.maxHp} HP.`)
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
        },
      },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  const bossRatio = boss.maxHp > 0 ? Math.max(0, boss.currentHp / boss.maxHp) : 0

  return jsxs('div', {
    className: 'minigame-scene tera-raid-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Tera Raid' }),
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
                  children: squad.map((member, index) =>
                    jsxs(
                      'div',
                      {
                        className: `royal-member${member.currentHp <= 0 ? ' fainted' : ''}${
                          index === activeIndex ? ' active' : ''
                        }`,
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
                                    jsx('span', { className: 'royal-in', children: 'IN' }),
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
