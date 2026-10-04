// Alola's Battle Royal, played as a full-stage scene while the reducer is in
// the `battleRoyal` phase. A 4-way round: the active Pokemon faces the other
// three participants one at a time, and the round is placed 1st (all three
// beaten) down to 4th (beaten before any). Clearing the round heals the squad;
// a faint benches that Pokemon and the next one starts a fresh round.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  BATTLE_ROYAL_ROUND_SIZE,
  battleRoyalOpponent,
  battleRoyalPlacement,
  battleRoyalPrize,
  battleRoyalRank,
  createOpponent,
  healSquad,
  simulateBattle,
  toBattlePokemon,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** @param {number} placement */
function ordinal(placement) {
  return placement === 1 ? '1st' : placement === 2 ? '2nd' : placement === 3 ? '3rd' : '4th'
}

/**
 * One fighter card: sprite, name, level and an HP bar. The active fighter and
 * the latest opponent share it so the arena reads the same on both sides.
 * @param {{ speciesKey: string, name: string, level?: number, hp: number, maxHp: number, down?: boolean, hit?: boolean, empty?: boolean }} props
 */
function RoyalFighter({ speciesKey, name, level, hp, maxHp, down, hit, empty }) {
  if (empty) return jsx('div', { className: 'royal-fighter royal-empty', children: '?' })
  const id = pokemonSpecies[speciesKey]?.id ?? 0,
    ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  return jsxs('div', {
    className: `royal-fighter${down ? ' down' : ''}${hit ? ' hit' : ''}`,
    children: [
      jsx('img', {
        className: 'royal-sprite',
        src: getPokemonSpriteUrl(id),
        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
          (event.target.src = getPokemonSpriteFallbackUrl(id)),
        alt: name,
      }),
      jsx('span', { className: 'royal-name', children: name }),
      level != null && jsx('span', { className: 'royal-level', children: `Lv.${level}` }),
      maxHp > 0 &&
        jsxs('div', {
          className: 'royal-hp',
          children: [
            jsx('span', {
              className: 'royal-hp-fill',
              style: { width: `${ratio * 100}%` },
            }),
            jsx('span', {
              className: 'royal-hp-text',
              children: `${Math.max(0, hp)}/${maxHp}`,
            }),
          ],
        }),
    ],
  })
}

