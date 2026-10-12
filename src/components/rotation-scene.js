// The Battle Tower rotation court, played as a full-stage scene while the
// reducer is in the `rotation` phase. Each side fields a trio but only the
// active Pokemon fights; the player can rotate for free before each round, the
// AI rotates to its best matchup, and a fainted member is replaced by the next
// healthy one. Clear all three foes to win a bout; the squad heals a little and
// a fresh trio steps up.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  createOpponent,
  nextHealthyIndex,
  rotationOpponents,
  rotationPrize,
  runRotationRound,
  toBattlePokemon,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** A won bout heals the surviving squad a little. */
const ROTATION_HEAL = 0.25

/** @param {any[]} list */
function cloneBattlers(list) {
  return list.map((member) => ({ ...member }))
}

/**
 * One roster card. `onRotate` is set only on the player's side and only while
 * the member can actually take the active slot.
 * @param {{ pokemon: any, side: 'ally' | 'foe', active?: boolean, hit?: boolean, onRotate?: () => void }} props
 */
function RotationFighter({ pokemon, side, active, hit, onRotate }) {
  if (!pokemon)
    return jsx('div', { className: 'doubles-fighter doubles-empty', children: '?' })
  const id = pokemonSpecies[pokemon.speciesKey]?.id ?? 0,
    ratio =
      pokemon.maxHp > 0 ? Math.max(0, Math.min(1, (pokemon.currentHp ?? 0) / pokemon.maxHp)) : 0,
    down = (pokemon.currentHp ?? 0) <= 0
  return jsxs('button', {
    className: `doubles-fighter rotation-fighter ${side}${down ? ' down' : ''}${
      active ? ' active' : ''
    }${hit ? ' hit' : ''}`,
    disabled: !onRotate || down,
    onClick: onRotate,
    title: down ? `${pokemon.name} has fainted` : undefined,
    children: [
      jsx('img', {
        className: 'doubles-sprite',
        src: getPokemonSpriteUrl(id),
        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
          (event.target.src = getPokemonSpriteFallbackUrl(id)),
        alt: pokemon.name,
      }),
      jsx('span', { className: 'doubles-name', children: pokemon.name }),
      jsx('span', { className: 'doubles-level', children: `Lv.${pokemon.level}` }),
      jsxs('div', {
        className: 'doubles-hp',
        children: [
          jsx('span', {
            className: 'doubles-hp-fill',
            style: { width: `${ratio * 100}%` },
          }),
          jsx('span', {
            className: 'doubles-hp-text',
            children: `${Math.max(0, pokemon.currentHp ?? 0)}/${pokemon.maxHp}`,
          }),
        ],
      }),
      active ? jsx('span', { className: 'rotation-active-tag', children: 'ACTIVE' }) : null,
    ],
  })
}

