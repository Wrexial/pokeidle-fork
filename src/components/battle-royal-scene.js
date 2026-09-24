// Alola's Battle Royal, played as a full-stage scene while the reducer is in
// the `battleRoyal` phase. An endless wave gauntlet resolved with the real
// combat pipeline: each win heals the squad a little, each faint benches a
// Pokemon, and a full wipe ends the run.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import {
  battleRoyalOpponent,
  battleRoyalPrize,
  createOpponent,
  healSquad,
  simulateBattle,
  toBattlePokemon,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

export function BattleRoyalScene() {
  const { state, dispatch } = useGame(),
    [squad, setSquad] = React.useState(() =>
      state.party.map((member) => toBattlePokemon(member, { isPlayer: true }))
    ),
    [activeIndex, setActiveIndex] = React.useState(() =>
      state.party.findIndex((member) => member.currentHp > 0)
    ),
    [wave, setWave] = React.useState(0),
    [phase, setPhase] = React.useState(
      /** @type {'ready' | 'between' | 'done'} */ ('ready')
    ),
    [log, setLog] = React.useState('Ring the bell to face the first challenger.'),
    [lastBattle, setLastBattle] = React.useState(
      /** @type {{ enemy: string, enemySpecies: string, won: boolean } | null} */ (null)
    ),
    [result, setResult] = React.useState(
      /** @type {ReturnType<typeof battleRoyalPrize> | null} */ (null)
    ),
    settledRef = React.useRef(!1)

  const baseLevel = Math.max(...squad.map((member) => member.level), 5),
    active = activeIndex >= 0 ? squad[activeIndex] : null,
    partyAlive = squad.some((member) => member.currentHp > 0)

  function fight() {
    if (phase !== 'ready' || !active) return
    const nextSquad = squad.map((member) => ({ ...member })),
      ally = nextSquad[activeIndex],
      info = battleRoyalOpponent(wave + 1, baseLevel),
      enemy = createOpponent(info.speciesKey, info.level),
      outcome = simulateBattle(ally, enemy)
    setLastBattle({ enemy: info.name, enemySpecies: info.speciesKey, won: outcome.won })
    if (outcome.won) {
      const clearedWaves = wave + 1
      setSquad(healSquad(nextSquad))
      setWave(clearedWaves)
      setLog(`Wave ${clearedWaves} cleared! The party recovers a little.`)
      setPhase('between')
      return
    }
    // The active Pokemon fainted: send out the next one, or call it a run.
    const nextIndex = nextSquad.findIndex(
      (member, index) => index !== activeIndex && member.currentHp > 0
    )
    setSquad(nextSquad)
    if (nextIndex === -1) finish(wave)
    else {
      setActiveIndex(nextIndex)
      setLog(`${ally.name} went down. ${nextSquad[nextIndex].name} steps into the ring!`)
      setPhase('ready')
    }
  }

  /** @param {number} waves */
  function finish(waves) {
    if (settledRef.current) return
    settledRef.current = !0
    const prize = battleRoyalPrize(waves)
    setResult(prize)
    setLog(`${prize.label} \u2014 ${waves} wave${waves === 1 ? '' : 's'} cleared.`)
    setPhase('done')
    dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: prize })
  }

  function nextWave() {
    setPhase('ready')
    setLog(`Wave ${wave + 1} incoming!`)
  }

  function leave() {
    dispatch({ type: 'END_MINIGAME' })
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
            children: [`Wave ${wave + 1}`, ' \u00b7 ', `${wave} cleared`],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsxs('div', {
            className: 'royal-arena',
            children: [
              active &&
                jsxs('div', {
                  className: 'royal-fighter',
                  children: [
                    jsx('img', {
                      className: 'royal-sprite',
                      src: getPokemonSpriteUrl(
                        pokemonSpecies[active.speciesKey]?.id ?? 0
                      ),
                      onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                        (event.target.src = getPokemonSpriteFallbackUrl(
                          pokemonSpecies[active.speciesKey]?.id ?? 0
                        )),
                      alt: active.name,
                    }),
                    jsx('span', { className: 'royal-name', children: active.name }),
                  ],
                }),
              jsx('span', { className: 'royal-versus', children: 'VS' }),
              lastBattle
                ? jsxs('div', {
                    className: 'royal-fighter',
                    children: [
                      jsx('img', {
                        className: `royal-sprite${lastBattle.won ? ' down' : ''}`,
                        src: getPokemonSpriteUrl(
                          pokemonSpecies[lastBattle.enemySpecies]?.id ?? 0
                        ),
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(
                            pokemonSpecies[lastBattle.enemySpecies]?.id ?? 0
                          )),
                        alt: lastBattle.enemy,
                      }),
                      jsx('span', { className: 'royal-name', children: lastBattle.enemy }),
                    ],
                  })
                : jsx('div', { className: 'royal-fighter royal-empty', children: '?' }),
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
          jsx('button', {
            className: 'move-panel-btn cancel',
            onClick: leave,
            children: phase === 'done' ? 'COLLECT & LEAVE' : 'FORFEIT',
          }),
          phase === 'ready' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              disabled: !partyAlive,
              onClick: fight,
              children: `FIGHT (WAVE ${wave + 1})`,
            }),
          phase === 'between' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: nextWave,
              children: 'NEXT WAVE',
            }),
        ],
      }),
    ],
  })
}
