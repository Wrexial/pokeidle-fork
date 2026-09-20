// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { createPortal } from 'react-dom'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { EnemyInfoBox, PlayerInfoBox } from './common.js'
import { SettingsModal } from './settings.js'
import { BATTLE_LOG_MIN_HEIGHT, DESIGN_WIDTH, SPEED_OPTIONS, locationImages, moveCategoryIcons, moveIcons } from '../data/constants.js'
import { mapData, moveData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getBossTrainerSpriteUrl, getFamilyLearnset, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, getTrainerSpriteUrl } from '../game/pokemon.js'
import { useGameLoop, useIsMobile, useTypewriter } from '../hooks.js'

function BattleTextBox({ event, speed, isAtTown }) {
  const charDelay = Math.max(5, 30 / speed),
    defaultMessage = isAtTown ? 'Looking for trainers...' : 'Searching for wild Pokémon...',
    message = event?.message ?? defaultMessage,
    { displayed } = useTypewriter(message, charDelay)
  return jsx('div', {
    className: 'battle-text-box',
    children: jsx('div', {
      className: 'text-box-inner',
      children: jsxs('p', {
        children: [
          displayed,
          jsx('span', {
            className: 'text-cursor',
            children: '▼',
          }),
        ],
      }),
    }),
  })
}

function SpeedControls() {
  const { state, dispatch } = useGame()
  return jsxs('div', {
    className: 'speed-controls',
    children: [
      jsx('button', {
        className: `speed-btn pause-btn ${state.paused ? 'active' : ''}`,
        onClick: () =>
          dispatch({
            type: 'TOGGLE_PAUSE',
          }),
        children: state.paused ? '▶' : '⏸',
      }),
      SPEED_OPTIONS.map((speedOption) =>
        jsxs(
          'button',
          {
            className: `speed-btn ${!state.paused && state.speed === speedOption ? 'active' : ''}`,
            onClick: () => {
              ;(state.paused &&
                dispatch({
                  type: 'TOGGLE_PAUSE',
                }),
                dispatch({
                  type: 'SET_SPEED',
                  payload: {
                    speed: speedOption,
                  },
                }))
            },
            children: [speedOption, 'x'],
          },
          speedOption
        )
      ),
    ],
  })
}