export function RotationScene() {
  const { state, dispatch } = useGame(),
    initialState = React.useMemo(() => {
      const squad = state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
      return squad.filter((member) => member.currentHp > 0).slice(0, 3)
    }, [state.party]),
    [allies, setAllies] = React.useState(initialState),
    baseLevel = Math.max(5, ...state.party.map((member) => member.level)),
    [foes, setFoes] = React.useState(() =>
      rotationOpponents(baseLevel, 1).map((info) => createOpponent(info.speciesKey, info.level))
    ),
    [allyActive, setAllyActive] = React.useState(0),
    [foeActive, setFoeActive] = React.useState(0),
    [wins, setWins] = React.useState(0),
    [phase, setPhase] = React.useState(/** @type {'ready' | 'done'} */ ('ready')),
    [log, setLog] = React.useState('Your squad steps onto the rotation court. Pick a lead.'),
    [lastMessages, setLastMessages] = React.useState(/** @type {string[]} */ ([])),
    [hit, setHit] = React.useState(/** @type {'ally' | 'foe' | null} */ (null)),
    [result, setResult] = React.useState(
      /** @type {ReturnType<typeof rotationPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(!1),
    partyAlive = allies.some((member) => member.currentHp > 0)

  function fight() {
    if (phase !== 'ready') return
    const nextAllies = cloneBattlers(allies),
      nextFoes = cloneBattlers(foes)
    const round = runRotationRound(nextAllies, allyActive, nextFoes, foeActive)
    setLastMessages(round.log.slice(-6))
    setHit(round.log.some((line) => /used/.test(line)) ? 'foe' : null)
    window.setTimeout(() => setHit(null), 500)

    let nextAllyActive = round.allyActive,
      nextFoeActive = round.foeActive
    // Replace any fainted active with the next healthy member.
    if (!(nextAllies[nextAllyActive]?.currentHp > 0))
      nextAllyActive = nextHealthyIndex(nextAllies, nextAllyActive)
    if (!(nextFoes[nextFoeActive]?.currentHp > 0))
      nextFoeActive = nextHealthyIndex(nextFoes, nextFoeActive)
    setAllies(nextAllies)
    setFoes(nextFoes)
    setAllyActive(nextAllyActive)
    setFoeActive(nextFoeActive)

    if (!nextAllies.some((member) => member.currentHp > 0)) {
      finish(wins)
      return
    }
    if (nextFoes.every((foe) => foe.currentHp <= 0)) {
      const nextWins = wins + 1,
        healed = nextAllies.map((member) =>
          member.currentHp > 0
            ? {
                ...member,
                currentHp: Math.min(
                  member.maxHp,
                  member.currentHp + Math.round(member.maxHp * ROTATION_HEAL)
                ),
              }
            : member
        )
      setAllies(healed)
      setWins(nextWins)
      setFoes(
        rotationOpponents(baseLevel, nextWins + 1).map((info) =>
          createOpponent(info.speciesKey, info.level)
        )
      )
      setAllyActive(nextHealthyIndex(healed, -1))
      setFoeActive(0)
      setLog(`Bout ${nextWins} won! The squad recovers a little and a fresh trio steps up.`)
      if (state.sfxEnabled) playSfx('good')
      return
    }
    setLog(`The round ends \u2014 ${nextFoes.filter((foe) => foe.currentHp > 0).length} foe(s) left.`)
    if (state.sfxEnabled) playSfx('good')
  }

  /** @param {number} totalWins */
  function finish(totalWins) {
    if (settledRef.current) return
    settledRef.current = !0
    const prize = rotationPrize(totalWins)
    setResult(prize)
    setLog(`${prize.label} \u2014 ${totalWins} bout${totalWins === 1 ? '' : 's'} won.`)
    setPhase('done')
    if (state.sfxEnabled) playSfx('coin')
  }

  function leave() {
    collect(
      {
        type: 'END_MINIGAME',
        payload: { minigame: 'rotation', score: wins, completed: wins > 0 },
      },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  const bestWins = state.minigameRecords?.rotation?.best ?? 0,
    slots = Array.from({ length: 3 }, (_, index) => index)
  return jsxs('div', {
    className: 'minigame-scene doubles-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Battle Tower Rotation' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [`Bouts won ${wins}`, bestWins > 0 ? ` \u00b7 Best ${bestWins}` : ''],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children:
          phase === 'done'
            ? [
                jsx(MinigameRewardScreen, {
                  prize: result,
                  onCollect: leave,
                  summary: jsx('span', {
                    className: 'doubles-summary',
                    children: `${wins} bout${wins === 1 ? '' : 's'} won`,
                  }),
                }),
              ]
            : [
                jsxs('div', {
                  className: 'doubles-arena doubles-arena-triple',
                  children: [
                    jsxs('div', {
                      className: 'doubles-side',
                      children: slots.map((index) =>
                        jsx(
                          RotationFighter,
                          {
                            pokemon: allies[index],
                            side: 'ally',
                            active: index === allyActive,
                            hit: hit === 'ally',
                            onRotate: () => setAllyActive(index),
                          },
                          `ally-${index}`
                        )
                      ),
                    }),
                    jsx('span', { className: 'doubles-versus', children: 'VS' }),
                    jsxs('div', {
                      className: 'doubles-side',
                      children: slots.map((index) =>
                        jsx(
                          RotationFighter,
                          { pokemon: foes[index], side: 'foe', active: index === foeActive, hit: hit === 'foe' },
                          `foe-${index}`
                        )
                      ),
                    }),
                  ],
                }),
                jsx('p', {
                  className: 'rotation-hint',
                  children:
                    'Tap one of your Pokemon to make it the active fighter \u2014 rotating is free, and only the active Pokemon acts each round.',
                }),
                lastMessages.length > 0 &&
                  jsx('div', {
                    className: 'doubles-round-log',
                    children: lastMessages.map((message, index) =>
                      jsx('div', { className: 'doubles-round-line', children: message }, index)
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
              children: 'FORFEIT',
            }),
          phase === 'ready' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              disabled: !partyAlive,
              onClick: fight,
              children: 'FIGHT ROUND',
            }),
        ],
      }),
    ],
  })
}
