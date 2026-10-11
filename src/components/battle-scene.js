// Split from a grouped component file.

import React from 'react'
import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { formatMoveAccuracy } from '../data/moves.js'
import { MoveCategoryIcon } from './move-category-icon.js'
import { moveTooltip } from '../game/move-info.js'
import { dailyEventByKey } from '../data/daily-events.js'
import { hasClaimableQuests } from '../game/quests.js'
import { biomeBackgroundFor, biomeForLocation, BIOME_FILTERS, DAY_NIGHT_FILTERS, locationImages } from '../data/ui.js'
import { useDayPhase } from '../hooks.js'
import { getDexStatus, shouldOfferMasterBall } from '../game/catching.js'
import { battleSpecies, estimateMoveDamage, getTypeMultiplier } from '../game/combat.js'
import { BattleWeatherOverlay } from './battle-weather-overlay.js'
import { isFemalePokemon } from '../game/breeding.js'
import { WEATHER_ICONS, WEATHER_NAMES } from '../game/weather.js'
import { TERRAIN_ICONS, TERRAIN_NAMES } from '../game/terrain.js'
import { mapData, moveData } from '../data/gameData.js'
import { gmaxEvolveReady, megaEvolveReady } from '../data/mega-evolution.js'
import { useGame } from '../game/context.js'
import { getBossTrainerSpriteUrl, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, getTrainerSpriteUrl, isBattleReady } from '../game/pokemon.js'
import { EnemyInfoBox } from './enemy-info-box.js'
import { PlayerInfoBox } from './player-info-box.js'
import { BattleTextBox } from './battle-text-box.js'
import { EvolutionScene } from './evolution-scene.js'
import { DexCompleteScene } from './dex-complete-scene.js'
import { GameOverScene } from './game-over-scene.js'
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
import { ChampionGauntletScene } from './champion-gauntlet-scene.js'
import { DoublesScene } from './doubles-scene.js'
import { DynamaxAdventuresScene } from './dynamax-adventures-scene.js'
import { LightsOutScene } from './lights-out-scene.js'
import { CurryScene } from './curry-scene.js'
import { PokestarScene } from './pokestar-scene.js'
import { PuzzleLeagueScene } from './puzzle-league-scene.js'
import { MemoryScene } from './memory-scene.js'
import { WhackScene } from './whack-scene.js'
import { MusicalScene } from './musical-scene.js'
import { PicnicScene } from './picnic-scene.js'
import { PokeballFactoryScene } from './pokeball-factory-scene.js'
import { RuinsPuzzleScene } from './ruins-puzzle-scene.js'
import { IceSlideScene } from './ice-slide-scene.js'
import { PokePelagoScene } from './poke-pelago-scene.js'
import { MantineSurfScene } from './mantine-surf-scene.js'
import { RotomRallyScene } from './rotom-rally-scene.js'
import { OgreOustinScene } from './ogre-oustin-scene.js'
import { TypeFusionScene } from './type-fusion-scene.js'
import { UnownPicrossScene } from './unown-picross-scene.js'
import { PokeshotScene } from './pokeshot-scene.js'
import { TeraRaidScene } from './tera-raid-scene.js'
import { PokewordScene } from './pokeword-scene.js'
import { BerryBlenderScene } from './berry-blender-scene.js'
import { UltraWarpScene } from './ultra-warp-scene.js'
import { MiningScene } from './mining-scene.js'
import { GameCornerScene } from './game-corner-scene.js'
import { RouteActivityScene } from './route-activity-scene.js'
import { WonderTradeScene } from './wonder-trade-scene.js'
import { PokeballIcon } from './pokeball-icon.js'
import { SpeedControls } from './speed-controls.js'

/**
 * A move's effectiveness against the current foe and a rough KO estimate, for
 * the manual move buttons. Status moves (and a missing foe) return null.
 * @param {any} moveDef
 * @param {any} playerPokemon
 * @param {any} enemyPokemon
 * @param {boolean} [inverse] Inverse-battle type chart (the Battle Arena).
 * @returns {{ multiplier: number, ko: boolean } | null}
 */