function MoveManagerPanel({ onClose }) {
  const { state, dispatch } = useGame(),
    pokemon = state.playerPokemon,
    pokemonId = pokemon.id,
    [moves, setMoves] = React.useState([...pokemon.moves]),
    availableMoves = getFamilyLearnset(pokemon.speciesKey, pokemon.level),
    species = pokemonSpecies[pokemon.speciesKey]
  function toggleMove(moveId) {
    moves.includes(moveId)
      ? moves.length > 1 && setMoves(moves.filter((existingMoveId) => existingMoveId !== moveId))
      : moves.length < 4 && setMoves([...moves, moveId])
  }
  function confirmMoves() {
    if (state.playerPokemon?.id !== pokemonId) {
      onClose()
      return
    }
    ;(dispatch({
      type: 'SET_MOVES',
      payload: {
        moves,
      },
    }),
      onClose())
  }
  return jsx('div', {
    className: 'move-panel-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'move-panel',
      onClick: (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'move-panel-header',
          children: [
            jsx('span', {
              className: 'move-panel-title',
              children: 'Manage Moves',
            }),
            jsxs('span', {
              className: 'move-panel-species',
              children: [species.name, ' Lv.', pokemon.level],
            }),
          ],
        }),
        jsxs('div', {
          className: 'move-panel-section-label',
          children: ['Current Moves (', moves.length, '/4)'],
        }),
        jsx('div', {
          className: 'move-panel-slots',
          children: [0, 1, 2, 3].map((slotIndex) => {
            const moveId = moves[slotIndex],
              moveDef = moveId ? moveData[moveId] : null
            return moveDef
              ? jsxs(
                  'div',
                  {
                    className: `move-panel-slot type-bg-${moveDef.type.toLowerCase()}`,
                    onClick: () => toggleMove(moveId),
                    children: [
                      jsx('span', {
                        className: 'move-panel-slot-icon',
                        children: moveCategoryIcons[moveDef.category],
                      }),
                      jsx('span', {
                        className: 'move-panel-slot-name',
                        children: moveDef.name,
                      }),
                    ],
                  },
                  slotIndex
                )
              : jsx(
                  'div',
                  {
                    className: 'move-panel-slot empty',
                    children: '---',
                  },
                  slotIndex
                )
          }),
        }),
        jsx('div', {
          className: 'move-panel-section-label',
          children: 'Available Moves',
        }),
        jsx('div', {
          className: 'move-panel-list',
          children: availableMoves.map(({ moveId, learnLevel }) => {
            const moveDef = moveData[moveId]
            if (!moveDef) return null
            const isSelected = moves.includes(moveId)
            return jsxs(
              'div',
              {
                className: `move-panel-item type-bg-${moveDef.type.toLowerCase()} ${isSelected ? 'selected' : ''}`,
                onClick: () => toggleMove(moveId),
                children: [
                  jsx('span', {
                    className: 'move-panel-item-icon',
                    children: moveCategoryIcons[moveDef.category],
                  }),
                  jsx('span', {
                    className: 'move-panel-item-name',
                    children: moveDef.name,
                  }),
                  jsx('span', {
                    className: 'move-panel-item-stats',
                    children: moveDef.power > 0 ? moveDef.power : '---',
                  }),
                  jsxs('span', {
                    className: 'move-panel-item-stats',
                    children: [moveDef.accuracy, '%'],
                  }),
                  jsxs('span', {
                    className: 'move-panel-item-level',
                    children: ['Lv.', learnLevel],
                  }),
                ],
              },
              moveId
            )
          }),
        }),
        jsxs('div', {
          className: 'move-panel-buttons',
          children: [
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: onClose,
              children: 'Cancel',
            }),
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: confirmMoves,
              children: 'Confirm',
            }),
          ],
        }),
      ],
    }),
  })
}

function EvolutionScene() {
  const { state, dispatch } = useGame(),
    evolutionState = state.evolutionState
  if (
    (React.useEffect(() => {
      if (!evolutionState) return
      const speed = state.speed || 1
      const swapTimeout = setTimeout(() => {
          dispatch({
            type: 'EVOLUTION_STEP',
            payload: {
              step: 'swap',
            },
          })
        }, 2500 / speed),
        doneTimeout = setTimeout(() => {
          dispatch({
            type: 'EVOLUTION_STEP',
            payload: {
              step: 'done',
            },
          })
        }, 3500 / speed),
        completeTimeout = setTimeout(() => {
          dispatch({
            type: 'COMPLETE_EVOLUTION',
          })
        }, 5500 / speed)
      return () => {
        ;(clearTimeout(swapTimeout), clearTimeout(doneTimeout), clearTimeout(completeTimeout))
      }
    }, [dispatch, state.speed]),
    !evolutionState)
  )
    return null
  const fromSpecies = pokemonSpecies[evolutionState.fromSpeciesKey],
    toSpecies = pokemonSpecies[evolutionState.toSpeciesKey],
    showNewSprite = evolutionState.step === 'swap' || evolutionState.step === 'done',
    spriteClass =
      evolutionState.step === 'flash'
        ? 'evo-sprite evo-flash'
        : evolutionState.step === 'swap'
          ? 'evo-sprite evo-burst'
          : 'evo-sprite evo-glow',
    message =
      evolutionState.step === 'done'
        ? `${fromSpecies.name} evolved into ${toSpecies.name}!`
        : `What? ${fromSpecies.name} is evolving!`
  return jsxs('div', {
    className: 'evolution-scene',
    children: [
      jsx('div', {
        className: 'evolution-bg',
      }),
      jsx('div', {
        className: 'evolution-sprite-container',
        children: jsx('img', {
          className: spriteClass,
          src: getPokemonSpriteUrl(showNewSprite ? toSpecies.id : fromSpecies.id, !1, evolutionState.isShiny),
          onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(showNewSprite ? toSpecies.id : fromSpecies.id, !1, evolutionState.isShiny)),
          alt: showNewSprite ? toSpecies.name : fromSpecies.name,
        }),
      }),
      jsx('div', {
        className: 'evolution-text',
        children: jsx('p', {
          children: message,
        }),
      }),
    ],
  })
}

