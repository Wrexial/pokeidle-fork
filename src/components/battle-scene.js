// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { moveCategoryIcons } from '../data/moves.js'
import { locationImages } from '../data/ui.js'
import { catchableSpeciesCount, mapData, moveData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getBossTrainerSpriteUrl, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, getTrainerSpriteUrl } from '../game/pokemon.js'
import { EnemyInfoBox } from './enemy-info-box.js'
import { PlayerInfoBox } from './player-info-box.js'
import { SettingsModal } from './settings-modal.js'
import { BattleTextBox } from './battle-text-box.js'
import { EvolutionScene } from './evolution-scene.js'
import { HealingScene } from './healing-scene.js'
import { MoveManagerPanel } from './move-manager-panel.js'
import { SpeedControls } from './speed-controls.js'

export function BattleScene() {
  const [showMoveManager, setShowMoveManager] = React.useState(!1),
    [showInfo, setShowInfo] = React.useState(!1),
    [showSettings, setShowSettings] = React.useState(!1),
    { state, dispatch } = useGame(),
    { playerPokemon, enemyPokemon, battleEvents } = state,
    catchableCount = catchableSpeciesCount,
    isDexComplete = state.pokedexCaught.length >= catchableCount
  if (state.phase === 'evolving') return jsx(EvolutionScene, {})
  if (state.phase === 'healing') return jsx(HealingScene, {})
  if (!playerPokemon) return null
  const currentEvent = battleEvents.length > 0 ? battleEvents[battleEvents.length - 1] : null,
    playerSpecies = pokemonSpecies[playerPokemon.speciesKey],
    activeTrainerBattle = state.bossBattle ?? state.trainerBattle,
    lastDamageEvent = battleEvents.filter((event) => event.type === 'damage').pop(),
    lastFaintEvent = battleEvents.filter((event) => event.type === 'faint').pop(),
    pendingTrainerAppear =
      activeTrainerBattle &&
      battleEvents.length === 0 &&
      state.pendingEvents.some((event) => event.type === 'trainerAppear'),
    hasTrainerAppeared = battleEvents.some((event) => event.type === 'trainerAppear'),
    showTrainerIntro =
      activeTrainerBattle && (currentEvent?.type === 'trainerAppear' || (currentEvent?.type === 'trainerSendOut' && hasTrainerAppeared)),
    trainerIntroSlideOut = currentEvent?.type === 'trainerSendOut' && hasTrainerAppeared,
    isTrainerSendOut = currentEvent?.type === 'trainerSendOut',
    isPlayerSwitch = currentEvent?.type === 'playerSwitch',
    hideEnemySprite = currentEvent?.type === 'trainerAppear' || pendingTrainerAppear,
    isLatestDamage = lastDamageEvent ? battleEvents.indexOf(lastDamageEvent) === battleEvents.length - 1 : !1,
    playerWasHit = lastDamageEvent?.data?.target === 'player' && isLatestDamage,
    enemyWasHit = lastDamageEvent?.data?.target === 'enemy' && isLatestDamage,
    enemyFainted = lastFaintEvent?.data?.target === 'enemy',
    playerFainted = lastFaintEvent?.data?.target === 'player',
    isTown = mapData[state.currentLocation]?.type === 'town',
    townBackground =
      {
        vermilionCity: '/backgrounds/town_port.png',
        cinnabarIsland: '/backgrounds/town_port.png',
        fuchsiaCity: '/backgrounds/town_port.png',
      }[state.currentLocation] || '/backgrounds/town.png',
    battleBackground = activeTrainerBattle || isTown ? townBackground : locationImages[state.currentRoute] || locationImages.route1
  return jsxs('div', {
    className: 'battle-scene',
    style: {
      backgroundImage: `url('${battleBackground}')`,
    },
    children: [
      jsxs('div', {
        className: 'battle-top-buttons',
        children: [
          jsx('button', {
            className: 'battle-info-btn',
            onClick: () => setShowInfo(!0),
            children: '?',
          }),
          jsx('button', {
            className: `battle-info-btn auto-proceed-btn${state.autoProceed ? ' active' : ''}`,
            onClick: () =>
              dispatch({
                type: 'TOGGLE_AUTO_PROCEED',
              }),
            title: state.autoProceed ? 'Auto-proceed: ON' : 'Auto-proceed: OFF',
            children: '▶▶',
          }),
          jsx('button', {
            className: 'battle-info-btn',
            onClick: () => setShowSettings(!0),
            children: jsx('span', {
              className: 'settings-icon',
              children: '⚙',
            }),
          }),
        ],
      }),
      showInfo &&
        createPortal(
          jsx('div', {
            className: 'battle-info-overlay',
            onClick: () => setShowInfo(!1),
            children: jsxs('div', {
              className: 'battle-info-modal',
              onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
              children: [
                jsxs('div', {
                  className: 'battle-info-header',
                  children: [
                    jsx('span', {
                      className: 'battle-info-title',
                      children: 'Info',
                    }),
                    jsx('button', {
                      className: 'battle-info-close',
                      onClick: () => setShowInfo(!1),
                      children: 'X',
                    }),
                  ],
                }),
                jsxs('div', {
                  className: 'battle-info-content',
                  children: [
                    jsxs('p', {
                      children: [
                        "Hello and welcome to Pokemon Idle! Please be aware that this game is still in the very early stages of development so I welcome any and all feedback. I apologize for the lack of detailed tutorial system but I just haven't had a chance. Feel free to join the ",
                        jsx('a', {
                          href: 'https://www.reddit.com/r/PkmnIdle/',
                          target: '_blank',
                          rel: 'noopener noreferrer',
                          children: 'Pokemon Idle subreddit',
                        }),
                        ' to ask questions or find answers to questions others have asked.',
                      ],
                    }),
                    jsx('p', {
                      children:
                        'Head out to a route to begin your Pokemon adventure!',
                    }),
                    jsxs('div', {
                      className: 'info-shiny-stats',
                      children: [
                        jsxs('span', {
                          children: ['Shinies seen: ', state.shinySeen.length],
                        }),
                        jsxs('span', {
                          children: ['Shinies caught: ', state.shinyCaught.length],
                        }),
                        jsxs('span', {
                          children: [
                            'Shiny odds: 1/',
                            isDexComplete ? '4096' : '8192',
                            isDexComplete ? ' (Shiny Charm active!)' : '',
                          ],
                        }),
                        !isDexComplete &&
                          jsxs('span', {
                            className: 'info-shiny-hint',
                            children: [
                              'Catch all ',
                              catchableCount,
                              ' Pokemon to unlock the Shiny Charm (2x shiny rate)',
                            ],
                          }),
                      ],
                    }),
                    jsx('button', {
                      className: 'patch-notes-link-btn',
                      onClick: () => {
                        window.location.hash = 'patchnotes'
                      },
                      children: 'View Patch Notes',
                    }),
                  ],
                }),
              ],
            }),
          }),
          document.body
        ),
      activeTrainerBattle &&
        jsx('div', {
          className: 'trainer-name-display',
          children: activeTrainerBattle.trainerName,
        }),
      enemyPokemon &&
        !hideEnemySprite &&
        jsx('div', {
          className: 'enemy-info-anchor',
          children: jsx(EnemyInfoBox, {
            pokemon: enemyPokemon,
          }),
        }),
      activeTrainerBattle &&
        jsx('div', {
          className: 'trainer-team-indicator',
          children: activeTrainerBattle.trainerTeam.map((member, index) =>
            jsx(
              'span',
              {
                className: `team-ball ${member.currentHp <= 0 ? 'fainted' : ''} ${index === activeTrainerBattle.currentTrainerPokemonIndex ? 'active' : ''}`,
              },
              index
            )
          ),
        }),
      (activeTrainerBattle || state.party.length > 1) &&
        jsx('div', {
          className: 'player-team-indicator',
          children: state.party.map((member, index) =>
            jsx(
              'span',
              {
                className: `team-ball player-ball ${member.currentHp <= 0 ? 'fainted' : ''} ${index === state.activePlayerPokemonIndex ? 'active' : ''}`,
              },
              index
            )
          ),
        }),
      showTrainerIntro &&
        activeTrainerBattle &&
        jsx('div', {
          className: `trainer-intro-anchor ${trainerIntroSlideOut ? 'slide-out' : 'slide-in'}`,
          children: jsx('img', {
            className: 'trainer-intro-img',
            src: state.bossBattle?.spriteKey
              ? getBossTrainerSpriteUrl(state.bossBattle.spriteKey)
              : getTrainerSpriteUrl(activeTrainerBattle.trainerClass),
            alt: activeTrainerBattle.trainerName,
          }),
        }),
      enemyPokemon &&
        !hideEnemySprite &&
        jsxs('div', {
          className: `sprite-container enemy-sprite ${enemyWasHit ? 'hit-flash' : ''} ${enemyFainted ? 'faint-anim' : ''} ${isTrainerSendOut ? 'pokemon-appear' : ''}${enemyPokemon.isShiny ? ' shiny-sparkle' : ''}`,
          children: [
            jsx('div', {
              className: 'sprite-shadow',
            }),
            jsx('img', {
              src: getPokemonSpriteUrl(
                pokemonSpecies[enemyPokemon.speciesKey].id,
                !1,
                enemyPokemon.isShiny
              ),
              onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(
                pokemonSpecies[enemyPokemon.speciesKey].id,
                !1,
                enemyPokemon.isShiny
              )),
              alt: enemyPokemon.name,
            }),
          ],
        }),
      jsxs('div', {
        className: `sprite-container player-sprite ${playerWasHit ? 'hit-flash' : ''} ${playerFainted ? 'faint-anim' : ''} ${isPlayerSwitch ? 'pokemon-appear' : ''}${state.playerPokemon?.isShiny ? ' shiny-sparkle' : ''}`,
        children: [
          jsx('div', {
            className: 'sprite-shadow',
          }),
          jsx('img', {
            src: getPokemonSpriteUrl(playerSpecies.id, !0, state.playerPokemon?.isShiny),
            onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(playerSpecies.id, !0, state.playerPokemon?.isShiny)),
            alt: playerPokemon.name,
          }),
        ],
      }),
      jsx('div', {
        className: 'player-info-anchor',
        children: jsx(PlayerInfoBox, {
          pokemon: playerPokemon,
        }),
      }),
      jsx('div', {
        className: 'speed-overlay',
        children: jsx(SpeedControls, {}),
      }),
      jsxs('div', {
        className: 'bottom-panel',
        children: [
          jsx(BattleTextBox, {
            event:
              currentEvent ??
              (state.pendingEvents.length > 0
                ? {
                    type: 'waiting',
                    message: '',
                  }
                : null),
            speed: state.speed,
            isAtTown: mapData[state.currentLocation]?.type === 'town',
          }),
          jsxs('div', {
            className: 'bottom-right-panel',
            children: [
              jsx('button', {
                className: 'move-swap-btn',
                onClick: () => setShowMoveManager(!0),
                children: 'MOVES',
              }),
              jsx('div', {
                className: 'move-grid',
                children: playerPokemon.moves.map((moveId) => {
                  const moveDef = moveData[moveId]
                  return moveDef
                    ? jsxs(
                        'div',
                        {
                          className: `move-cell type-bg-${moveDef.type.toLowerCase()}`,
                          children: [
                            jsxs('div', {
                              className: 'move-top-row',
                              children: [
                                jsx('span', {
                                  className: 'move-category-icon',
                                  children: moveCategoryIcons[moveDef.category],
                                }),
                                jsx('span', {
                                  className: 'move-name',
                                  children: moveDef.name,
                                }),
                              ],
                            }),
                            jsxs('div', {
                              className: 'move-stats',
                              children: [
                                jsxs('span', {
                                  children: [
                                    jsx('span', {
                                      className: 'move-stat-label',
                                      children: 'Pow',
                                    }),
                                    ' ',
                                    moveDef.power > 0 ? moveDef.power : '—',
                                  ],
                                }),
                                jsxs('span', {
                                  children: [
                                    jsx('span', {
                                      className: 'move-stat-label',
                                      children: 'Acc',
                                    }),
                                    ' ',
                                    moveDef.accuracy,
                                    '%',
                                  ],
                                }),
                              ],
                            }),
                          ],
                        },
                        moveId
                      )
                    : null
                }),
              }),
            ],
          }),
        ],
      }),
      showMoveManager &&
        jsx(MoveManagerPanel, {
          onClose: () => setShowMoveManager(!1),
        }),
      showSettings &&
        jsx(SettingsModal, {
          onClose: () => setShowSettings(!1),
        }),
    ],
  })
}
