// Galar's Dynamax Adventures, played as a full-stage scene while the reducer is
// in the `dynamaxAdventures` phase. Scout a legendary from the Max Lair's real
// raid pool, pick a path through each stage's encounter (each clear drops a
// pickup), then face the legendary. Beat it to catch it; wipe — or run out of
// KOs — and the adventure is over.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  DYNAMAX_STAGES,
  applyDynamaxPickup,
  createOpponent,
  dynamaxBossOptions,
  dynamaxKoLimit,
  dynamaxPaths,
  dynamaxPickup,
  dynamaxPrize,
  healSquad,
  simulateBattle,
  toBattlePokemon,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** @param {string} speciesKey */
function spriteFor(speciesKey) {
  return pokemonSpecies[speciesKey]?.id ?? 0
}

export function DynamaxAdventuresScene() {
  const { state, dispatch } = useGame(),
    [squad, setSquad] = React.useState(() =>
      state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
    ),
    [activeIndex, setActiveIndex] = React.useState(() =>
      state.party.findIndex((member) => member.currentHp > 0)
    ),
    [stage, setStage] = React.useState(0),
    [paths, setPaths] = React.useState(() =>
      dynamaxPaths(0, Math.max(...state.party.map((member) => member.level), 5))
    ),
    [bossOptions, setBossOptions] = React.useState(() =>
      dynamaxBossOptions('galar', state.challengeMonotype)
    ),
    [boss, setBoss] = React.useState(/** @type {any} */ (null)),
    [phase, setPhase] = React.useState(
      /** @type {'scout' | 'choose' | 'boss' | 'done'} */ ('scout')
    ),
    [log, setLog] = React.useState('Scout the legendary you want to hunt.'),
    [kos, setKos] = React.useState(0),
    [pickups, setPickups] = React.useState(
      /** @type {{ id: string, label: string, icon: string }[]} */ ([])
    ),
    [caught, setCaught] = React.useState(
      /** @type {{ speciesKey: string } | null} */ (null)
    ),
    [result, setResult] = React.useState(
      /** @type {ReturnType<typeof dynamaxPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(!1)

  const baseLevel = Math.max(...squad.map((member) => member.level), 5),
    active = activeIndex >= 0 ? squad[activeIndex] : null,
    koLimit = dynamaxKoLimit(state.party.length),
    bestStages = state.minigameRecords?.dynamaxAdventures?.best ?? 0

  function reRoll() {
    setBossOptions(dynamaxBossOptions('galar', state.challengeMonotype))
    setLog('The Max Lair scouts a fresh set of legends.')
  }

  /** @param {any} option */
  function chooseBoss(option) {
    setBoss(option)
    setPhase('choose')
    setLog(`Hunting ${option.name}! Choose the first path.`)
  }

  /** @param {any} info */
  function fight(info) {
    if (!active) return
    const nextSquad = squad.map((member) => ({ ...member })),
      ally = nextSquad[activeIndex],
      enemy = createOpponent(info.speciesKey, info.level),
      outcome = simulateBattle(ally, enemy)
    if (outcome.won) {
      if (state.sfxEnabled) playSfx('good')
      const nextStage = stage + 1
      if (nextStage >= DYNAMAX_STAGES) {
        // One last breather before the legendary.
        setSquad(healSquad(nextSquad, 0.5))
        setStage(nextStage)
        setPhase('boss')
        setLog(`${info.name} defeated! The legendary ${boss?.name ?? 'foe'} awaits.`)
      } else {
        const pickup = dynamaxPickup()
        setSquad(applyDynamaxPickup(pickup.id, nextSquad, activeIndex))
        setPickups((current) => [...current, pickup])
        setStage(nextStage)
        setPaths(dynamaxPaths(nextStage, baseLevel))
        setLog(`${info.name} defeated! Found a ${pickup.label} — pick the next path.`)
      }
      return
    }
    // The active Pokemon fainted: bench it, count the KO, and check the limit.
    const nextKos = kos + 1,
      nextIndex = nextSquad.findIndex(
        (member, index) => index !== activeIndex && member.currentHp > 0
      )
    setSquad(nextSquad)
    setKos(nextKos)
    if (state.sfxEnabled) playSfx('miss')
    if (nextIndex === -1 || nextKos >= koLimit) finish(stage, !1)
    else {
      setActiveIndex(nextIndex)
      setLog(
        `${ally.name} went down (${nextKos}/${koLimit} KOs). ${nextSquad[nextIndex].name} takes over!`
      )
    }
  }

  function challengeBoss() {
    if (!active || !boss) return
    const nextSquad = squad.map((member) => ({ ...member })),
      ally = nextSquad[activeIndex],
      enemy = createOpponent(boss.speciesKey, boss.level),
      outcome = simulateBattle(ally, enemy)
    setSquad(nextSquad)
    if (outcome.won) {
      if (state.sfxEnabled) playSfx('win')
      setCaught({ speciesKey: boss.speciesKey })
      dispatch({
        type: 'CATCH_POKEMON',
        payload: { speciesKey: boss.speciesKey, level: boss.level },
      })
      dispatch({ type: 'MARK_CAUGHT', payload: { speciesKey: boss.speciesKey } })
      finish(DYNAMAX_STAGES, !0)
    } else {
      if (state.sfxEnabled) playSfx('miss')
      const nextKos = kos + 1,
        nextIndex = nextSquad.findIndex(
          (member, index) => index !== activeIndex && member.currentHp > 0
        )
      setKos(nextKos)
      if (nextIndex === -1 || nextKos >= koLimit) finish(stage, !1)
      else {
        setActiveIndex(nextIndex)
        setLog(
          `${ally.name} went down (${nextKos}/${koLimit} KOs). ${nextSquad[nextIndex].name} steps up!`
        )
      }
    }
  }

  /** @param {number} stages @param {boolean} bossWon */
  function finish(stages, bossWon) {
    if (settledRef.current) return
    settledRef.current = !0
    const prize = dynamaxPrize(stages, bossWon)
    setResult(prize)
    setLog(prize.label)
    setPhase('done')
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'dynamaxAdventures', score: stage } },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene dynamax-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Dynamax Adventures' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              phase === 'scout'
                ? 'Scouting'
                : `Stage ${Math.min(stage + 1, DYNAMAX_STAGES + 1)}/${DYNAMAX_STAGES + 1}`,
              ' \u00b7 ',
              active ? active.name : 'Party down',
              ` \u00b7 KOs ${kos}/${koLimit}`,
              bestStages > 0 ? ` \u00b7 Best ${bestStages}` : '',
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: phase === 'done'
          ? jsx(MinigameRewardScreen, {
              prize: result,
              onCollect: leave,
              summary: caught
                ? jsxs('div', {
                    className: 'dynamax-caught',
                    children: [
                      jsx('img', {
                        className: 'dynamax-boss-sprite',
                        src: getPokemonSpriteUrl(spriteFor(caught.speciesKey)),
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(
                            spriteFor(caught.speciesKey)
                          )),
                        alt: pokemonSpecies[caught.speciesKey]?.name ?? caught.speciesKey,
                      }),
                      jsx('span', {
                        children: `Caught ${pokemonSpecies[caught.speciesKey]?.name ?? caught.speciesKey}!`,
                      }),
                    ],
                  })
                : undefined,
            })
          : [
              phase === 'scout'
                ? jsxs('div', {
                    className: 'dynamax-scout',
                    children: [
                      jsx('span', {
                        className: 'dynamax-scout-hint',
                        children: 'Scout the legendary you are hunting \u2014 re-roll for a fresh set.',
                      }),
                      jsx('div', {
                        className: 'dynamax-paths',
                        children: bossOptions.map((option, index) =>
                          jsxs(
                            'button',
                            {
                              className: 'dynamax-path',
                              onClick: () => chooseBoss(option),
                              children: [
                                jsx('img', {
                                  className: 'dynamax-path-sprite',
                                  src: getPokemonSpriteUrl(spriteFor(option.speciesKey)),
                                  onError: /** @param {{ target: HTMLImageElement }} event */ (
                                    event
                                  ) =>
                                    (event.target.src = getPokemonSpriteFallbackUrl(
                                      spriteFor(option.speciesKey)
                                    )),
                                  alt: option.name,
                                }),
                                jsxs('span', {
                                  className: 'dynamax-path-info',
                                  children: [
                                    jsx('strong', { children: option.name }),
                                    `Lv.${option.level}`,
                                  ],
                                }),
                              ],
                            },
                            `${option.speciesKey}-${index}`
                          )
                        ),
                      }),
                      jsx('button', {
                        className: 'dynamax-reroll',
                        onClick: reRoll,
                        children: '\u{1F504} RE-ROLL',
                      }),
                    ],
                  })
                : phase === 'choose'
                  ? jsx('div', {
                      className: 'dynamax-paths',
                      children: paths.map((path, index) =>
                        jsxs(
                          'button',
                          {
                            className: 'dynamax-path',
                            onClick: () => fight(path),
                            children: [
                              jsx('img', {
                                className: 'dynamax-path-sprite',
                                src: getPokemonSpriteUrl(spriteFor(path.speciesKey)),
                                onError:
                                  /** @param {{ target: HTMLImageElement }} event */ (event) =>
                                    (event.target.src = getPokemonSpriteFallbackUrl(
                                      spriteFor(path.speciesKey)
                                    )),
                                alt: path.name,
                              }),
                              jsxs('span', {
                                className: 'dynamax-path-info',
                                children: [
                                  jsx('strong', { children: path.name }),
                                  `Lv.${path.level}`,
                                ],
                              }),
                            ],
                          },
                          `${path.speciesKey}-${index}`
                        )
                      ),
                    })
                  : phase === 'boss' && boss
                    ? jsxs('div', {
                        className: 'dynamax-boss',
                        children: [
                          jsx('span', { className: 'dynamax-boss-tag', children: 'LEGENDARY' }),
                          jsx('img', {
                            className: 'dynamax-boss-sprite',
                            src: getPokemonSpriteUrl(spriteFor(boss.speciesKey)),
                            onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                              (event.target.src = getPokemonSpriteFallbackUrl(
                                spriteFor(boss.speciesKey)
                              )),
                            alt: boss.name,
                          }),
                          jsxs('span', {
                            className: 'dynamax-path-info',
                            children: [
                              jsx('strong', { children: boss.name }),
                              `Lv.${boss.level}`,
                            ],
                          }),
                        ],
                      })
                    : jsxs('div', {
                        className: 'dynamax-boss',
                        children: [
                          jsx('span', {
                            className: 'dynamax-path-info',
                            children: result?.label ?? '',
                          }),
                        ],
                      }),
              pickups.length > 0 &&
                jsxs('div', {
                  className: 'dynamax-pickups',
                  children: [
                    jsx('span', { className: 'dynamax-pickups-label', children: 'Found:' }),
                    ...pickups.map((pickup, index) =>
                      jsx(
                        'span',
                        {
                          className: 'dynamax-pickup-chip',
                          title: pickup.label,
                          children: pickup.icon,
                        },
                        `${pickup.id}-${index}`
                      )
                    ),
                  ],
                }),
              jsx('div', {
                className: 'royal-party',
                children: squad.map((member, index) =>
                  jsxs(
                    'div',
                    {
                      className: `royal-member${member.currentHp <= 0 ? ' fainted' : ''}${
                        index === activeIndex ? ' active' : ''
                      }`,
                      children: [
                        jsx('span', { className: 'royal-member-name', children: member.name }),
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
              children: 'RETREAT',
            }),
          phase === 'boss' &&
            boss &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: challengeBoss,
              children: `CHALLENGE ${boss.name.toUpperCase()}`,
            }),
        ],
      }),
    ],
  })
}
