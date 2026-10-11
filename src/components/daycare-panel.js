// The Daycare, hosted on a route in every region. Deposit two compatible Box
// Pokemon to breed eggs, then collect the Egg here (it hatches in the party).

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import {
  DAYCARE_LOCATIONS,
  breedShinyOdds,
  breedShinyParentOdds,
  daycareEggBattles,
} from '../data/config.js'
import { mapData, pokemonSpecies } from '../data/gameData.js'
import { NATURES } from '../data/natures.js'
import { useGame } from '../game/context.js'
import {
  BREEDING_GOALS,
  MAX_BREEDING_PROJECTS,
  breedingGoalLabel,
  createBreedingTracker,
} from '../game/breeding-projects.js'
import {
  breedingCompatibility,
  eggSpeciesKey,
  genderForPokemon,
  genderSymbol,
  isFemalePokemon,
} from '../game/breeding.js'
import {
  getPokemonSpriteFallbackUrl,
  getPokemonSpriteUrl,
  pokemonDisplayName,
} from '../game/pokemon.js'

const genderClass = (/** @type {'male' | 'female' | 'genderless'} */ gender) =>
  gender === 'male' ? 'gender-male' : gender === 'female' ? 'gender-female' : 'gender-none'

/** @param {{ pokemon: Pokemon }} props */
function ParentSlot({ pokemon }) {
  const species = pokemonSpecies[pokemon.speciesKey],
    gender = genderForPokemon(pokemon)
  return jsxs('div', {
    className: 'daycare-slot filled',
    children: [
      jsx('img', {
        className: 'daycare-slot-sprite',
        src: getPokemonSpriteUrl(species.id, !1, pokemon.isShiny, isFemalePokemon(pokemon)),
        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
          (event.target.src = getPokemonSpriteFallbackUrl(
            species.id,
            !1,
            pokemon.isShiny,
            isFemalePokemon(pokemon)
          )),
        alt: pokemon.name,
      }),
      jsxs('span', {
        className: 'daycare-slot-name',
        children: [
          pokemon.isShiny && jsx('span', { className: 'shiny-star', children: '★' }),
          pokemonDisplayName(pokemon),
          jsx('span', {
            className: `pokemon-gender ${genderClass(gender)}`,
            children: genderSymbol(gender),
          }),
        ],
      }),
      jsx('span', {
        className: 'daycare-slot-level',
        children: ['Lv', pokemon.level],
      }),
    ],
  })
}

