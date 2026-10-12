// The Battle Tower free-for-all, played as a full-stage scene while the reducer
// is in the `freeForAll` phase. Four trainers (the player and three rivals) each
// field a small team and everyone can hit everyone; each round every surviving
// active Pokemon acts in speed order and the last trainer standing wins the
// bout. The squad heals a little between bouts and a fresh set of rivals steps
// in until the player is eliminated.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  activeMon,
  ffaPrize,
  ffaRivals,
  ownerAlive,
  runFreeForAllRound,
  survivors,
  toBattlePokemon,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** A won bout heals the surviving squad a little. */
const FFA_HEAL = 0.25

/** @param {any} participant */
function cloneParticipant(participant) {
  return { ...participant, team: participant.team.map((/** @type {any} */ mon) => ({ ...mon })) }
}

/** @param {{ participant: any, player?: boolean, hit?: boolean }} props */
function ParticipantCard({ participant, player, hit }) {
  const mon = activeMon(participant),
    species = mon ? pokemonSpecies[mon.speciesKey] : null,
    id = species?.id ?? 0,
    ratio = mon && mon.maxHp > 0 ? Math.max(0, Math.min(1, mon.currentHp / mon.maxHp)) : 0,
    down = !mon || mon.currentHp <= 0,
    remaining = participant.team.filter((/** @type {any} */ member) => member.currentHp > 0).length
  return jsxs('div', {
    className: `ffa-card${player ? ' player' : ''}${down ? ' down' : ''}${hit ? ' hit' : ''}`,
    children: [
      jsx('span', { className: 'ffa-card-name', children: participant.name }),
      mon &&
        jsx('img', {
          className: 'ffa-sprite',
          src: getPokemonSpriteUrl(id),
          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
            (event.target.src = getPokemonSpriteFallbackUrl(id)),
          alt: mon.name,
        }),
      jsx('span', { className: 'ffa-mon-name', children: down ? 'No Pokemon left' : mon.name }),
      jsxs('div', {
        className: 'doubles-hp',
        children: [
          jsx('span', { className: 'doubles-hp-fill', style: { width: `${ratio * 100}%` } }),
          jsx('span', {
            className: 'doubles-hp-text',
            children: mon ? `${Math.max(0, mon.currentHp)}/${mon.maxHp}` : '0/0',
          }),
        ],
      }),
      jsx('div', {
        className: 'ffa-pips',
        children: participant.team.map((/** @type {any} */ member, /** @type {number} */ index) =>
          jsx(
            'span',
            { className: `ffa-pip${member.currentHp > 0 ? ' alive' : ''}` },
            `${index}-${participant.id}`
          )
        ),
      }),
      jsx('span', {
        className: 'ffa-remaining',
        children: `${remaining} Pokemon left`,
      }),
    ],
  })
}

export function FreeForAllScene() {
  const { state, dispatch } = useGame(),
    initialState = React.useMemo(() => {
      const squad = state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
      return [
        {
          id: 'player',
          name: 'You',
          isPlayer: true,
          active: 0,
          team: squad.filter((member) => member.currentHp > 0).slice(0, 3),
        },
      ]
    }, [state.party]),
    baseLevel = Math.max(5, ...state.party.map((member) => member.level)),
    [participants, setParticipants] = React.useState(() => [
      ...initialState,
      ...ffaRivals(baseLevel, 1),
    ]),
    [wins, setWins] = React.useState(0),
    [phase, setPhase] = React.useState(/** @type {'ready' | 'done'} */ ('ready')),
    [log, setLog] = React.useState('Four trainers step into the ring. Last one standing wins.'),
    [lastMessages, setLastMessages] = React.useState(/** @type {string[]} */ ([])),
    [hits, setHits] = React.useState(/** @type {string[]} */ ([])),
    [result, setResult] = React.useState(
      /** @type {ReturnType<typeof ffaPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(!1),
    playerAlive = participants[0] ? ownerAlive(participants[0]) : false

  function fight() {
    if (phase !== 'ready') return
    const next = participants.map(cloneParticipant),
      before = next.map((participant) => activeMon(participant)?.currentHp ?? 0)
    const round = runFreeForAllRound(next)
    setLastMessages(round.log.slice(-8))
    const damaged = next
      .map((participant, index) => ({ participant, index }))
      .filter(({ participant, index }) => (activeMon(participant)?.currentHp ?? 0) < before[index])
      .map(({ participant }) => participant.id)
    setHits(damaged)
    window.setTimeout(() => setHits([]), 500)
    setParticipants(next)

    if (!ownerAlive(next[0])) {
      finish(wins)
      return
    }
    if (survivors(next) === 1) {
      // The player outlasted everyone: heal the squad and reset the rivals.
      const nextWins = wins + 1,
        healedPlayer = {
          ...next[0],
          team: next[0].team.map((/** @type {any} */ member) =>
            member.currentHp > 0
              ? {
                  ...member,
                  currentHp: Math.min(
                    member.maxHp,
                    member.currentHp + Math.round(member.maxHp * FFA_HEAL)
                  ),
                }
              : member
          ),
        }
      setParticipants([healedPlayer, ...ffaRivals(baseLevel, nextWins + 1)])
      setWins(nextWins)
      setLog(`Bout ${nextWins} won! You were the last trainer standing.`)
      if (state.sfxEnabled) playSfx('good')
      return
    }
    setLog(`The round ends \u2014 ${survivors(next)} trainers left standing.`)
    if (state.sfxEnabled) playSfx('good')
  }

  /** @param {number} totalWins */
  function finish(totalWins) {
    if (settledRef.current) return
    settledRef.current = !0
    const prize = ffaPrize(totalWins)
    setResult(prize)
    setLog(`${prize.label} \u2014 ${totalWins} bout${totalWins === 1 ? '' : 's'} won.`)
    setPhase('done')
    if (state.sfxEnabled) playSfx('coin')
  }

  function leave() {
    collect(
      {
        type: 'END_MINIGAME',
        payload: { minigame: 'freeForAll', score: wins, completed: wins > 0 },
      },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  const bestWins = state.minigameRecords?.freeForAll?.best ?? 0
  return jsxs('div', {
    className: 'minigame-scene ffa-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Battle Tower Free-for-All' }),
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
                jsx('div', {
                  className: 'ffa-grid',
                  children: participants.map((participant) =>
                    jsx(
                      ParticipantCard,
                      {
                        participant,
                        player: participant.isPlayer,
                        hit: hits.includes(participant.id),
                      },
                      participant.id
                    )
                  ),
                }),
                jsx('p', {
                  className: 'rotation-hint',
                  children:
                    'Everyone fights everyone. Each round your Pokemon picks its own target; outlast all three rivals to win the bout.',
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
              disabled: !playerAlive,
              onClick: fight,
              children: 'FIGHT ROUND',
            }),
        ],
      }),
    ],
  })
}
