// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { moveCategoryIcons } from '../data/moves.js'
import { dailyEventByKey } from '../data/daily-events.js'
import { hasClaimableQuests } from '../game/quests.js'
import { biomeForLocation, BIOME_FILTERS, locationImages } from '../data/ui.js'
import { getDexStatus, shouldOfferMasterBall } from '../game/catching.js'
import { battleSpecies } from '../game/combat.js'
import { isFemalePokemon } from '../game/breeding.js'
import { WEATHER_ICONS, WEATHER_NAMES } from '../game/weather.js'
import { TERRAIN_ICONS, TERRAIN_NAMES } from '../game/terrain.js'
import { completedGenerations, mapData, moveData, pokemonSpecies, speciesKeysByGeneration } from '../data/gameData.js'
import { megaEvolveReady } from '../data/mega-evolution.js'
import { useGame } from '../game/context.js'
import { shinyOddsForCompletedGenerations } from '../game/progression.js'
import { getBossTrainerSpriteUrl, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, getTrainerSpriteUrl } from '../game/pokemon.js'
import { EnemyInfoBox } from './enemy-info-box.js'
import { PlayerInfoBox } from './player-info-box.js'
import { SettingsModal } from './settings-modal.js'
import { BattleTextBox } from './battle-text-box.js'
import { EvolutionScene } from './evolution-scene.js'
import { DailyEventModal } from './daily-event-modal.js'
import { DexCompleteScene } from './dex-complete-scene.js'
import { QuestsModal } from './quests-modal.js'
import { HealingScene } from './healing-scene.js'
import { MasterBallScene } from './master-ball-scene.js'
import { BugContestScene } from './bug-contest-scene.js'
import { SafariScene } from './safari-scene.js'
import { AcademyQuizScene } from './academy-quiz-scene.js'
import { VoltorbFlipScene } from './voltorb-flip-scene.js'
import { AuctionHouseScene } from './auction-house-scene.js'
import { ContestScene } from './contest-scene.js'
import { PokeathlonScene } from './pokeathlon-scene.js'
import { PokeRadarScene } from './poke-radar-scene.js'
import { BattleRoyalScene } from './battle-royal-scene.js'
import { DynamaxAdventuresScene } from './dynamax-adventures-scene.js'
import { LightsOutScene } from './lights-out-scene.js'
import { CurryScene } from './curry-scene.js'
import { PokestarScene } from './pokestar-scene.js'
import { MiningScene } from './mining-scene.js'
import { GameCornerScene } from './game-corner-scene.js'
import { RouteActivityScene } from './route-activity-scene.js'
import { WonderTradeScene } from './wonder-trade-scene.js'
import { PokeballIcon } from './pokeball-icon.js'
import { MoveManagerPanel } from './move-manager-panel.js'
import { SpeedControls } from './speed-controls.js'