export function DaycarePanel() {
  const { state, dispatch } = useGame(),
    [query, setQuery] = React.useState(''),
    [projectGoal, setProjectGoal] = React.useState('any'),
    [projectNature, setProjectNature] = React.useState(NATURES[0]?.key ?? 'hardy'),
    location = mapData[state.currentLocation],
    regionId = location?.region ?? 'kanto',
    daycareLocation = DAYCARE_LOCATIONS[regionId]

  if (!daycareLocation || state.currentLocation !== daycareLocation) return null

  const { parents, progress } = state.daycare,
    compatibility = breedingCompatibility(parents),
    breeding = state.breeding ?? createBreedingTracker(),
    projects = breeding.projects ?? [],
    breedable = compatibility.ok,
    ready = breedable && progress >= daycareEggBattles,
    hasShinyParent = parents.some((parent) => parent.isShiny),
    shinyOdds = hasShinyParent ? breedShinyParentOdds : breedShinyOdds,
    eggKey = breedable ? eggSpeciesKey(parents) : null,
    eggSpecies = eggKey ? pokemonSpecies[eggKey] : null,
    needle = query.trim().toLowerCase(),
    candidates = needle
      ? state.box.filter((member) => {
          const species = pokemonSpecies[member.speciesKey]
          return (
            pokemonDisplayName(member).toLowerCase().includes(needle) ||
            (species?.name ?? member.speciesKey).toLowerCase().includes(needle)
          )
        })
      : state.box

  return jsxs('div', {
    className: 'location-tower daycare-panel',
    children: [
      jsx('div', {
        className: 'location-section-title',
        children: 'Daycare',
      }),
      jsxs('div', {
        className: 'daycare-slots',
        children: [0, 1].map((slotIndex) => {
          const parent = parents[slotIndex]
          if (!parent)
            return jsx(
              'div',
              {
                className: 'daycare-slot empty',
                children: 'Empty',
              },
              `empty-${slotIndex}`
            )
          return jsxs(
            'div',
            {
              className: 'daycare-slot-button',
              children: [
                jsx(ParentSlot, {
                  pokemon: parent,
                }),
                jsx('button', {
                  className: 'daycare-withdraw-btn',
                  onClick: () =>
                    dispatch({
                      type: 'WITHDRAW_DAYCARE',
                      payload: {
                        pokemonId: parent.id,
                      },
                    }),
                  children: 'Withdraw',
                }),
              ],
            },
            parent.id
          )
        }),
      }),
      jsx('div', {
        className: 'tower-hint',
        children:
          parents.length < 2
            ? 'Deposit two compatible Pokemon from your Box below.'
            : compatibility.reason,
      }),
      breedable &&
        eggSpecies &&
        jsxs('div', {
          className: 'daycare-progress',
          children: [
            jsx('div', {
              className: 'daycare-progress-bar',
              children: jsx('div', {
                className: 'daycare-progress-fill',
                style: {
                  width: `${Math.min(100, (progress / daycareEggBattles) * 100)}%`,
                },
              }),
            }),
            jsx('span', {
              className: 'daycare-progress-label',
              children: ready
                ? 'Egg ready to collect!'
                : `${progress} / ${daycareEggBattles} battles`,
            }),
          ],
        }),
      jsxs('div', {
        className: 'daycare-tracker',
        children: [
          jsx('span', {
            className: 'daycare-tracker-line',
            children: `Eggs hatched: ${breeding.eggsHatched} \u00b7 Shinies: ${breeding.shinyEggsHatched} \u00b7 Since a shiny: ${breeding.eggsSinceShiny}`,
          }),
          jsx('span', {
            className: 'daycare-tracker-line',
            children: `Projects (${projects.length}/${MAX_BREEDING_PROJECTS})`,
          }),
          projects.length === 0
            ? jsx('span', {
                className: 'daycare-tracker-empty',
                children: 'No breeding projects queued.',
              })
            : jsx('div', {
                className: 'daycare-project-list',
                children: projects.map((project) =>
                  jsxs(
                    'div',
                    {
                      className: 'daycare-project-row',
                      children: [
                        jsx('span', {
                          className: 'daycare-project-name',
                          children: `${pokemonSpecies[project.speciesKey]?.name ?? project.speciesKey} \u00b7 ${breedingGoalLabel(project)}`,
                        }),
                        jsx('button', {
                          className: 'daycare-project-remove',
                          title: 'Remove project',
                          onClick: () =>
                            dispatch({
                              type: 'REMOVE_BREEDING_PROJECT',
                              payload: { projectId: project.id },
                            }),
                          children: 'X',
                        }),
                      ],
                    },
                    project.id
                  )
                ),
              }),
          breedable &&
            eggSpecies &&
            projects.length < MAX_BREEDING_PROJECTS &&
            jsxs('div', {
              className: 'daycare-project-add',
              children: [
                jsx('select', {
                  className: 'daycare-project-select',
                  value: projectGoal,
                  onChange: /** @param {React.ChangeEvent<HTMLSelectElement>} event */ (event) =>
                    setProjectGoal(event.target.value),
                  children: BREEDING_GOALS.map((goal) =>
                    jsx('option', { value: goal.value, children: goal.label }, goal.value)
                  ),
                }),
                projectGoal === 'nature' &&
                  jsx('select', {
                    className: 'daycare-project-select',
                    value: projectNature,
                    onChange: /** @param {React.ChangeEvent<HTMLSelectElement>} event */ (event) =>
                      setProjectNature(event.target.value),
                    children: NATURES.map((nature) =>
                      jsx('option', { value: nature.key, children: nature.name }, nature.key)
                    ),
                  }),
                jsx('button', {
                  className: 'gym-fight-btn',
                  onClick: () =>
                    dispatch({
                      type: 'ADD_BREEDING_PROJECT',
                      payload: {
                        speciesKey: eggKey,
                        goal: projectGoal,
                        nature: projectGoal === 'nature' ? projectNature : undefined,
                      },
                    }),
                  children: 'QUEUE',
                }),
              ],
            }),
        ],
      }),
      breedable &&
        eggSpecies &&
        jsx('div', {
          className: 'tower-hint',
          children: `An Egg of ${eggSpecies.name} is ready every ${daycareEggBattles} battles, with 1 in ${shinyOdds} shiny odds${
            hasShinyParent ? ' (boosted by a shiny parent)' : ''
          }. Eggs inherit 3 of the parents\u2019 best IVs, may inherit a nature, and can pass down moves. Collect it, then carry it in your party to hatch it.`,
        }),
      jsx('button', {
        className: 'gym-fight-btn',
        style: {
          width: '100%',
        },
        disabled: !ready,
        onClick: () => dispatch({ type: 'HATCH_DAYCARE_EGG' }),
        children: ready ? 'COLLECT EGG' : 'NOT READY YET',
      }),
      parents.length < 2 &&
        jsxs('div', {
          className: 'daycare-deposit',
          children: [
            jsx('div', {
              className: 'location-section-title',
              children: 'Deposit from the Box',
            }),
            state.box.length === 0
              ? jsx('div', {
                  className: 'tower-hint',
                  children: 'Your Box is empty.',
                })
              : jsxs('div', {
                  className: 'daycare-deposit-list',
                  children: [
                    state.box.length > 6 &&
                      jsx('input', {
                        className: 'daycare-deposit-search',
                        type: 'search',
                        placeholder: 'Search the Box\u2026',
                        value: query,
                        onChange: /** @param {React.ChangeEvent<HTMLInputElement>} event */ (
                          event
                        ) => setQuery(event.target.value),
                      }),
                    candidates.length === 0
                      ? jsx('div', {
                          className: 'tower-hint',
                          children: 'No Pokemon match.',
                        })
                      : candidates.map((member) => {
                          const species = pokemonSpecies[member.speciesKey],
                            gender = genderForPokemon(member),
                            compatible =
                              parents.length === 0 ||
                              breedingCompatibility([parents[0], member]).ok
                          return jsxs(
                            'div',
                            {
                              className: `daycare-deposit-row${compatible ? '' : ' incompatible'}`,
                              children: [
                                jsx('img', {
                                  className: 'daycare-deposit-sprite',
                                  src: getPokemonSpriteUrl(
                                    species.id,
                                    !1,
                                    member.isShiny,
                                    isFemalePokemon(member)
                                  ),
                                  onError: /** @param {{ target: HTMLImageElement }} event */ (
                                    event
                                  ) =>
                                    (event.target.src = getPokemonSpriteFallbackUrl(
                                      species.id,
                                      !1,
                                      member.isShiny,
                                      isFemalePokemon(member)
                                    )),
                                  alt: member.name,
                                }),
                                jsxs('div', {
                                  className: 'daycare-deposit-info',
                                  children: [
                                    jsxs('span', {
                                      className: 'daycare-deposit-name',
                                      children: [
                                        member.isShiny &&
                                          jsx('span', { className: 'shiny-star', children: '★' }),
                                        pokemonDisplayName(member),
                                        jsx('span', {
                                          className: `pokemon-gender ${genderClass(gender)}`,
                                          children: genderSymbol(gender),
                                        }),
                                      ],
                                    }),
                                    jsx('span', {
                                      className: 'daycare-deposit-detail',
                                      children: `Lv.${member.level} \u00b7 ${
                                        species.types.join('/')
                                      }`,
                                    }),
                                  ],
                                }),
                                jsx('button', {
                                  className: 'gym-fight-btn',
                                  disabled: !compatible,
                                  title: compatible ? void 0 : 'Cannot breed with the first parent',
                                  onClick: () =>
                                    dispatch({
                                      type: 'DEPOSIT_DAYCARE',
                                      payload: {
                                        pokemonId: member.id,
                                      },
                                    }),
                                  children: 'DEPOSIT',
                                }),
                              ],
                            },
                            member.id
                          )
                        }),
                  ],
                }),
          ],
        }),
    ],
  })
}
