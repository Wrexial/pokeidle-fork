// The Trainer hub: the player's card (name, title, outfit and favourite
// Pokemon), pinned badges and PNG export, plus the League, Records and Run
// Summary views as sub-tabs. Rendered inline as a single Backpack tab.
// The GymPanel sub-view keeps its Kecleon Shop shortcut through `onOpenShop`.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { OUTFITS } from '../data/outfits.js'
import { gymLeaderData, mapData, regions } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { pokemonDisplayName } from '../game/pokemon.js'
import { exportTrainerCardPng } from '../game/trainer-card-export.js'
import { availableOutfits, buildTrainerCard, createTrainerProfile } from '../game/trainer-profile.js'
import { availableTitles } from '../game/titles.js'
import { GymPanel } from './gym-panel.js'
import { RecordsModal } from './records-modal.js'
import { RunSummaryModal } from './run-summary-modal.js'
import { TrainerCard } from './trainer-card.js'

// The Trainer hub's sub-views. The Backpack renders one "Trainer" tab; this
// panel hosts the card itself plus the League, Records and Run Summary views
// that used to sit in their own top-level tabs.
const TRAINER_TABS = [
  { id: 'card', label: 'Card' },
  { id: 'league', label: 'League' },
  { id: 'records', label: 'Records' },
  { id: 'summary', label: 'Summary' },
]

/**
 * @param {{ onClose?: () => void, inline?: boolean, onOpenShop?: () => void }} props
 */