export function BattleRoyalScene() {
  const { state, dispatch } = useGame(),
    [squad, setSquad] = React.useState(() =>
      state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
    ),
    [activeIndex, setActiveIndex] = React.useState(() =>
      state.party.findIndex((member) => member.currentHp > 0)
    ),
    [wins, setWins] = React.useState(0),
    [round, setRound] = React.useState(0),
    [roundDefeated, setRoundDefeated] = React.useState(0),
    [roundWon, setRoundWon] = React.useState(false),
    [phase, setPhase] = React.useState(
      /** @type {'ready' | 'between' | 'done'} */ ('ready')
    ),
    [log, setLog] = React.useState('Ring the bell to face the first round.'),
    [lastBattle, setLastBattle] = React.useState(
      /** @type {{ ally: any, enemy: any, won: boolean, turns: number, placement?: number } | null} */ (null)
    ),
    [hit, setHit] = React.useState(/** @type {'ally' | 'enemy' | null} */ (null)),
    [result, setResult] = React.useState(
      /** @type {ReturnType<typeof battleRoyalPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    settledRef = React.useRef(!1)

  const baseLevel = Math.max(...squad.map((member) => member.level), 5),
    active = activeIndex >= 0 ? squad[activeIndex] : null,
    partyAlive = squad.some((member) => member.currentHp > 0),
    bestWins = state.minigameRecords?.battleRoyal?.best ?? 0,
    rank = battleRoyalRank(wins),
    // The arena keeps the pair that just fought until the next bell, so a
    // knockout is never wiped from the screen before the player reads it.
    arenaAlly = lastBattle?.ally ?? active,
    arenaEnemy = lastBattle?.enemy ?? null

  function fight() {
    if (phase !== 'ready' || !active) return
    const nextSquad = squad.map((member) => ({ ...member })),
      ally = nextSquad[activeIndex],
      info = battleRoyalOpponent(wins + 1, baseLevel),
      enemy = createOpponent(info.speciesKey, info.level),
      outcome = simulateBattle(ally, enemy),
      snapshot = /** @param {any} pokemon */ (pokemon) => ({
        speciesKey: pokemon.speciesKey,
        name: pokemon.name,
        level: pokemon.level,
        hp: Math.max(0, pokemon.currentHp),
        maxHp: pokemon.maxHp,
      })
    setHit(outcome.won ? 'enemy' : 'ally')
    window.setTimeout(() => setHit(null), 550)
    if (outcome.won) {
      const nextWins = wins + 1,
        nextDefeated = roundDefeated + 1,
        finishedRound = nextDefeated >= BATTLE_ROYAL_ROUND_SIZE,
        healed = finishedRound ? healSquad(nextSquad) : nextSquad
      setSquad(healed)
      setWins(nextWins)
      if (finishedRound) {
        setRound(round + 1)
        setRoundDefeated(0)
        setRoundWon(true)
      } else setRoundDefeated(nextDefeated)
      setLastBattle({
        ally: snapshot(healed[activeIndex]),
        enemy: snapshot(enemy),
        won: true,
        turns: outcome.turns,
      })
      setLog(
        finishedRound
          ? `Round ${round + 1} won \u2014 1st place! The party recovers a little.`
          : `${info.name} defeated (${nextDefeated}/${BATTLE_ROYAL_ROUND_SIZE} this round).`
      )
      if (state.sfxEnabled) playSfx('good')
      setPhase('between')
      return
    }
    // The active Pokemon fainted: the round ends, placed by how many it beat.
    const placement = battleRoyalPlacement(roundDefeated),
      nextIndex = nextSquad.findIndex(
        (member, index) => index !== activeIndex && member.currentHp > 0
      )
    setSquad(nextSquad)
    setLastBattle({
      ally: snapshot(ally),
      enemy: snapshot(enemy),
      won: false,
      turns: outcome.turns,
      placement,
    })
    setRound(round + 1)
    setRoundDefeated(0)
    if (state.sfxEnabled) playSfx('miss')
    if (nextIndex === -1) finish(wins, placement)
    else {
      setActiveIndex(nextIndex)
      setLog(
        `${ally.name} was knocked out \u2014 ${ordinal(placement)} place. ${nextSquad[nextIndex].name} starts round ${
          round + 2
        }!`
      )
      setPhase('ready')
    }
  }

  /** @param {number} totalWins @param {number} [placement] */
  function finish(totalWins, placement) {
    if (settledRef.current) return
    settledRef.current = !0
    if (state.sfxEnabled) playSfx('coin')
    const prize = battleRoyalPrize(totalWins)
    setResult(prize)
    setLog(
      `${prize.label} \u2014 ${totalWins} opponent${totalWins === 1 ? '' : 's'} beaten${
        placement ? `, ${ordinal(placement)} in the last round` : ''
      }.`
    )
    setPhase('done')
  }

  function nextRound() {
    setRoundWon(false)
    setPhase('ready')
    setLog(`Round ${round + 1} \u2014 ${rank.label}. Here comes the first opponent!`)
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'battleRoyal', score: wins, completed: wins > 0 } },
      result ? { type: 'CLAIM_MINIGAME_REWARD', payload: result } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene royal-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Battle Royal' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Round ${round + 1}`,
              ' \u00b7 ',
              rank.label,
              ' \u00b7 ',
              `${roundDefeated}/${BATTLE_ROYAL_ROUND_SIZE}`,
              bestWins > 0 ? ` \u00b7 Best ${bestWins}` : '',
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: phase === 'done'
          ? [jsx(MinigameRewardScreen, {
              prize: result,
              onCollect: leave,
              summary: jsx('span', {
                className: 'royal-wave-summary',
                children: `${wins} opponent${wins === 1 ? '' : 's'} beaten \u00b7 ${battleRoyalRank(wins).label}`,
              }),
            })]
          : [
              jsxs('div', {
                className: 'royal-arena',
                children: [
                  arenaAlly
                    ? jsx(RoyalFighter, {
                        speciesKey: arenaAlly.speciesKey,
                        name: arenaAlly.name,
                        level: arenaAlly.level,
                        hp: arenaAlly.currentHp ?? arenaAlly.hp,
                        maxHp: arenaAlly.maxHp,
                        down: !!(lastBattle && !lastBattle.won && lastBattle.ally === arenaAlly),
                        hit: hit === 'ally',
                      })
                    : jsx(RoyalFighter, { speciesKey: '', name: '', hp: 0, maxHp: 0, empty: true }),
                  jsx('span', { className: 'royal-versus', children: 'VS' }),
                  jsx(RoyalFighter, {
                    speciesKey: arenaEnemy?.speciesKey ?? '',
                    name: arenaEnemy?.name ?? '',
                    level: arenaEnemy?.level,
                    hp: arenaEnemy?.hp ?? 0,
                    maxHp: arenaEnemy?.maxHp ?? 0,
                    down: !!(arenaEnemy && lastBattle?.won),
                    hit: hit === 'enemy',
                    empty: !arenaEnemy,
                  }),
                ],
              }),
              lastBattle &&
                jsxs('div', {
                  className: `royal-result${lastBattle.won ? ' win' : ' loss'}`,
                  children: [
                    jsx('span', {
                      className: 'royal-result-title',
                      children: lastBattle.won
                        ? roundWon
                          ? `Round ${round} won \u2014 1st place!`
                          : `Round ${round + 1}: ${roundDefeated}/${BATTLE_ROYAL_ROUND_SIZE} beaten`
                        : `${lastBattle.ally.name} took ${ordinal(lastBattle.placement ?? 4)} place`,
                    }),
                    jsx('span', {
                      className: 'royal-result-sub',
                      children: `${lastBattle.turns} turn${
                        lastBattle.turns === 1 ? '' : 's'
                      } \u00b7 ${lastBattle.enemy.name} was left at ${lastBattle.enemy.hp}/${
                        lastBattle.enemy.maxHp
                      } HP`,
                    }),
                  ],
                }),
              jsxs('div', {
                className: 'royal-party',
                children: squad.map((member, index) =>
                  jsxs(
                    'div',
                    {
                      className: `royal-member${member.currentHp <= 0 ? ' fainted' : ''}${
                        index === activeIndex ? ' active' : ''
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
                                index === activeIndex &&
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
              children: 'FORFEIT',
            }),
          phase === 'ready' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              disabled: !partyAlive,
              onClick: fight,
              children: `FIGHT (ROUND ${round + 1} \u00b7 ${roundDefeated + 1}/${BATTLE_ROYAL_ROUND_SIZE})`,
            }),
          phase === 'between' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: nextRound,
              children: roundWon ? 'NEXT ROUND' : 'NEXT OPPONENT',
            }),
        ],
      }),
    ],
  })
}
