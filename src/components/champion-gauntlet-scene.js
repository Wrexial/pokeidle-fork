// The Champions' Gauntlet, played as a full-stage scene while the reducer is in
// the `championGauntlet` phase. A bracket of named trainers (gym leaders, then
// Elite Four, then a Champion) each field their endgame team; the party fights
// them one trainer at a time, fully healing the survivors between rounds. The
// run ends when the whole party is down, and the prize scales with how deep it
// got.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  buildGauntletBracket,
  CHAMPION_GAUNTLET_HEAL,
  createOpponent,
  gauntletPrize,
  gauntletTierLabel,
  healSquad,
  simulateBattle,
  toBattlePokemon,
} from '../game/minigames.js'
import {
  getBossTrainerSpriteUrl,
  getPokemonSpriteFallbackUrl,
  getPokemonSpriteUrl,
} from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/**
 * @param {{ speciesKey: string, size?: 'lg' | 'sm' }} props
 */
function GauntletMon({ speciesKey, size = 'sm' }) {
  const species = pokemonSpecies[speciesKey],
    id = species?.id ?? 0
  return jsx('img', {
    className: `gauntlet-mon gauntlet-mon-${size}`,
    src: getPokemonSpriteUrl(id),
    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
      (event.target.src = getPokemonSpriteFallbackUrl(id)),
    alt: species?.name ?? speciesKey,
    title: species?.name ?? speciesKey,
  })
}

