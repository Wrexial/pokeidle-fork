// Galar's Dynamax Adventures, played as a full-stage scene while the reducer is
// in the `dynamaxAdventures` phase. Pick a path through each stage's encounter,
// then face a legendary from Galar's raid pool. Beat it to catch it; wipe and
// the adventure is over.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  DYNAMAX_STAGES,
  createOpponent,
  dynamaxBoss,
  dynamaxPaths,
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
    [boss] = React.useState(() => dynamaxBoss()),
    [phase, setPhase] = React.useState(
      /** @type {'choose' | 'boss' | 'done'} */ ('choose')
    ),
    [log, setLog] = React.useState('Choose a path through the Max Lair.'),
    [caught, setCaught] = React.useState(
      /** @type {{ speciesKey: string } | null} */ (null)
    ),
    [result, setResult] = React.useState(
      /** @type {ReturnType<typeof dynamaxPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(!1)

  const baseLevel = Math.max(...squad.map((member) => member.level), 5),
    active = activeIndex >= 0 ? squad[activeIndex] : null

  /** @param {any} info */
  function fight(info) {
    if (!active) return
    const nextSquad = squad.map((member) => ({ ...member })),
      ally = nextSquad[activeIndex],
      enemy = createOpponent(info.speciesKey, info.level),
      outcome = simulateBattle(ally, enemy)
    setSquad(nextSquad)
    if (outcome.won) {
      if (state.sfxEnabled) playSfx('good')
      const nextStage = stage + 1
      if (nextStage >= DYNAMAX_STAGES) {
        // One last breather before the legendary.
        setSquad(healSquad(nextSquad, 0.5))
        setStage(nextStage)
        setPhase('boss')
        setLog(`${info.name} defeated! The legendary ${boss.name} awaits.`)
      } else {
        setSquad(healSquad(nextSquad, 0.3))
        setStage(nextStage)
        setPaths(dynamaxPaths(nextStage, baseLevel))
        setLog(`${info.name} defeated! Choose the next path.`)
      }
      return
    }
    const nextIndex = nextSquad.findIndex(
      (member, index) => index !== activeIndex && member.currentHp > 0
    )
    if (nextIndex === -1) finish(stage, !1)
    else {
      if (state.sfxEnabled) playSfx('miss')
      setActiveIndex(nextIndex)
      setLog(`${ally.name} went down. ${nextSquad[nextIndex].name} takes over!`)
    }
  }

  function challengeBoss() {
    if (!active) return
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
      const nextIndex = nextSquad.findIndex(
        (member, index) => index !== activeIndex && member.currentHp > 0
      )
      if (nextIndex === -1) finish(stage, !1)
      else {
        setActiveIndex(nextIndex)
        setLog(`${ally.name} went down. ${nextSquad[nextIndex].name} steps up!`)
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
      { type: 'END_MINIGAME' },
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
              `Stage ${Math.min(stage + 1, DYNAMAX_STAGES + 1)}/${DYNAMAX_STAGES + 1}`,
              ' \u00b7 ',
              active ? active.name : 'Party down',
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
          phase === 'choose'
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
                          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
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
            : phase === 'boss'
              ? jsxs('div', {
                  className: 'dynamax-boss',
                  children: [
                    jsx('span', { className: 'dynamax-boss-tag', children: 'LEGENDARY' }),
                    jsx('img', {
                      className: 'dynamax-boss-sprite',
                      src: getPokemonSpriteUrl(spriteFor(boss.speciesKey)),
                      onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                        (event.target.src = getPokemonSpriteFallbackUrl(spriteFor(boss.speciesKey))),
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