function HealingScene() {
  const { state, dispatch } = useGame(),
    healingState = state.healingState,
    videoRef = React.useRef(null)
  if (
    (React.useEffect(() => {
      if (!healingState) return
      const speed = state.speed || 1
      const healTimeout = setTimeout(() => {
          dispatch({
            type: 'HEALING_STEP',
            payload: {
              step: 'healing',
            },
          })
        }, 250 / speed),
        doneTimeout = setTimeout(() => {
          dispatch({
            type: 'HEALING_STEP',
            payload: {
              step: 'done',
            },
          })
        }, 3e3 / speed),
        completeTimeout = setTimeout(() => {
          dispatch({
            type: 'COMPLETE_HEALING',
          })
        }, 3750 / speed)
      return () => {
        ;(clearTimeout(healTimeout), clearTimeout(doneTimeout), clearTimeout(completeTimeout))
      }
    }, [dispatch, state.speed]),
    React.useEffect(() => {
      if (!healingState) return
      const video = videoRef.current
      if (!video) return
      const handleCanPlay = () => {
        ;((video.currentTime = 0), (video.playbackRate = 2.5), video.play().catch(() => {}))
      }
      if (video.readyState >= 3) handleCanPlay()
      else
        return (
          video.addEventListener('canplay', handleCanPlay, {
            once: !0,
          }),
          () => video.removeEventListener('canplay', handleCanPlay)
        )
    }, [healingState]),
    !healingState)
  )
    return null
  const message =
    healingState.step === 'done'
      ? 'Your Pokemon are fully healed!'
      : 'Healing your Pokemon...'
  return jsxs('div', {
    className: 'heal-scene',
    children: [
      jsx('video', {
        ref: videoRef,
        className: 'heal-video',
        src: '/heal-animation-web.mp4',
        muted: !0,
        playsInline: !0,
        preload: 'auto',
      }),
      healingState.step === 'healing' &&
        jsx('div', {
          className: 'heal-flash-overlay',
        }),
      healingState.step === 'done' &&
        jsx('div', {
          className: 'heal-done-flash',
        }),
      jsx('div', {
        className: 'heal-text',
        children: jsx('p', {
          children: message,
        }),
      }),
    ],
  })
}

function BattleScene() {
  const [showMoveManager, setShowMoveManager] = React.useState(!1),
    [showInfo, setShowInfo] = React.useState(!1),
    [showSettings, setShowSettings] = React.useState(!1),
    { state, dispatch } = useGame(),
    { playerPokemon, enemyPokemon, battleEvents } = state,
    catchableCount = React.useMemo(() => 151, []), //Object.keys(pokemonSpecies).length
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
              onClick: (event) => event.stopPropagation(),
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
                        'Click on Route 1 to begin your pokemon adventure!',
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
              onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(
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
            onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(playerSpecies.id, !0, state.playerPokemon?.isShiny)),
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
                                  children: moveIcons[moveDef.category],
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

function BattleLog() {
  const { state } = useGame(),
    containerRef = React.useRef(null),
    endRef = React.useRef(null),
    [isCollapsed, setIsCollapsed] = React.useState(!1)
  ;(React.useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [state.battleLog.length]),
    React.useEffect(() => {
      const containerEl = containerRef.current
      if (!containerEl) return
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) setIsCollapsed(entry.contentRect.height < BATTLE_LOG_MIN_HEIGHT)
      })
      return (resizeObserver.observe(containerEl), () => resizeObserver.disconnect())
    }, []))
  const activeEffects = state.activeEffects
  return jsx('div', {
    ref: containerRef,
    className: 'battle-log',
    style: isCollapsed
      ? {
          padding: 0,
          borderTop: 'none',
        }
      : void 0,
    children:
      !isCollapsed &&
      jsxs(Fragment, {
        children: [
          jsx('h3', {
            className: 'log-title',
            children: 'Battle Log',
          }),
          activeEffects.length > 0 &&
            jsx('div', {
              className: 'active-effects-bar',
              children: activeEffects.map((effect, index) => {
                let label = ''
                return (
                  effect.type === 'expShare'
                    ? (label = `Exp Share (${effect.battlesRemaining})`)
                    : (label = `${effect.speciesKey ? (pokemonSpecies[effect.speciesKey]?.name ?? effect.speciesKey) : ''} (${effect.battlesRemaining})`),
                  jsx(
                    'span',
                    {
                      className: `active-effect-tag effect-${effect.type}`,
                      children: label,
                    },
                    index
                  )
                )
              }),
            }),
          jsxs('div', {
            className: 'log-entries',
            children: [
              state.battleLog.map((entry, index) =>
                jsx(
                  'div',
                  {
                    className: 'log-entry',
                    children: entry,
                  },
                  index
                )
              ),
              jsx('div', {
                ref: endRef,
              }),
            ],
          }),
        ],
      }),
  })
}

