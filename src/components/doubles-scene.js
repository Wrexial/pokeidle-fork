// Kalos's Battle Maison doubles court, played as a full-stage scene while the
// reducer is in the `doubles` phase. Two of the player's Pokemon face two foes
// at once; each round every battler picks a target, the actions resolve in
// speed order and spread moves hit both. A fainted ally is replaced from the
// bench; clearing both foes wins the bout.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  createOpponent,
  doublesOpponents,
  doublesPrize,
  runDoublesRound,
  toBattlePokemon,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** A faint heals the surviving side between bouts. */
const DOUBLES_HEAL = 0.25

/** @param {any[]} list */
function cloneBattlers(list) {
  return list.map((member) => ({ ...member }))
}

/**
 * @param {{ pokemon: any, side: 'ally' | 'foe', active?: boolean, hit?: boolean }} props
 */
function DoublesFighter({ pokemon, side, active, hit }) {
  if (!pokemon)
    return jsx('div', { className: 'doubles-fighter doubles-empty', children: '?' })
  const id = pokemonSpecies[pokemon.speciesKey]?.id ?? 0,
    ratio =
      pokemon.maxHp > 0 ? Math.max(0, Math.min(1, (pokemon.currentHp ?? 0) / pokemon.maxHp)) : 0,
    down = (pokemon.currentHp ?? 0) <= 0
  return jsxs('div', {
    className: `doubles-fighter ${side}${down ? ' down' : ''}${active ? ' active' : ''}${
      hit ? ' hit' : ''
    }`,
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
    ],
  })
}

export function DoublesScene() {
  const { state, dispatch } = useGame(),
    initialState = React.useMemo(() => {
      const squad = state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
      return {
        allies: squad.filter((member) => member.currentHp > 0).slice(0, 2),
        bench: squad.filter((member) => member.currentHp > 0).slice(2),
      }
    }, [state.party]),
    [allies, setAllies] = React.useState(initialState.allies),
    [bench, setBench] = React.useState(initialState.bench),
    baseLevel = Math.max(5, ...state.party.map((member) => member.level)),
    [foes, setFoes] = React.useState(() =>
      doublesOpponents(baseLevel, 1).map((info) => createOpponent(info.speciesKey, info.level))
    ),
    [wins, setWins] = React.useState(0),
    [phase, setPhase] = React.useState(/** @type {'ready' | 'done'} */ ('ready')),
    [log, setLog] = React.useState('Two of your Pokemon step onto the doubles court.'),
    [lastMessages, setLastMessages] = React.useState(/** @type {string[]} */ ([])),
    [hit, setHit] = React.useState(/** @type {'ally' | 'foe' | null} */ (null)),
    [result, setResult] = React.useState(
      /** @type {ReturnType<typeof doublesPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(!1),
    partyAlive = allies.some((member) => member.currentHp > 0)

  function fight() {
    if (phase !== 'ready') return
    const nextAllies = cloneBattlers(allies),
      nextFoes = cloneBattlers(foes)
    const round = runDoublesRound(nextAllies, nextFoes)
    setLastMessages(round.log.slice(-6))
    setHit(round.log.some((line) => /used/.test(line)) ? 'foe' : null)
    window.setTimeout(() => setHit(null), 500)

    // Tag a fresh bench Pokemon in for any fainted ally.
    let benchLeft = [...bench],
      activeAllies = nextAllies.filter((member) => member.currentHp > 0)
    while (activeAllies.length < 2 && benchLeft.length > 0) {
      const next = benchLeft.shift()
      activeAllies = [...activeAllies, next]
    }
    setBench(benchLeft)
    setAllies(activeAllies)

    const foesDown = nextFoes.every((foe) => foe.currentHp <= 0)
    if (!activeAllies.some((member) => member.currentHp > 0)) {
      finish(wins)
      return
    }
    if (foesDown) {
      const nextWins = wins + 1,
        healed = activeAllies.map((member) => ({
          ...member,
          currentHp: Math.min(
            member.maxHp,
            member.currentHp + Math.round(member.maxHp * DOUBLES_HEAL)
          ),
        }))
      setAllies(healed)
      setWins(nextWins)
      setFoes(
        doublesOpponents(baseLevel, nextWins + 1).map((info) =>
          createOpponent(info.speciesKey, info.level)
        )
      )
      setLog(`Bout ${nextWins} won! The squad recovers a little and two new foes step up.`)
      if (state.sfxEnabled) playSfx('good')
      return
    }
    // One foe down but the other is still standing: fight on.
    setFoes(nextFoes.filter((foe) => foe.currentHp > 0))
    setLog(`The round ends \u2014 ${nextFoes.filter((foe) => foe.currentHp > 0).length} foe(s) left.`)
    if (state.sfxEnabled) playSfx('good')
  }

  /** @param {number} totalWins */
  function finish(totalWins) {
    if (settledRef.current) return
    settledRef.current = !0
    const prize = doublesPrize(totalWins)
    setResult(prize)
    setLog(`${prize.label} \u2014 ${totalWins} bout${totalWins === 1 ? '' : 's'} won.`)
    setPhase('done')
    if (state.sfxEnabled) playSfx('coin')
  }

  function leave() {
    collect(
      {
        type: 'END_MINIGAME',
        payload: { minigame: 'doubles', score: wins, completed: wins > 0 },
      },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  const bestWins = state.minigameRecords?.doubles?.best ?? 0
  return jsxs('div', {
    className: 'minigame-scene doubles-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Battle Maison Doubles' }),
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
                  className: 'doubles-arena',
                  children: [
                    jsxs('div', {
                      className: 'doubles-side',
                      children: [
                        jsx(DoublesFighter, {
                          pokemon: allies[0],
                          side: 'ally',
                          active: true,
                          hit: hit === 'ally',
                        }),
                        jsx(DoublesFighter, { pokemon: allies[1], side: 'ally' }),
                      ],
                    }),
                    jsx('span', { className: 'doubles-versus', children: 'VS' }),
                    jsxs('div', {
                      className: 'doubles-side',
                      children: [
                        jsx(DoublesFighter, { pokemon: foes[0], side: 'foe', hit: hit === 'foe' }),
                        jsx(DoublesFighter, { pokemon: foes[1], side: 'foe' }),
                      ],
                    }),
                  ],
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
