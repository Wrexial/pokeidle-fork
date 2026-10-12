// The Battle Maison doubles court and the Battle Tower's triple court, played
// as a full-stage scene while the reducer is in the `doubles` / `triples` phase.
// Two (or three) of the player's Pokemon face the same number of foes at once;
// each round every battler picks a target, the actions resolve in speed order
// and spread moves hit the other side. A fainted ally is replaced from the
// bench; clearing every foe wins the bout.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  createOpponent,
  doublesOpponents,
  doublesPrize,
  runDoublesRound,
  toBattlePokemon,
  triplesOpponents,
  triplesPrize,
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

/**
 * @param {{ size?: number }} props
 */
export function DoublesScene({ size = 2 }) {
  const { state, dispatch } = useGame(),
    minigameId = size === 3 ? 'triples' : 'doubles',
    buildOpponents = size === 3 ? triplesOpponents : doublesOpponents,
    prizeFor = size === 3 ? triplesPrize : doublesPrize,
    initialState = React.useMemo(() => {
      const squad = state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
      return {
        allies: squad.filter((member) => member.currentHp > 0).slice(0, size),
        bench: squad.filter((member) => member.currentHp > 0).slice(size),
      }
    }, [state.party, size]),
    [allies, setAllies] = React.useState(initialState.allies),
    [bench, setBench] = React.useState(initialState.bench),
    baseLevel = Math.max(5, ...state.party.map((member) => member.level)),
    [foes, setFoes] = React.useState(() =>
      buildOpponents(baseLevel, 1).map((info) => createOpponent(info.speciesKey, info.level))
    ),
    [wins, setWins] = React.useState(0),
    [phase, setPhase] = React.useState(/** @type {'ready' | 'done'} */ ('ready')),
    [log, setLog] = React.useState(
      size === 3
        ? 'Three of your Pokemon step onto the triple court.'
        : 'Two of your Pokemon step onto the doubles court.'
    ),
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

    // Tag a fresh bench Pokemon in for any fainted ally. Every slot is kept (a
    // fainted slot stays as a downed placeholder when the bench is empty), so
    // the round engine and its residual pass always see a full side.
    let benchLeft = [...bench]
    const activeAllies = nextAllies.map((member) => {
      if (member.currentHp > 0 || benchLeft.length === 0) return member
      return /** @type {BattlePokemon} */ (benchLeft.shift())
    })
    setBench(benchLeft)
    setAllies(activeAllies)

    const foesDown = nextFoes.every((foe) => foe.currentHp <= 0)
    if (!activeAllies.some((member) => member.currentHp > 0)) {
      finish(wins)
      return
    }
    if (foesDown) {
      const nextWins = wins + 1,
        healed = activeAllies.map((member) =>
          member.currentHp > 0
            ? {
                ...member,
                currentHp: Math.min(
                  member.maxHp,
                  member.currentHp + Math.round(member.maxHp * DOUBLES_HEAL)
                ),
              }
            : member
        )
      setAllies(healed)
      setWins(nextWins)
      setFoes(
        buildOpponents(baseLevel, nextWins + 1).map((info) =>
          createOpponent(info.speciesKey, info.level)
        )
      )
      setLog(`Bout ${nextWins} won! The squad recovers a little and new foes step up.`)
      if (state.sfxEnabled) playSfx('good')
      return
    }
    // One foe down but the rest are still standing: fight on. The fainted slot
    // stays in place so the next round still sees a full side.
    setFoes(nextFoes)
    setLog(`The round ends \u2014 ${nextFoes.filter((foe) => foe.currentHp > 0).length} foe(s) left.`)
    if (state.sfxEnabled) playSfx('good')
  }

  /** @param {number} totalWins */
  function finish(totalWins) {
    if (settledRef.current) return
    settledRef.current = !0
    const prize = prizeFor(totalWins)
    setResult(prize)
    setLog(`${prize.label} \u2014 ${totalWins} bout${totalWins === 1 ? '' : 's'} won.`)
    setPhase('done')
    if (state.sfxEnabled) playSfx('coin')
  }

  function leave() {
    collect(
      {
        type: 'END_MINIGAME',
        payload: { minigame: minigameId, score: wins, completed: wins > 0 },
      },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  const bestWins = state.minigameRecords?.[minigameId]?.best ?? 0,
    region = mapData[state.currentLocation]?.region,
    courtName =
      size === 3
        ? 'Battle Tower Triples'
        : region === 'hoenn'
          ? 'Battle Tower Doubles'
          : 'Battle Maison Doubles',
    slots = Array.from({ length: size }, (_, index) => index)
  return jsxs('div', {
    className: 'minigame-scene doubles-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: courtName }),
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
                  className: `doubles-arena${size === 3 ? ' doubles-arena-triple' : ''}`,
                  children: [
                    jsxs('div', {
                      className: 'doubles-side',
                      children: slots.map((index) =>
                        jsx(
                          DoublesFighter,
                          {
                            pokemon: allies[index],
                            side: 'ally',
                            active: index === 0,
                            hit: hit === 'ally',
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
                          DoublesFighter,
                          { pokemon: foes[index], side: 'foe', hit: hit === 'foe' },
                          `foe-${index}`
                        )
                      ),
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