export function TrainerCardPanel({ onClose, inline = false, onOpenShop }) {
  const { state, dispatch } = useGame(),
    [tab, setTab] = React.useState('card'),
    [exportStatus, setExportStatus] = React.useState(''),
    profile = state.trainerProfile ?? createTrainerProfile(),
    card = buildTrainerCard(state),
    titles = availableTitles(state),
    unlockedOutfits = availableOutfits(state).map((outfit) => outfit.id),
    favouriteOptions = [...(state.party ?? []), ...(state.box ?? [])],
    regionId = mapData[state.currentLocation]?.region ?? state.startRegion ?? 'kanto',
    regionName = regions.find((region) => region.id === regionId)?.name ?? regionId,
    regionGyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === regionId),
    earned = new Set(state.defeatedGyms ?? []),
    earnedRegionBadgeIds = regionGyms
      .filter((gym) => earned.has(gym.id))
      .map((gym) => gym.id),
    autoBadgeCase = (profile.badgeCase ?? []).length === 0,
    shownBadgeIds = autoBadgeCase ? earnedRegionBadgeIds : profile.badgeCase

  /** @param {string} name */
  function setName(name) {
    dispatch({ type: 'UPDATE_TRAINER_PROFILE', payload: { name } })
  }

  /** @param {string} gymId */
  function toggleBadge(gymId) {
    const next = shownBadgeIds.includes(gymId)
      ? shownBadgeIds.filter((id) => id !== gymId)
      : [...shownBadgeIds, gymId]
    dispatch({ type: 'UPDATE_TRAINER_PROFILE', payload: { badgeCase: next } })
  }

  async function exportCard() {
    setExportStatus('Rendering…')
    const ok = await exportTrainerCardPng(card).catch(() => false)
    setExportStatus(ok ? 'Card downloaded!' : 'Could not export the card.')
  }

  const achievementTitles = titles.filter((title) => title.source === 'achievement'),
    ribbonTitles = titles.filter((title) => title.source === 'ribbon')

  const cardContent = jsxs('div', {
    className: 'trainer-card-scroll',
    children: [
      jsxs('div', {
        className: 'trainer-card-panel-head',
        children: [
          jsx('span', { className: 'trainer-card-panel-title', children: 'Trainer Card' }),
          onClose
            ? jsx('button', {
                className: 'battle-info-close',
                onClick: onClose,
                children: 'X',
              })
            : null,
        ],
      }),
      jsx(TrainerCard, { card }),
      jsxs('div', {
        className: 'trainer-card-actions',
        children: [
          jsx('button', {
            className: 'settings-save-btn',
            onClick: exportCard,
            children: '⬇ Export Card (PNG)',
          }),
          exportStatus
            ? jsx('span', { className: 'trainer-card-export-status', children: exportStatus })
            : null,
        ],
      }),
      jsxs('div', {
        className: 'settings-section trainer-card-section',
        children: [
          jsx('div', { className: 'settings-section-title', children: 'Identity' }),
          jsxs('label', {
            className: 'trainer-card-field',
            children: [
              jsx('span', { children: 'Name' }),
              jsx('input', {
                className: 'trainer-card-input',
                type: 'text',
                maxLength: 16,
                value: profile.name,
                onChange: /** @param {React.ChangeEvent<HTMLInputElement>} event */ (event) =>
                  setName(event.target.value),
              }),
            ],
          }),
          jsxs('label', {
            className: 'trainer-card-field',
            children: [
              jsx('span', { children: 'Title' }),
              jsxs('select', {
                className: 'trainer-card-select',
                value: profile.title ?? '',
                onChange: /** @param {React.ChangeEvent<HTMLSelectElement>} event */ (event) =>
                  dispatch({
                    type: 'UPDATE_TRAINER_PROFILE',
                    payload: { title: event.target.value || null },
                  }),
                children: [
                  jsx('option', { value: '', children: 'No title' }),
                  achievementTitles.length > 0
                    ? jsx('optgroup', {
                        label: 'Achievements',
                        children: achievementTitles.map((title) =>
                          jsx(
                            'option',
                            { value: title.id, title: title.description, children: title.name },
                            title.id
                          )
                        ),
                      })
                    : null,
                  ribbonTitles.length > 0
                    ? jsx('optgroup', {
                        label: 'Ribbons',
                        children: ribbonTitles.map((title) =>
                          jsx(
                            'option',
                            { value: title.id, title: title.description, children: title.name },
                            title.id
                          )
                        ),
                      })
                    : null,
                ],
              }),
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'settings-section trainer-card-section',
        children: [
          jsx('div', { className: 'settings-section-title', children: 'Outfit' }),
          jsx('p', {
            className: 'settings-hint',
            children:
              'Unlock outfits by earning achievements, or buy the pricier ones below.',
          }),
          jsx('div', {
            className: 'trainer-outfit-grid',
            children: OUTFITS.map((outfit) => {
              const unlocked = unlockedOutfits.includes(outfit.id),
                selected = profile.outfit === outfit.id,
                cost = outfit.unlock.cost,
                affordable = cost != null && state.money >= cost,
                label = outfit.unlock.achievement
                  ? 'Earn the matching achievement'
                  : cost != null
                    ? `$${cost.toLocaleString()}`
                    : ''
              return jsxs(
                'div',
                {
                  className: `trainer-outfit${selected ? ' selected' : ''}${unlocked ? '' : ' locked'}`,
                  title: outfit.description,
                  children: [
                    jsx('button', {
                      className: 'trainer-outfit-swatch',
                      disabled: !unlocked,
                      style: {
                        background: `linear-gradient(135deg, ${outfit.bg[0]}, ${outfit.bg[1]})`,
                        borderColor: selected ? outfit.shirt : void 0,
                      },
                      onClick: () =>
                        dispatch({
                          type: 'UPDATE_TRAINER_PROFILE',
                          payload: { outfit: outfit.id },
                        }),
                      children: jsx('span', {
                        className: 'trainer-outfit-emblem',
                        children: outfit.emblem,
                      }),
                    }),
                    jsx('span', { className: 'trainer-outfit-name', children: outfit.name }),
                    !unlocked && cost != null
                      ? jsx('button', {
                          className: 'trainer-outfit-buy',
                          disabled: !affordable,
                          onClick: () =>
                            dispatch({ type: 'BUY_OUTFIT', payload: { outfitId: outfit.id } }),
                          children: affordable ? `Buy ${label}` : `Need ${label}`,
                        })
                      : !unlocked
                        ? jsx('span', {
                            className: 'trainer-outfit-hint',
                            children: label,
                          })
                        : null,
                  ],
                },
                outfit.id
              )
            }),
          }),
        ],
      }),
      jsxs('div', {
        className: 'settings-section trainer-card-section',
        children: [
          jsx('div', { className: 'settings-section-title', children: 'Favourite Pokemon' }),
          jsx('p', {
            className: 'settings-hint',
            children: 'The partner shown on the card. Defaults to your active Pokemon.',
          }),
          favouriteOptions.length > 0
            ? jsxs('select', {
                className: 'trainer-card-select',
                value: profile.favouritePokemonId ?? '',
                onChange: /** @param {React.ChangeEvent<HTMLSelectElement>} event */ (event) =>
                  dispatch({
                    type: 'UPDATE_TRAINER_PROFILE',
                    payload: { favouritePokemonId: event.target.value || null },
                  }),
                children: [
                  jsx('option', {
                    value: '',
                    children: `Active${
                      state.playerPokemon ? ` \u00b7 ${pokemonDisplayName(state.playerPokemon)}` : ''
                    }`,
                  }),
                  favouriteOptions.map((member) =>
                    jsx(
                      'option',
                      {
                        value: member.id,
                        children: `${pokemonDisplayName(member)} \u00b7 Lv.${member.level}`,
                      },
                      member.id
                    )
                  ),
                ],
              })
            : jsx('p', {
                className: 'settings-hint',
                children: 'Catch a Pokemon first.',
              }),
        ],
      }),
      jsxs('div', {
        className: 'settings-section trainer-card-section',
        children: [
          jsx('div', { className: 'settings-section-title', children: 'Badge Case' }),
          jsx('p', {
            className: 'settings-hint',
            children: autoBadgeCase
              ? `Showing every ${regionName} badge you have earned. Click one to pin a custom case.`
              : 'Showing your pinned badges. Reset to follow your current region again.',
          }),
          earnedRegionBadgeIds.length > 0
            ? jsx('div', {
                className: 'trainer-badge-picker',
                children: regionGyms
                  .filter((gym) => earned.has(gym.id))
                  .map((gym) =>
                    jsx(
                      'button',
                      {
                        className: `trainer-badge-pick${shownBadgeIds.includes(gym.id) ? ' active' : ''}`,
                        title: gym.badgeName,
                        style: { backgroundColor: gym.badgeColor },
                        onClick: () => toggleBadge(gym.id),
                      },
                      gym.id
                    )
                  ),
              })
            : jsx('p', {
                className: 'settings-hint',
                children: `No ${regionName} badges yet.`,
              }),
          !autoBadgeCase
            ? jsx('button', {
                className: 'settings-save-btn',
                onClick: () =>
                  dispatch({ type: 'UPDATE_TRAINER_PROFILE', payload: { badgeCase: [] } }),
                children: '↺ Show all earned badges',
              })
            : null,
        ],
      }),
    ],
  })

  return jsxs('div', {
    className: `trainer-card-panel${inline ? ' inline' : ''}`,
    children: [
      jsx('div', {
        className: 'bag-tabs trainer-tab-bar',
        children: TRAINER_TABS.map((tabDef) =>
          jsx(
            'button',
            {
              className: `bag-tab${tab === tabDef.id ? ' active' : ''}`,
              onClick: () => setTab(tabDef.id),
              children: tabDef.label,
            },
            tabDef.id
          )
        ),
      }),
      tab === 'card' && cardContent,
      tab === 'league' &&
        jsx('div', {
          className: 'panel-content',
          children: jsx(GymPanel, { onOpenShop: onOpenShop ?? (() => {}) }),
        }),
      tab === 'records' && jsx(RecordsModal, { inline: true }),
      tab === 'summary' && jsx(RunSummaryModal, { inline: true }),
    ],
  })
}
