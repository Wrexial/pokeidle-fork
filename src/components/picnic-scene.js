// Paldea's Picnic, played as a full-stage scene while the reducer is in the
// `picnic` phase. Pick three fillings (their types set the sandwich's type),
// drop them onto the bread without toppling it, then a wild Pokemon of that
// type appears with tripled shiny odds.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { createBattlePokemon } from '../game/combat.js'
import {
  PICNIC_BREAD,
  PICNIC_INGREDIENTS,
  PICNIC_PICKS,
  PICNIC_SHINY_MULTIPLIER,
  PICNIC_SWING_MS,
  ingredientById,
  picnicDropScore,
  rollPicnicEncounter,
  rollSandwichType,
  sandwichTypes,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { checkShinyOdds, shinyOddsForSpecies } from '../game/progression.js'

/** Pastel fill colours cycled through the stacked layers. */
const PICNIC_COLORS = [
  '#e8c98a',
  '#7cc45a',
  '#e05a4a',
  '#f2d24a',
  '#d98aa0',
  '#f0e6c8',
  '#8ac46a',
  '#6aa84f',
  '#c46a3a',
  '#b07ac4',
]

export function PicnicScene() {
  const { state, dispatch } = useGame(),
    region = mapData[state.currentLocation]?.region ?? 'paldea',
    [stage, setStage] = React.useState(
      /** @type {'choose' | 'stack' | 'reward' | 'failed'} */ ('choose')
    ),
    [picks, setPicks] = React.useState(/** @type {string[]} */ ([])),
    [position, setPosition] = React.useState(-0.5),
    [layers, setLayers] = React.useState(
      () => /** @type {{ ingredientId: string, offset: number, grade: string }[]} */ ([])
    ),
    [score, setScore] = React.useState(0),
    [lastGrade, setLastGrade] = React.useState(''),
    [pending, setPending] = React.useState(
      () =>
        /** @type {{ enemy: any, speciesKey: string, level: number, isShiny: boolean, type: string } | null} */ (
          null
        )
    ),
    startedRef = React.useRef(false),
    startRef = React.useRef(Date.now()),
    posRef = React.useRef(-0.5),
    layersRef = React.useRef(
      /** @type {{ ingredientId: string, offset: number, grade: string }[]} */ ([])
    ),
    scoreRef = React.useRef(0),
    finishedRef = React.useRef(false)

  // Sweep the next filling back and forth over the plate while stacking.
  React.useEffect(() => {
    if (stage !== 'stack') return
    startRef.current = Date.now()
    startedRef.current = false
    const tick = setInterval(() => {
      if (finishedRef.current) return
      const elapsed = Date.now() - startRef.current,
        phase = (elapsed / PICNIC_SWING_MS) % 2,
        next = phase <= 1 ? -0.5 + phase : 1.5 - phase
      startedRef.current = true
      posRef.current = next
      setPosition(next)
    }, 30)
    return () => clearInterval(tick)
  }, [stage])

  /** @param {string} id */
  function chooseIngredient(id) {
    if (stage !== 'choose') return
    if (state.sfxEnabled) playSfx('tap')
    setPicks((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id)
      if (current.length >= PICNIC_PICKS) return current
      return [...current, id]
    })
  }

  function build() {
    if (stage !== 'choose' || picks.length !== PICNIC_PICKS) return
    layersRef.current = [{ ingredientId: PICNIC_BREAD.id, offset: 0, grade: 'perfect' }]
    scoreRef.current = 0
    finishedRef.current = false
    setLayers([...layersRef.current])
    setScore(0)
    setStage('stack')
  }

  function buildReward() {
    const type = state.challengeMonotype ?? rollSandwichType(picks)
    if (!type) {
      setStage('failed')
      return
    }
    const party = state.party ?? [],
      averageLevel =
        party.length > 0
          ? Math.round(party.reduce((sum, member) => sum + member.level, 0) / party.length)
          : 20,
      baseLevel = Math.max(5, Math.min(75, averageLevel + Math.floor(scoreRef.current / 150))),
      encounter = rollPicnicEncounter(type, region, baseLevel)
    if (!encounter) {
      setStage('failed')
      return
    }
    const completedGenerationSet = completedGenerations(state.pokedexCaught),
      isShiny = checkShinyOdds(
        Math.max(
          1,
          Math.round(
            shinyOddsForSpecies(encounter.speciesKey, completedGenerationSet) /
              PICNIC_SHINY_MULTIPLIER
          )
        )
      ),
      enemy = createBattlePokemon(encounter.speciesKey, encounter.level, {
        isShiny,
        wild: true,
      })
    // Flags this as a minigame find so the battle offers a manual catch.
    enemy.fromActivity = true
    setPending({
      enemy,
      speciesKey: encounter.speciesKey,
      level: encounter.level,
      isShiny,
      type,
    })
    if (state.sfxEnabled) playSfx('win')
    setStage('reward')
  }

  function drop() {
    if (stage !== 'stack' || finishedRef.current || !startedRef.current) return
    const placedFillings = layersRef.current.filter(
        (layer) => layer.ingredientId !== PICNIC_BREAD.id
      ).length,
      ingredientId = picks[placedFillings]
    if (!ingredientId) return
    const offset = posRef.current,
      result = picnicDropScore(offset)
    layersRef.current = [...layersRef.current, { ingredientId, offset, grade: result.grade }]
    scoreRef.current += result.points
    setLayers([...layersRef.current])
    setScore(scoreRef.current)
    setLastGrade(result.grade)
    if (state.sfxEnabled) playSfx(result.topple ? 'miss' : result.grade === 'perfect' ? 'great' : 'good')
    if (result.topple) {
      finishedRef.current = true
      setStage('failed')
      return
    }
    if (placedFillings + 1 >= PICNIC_PICKS) {
      // Cap the sandwich with the top slice of Bread.
      layersRef.current = [
        ...layersRef.current,
        { ingredientId: PICNIC_BREAD.id, offset: 0, grade: 'perfect' },
      ]
      setLayers([...layersRef.current])
      finishedRef.current = true
      buildReward()
    }
  }

  function fight() {
    if (!pending) return
    dispatch({ type: 'MARK_SEEN', payload: { speciesKey: pending.speciesKey } })
    dispatch({ type: 'START_ENCOUNTER', payload: { enemy: pending.enemy } })
  }

  function leave() {
    dispatch({
      type: 'END_MINIGAME',
      payload: { score, completed: stage === 'reward' },
    })
  }

  const placedFillings = layers.filter((layer) => layer.ingredientId !== PICNIC_BREAD.id).length,
    nextIngredient = stage === 'stack' ? ingredientById(picks[placedFillings]) : null,
    previewTypes = sandwichTypes(picks),
    spawnSpecies = pending ? pokemonSpecies[pending.speciesKey] : null

  return jsxs('div', {
    className: 'minigame-scene picnic-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Picnic' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children:
              stage === 'choose'
                ? `${picks.length}/${PICNIC_PICKS} picked`
                : stage === 'stack'
                  ? `Score ${score} \u00b7 Stack ${placedFillings}/${PICNIC_PICKS}`
                  : stage === 'reward'
                    ? `${pending?.type ?? ''} sandwich`
                    : (lastGrade === 'topple' ? 'The stack toppled!' : 'No Pokemon'),
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children:
          stage === 'choose'
            ? jsxs('div', {
                className: 'picnic-choose',
                children: [
                  jsxs('div', {
                    className: 'picnic-request',
                    children: [
                      'Pick ',
                      jsx('strong', { children: PICNIC_PICKS }),
                      ' fillings \u2014 their types lure out the Pokemon.',
                    ],
                  }),
                  jsx('div', {
                    className: 'picnic-ingredients',
                    children: PICNIC_INGREDIENTS.map((ingredient) => {
                      const picked = picks.includes(ingredient.id)
                      return jsxs(
                        'button',
                        {
                          className: `picnic-ingredient${picked ? ' picked' : ''}`,
                          onClick: () => chooseIngredient(ingredient.id),
                          'aria-pressed': picked,
                          children: [
                            jsx('span', {
                              className: 'picnic-ingredient-emoji',
                              children: ingredient.emoji,
                            }),
                            jsx('span', {
                              className: 'picnic-ingredient-name',
                              children: ingredient.name,
                            }),
                            jsx('span', {
                              className: `type-badge type-${ingredient.type.toLowerCase()}`,
                              children: ingredient.type,
                            }),
                          ],
                        },
                        ingredient.id
                      )
                    }),
                  }),
                  jsxs('div', {
                    className: 'picnic-order',
                    children: [
                      jsx('span', {
                        className: 'picnic-order-bread',
                        children: PICNIC_BREAD.emoji,
                      }),
                      ...picks.map((id) => {
                        const ingredient = ingredientById(id)
                        return jsx(
                          'span',
                          { className: 'picnic-order-item', children: ingredient?.emoji ?? '' },
                          id
                        )
                      }),
                      jsx('span', {
                        className: 'picnic-order-bread',
                        children: PICNIC_BREAD.emoji,
                      }),
                    ],
                  }),
                  jsx('div', {
                    className: 'picnic-type-preview',
                    children:
                      previewTypes.length > 0
                        ? jsxs('span', {
                            children: [
                              'Sandwich type: one of ',
                              jsx('strong', { children: previewTypes.join(' / ') }),
                            ],
                          })
                        : 'Pick at least one filling.',
                  }),
                ],
              })
            : stage === 'stack'
              ? jsxs('div', {
                  className: 'picnic-board',
                  children: [
                    jsx('div', {
                      className: 'picnic-swing',
                      children: nextIngredient
                        ? jsxs('span', {
                            className: 'picnic-piece',
                            style: { left: `${(position + 0.5) * 100}%` },
                            children: [nextIngredient.emoji, ' ', nextIngredient.name],
                          })
                        : null,
                    }),
                    jsxs('div', {
                      className: 'picnic-stack',
                      children: [
                        jsx('div', { className: 'picnic-plate' }),
                        ...layers.map((layer, index) => {
                          const ingredient = ingredientById(layer.ingredientId)
                          return jsx(
                            'span',
                            {
                              className: `picnic-layer${ingredient?.id === PICNIC_BREAD.id ? ' bread' : ''} grade-${layer.grade}`,
                              style: {
                                left: `${50 + layer.offset * 100}%`,
                                bottom: `${8 + index * 15}px`,
                                background:
                                  ingredient?.id === PICNIC_BREAD.id
                                    ? '#e8c98a'
                                    : PICNIC_COLORS[index % PICNIC_COLORS.length],
                              },
                              title: `${ingredient?.name ?? layer.ingredientId} +${picnicDropScore(layer.offset).points}`,
                              children: ingredient?.emoji,
                            },
                            index
                          )
                        }),
                      ],
                    }),
                    jsx('button', {
                      className: 'picnic-drop-btn',
                      onClick: drop,
                      children: 'DROP',
                    }),
                  ],
                })
              : stage === 'reward' && pending && spawnSpecies
                ? jsxs('div', {
                    className: `picnic-spawn${pending.isShiny ? ' shiny' : ''}`,
                    children: [
                      jsx('img', {
                        className: 'picnic-spawn-sprite',
                        src: getPokemonSpriteUrl(spawnSpecies.id, false, pending.isShiny),
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(
                            spawnSpecies.id,
                            false,
                            pending.isShiny
                          )),
                        alt: spawnSpecies.name,
                      }),
                      jsxs('span', {
                        className: 'picnic-spawn-name',
                        children: [
                          pending.isShiny ? '\u2605 ' : '',
                          spawnSpecies.name,
                        ],
                      }),
                      jsx('span', {
                        className: 'picnic-spawn-level',
                        children: `Lv.${pending.level}`,
                      }),
                      jsx('div', {
                        className: 'picnic-spawn-types',
                        children: (spawnSpecies.types ?? []).map((type) =>
                          jsx(
                            'span',
                            {
                              className: `type-badge type-${type.toLowerCase()}`,
                              children: type,
                            },
                            type
                          )
                        ),
                      }),
                      jsxs('span', {
                        className: 'picnic-spawn-odds',
                        children: [
                          `Shiny odds \u00d7${PICNIC_SHINY_MULTIPLIER}`,
                          ' \u00b7 ',
                          `${pending.type} sandwich`,
                        ],
                      }),
                    ],
                  })
                : jsx('div', {
                    className: 'picnic-failed',
                    children: lastGrade === 'topple'
                      ? 'The sandwich toppled and the Pokemon slipped away.'
                      : 'Nothing turned up for this sandwich.',
                  }),
      }),
      jsx('div', {
        className: 'minigame-scene-footer',
        children:
          stage === 'choose'
            ? jsxs('div', {
                className: 'activity-actions',
                children: [
                  jsx('button', {
                    className: 'move-panel-btn confirm',
                    disabled: picks.length !== PICNIC_PICKS,
                    onClick: build,
                    children: 'BUILD',
                  }),
                  jsx('button', {
                    className: 'move-panel-btn cancel',
                    onClick: leave,
                    children: 'LEAVE',
                  }),
                ],
              })
            : stage === 'stack'
              ? jsx('button', {
                  className: 'move-panel-btn cancel',
                  onClick: leave,
                  children: 'LEAVE',
                })
              : stage === 'reward'
                ? jsxs('div', {
                    className: 'activity-actions',
                    children: [
                      jsx('button', {
                        className: 'move-panel-btn confirm',
                        onClick: fight,
                        children: 'BATTLE',
                      }),
                      jsx('button', {
                        className: 'move-panel-btn cancel',
                        onClick: leave,
                        children: 'LET IT GO',
                      }),
                    ],
                  })
                : jsx('button', {
                    className: 'move-panel-btn confirm',
                    onClick: leave,
                    children: 'CONTINUE',
                  }),
      }),
    ],
  })
}