export function ChampionGauntletScene() {
  const { state, dispatch } = useGame(),
    [bracket] = React.useState(() => buildGauntletBracket()),
    [squad, setSquad] = React.useState(() =>
      state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
    ),
    [activeIndex, setActiveIndex] = React.useState(() =>
      state.party.findIndex((member) => member.currentHp > 0)
    ),
    [index, setIndex] = React.useState(0),
    [beaten, setBeaten] = React.useState(0),
    [phase, setPhase] = React.useState(/** @type {'ready' | 'between' | 'done'} */ ('ready')),
    [log, setLog] = React.useState('The bracket is set. Your first opponent steps up.'),
    [lastResult, setLastResult] = React.useState(
      /** @type {{ trainer: any, won: boolean, defeated: number, total: number } | null} */ (null)
    ),
    [result, setResult] = React.useState(/** @type {ReturnType<typeof gauntletPrize> | null} */ (null)),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(!1)

  const trainer = bracket[index] ?? null,
    partyAlive = squad.some((member) => member.currentHp > 0),
    best = state.minigameRecords?.championGauntlet?.best ?? 0

  /** @param {any[]} list */
  function findAlive(list) {
    return list.findIndex((member) => member.currentHp > 0)
  }

  function fight() {
    if (phase !== 'ready' || !trainer) return
    const nextSquad = squad.map((member) => ({ ...member }))
    let defeated = 0,
      wiped = false
    outer: for (const member of trainer.team) {
      while (true) {
        const allyIdx = findAlive(nextSquad)
        if (allyIdx === -1) {
          wiped = true
          break outer
        }
        const ally = nextSquad[allyIdx],
          enemy = createOpponent(member.speciesKey, member.level),
          outcome = simulateBattle(ally, enemy)
        if (outcome.won) break
        // A faint benches the Pokemon and the next alive one steps in; a stall
        // (neither side down inside the turn cap) ends the run.
        if (!outcome.playerFainted) {
          wiped = true
          break outer
        }
      }
      defeated += 1
    }
    const nextActive = findAlive(nextSquad)
    setActiveIndex(nextActive)
    setSquad(nextSquad)
    if (wiped || nextActive === -1) {
      setLastResult({
        trainer,
        won: false,
        defeated,
        total: trainer.team.length,
      })
      setLog(
        `${trainer.name} holds the line \u2014 your party is out after beating ${beaten} trainer${
          beaten === 1 ? '' : 's'
        }.`
      )
      finish(beaten)
      return
    }
    const nextBeaten = index + 1
    setBeaten(nextBeaten)
    setLastResult({ trainer, won: true, defeated, total: trainer.team.length })
    if (state.sfxEnabled) playSfx('good')
    if (nextBeaten >= bracket.length) {
      setLog(`${trainer.name} is beaten \u2014 the Gauntlet is yours!`)
      finish(nextBeaten)
      return
    }
    // Full heal between trainers (never reviving a fainted Pokemon).
    setSquad(healSquad(nextSquad, CHAMPION_GAUNTLET_HEAL))
    setIndex(nextBeaten)
    setPhase('between')
    setLog(`${trainer.name} is beaten \u2014 the party recovers and the next trainer steps up.`)
  }

  function nextTrainer() {
    setPhase('ready')
    const upcoming = bracket[index]
    if (upcoming)
      setLog(`${upcoming.name} (${gauntletTierLabel(upcoming.tier)}) sends out their team.`)
  }

  /** @param {number} beatenCount */
  function finish(beatenCount) {
    if (settledRef.current) return
    settledRef.current = !0
    if (state.sfxEnabled) playSfx('coin')
    const prize = gauntletPrize(beatenCount)
    setResult(prize)
    setPhase('done')
  }

  function leave() {
    collect(
      {
        type: 'END_MINIGAME',
        payload: {
          minigame: 'championGauntlet',
          score: beaten,
          completed: beaten >= bracket.length,
        },
      },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene gauntlet-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: "Champions' Gauntlet" }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Trainer ${Math.min(index + 1, bracket.length)}/${bracket.length}`,
              ' \u00b7 ',
              `${beaten} beaten`,
              best > 0 ? ` \u00b7 Best ${best}` : '',
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children:
          phase === 'done'
            ? [jsx(MinigameRewardScreen, {
                prize: result,
                onCollect: leave,
                summary: jsx('span', {
                  className: 'gauntlet-summary',
                  children: `${beaten} of ${bracket.length} trainers beaten`,
                }),
              })]
            : [
                jsxs('div', {
                  className: 'gauntlet-layout',
                  children: [
                    jsxs('div', {
                      className: 'gauntlet-bracket',
                      children: bracket.map((entry, entryIndex) =>
                        jsxs(
                          'div',
                          {
                            className: `gauntlet-entry${entryIndex < beaten ? ' beaten' : ''}${
                              entryIndex === index ? ' current' : ''
                            }`,
                            children: [
                              jsx('img', {
                                className: 'gauntlet-entry-sprite',
                                src: getBossTrainerSpriteUrl(entry.spriteKey ?? ''),
                                alt: entry.name,
                                onError: /** @param {{ target: HTMLImageElement }} event */ (
                                  event
                                ) => (event.target.style.visibility = 'hidden'),
                              }),
                              jsxs('span', {
                                className: 'gauntlet-entry-info',
                                children: [
                                  jsx('span', {
                                    className: 'gauntlet-entry-name',
                                    children: entry.name,
                                  }),
                                  jsxs('span', {
                                    className: 'gauntlet-entry-tier',
                                    children: [
                                      gauntletTierLabel(entry.tier),
                                      entryIndex < beaten ? ' \u00b7 BEATEN' : '',
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          },
                          entry.id ?? entryIndex
                        )
                      ),
                    }),
                    jsxs('div', {
                      className: 'gauntlet-stage',
                      children: [
                        lastResult &&
                          !lastResult.won &&
                          jsxs('div', {
                            className: 'gauntlet-result loss',
                            children: [
                              jsx('span', {
                                className: 'gauntlet-result-title',
                                children: `${lastResult.trainer.name}'s team stopped you`,
                              }),
                              jsx('span', {
                                className: 'gauntlet-result-sub',
                                children: `You took down ${lastResult.defeated}/${lastResult.total} before your party fell.`,
                              }),
                            ],
                          }),
                        trainer &&
                          jsxs('div', {
                            className: 'gauntlet-current',
                            children: [
                              jsx('img', {
                                className: 'gauntlet-trainer-sprite',
                                src: getBossTrainerSpriteUrl(trainer.spriteKey ?? ''),
                                alt: trainer.name,
                                onError: /** @param {{ target: HTMLImageElement }} event */ (
                                  event
                                ) => (event.target.style.visibility = 'hidden'),
                              }),
                              jsxs('div', {
                                className: 'gauntlet-current-info',
                                children: [
                                  jsx('span', {
                                    className: 'gauntlet-current-name',
                                    children: trainer.name,
                                  }),
                                  jsxs('span', {
                                    className: 'gauntlet-current-title',
                                    children: [
                                      gauntletTierLabel(trainer.tier),
                                      ' \u00b7 ',
                                      trainer.region.toUpperCase(),
                                    ],
                                  }),
                                  jsx('div', {
                                    className: 'gauntlet-team',
                                    children: trainer.team.map((member, memberIndex) =>
                                      jsx(
                                        GauntletMon,
                                        { speciesKey: member.speciesKey, size: 'lg' },
                                        memberIndex
                                      )
                                    ),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        lastResult?.won &&
                          jsxs('div', {
                            className: 'gauntlet-result win',
                            children: [
                              jsx('span', {
                                className: 'gauntlet-result-title',
                                children: `${lastResult.trainer.name} defeated!`,
                              }),
                              jsx('span', {
                                className: 'gauntlet-result-sub',
                                children: `All ${lastResult.defeated} Pokemon beaten \u00b7 ${
                                  index >= bracket.length
                                    ? 'final trainer'
                                    : `next: ${bracket[index]?.name ?? ''}`
                                }`,
                              }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
                jsxs('div', {
                  className: 'gauntlet-party-row',
                  children: [
                    jsx('span', {
                      className: 'gauntlet-party-label',
                      children: 'Your party',
                    }),
                    jsxs('div', {
                      className: 'gauntlet-party',
                      children: squad.map((member, memberIndex) =>
                        jsxs(
                          'div',
                          {
                            className: `royal-member${member.currentHp <= 0 ? ' fainted' : ''}${
                              memberIndex === activeIndex ? ' active' : ''
                            }`,
                            children: [
                              jsx('img', {
                                className: 'royal-member-sprite',
                                src: getPokemonSpriteUrl(
                                  pokemonSpecies[member.speciesKey]?.id ?? 0
                                ),
                                onError: /** @param {{ target: HTMLImageElement }} event */ (
                                  event
                                ) =>
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
                                      member.currentHp <= 0 &&
                                        jsx('span', { className: 'royal-ko', children: 'KO' }),
                                      memberIndex === activeIndex &&
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
                                          width: `${Math.max(
                                            0,
                                            (member.currentHp / member.maxHp) * 100
                                          )}%`,
                                        },
                                      }),
                                      `${Math.max(0, member.currentHp)}/${member.maxHp}`,
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          },
                          `${member.name}-${memberIndex}`
                        )
                      ),
                    }),
                  ],
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
              children: 'FORFEIT',
            }),
          phase === 'ready' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              disabled: !partyAlive || !trainer,
              onClick: fight,
              children: `FIGHT ${trainer ? `(${trainer.name.toUpperCase()})` : ''}`,
            }),
          phase === 'between' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: nextTrainer,
              children: 'NEXT TRAINER',
            }),
        ],
      }),
    ],
  })
}