function movePreview(moveDef, playerPokemon, enemyPokemon, inverse = !1) {
  if (!enemyPokemon || !moveDef || !(moveDef.power > 0)) return null
  const physical = moveDef.category === 'physical',
    attack = physical ? playerPokemon.attack : playerPokemon.spAttack,
    defense = physical ? enemyPokemon.defense : enemyPokemon.spDefense,
    attackStage = playerPokemon.statStages?.[physical ? 'attack' : 'spAttack'] ?? 0,
    defenseStage = enemyPokemon.statStages?.[physical ? 'defense' : 'spDefense'] ?? 0,
    estimate = estimateMoveDamage(
      playerPokemon.level,
      attack,
      defense,
      moveDef,
      playerPokemon.types ?? [],
      enemyPokemon.types ?? [],
      attackStage,
      defenseStage,
      inverse
    ),
    multiplier = getTypeMultiplier(moveDef.type, enemyPokemon.types ?? [], inverse)
  return { multiplier, ko: estimate >= (enemyPokemon.currentHp ?? 0) }
}

/** @param {number} multiplier */
function formatEffectiveness(multiplier) {
  if (multiplier === 0) return '\u00d70'
  if (multiplier === 0.25) return '\u00d7\u00bc'
  if (multiplier === 0.5) return '\u00d7\u00bd'
  if (multiplier === 0.125) return '\u00d7\u215b'
  return `\u00d7${multiplier}`
}