function LevelUpNotification() {
  const { state, dispatch } = useGame()
  return (
    React.useEffect(() => {
      if (state.levelUpNotification) {
        const timeoutId = setTimeout(() => {
          dispatch({
            type: 'CLEAR_LEVEL_UP',
          })
        }, 2e3)
        return () => clearTimeout(timeoutId)
      }
    }, [state.levelUpNotification, dispatch]),
    state.levelUpNotification
      ? jsx('div', {
          className: 'level-up-notification',
          children: jsx('span', {
            children: state.levelUpNotification,
          }),
        })
      : null
  )
}

export function BattleScreen() {
  const { state } = useGame(),
    isMobile = useIsMobile(),
    containerRef = React.useRef(null),
    contentRef = React.useRef(null),
    [scale, setScale] = React.useState(1),
    [contentHeight, setContentHeight] = React.useState(480)
  useGameLoop()
  const recalcSize = React.useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth
    if ((setScale(Math.min(containerWidth / DESIGN_WIDTH, 1)), contentRef.current)) {
      const battleScene = contentRef.current.querySelector('.battle-scene'),
        scrollHeight = contentRef.current.scrollHeight,
        marginBottom = battleScene ? parseFloat(getComputedStyle(battleScene).marginBottom) : 0
      setContentHeight(scrollHeight + marginBottom)
    }
  }, [])
  if (
    (React.useEffect(() => {
      if (!isMobile || !containerRef.current) return
      const resizeObserver = new ResizeObserver(() => recalcSize())
      return (resizeObserver.observe(containerRef.current), recalcSize(), () => resizeObserver.disconnect())
    }, [isMobile, recalcSize]),
    React.useEffect(() => {
      if (isMobile && contentRef.current) {
        const battleScene = contentRef.current.querySelector('.battle-scene'),
          scrollHeight = contentRef.current.scrollHeight,
          marginBottom = battleScene ? parseFloat(getComputedStyle(battleScene).marginBottom) : 0
        setContentHeight(scrollHeight + marginBottom)
      }
    }),
    !state.playerPokemon)
  )
    return null
  if (isMobile) {
    const scaledHeight = contentHeight * scale
    return jsxs('div', {
      className: 'battle-screen',
      ref: containerRef,
      style: {
        height: scaledHeight,
        overflow: 'hidden',
      },
      children: [
        jsx('div', {
          ref: contentRef,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: DESIGN_WIDTH,
          },
          children: jsx(BattleScene, {}),
        }),
        jsx(LevelUpNotification, {}),
      ],
    })
  }
  return jsxs('div', {
    className: 'battle-screen',
    children: [jsx(BattleScene, {}), jsx(BattleLog, {}), jsx(LevelUpNotification, {})],
  })
}