export function BattleScene() {
  const [showMoveManager, setShowMoveManager] = React.useState(!1),
    [showInfo, setShowInfo] = React.useState(!1),
    [showSettings, setShowSettings] = React.useState(!1),
    [showDaily, setShowDaily] = React.useState(!1),
    [showQuests, setShowQuests] = React.useState(!1),
    { state, dispatch } = useGame(),
    { playerPokemon, enemyPokemon, battleEvents } = state,
    completedGenerationSet = completedGenerations(state.pokedexCaught),
    caughtSpeciesSet = new Set(state.pokedexCaught),
    shinyCharmOdds = shinyOddsForCompletedGenerations(
      completedGenerationSet.size,
      speciesKeysByGeneration.length
    )
  if (state.phase === 'evolving') return jsx(EvolutionScene, {})
  if (state.phase === 'healing') return jsx(HealingScene, {})
  if (state.phase === 'catching') return jsx(MasterBallScene, {})
  if (state.phase === 'bugCatching') return jsx(BugContestScene, {})
  if (state.phase === 'safari') return jsx(SafariScene, {})
  if (state.phase === 'academyQuiz') return jsx(AcademyQuizScene, {})
  if (state.phase === 'voltorbFlip') return jsx(VoltorbFlipScene, {})
  if (state.phase === 'auctionHouse') return jsx(AuctionHouseScene, {})
  if (state.phase === 'contest') return jsx(ContestScene, {})
  if (state.phase === 'pokeathlon') return jsx(PokeathlonScene, {})
  if (state.phase === 'pokeRadar') return jsx(PokeRadarScene, {})
  if (state.phase === 'battleRoyal') return jsx(BattleRoyalScene, {})
  if (state.phase === 'dynamaxAdventures') return jsx(DynamaxAdventuresScene, {})
  if (state.phase === 'lightsOut') return jsx(LightsOutScene, {})
  if (state.phase === 'curry') return jsx(CurryScene, {})
  if (state.phase === 'pokestar') return jsx(PokestarScene, {})
  if (state.phase === 'mining') return jsx(MiningScene, {})
  if (state.phase === 'gameCorner') return jsx(GameCornerScene, {})
  if (state.phase === 'routeActivity') return jsx(RouteActivityScene, {})
  if (state.phase === 'wonderTrade') return jsx(WonderTradeScene, {})
  if (state.phase === 'dexComplete') return jsx(DexCompleteScene, {})
  if (!playerPokemon) return null
  const currentEvent = battleEvents.length > 0 ? battleEvents[battleEvents.length - 1] : null,
    playerSpecies = battleSpecies(state.playerVolatile?.formKey ?? playerPokemon.speciesKey),
    activeTrainerBattle = state.bossBattle ?? state.trainerBattle,
    lastDamageEvent = battleEvents
      .filter((event) => event.type === 'damage' || event.type === 'recoil')
      .pop(),
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
    damageFloat =
      isLatestDamage && lastDamageEvent?.data?.damage != null
        ? {
            target: lastDamageEvent.data.target,
            amount: lastDamageEvent.data.damage,
            key: battleEvents.length,
          }
        : null,
    enemyFainted = lastFaintEvent?.data?.target === 'enemy',
    playerFainted = lastFaintEvent?.data?.target === 'player',
    isTown = mapData[state.currentLocation]?.type === 'town',
    townBackground =
      {
        vermilionCity: '/backgrounds/town_port.png',
        cinnabarIsland: '/backgrounds/town_port.png',
        fuchsiaCity: '/backgrounds/town_port.png',
      }[state.currentLocation] || '/backgrounds/town.png',
    battleBackground =
      activeTrainerBattle || isTown
        ? townBackground
        : mapData[state.currentLocation]?.background ||
          locationImages[state.currentRoute] ||
          locationImages.route1
  return jsxs('div', {
    className: 'battle-scene',
    children: [
      jsx('div', {
        className: 'battle-scene-bg',
        style: {
          backgroundImage: `url('${battleBackground}')`,
          filter: BIOME_FILTERS[
            activeTrainerBattle || isTown ? 'town' : biomeForLocation(mapData[state.currentLocation])
          ],
        },
      }),
      (state.weather || state.terrain) &&
        jsxs('div', {
          className: 'battle-field-badges',
          children: [
            state.weather &&
              jsx('div', {
                className: `battle-weather-badge weather-${state.weather.type}`,
                title: `${WEATHER_NAMES[state.weather.type] ?? state.weather.type} \u2014 ${
                  state.weather.turns
                } turns left`,
                children: `${WEATHER_ICONS[state.weather.type] ?? ''} ${
                  WEATHER_NAMES[state.weather.type] ?? state.weather.type
                } \u00b7 ${state.weather.turns}`,
              }),
            state.terrain &&
              jsx('div', {
                className: `battle-weather-badge terrain-${state.terrain.type}`,
                title: `${TERRAIN_NAMES[state.terrain.type] ?? state.terrain.type} \u2014 ${
                  state.terrain.turns
                } turns left`,
                children: `${TERRAIN_ICONS[state.terrain.type] ?? ''} ${
                  TERRAIN_NAMES[state.terrain.type] ?? state.terrain.type
                } \u00b7 ${state.terrain.turns}`,
              }),
          ],
        }),
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
            className: `battle-info-btn daily-event-btn${
              state.dailyEvent && !state.dailyEvent.claimed ? ' claimable' : ''
            }`,
            onClick: () => setShowDaily(!0),
            title: state.dailyEvent
              ? dailyEventByKey[state.dailyEvent.kind]?.name ?? 'Daily Event'
              : 'Daily Event',
            children: state.dailyEvent
              ? dailyEventByKey[state.dailyEvent.kind]?.icon ?? '🎁'
              : '🎁',
          }),
          jsx('button', {
            className: `battle-info-btn daily-event-btn${
              hasClaimableQuests(state.quests) ? ' claimable' : ''
            }`,
            onClick: () => setShowQuests(!0),
            title: 'Daily Quests',
            children: '📜',
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
                        jsx('span', {
                          children:
                            completedGenerationSet.size > 0
                              ? `Shiny odds: 1/8192, or 1/${shinyCharmOdds} for a completed generation (${completedGenerationSet.size}/${speciesKeysByGeneration.length} charms)`
                              : 'Shiny odds: 1/8192 - complete a generation to unlock its Shiny Charm',
                        }),
                        jsx('div', {
                          className: 'info-shiny-generations',
                          children: speciesKeysByGeneration.map((requiredSpecies, generationIndex) => {
                            const isComplete = completedGenerationSet.has(generationIndex),
                              caughtCount = requiredSpecies.filter((speciesKey) =>
                                caughtSpeciesSet.has(speciesKey)
                              ).length
                            return jsxs(
                              'span',
                              {
                                className: `info-shiny-gen${isComplete ? ' complete' : ''}`,
                                children: [
                                  `Gen ${generationIndex + 1} `,
                                  isComplete ? '✓ Shiny Charm' : `${caughtCount}/${requiredSpecies.length}`,
                                ],
                              },
                              generationIndex
                            )
                          }),
                        }),
                        jsx('span', {
                          className: 'info-shiny-hint',
                          children:
                            'Catch every Pokemon in a generation to unlock its Shiny Charm (2x shiny rate)',
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
        jsxs('div', {
          className: 'enemy-info-anchor',
          children: [
            jsx(EnemyInfoBox, {
              pokemon: enemyPokemon,
              status: enemyPokemon.status ?? null,
              // Trainer teams aren't a catch reward, so only flag wilds with a
              // seen / caught / shiny-caught ball.
              dexStatus: !activeTrainerBattle
                ? getDexStatus(state, enemyPokemon.speciesKey)
                : null,
            }),
            !activeTrainerBattle &&
              state.phase === 'battling' &&
              (state.inventory.masterball ?? 0) > 0 &&
              shouldOfferMasterBall(state, enemyPokemon.speciesKey) &&
              jsxs('button', {
                className: 'masterball-throw-btn',
                onClick: () => dispatch({ type: 'THROW_MASTER_BALL' }),
                disabled: enemyFainted,
                title: 'Throw a Master Ball \u2014 catches without fail',
                children: [
                  jsx(PokeballIcon, { ballId: 'masterball', size: 16 }),
                  jsx('span', { children: `MASTER BALL \u00d7${state.inventory.masterball}` }),
                ],
              }),
            !activeTrainerBattle &&
              state.phase === 'battling' &&
              megaEvolveReady(state) &&
              jsxs('button', {
                className: 'mega-evolve-btn',
                onClick: () => dispatch({ type: 'MEGA_EVOLVE' }),
                title: 'Mega Evolve for the rest of the battle',
                children: [
                  jsx('span', { className: 'mega-evolve-icon', children: '\u2726' }),
                  jsx('span', { children: 'MEGA EVOLVE' }),
                ],
              }),
            !activeTrainerBattle &&
              state.phase === 'battling' &&
              enemyPokemon.fromActivity &&
              jsxs('button', {
                className: 'activity-catch-btn',
                onClick: () => dispatch({ type: 'ATTEMPT_CATCH' }),
                // Also block while a turn is still resolving: the queued faint
                // must finish first so the loop can't catch the same Pokemon
                // again from its victory handler.
                disabled: enemyFainted || state.pendingEvents.length > 0,
                title: 'Throw your best ball at this Pokemon',
                children: [
                  jsx(PokeballIcon, { ballId: 'pokeball', size: 16 }),
                  jsx('span', { children: 'ATTEMPT CATCH' }),
                ],
              }),
          ],
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
          className: `sprite-container enemy-sprite ${enemyWasHit ? 'hit-flash hit-shake' : ''} ${enemyFainted ? 'faint-anim' : ''} ${isTrainerSendOut ? 'pokemon-appear' : ''}${enemyPokemon.isShiny ? ' shiny-sparkle' : ''}`,
          children: [
            jsx('div', {
              className: 'sprite-shadow',
            }),
            damageFloat?.target === 'enemy' &&
              jsx('span', {
                className: 'damage-float',
                key: `enemy-float-${damageFloat.key}`,
                children: `-${damageFloat.amount}`,
              }),
            jsx('img', {
              src: getPokemonSpriteUrl(
                battleSpecies(enemyPokemon.formKey ?? enemyPokemon.speciesKey).id,
                !1,
                enemyPokemon.isShiny,
                isFemalePokemon(enemyPokemon)
              ),
              onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(
                battleSpecies(enemyPokemon.formKey ?? enemyPokemon.speciesKey).id,
                !1,
                enemyPokemon.isShiny,
                isFemalePokemon(enemyPokemon)
              )),
              alt: enemyPokemon.name,
            }),
          ],
        }),
      jsxs('div', {
        className: `sprite-container player-sprite ${playerWasHit ? 'hit-flash hit-shake' : ''} ${playerFainted ? 'faint-anim' : ''} ${isPlayerSwitch ? 'pokemon-appear' : ''}${state.playerPokemon?.isShiny ? ' shiny-sparkle' : ''}`,
        children: [
          jsx('div', {
            className: 'sprite-shadow',
          }),
          damageFloat?.target === 'player' &&
            jsx('span', {
              className: 'damage-float',
              key: `player-float-${damageFloat.key}`,
              children: `-${damageFloat.amount}`,
            }),
          jsx('img', {
            src: getPokemonSpriteUrl(
              playerSpecies.id,
              !0,
              state.playerPokemon?.isShiny,
              isFemalePokemon(playerPokemon)
            ),
            onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(
              playerSpecies.id,
              !0,
              state.playerPokemon?.isShiny,
              isFemalePokemon(playerPokemon)
            )),
            alt: playerPokemon.name,
          }),
        ],
      }),
      jsx('div', {
        className: 'player-info-anchor',
        children: jsx(PlayerInfoBox, {
          // Reflect the battle-only form (Mega Evolution) in the name/typing.
          pokemon: { ...playerPokemon, name: playerSpecies.name, types: playerSpecies.types },
          status: state.playerVolatile?.status ?? null,
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
        state.playerPokemon &&
        jsx(MoveManagerPanel, {
          pokemon: state.playerPokemon,
          onClose: () => setShowMoveManager(!1),
        }),
      showSettings &&
        createPortal(
          jsx(SettingsModal, {
            onClose: () => setShowSettings(!1),
          }),
          document.body
        ),
      showDaily &&
        createPortal(
          jsx(DailyEventModal, {
            onClose: () => setShowDaily(!1),
          }),
          document.body
        ),
      showQuests &&
        createPortal(
          jsx(QuestsModal, {
            onClose: () => setShowQuests(!1),
          }),
          document.body
        ),
    ],
  })
}