/** @param {{ onOpenMenu: (menu: import('./battle-menu-modals.js').BattleMenuKey) => void }} props */
export function BattleScene({ onOpenMenu }) {
  const [showSwitch, setShowSwitch] = React.useState(!1),
    { state, dispatch } = useGame(),
    dayPhase = useDayPhase(),
    { playerPokemon, enemyPokemon, battleEvents } = state
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
  if (state.phase === 'championGauntlet') return jsx(ChampionGauntletScene, {})
  if (state.phase === 'doubles') return jsx(DoublesScene, {})
  if (state.phase === 'dynamaxAdventures') return jsx(DynamaxAdventuresScene, {})
  if (state.phase === 'lightsOut') return jsx(LightsOutScene, {})
  if (state.phase === 'curry') return jsx(CurryScene, {})
  if (state.phase === 'pokestar') return jsx(PokestarScene, {})
  if (state.phase === 'puzzleLeague') return jsx(PuzzleLeagueScene, {})
  if (state.phase === 'memory') return jsx(MemoryScene, {})
  if (state.phase === 'whack') return jsx(WhackScene, {})
  if (state.phase === 'musical') return jsx(MusicalScene, {})
  if (state.phase === 'picnic') return jsx(PicnicScene, {})
  if (state.phase === 'pokeballFactory') return jsx(PokeballFactoryScene, {})
  if (state.phase === 'ruinsPuzzle') return jsx(RuinsPuzzleScene, {})
  if (state.phase === 'iceSlide') return jsx(IceSlideScene, {})
  if (state.phase === 'pelago') return jsx(PokePelagoScene, {})
  if (state.phase === 'mantineSurf') return jsx(MantineSurfScene, {})
  if (state.phase === 'rotomRally') return jsx(RotomRallyScene, {})
  if (state.phase === 'ogreOustin') return jsx(OgreOustinScene, {})
  if (state.phase === 'typeFusion') return jsx(TypeFusionScene, {})
  if (state.phase === 'unownPicross') return jsx(UnownPicrossScene, {})
  if (state.phase === 'pokeshot') return jsx(PokeshotScene, {})
  if (state.phase === 'teraRaid') return jsx(TeraRaidScene, {})
  if (state.phase === 'pokeword') return jsx(PokewordScene, {})
  if (state.phase === 'berryBlender') return jsx(BerryBlenderScene, {})
  if (state.phase === 'ultraWarp') return jsx(UltraWarpScene, {})
  if (state.phase === 'mining') return jsx(MiningScene, {})
  if (state.phase === 'gameCorner') return jsx(GameCornerScene, {})
  if (state.phase === 'routeActivity') return jsx(RouteActivityScene, {})
  if (state.phase === 'wonderTrade') return jsx(WonderTradeScene, {})
  if (state.phase === 'dexComplete') return jsx(DexCompleteScene, {})
  if (state.phase === 'gameOver') return jsx(GameOverScene, {})
  if (!playerPokemon) return null
  const currentEvent = battleEvents.length > 0 ? battleEvents[battleEvents.length - 1] : null,
    playerSpecies = battleSpecies(state.playerVolatile?.formKey ?? playerPokemon.speciesKey),
    activeTrainerBattle = state.bossBattle ?? state.trainerBattle,
    lastDamageEvent = battleEvents
      .filter((event) => event.type === 'damage' || event.type === 'recoil')
      .pop(),
    lastFaintEvent = battleEvents.filter((event) => event.type === 'faint').pop(),
    hasTrainerAppeared = battleEvents.some((event) => event.type === 'trainerAppear'),
    showTrainerIntro =
      activeTrainerBattle && (currentEvent?.type === 'trainerAppear' || (currentEvent?.type === 'trainerSendOut' && hasTrainerAppeared)),
    trainerIntroSlideOut = currentEvent?.type === 'trainerSendOut' && hasTrainerAppeared,
    isTrainerSendOut = currentEvent?.type === 'trainerSendOut',
    isPlayerSwitch = currentEvent?.type === 'playerSwitch',
    // Keep the foe hidden from the moment a send cycle begins (a walk-in is
    // queued) until their Pokemon is actually thrown out. Watching the pending
    // queue rather than `battleEvents.length` matters for the Elite Four /
    // Champion gauntlet, where the prize message is consumed before the next
    // trainer appears — otherwise their Pokemon flashes on screen first.
    hideEnemySprite =
      !!activeTrainerBattle &&
      (currentEvent?.type === 'trainerAppear' ||
        state.pendingEvents.some((event) => event.type === 'trainerAppear')),
    isLatestDamage = lastDamageEvent ? battleEvents.indexOf(lastDamageEvent) === battleEvents.length - 1 : !1,
    playerWasHit = lastDamageEvent?.data?.target === 'player' && isLatestDamage,
    enemyWasHit = lastDamageEvent?.data?.target === 'enemy' && isLatestDamage,
    damageFloat =
      state.showDamageNumbers && isLatestDamage && lastDamageEvent?.data?.damage != null
        ? {
            target: lastDamageEvent.data.target,
            amount: lastDamageEvent.data.damage,
            key: battleEvents.length,
          }
        : null,
    lastProtectEvent = battleEvents.filter((event) => event.type === 'protect').pop(),
    protectEffect =
      lastProtectEvent && battleEvents.indexOf(lastProtectEvent) === battleEvents.length - 1
        ? {
            target: lastProtectEvent.data?.target === 'enemy' ? 'enemy' : 'player',
            blocked: !!lastProtectEvent.data?.blocked,
            failed: !!lastProtectEvent.data?.failed,
          }
        : null,
    enemyFainted = lastFaintEvent?.data?.target === 'enemy',
    enemyDexStatus =
      !activeTrainerBattle && enemyPokemon
        ? getDexStatus(state, enemyPokemon.speciesKey)
        : null,
    playerFainted = lastFaintEvent?.data?.target === 'player',
    isTown = mapData[state.currentLocation]?.type === 'town',
    townBattle = activeTrainerBattle || isTown,
    townBackground =
      {
        vermilionCity: '/backgrounds/town_port.webp',
        cinnabarIsland: '/backgrounds/town_port.webp',
        fuchsiaCity: '/backgrounds/town_port.webp',
      }[state.currentLocation] || '/backgrounds/town.webp',
    // Wild routes can use dedicated biome art when it exists, otherwise their
    // base scene plus the biome grade (see src/data/ui.js).
    biomeScene = townBattle ? null : biomeBackgroundFor(mapData[state.currentLocation]),
    battleBiome = townBattle ? 'town' : biomeForLocation(mapData[state.currentLocation]),
    battleBackground =
      townBattle
        ? townBackground
        : biomeScene?.image ||
          mapData[state.currentLocation]?.background ||
          locationImages[state.currentRoute] ||
          locationImages.route1
  // Manual battle mode: the loop waits for the player to pick a move or switch.
  // Forced turns (recharge / charging / a locked move, or a switch already
  // made this turn) resolve themselves.
  const manualMode = state.battleMode === 'manual',
    forcedAction =
      !!state.playerVolatile?.mustRecharge ||
      !!state.playerVolatile?.chargingMove ||
      !!state.playerVolatile?.lockedMove,
    awaitingManual =
      manualMode &&
      state.phase === 'battling' &&
      state.pendingEvents.length === 0 &&
      !state.pendingPlayerMove &&
      !state.playerTurnSpent &&
      !forcedAction,
    // Trapped by Block / Mean Look / Arena Trap / Fairy Lock / ... — cannot switch out.
    playerTrapped =
      !!state.playerVolatile?.trappedByMove ||
      !!state.playerVolatile?.trappedByAbility ||
      (state.playerVolatile?.fairyLockTurns ?? 0) > 0,
    // A fainted active Pokemon in manual mode waits for the player to pick who
    // comes out next (the loop stops there until they do).
    faintReplacement =
      manualMode &&
      state.phase === 'defeat' &&
      state.party.some((member) => isBattleReady(member)),
    switchPickerOpen = showSwitch || faintReplacement
  return jsxs('div', {
    className: 'battle-scene',
    children: [
      jsx('div', {
        className: 'battle-scene-bg',
        style: {
          backgroundImage: `url('${battleBackground}')`,
          filter:
            [
              biomeScene ? 'none' : BIOME_FILTERS[battleBiome],
              DAY_NIGHT_FILTERS[dayPhase.id],
            ]
              .filter((part) => part && part !== 'none')
              .join(' ') || 'none',
        },
      }),
      jsx(BattleWeatherOverlay, {
        weather: state.weather?.type,
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
            onClick: () => onOpenMenu('info'),
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
            onClick: () => onOpenMenu('daily'),
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
            onClick: () => onOpenMenu('quests'),
            title: 'Daily Quests',
            children: '📜',
          }),
          // Companion care moves out of Poké Pelago once it is unlocked, so it
          // sits with the dailies instead of hiding behind the Alola hub.
          state.unlockedLocations?.includes('alola-poke-pelago') &&
            jsx('button', {
              className: `battle-info-btn companion-btn${
                state.companion?.id && state.wildBattlesWon > state.companion.careBattle
                  ? ' claimable'
                  : ''
              }`,
              onClick: () => onOpenMenu('companion'),
              title: 'Companion',
              children: '🐾',
            }),
          jsx('button', {
            className: 'battle-info-btn',
            onClick: () => onOpenMenu('settings'),
            children: jsx('span', {
              className: 'settings-icon',
              children: '⚙',
            }),
          }),
        ],
      }),
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
              // A wild Illusion user shows its disguise until it is hit.
              pokemon: enemyPokemon.disguisedAs
                ? { ...enemyPokemon, name: enemyPokemon.disguisedAs.name }
                : enemyPokemon,
              status: enemyPokemon.status ?? null,
              // Trainer teams aren't a catch reward, so only flag wilds with a
              // seen / caught / shiny-caught ball.
              dexStatus: enemyDexStatus,
            }),
            !activeTrainerBattle &&
              state.phase === 'battling' &&
              (state.inventory.masterball ?? 0) > 0 &&
              !enemyPokemon.noCatch &&
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
              gmaxEvolveReady(state) &&
              jsxs('button', {
                className: 'mega-evolve-btn gmax-evolve-btn',
                onClick: () => dispatch({ type: 'GMAX_EVOLVE' }),
                title: 'Gigantamax for the rest of the battle',
                children: [
                  jsx('span', { className: 'mega-evolve-icon', children: '\u2601' }),
                  jsx('span', { children: 'GIGANTAMAX' }),
                ],
              }),
            !activeTrainerBattle &&
              state.phase === 'battling' &&
              enemyPokemon.fromActivity &&
              !enemyPokemon.noCatch &&
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
          className: `sprite-container enemy-sprite ${enemyWasHit ? 'hit-flash hit-shake' : ''} ${enemyFainted ? 'faint-anim' : ''} ${isTrainerSendOut ? 'pokemon-appear' : ''}${enemyPokemon.isShiny && state.showShinySparkles ? ' shiny-sparkle' : ''}`,
          children: [
            jsx('div', {
              className: 'sprite-shadow',
            }),
            damageFloat?.target === 'enemy' &&
              jsx('span', {
                className: 'damage-float',
                children: `-${damageFloat.amount}`,
              }, `enemy-float-${damageFloat.key}`),
            protectEffect?.target === 'enemy' && !protectEffect.failed &&
              jsx('div', { className: 'protect-shield' }),
            protectEffect?.target === 'enemy' &&
              jsx('span', {
                className: `protect-callout${protectEffect.failed ? ' failed' : ''}`,
                children: protectEffect.failed ? 'Failed!' : protectEffect.blocked ? 'Blocked!' : 'Shield',
              }),
            jsx('img', {
              src: getPokemonSpriteUrl(
                battleSpecies(
                  enemyPokemon.disguisedAs?.speciesKey ??
                    enemyPokemon.formKey ??
                    enemyPokemon.speciesKey
                ).id,
                !1,
                enemyPokemon.isShiny,
                isFemalePokemon(enemyPokemon)
              ),
              onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(
                battleSpecies(
                  enemyPokemon.disguisedAs?.speciesKey ??
                    enemyPokemon.formKey ??
                    enemyPokemon.speciesKey
                ).id,
                !1,
                enemyPokemon.isShiny,
                isFemalePokemon(enemyPokemon)
              )),
              alt: enemyPokemon.disguisedAs?.name ?? enemyPokemon.name,
            }),
          ],
        }),
      jsxs('div', {
        className: `sprite-container player-sprite ${playerWasHit ? 'hit-flash hit-shake' : ''} ${playerFainted ? 'faint-anim' : ''} ${isPlayerSwitch ? 'pokemon-appear' : ''}${state.playerPokemon?.isShiny && state.showShinySparkles ? ' shiny-sparkle' : ''}`,
        children: [
          jsx('div', {
            className: 'sprite-shadow',
          }),
          damageFloat?.target === 'player' &&
            jsx('span', {
              className: 'damage-float',
              children: `-${damageFloat.amount}`,
            }, `player-float-${damageFloat.key}`),
          protectEffect?.target === 'player' && !protectEffect.failed &&
            jsx('div', { className: 'protect-shield' }),
          protectEffect?.target === 'player' &&
            jsx('span', {
              className: `protect-callout${protectEffect.failed ? ' failed' : ''}`,
              children: protectEffect.failed ? 'Failed!' : protectEffect.blocked ? 'Blocked!' : 'Shield',
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
          jsxs('div', {
            className: 'battle-text-row',
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
              jsx('button', {
                className: `battle-mode-btn${manualMode ? ' active' : ''}`,
                onClick: () =>
                  dispatch({
                    type: 'SET_BATTLE_MODE',
                    payload: { mode: manualMode ? 'auto' : 'manual' },
                  }),
                title: manualMode
                  ? 'Manual mode \u2014 you choose each move'
                  : 'Auto mode \u2014 the game battles for you',
                children: manualMode ? 'MANUAL' : 'AUTO',
              }),
            ],
          }),
          jsxs('div', {
            className: 'bottom-right-panel',
            children: [
              manualMode &&
                state.phase === 'battling' &&
                jsxs('div', {
                  className: 'move-actions',
                  children: [
                    jsx('button', {
                      className: 'manual-switch-btn',
                      disabled: !awaitingManual || playerTrapped,
                      onClick: () => setShowSwitch(!0),
                      children: 'SWITCH',
                    }),
                    !state.trainerBattle &&
                      !state.bossBattle &&
                      jsx('button', {
                        className: 'manual-switch-btn manual-run-btn',
                        disabled: !awaitingManual,
                        onClick: () => dispatch({ type: 'FLEE' }),
                        children: 'RUN',
                      }),
                    jsx('span', {
                      className: `manual-status${awaitingManual ? ' your-turn' : ''}`,
                      children: state.pendingPlayerMove
                        ? 'Resolving...'
                        : forcedAction || state.playerTurnSpent
                          ? 'Resolving...'
                          : playerTrapped
                            ? 'TRAPPED — can\u2019t switch'
                            : awaitingManual
                              ? 'YOUR MOVE'
                              : 'Waiting...',
                    }),
                  ],
                }),
              jsx('div', {
                className: 'move-grid',
                children: playerPokemon.moves.map((moveId) => {
                  const moveDef = moveData[moveId],
                    preview = moveDef
                      ? movePreview(
                          moveDef,
                          playerPokemon,
                          enemyPokemon,
                          state.bossBattle?.rule === 'inverse'
                        )
                      : null
                  return moveDef
                    ? jsxs(
                        'div',
                        {
                          className: `move-cell type-bg-${moveDef.type.toLowerCase()}${
                            awaitingManual ? ' selectable' : ''
                          }${state.pendingPlayerMove === moveId ? ' chosen' : ''}`,
                          onClick: awaitingManual
                            ? () =>
                                dispatch({
                                  type: 'CHOOSE_PLAYER_MOVE',
                                  payload: { moveId },
                                })
                            : void 0,
                          'data-tooltip': moveTooltip(moveId, moveDef),
                          children: [
                            jsxs('div', {
                              className: 'move-top-row',
                              children: [
                                jsx('span', {
                                  className: 'move-category-icon',
                                  children: jsx(MoveCategoryIcon, {
                                    category: moveDef.category,
                                  }),
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
                                    formatMoveAccuracy(moveDef.accuracy),
                                  ],
                                }),
                              ],
                            }),
                            preview && (preview.multiplier !== 1 || preview.ko)
                              ? jsxs('div', {
                                  className: 'move-preview',
                                  children: [
                                    preview.multiplier !== 1 &&
                                      jsx('span', {
                                        className: `move-effectiveness${
                                          preview.multiplier > 1
                                            ? ' strong'
                                            : preview.multiplier === 0
                                              ? ' immune'
                                              : ' weak'
                                        }`,
                                        children: formatEffectiveness(preview.multiplier),
                                      }),
                                    preview.ko &&
                                      jsx('span', {
                                        className: 'move-ko',
                                        children: 'KO',
                                      }),
                                  ],
                                })
                              : null,
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
      switchPickerOpen &&
        createPortal(
          jsx('div', {
            className: 'battle-info-overlay',
            onClick: () => {
              if (!faintReplacement) setShowSwitch(!1)
            },
            children: jsxs('div', {
              className: 'battle-info-modal switch-modal',
              onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
              children: [
                jsxs('div', {
                  className: 'battle-info-header',
                  children: [
                    jsx('span', {
                      className: 'battle-info-title',
                      children: faintReplacement ? 'Choose Your Next Pokemon' : 'Switch Pokemon',
                    }),
                    faintReplacement
                      ? null
                      : jsx('button', {
                          className: 'battle-info-close',
                          onClick: () => setShowSwitch(!1),
                          children: 'X',
                        }),
                  ],
                }),
                jsxs('div', {
                  className: 'switch-list',
                  children: state.party.map((member, index) => {
                    const spriteSpecies = battleSpecies(member.speciesKey),
                      disabled = index === state.activePlayerPokemonIndex || !isBattleReady(member)
                    return jsxs(
                      'button',
                      {
                        className: `switch-option${index === state.activePlayerPokemonIndex ? ' active' : ''}`,
                        disabled,
                        onClick: () => {
                          setShowSwitch(!1)
                          dispatch({
                            type: 'SWITCH_PLAYER_POKEMON',
                            payload: { newPokemonIndex: index, costsTurn: !faintReplacement },
                          })
                          if (faintReplacement) dispatch({ type: 'RELEASE_FAINTED' })
                        },
                        children: [
                          jsx('img', {
                            className: 'switch-option-sprite',
                            src: getPokemonSpriteUrl(
                              spriteSpecies.id,
                              !1,
                              member.isShiny,
                              isFemalePokemon(member)
                            ),
                            onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(
                              spriteSpecies.id,
                              !1,
                              member.isShiny,
                              isFemalePokemon(member)
                            )),
                            alt: member.name,
                          }),
                          jsxs('span', {
                            className: 'switch-option-info',
                            children: [
                              jsx('span', {
                                className: 'switch-option-name',
                                children: member.name,
                              }),
                              jsxs('span', {
                                className: 'switch-option-meta',
                                children: [
                                  `Lv.${member.level}`,
                                  ' \u00b7 ',
                                  `${member.currentHp}/${member.maxHp} HP`,
                                ],
                              }),
                            ],
                          }),
                        ],
                      },
                      member.id
                    )
                  }),
                }),
              ],
            }),
          }),
          document.body
        ),
    ],
  })
}
