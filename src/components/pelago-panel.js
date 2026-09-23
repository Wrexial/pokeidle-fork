// Poké Pelago's passive islands panel: staff an island with boxed Pokemon and
// collect what they produce over your battles.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { PELAGO_ISLANDS, PELAGO_SLOTS } from '../game/pelago.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, pokemonDisplayName } from '../game/pokemon.js'

export function PelagoIslandsPanel() {
  const { state, dispatch } = useGame(),
    [pickerIsland, setPickerIsland] = React.useState(/** @type {string | null} */ (null)),
    pelago = state.pelago ?? {},
    assignedIds = new Set(
      Object.values(pelago).flatMap((island) => island.assigned)
    ),
    available = state.box.filter((member) => !assignedIds.has(member.id)),
    findMember = /** @param {string} id */ (id) =>
      state.box.find((member) => member.id === id) ??
      state.party.find((member) => member.id === id)
  return jsxs('div', {
    className: 'pelago-islands',
    children: [
      jsx('p', {
        className: 'daycare-hint',
        children:
          'Staff an island with boxed Pokemon. They work while you battle \u2014 come back and collect what they produced.',
      }),
      ...Object.values(PELAGO_ISLANDS).map((island) => {
        const entry = pelago[island.id] ?? { assigned: [], progress: 0, ready: 0 }
        return jsxs(
          'div',
          {
            className: `pelago-island${entry.ready > 0 ? ' ready' : ''}`,
            children: [
              jsxs('div', {
                className: 'pelago-island-head',
                children: [
                  jsxs('span', {
                    className: 'pelago-island-name',
                    children: [island.icon, ' ', island.name],
                  }),
                  entry.ready > 0
                    ? jsx('span', {
                        className: 'pelago-island-ready',
                        children: `READY x${entry.ready}`,
                      })
                    : null,
                ],
              }),
              jsx('p', { className: 'pelago-island-desc', children: island.description }),
              jsx('div', {
                className: 'pelago-slots',
                children: Array.from({ length: PELAGO_SLOTS }, (_, index) => {
                  const id = entry.assigned[index],
                    member = id ? findMember(id) : null
                  if (!member)
                    return jsx('span', { className: 'pelago-slot empty', children: '+' }, index)
                  const species = pokemonSpecies[member.speciesKey]
                  return jsxs(
                    'button',
                    {
                      className: 'pelago-slot filled',
                      title: 'Remove from this island',
                      onClick: () =>
                        dispatch({
                          type: 'UNASSIGN_PELAGO',
                          payload: { islandId: island.id, pokemonId: member.id },
                        }),
                      children: [
                        jsx('img', {
                          className: 'pelago-slot-sprite',
                          src: getPokemonSpriteUrl(species.id, !1, member.isShiny),
                          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                            (event.target.src = getPokemonSpriteFallbackUrl(
                              species.id,
                              !1,
                              member.isShiny
                            )),
                          alt: member.name,
                        }),
                        jsxs('span', {
                          className: 'pelago-slot-name',
                          children: [pokemonDisplayName(member), ` Lv.${member.level}`],
                        }),
                      ],
                    },
                    member.id
                  )
                }),
              }),
              jsxs('div', {
                className: 'pelago-progress',
                children: [
                  jsx('div', {
                    className: 'pelago-progress-bar',
                    children: jsx('div', {
                      className: 'pelago-progress-fill',
                      style: {
                        width: `${Math.max(0, Math.min(100, (entry.progress / island.goal) * 100))}%`,
                      },
                    }),
                  }),
                  jsx('span', {
                    className: 'pelago-progress-label',
                    children: `${entry.progress} / ${island.goal} battles`,
                  }),
                ],
              }),
              jsxs('div', {
                className: 'pelago-island-actions',
                children: [
                  jsx('button', {
                    className: 'pelago-collect-btn',
                    disabled: entry.ready <= 0,
                    onClick: () =>
                      dispatch({ type: 'COLLECT_PELAGO', payload: { islandId: island.id } }),
                    children: entry.ready > 0 ? `COLLECT (${entry.ready})` : 'COLLECT',
                  }),
                  jsx('button', {
                    className: 'pelago-assign-btn',
                    disabled: entry.assigned.length >= PELAGO_SLOTS || available.length === 0,
                    onClick: () =>
                      setPickerIsland(pickerIsland === island.id ? null : island.id),
                    children: 'ASSIGN',
                  }),
                ],
              }),
              pickerIsland === island.id &&
                jsx('div', {
                  className: 'pelago-picker',
                  children:
                    available.length > 0
                      ? available.map((member) => {
                          const species = pokemonSpecies[member.speciesKey]
                          return jsxs(
                            'button',
                            {
                              className: 'pelago-pick',
                              onClick: () => {
                                dispatch({
                                  type: 'ASSIGN_PELAGO',
                                  payload: { islandId: island.id, pokemonId: member.id },
                                })
                                setPickerIsland(null)
                              },
                              children: [
                                jsx('img', {
                                  className: 'pelago-pick-sprite',
                                  src: getPokemonSpriteUrl(species.id, !1, member.isShiny),
                                  onError: /** @param {{ target: HTMLImageElement }} event */ (
                                    event
                                  ) =>
                                    (event.target.src = getPokemonSpriteFallbackUrl(
                                      species.id,
                                      !1,
                                      member.isShiny
                                    )),
                                  alt: member.name,
                                }),
                                jsxs('span', {
                                  children: [pokemonDisplayName(member), ` Lv.${member.level}`],
                                }),
                              ],
                            },
                            member.id
                          )
                        })
                      : jsx('span', { className: 'daycare-hint', children: 'No free Pokemon.' }),
                }),
            ],
          },
          island.id
        )
      }),
    ],
  })
}
