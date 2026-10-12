// Battle Tower panel, shown in the location panel while standing on Hoenn
// Route 111 (its map POI). Moved out of the League tab so it launches from the
// route, like the other location minigames.

import { jsx, jsxs } from 'react/jsx-runtime'
import { BATTLE_TOWER_REGION } from '../data/config.js'
import { mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { buildTowerFloor } from '../game/progression.js'
import { DOUBLES_COST, TRIPLES_COST } from '../game/minigames/doubles.js'
import { ROTATION_COST } from '../game/minigames/rotation.js'
import { FFA_COST } from '../game/minigames/free-for-all.js'

export function BattleTowerPanel() {
  const { state, dispatch } = useGame(),
    regionId = mapData[state.currentLocation]?.region ?? BATTLE_TOWER_REGION,
    towerBest = state.towerBest[BATTLE_TOWER_REGION] ?? 0,
    // Floors are discrete puzzles: you resume at the next uncleared floor, so a
    // loss can be retried without replaying the climb.
    nextFloor = Math.max(state.towerFloor, towerBest + 1),
    preview = buildTowerFloor(nextFloor),
    canFight = state.party.some((member) => member.currentHp > 0),
    isBusy = [
      'evolving',
      'healing',
      'catching',
      'bugCatching',
      'safari',
      'academyQuiz',
      'mining',
      'gameCorner',
      'routeActivity',
      'wonderTrade',
    ].includes(state.phase),
    fightable = canFight && !isBusy

  /** @param {number} floor */
  function startFloor(floor) {
    if (!fightable) return
    if (state.phase === 'battling' || state.phase === 'victory' || state.phase === 'defeat')
      dispatch({ type: 'PHASE_IDLE' })
    dispatch({
      type: 'START_TOWER',
      payload: { floor },
    })
    dispatch({
      type: 'START_HEALING',
      payload: {
        pendingBossBattle: {
          bossId: 'tower',
          bossType: 'tower',
          trainerName: `Tower Trainer (Floor ${floor})`,
          trainerClass: 'ace',
          trainerTeam: buildTowerFloor(floor),
          spriteKey: 'acetrainer',
          region: regionId,
        },
      },
    })
  }

  return jsxs('div', {
    className: 'location-tower',
    children: [
      jsxs('div', {
        className: 'location-section-title',
        children: ['Battle Tower', towerBest > 0 ? ` \u00b7 Best Floor ${towerBest}` : ''],
      }),
      jsx('div', {
        className: 'tower-hint',
        children:
          nextFloor > 1
            ? `Next up: floor ${nextFloor}. Win to advance; losing just means retrying this floor \u2014 the climb never resets.`
            : 'Fight stronger trainers for Victory Tokens, one puzzle floor at a time. Every floor fields six fully evolved Pokemon and your team is healed before each one \u2014 stats start scaling at floor 15 and legendaries appear from floor 40. Floors pay 1 token every 10 cleared.',
      }),
      jsx('div', {
        className: 'tower-hint tower-deterministic',
        children:
          'Tower battles are deterministic: the opponent is fixed and there are no critical hits, misses or damage variance. Build a team that beats the matchup \u2014 stats, types, abilities and held items decide it.',
      }),
      jsxs('div', {
        className: 'tower-preview',
        children: [
          jsx('span', {
            className: 'tower-preview-title',
            children: `Floor ${nextFloor} opponent:`,
          }),
          jsx('div', {
            className: 'tower-preview-list',
            children: preview.map((member) =>
              jsxs(
                'span',
                {
                  className: 'tower-preview-member',
                  title: `${member.name} \u00b7 Lv.${member.level} \u00b7 ${member.types.join('/')}${
                    member.ability ? ` \u00b7 ${member.ability}` : ''
                  }${member.heldItem ? ` \u00b7 ${member.heldItem}` : ''}`,
                  children: [
                    member.name,
                    jsx('span', {
                      className: 'tower-preview-level',
                      children: ` Lv.${member.level}`,
                    }),
                  ],
                },
                member.speciesKey
              )
            ),
          }),
        ],
      }),
      jsx('button', {
        className: 'gym-fight-btn champion',
        style: { width: '100%' },
        disabled: !fightable,
        onClick: () => startFloor(nextFloor),
        children:
          nextFloor > 1
            ? `FIGHT FLOOR ${nextFloor}`
            : 'ENTER THE BATTLE TOWER',
      }),
      jsxs('div', {
        className: 'location-section-title',
        style: { marginTop: '10px' },
        children: 'Doubles Court',
      }),
      jsx('div', {
        className: 'tower-hint',
        children: `Send out two Pokemon against two at once, $${DOUBLES_COST} a run. Spread moves hit both foes and a fainted Pokemon is replaced from the bench until one side runs out.`,
      }),
      jsx('button', {
        className: 'gym-fight-btn',
        style: { width: '100%' },
        disabled: !fightable || state.money < DOUBLES_COST,
        onClick: () => {
          if (!fightable) return
          if (
            state.phase === 'battling' ||
            state.phase === 'victory' ||
            state.phase === 'defeat'
          )
            dispatch({ type: 'PHASE_IDLE' })
          dispatch({ type: 'START_DOUBLES' })
        },
        children: 'ENTER THE DOUBLES COURT',
      }),
      jsxs('div', {
        className: 'location-section-title',
        style: { marginTop: '10px' },
        children: 'Triples Court',
      }),
      jsx('div', {
        className: 'tower-hint',
        children: `Field three Pokemon against three at once, $${TRIPLES_COST} a run. Every battler picks its own target and spread moves hit the whole opposite side.`,
      }),
      jsx('button', {
        className: 'gym-fight-btn',
        style: { width: '100%' },
        disabled: !fightable || state.money < TRIPLES_COST,
        onClick: () => {
          if (!fightable) return
          if (
            state.phase === 'battling' ||
            state.phase === 'victory' ||
            state.phase === 'defeat'
          )
            dispatch({ type: 'PHASE_IDLE' })
          dispatch({ type: 'START_TRIPLES' })
        },
        children: 'ENTER THE TRIPLES COURT',
      }),
      jsxs('div', {
        className: 'location-section-title',
        style: { marginTop: '10px' },
        children: 'Rotation Court',
      }),
      jsx('div', {
        className: 'tower-hint',
        children: `Field a trio but fight with one at a time, $${ROTATION_COST} a run. Rotate your active Pokemon for free before each round to answer the foe's lead.`,
      }),
      jsx('button', {
        className: 'gym-fight-btn',
        style: { width: '100%' },
        disabled: !fightable || state.money < ROTATION_COST,
        onClick: () => {
          if (!fightable) return
          if (
            state.phase === 'battling' ||
            state.phase === 'victory' ||
            state.phase === 'defeat'
          )
            dispatch({ type: 'PHASE_IDLE' })
          dispatch({ type: 'START_ROTATION' })
        },
        children: 'ENTER THE ROTATION COURT',
      }),
      jsxs('div', {
        className: 'location-section-title',
        style: { marginTop: '10px' },
        children: 'Free-for-All',
      }),
      jsx('div', {
        className: 'tower-hint',
        children: `Four trainers, one ring, $${FFA_COST} a run. Everyone can hit everyone and the last trainer standing wins the bout; outlast all three rivals to keep going.`,
      }),
      jsx('button', {
        className: 'gym-fight-btn',
        style: { width: '100%' },
        disabled: !fightable || state.money < FFA_COST,
        onClick: () => {
          if (!fightable) return
          if (
            state.phase === 'battling' ||
            state.phase === 'victory' ||
            state.phase === 'defeat'
          )
            dispatch({ type: 'PHASE_IDLE' })
          dispatch({ type: 'START_FREE_FOR_ALL' })
        },
        children: 'ENTER THE FREE-FOR-ALL',
      }),
    ],
  })
}
