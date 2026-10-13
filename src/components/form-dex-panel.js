// The Living Dex view: completion progress for every species family, regional
// form set and generation, plus the per-family form/gender targets (see
// `src/data/form-dex.js`).

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { formDexModel, formLabels } from '../data/gameData.js'
import { formDexCompletion, formDexTargetLabel, isFormDexTargetCollected } from '../data/form-dex.js'
import { useGame } from '../game/context.js'

/** @param {{ onSelectSpecies: (speciesKey: string) => void }} props */
export function FormDexPanel({ onSelectSpecies }) {
  const { state } = useGame(),
    caughtSet = new Set(state.pokedexCaught),
    genders = state.formDexGenders ?? {},
    rewardFamilies = new Set(state.rewardedFamilies ?? []),
    rewardSets = new Set(state.rewardedRegionalSets ?? []),
    rewardGenerations = new Set(state.rewardedFormGenerations ?? []),
    [generation, setGeneration] = React.useState(0),
    [showBaseOnly, setShowBaseOnly] = React.useState(!1),
    allTargets = React.useMemo(
      () => formDexModel.families.flatMap((family) => family.targets),
      []
    ),
    overall = formDexCompletion(allTargets, caughtSet, genders),
    visibleFamilies = React.useMemo(
      () =>
        formDexModel.families.filter(
          (family) =>
            (generation === 0 || family.generation === generation - 1) &&
            (showBaseOnly || family.targets.length > 1)
        ),
      [generation, showBaseOnly]
    ),
    percent = overall.total > 0 ? Math.round((overall.collected / overall.total) * 100) : 0

  return jsxs('div', {
    className: 'form-dex',
    children: [
      jsxs('div', {
        className: 'form-dex-summary',
        children: [
          jsxs('div', {
            className: 'form-dex-summary-line',
            children: [
              jsx('span', {
                className: 'form-dex-summary-label',
                children: 'Living Dex',
              }),
              jsxs('span', {
                className: 'form-dex-summary-count',
                children: [overall.collected, ' / ', overall.total, ' entries \u00b7 ', percent, '%'],
              }),
            ],
          }),
          jsx('div', {
            className: 'form-dex-progress',
            children: jsx('div', {
              className: 'form-dex-progress-fill',
              style: { width: `${percent}%` },
            }),
          }),
        ],
      }),
      jsxs('div', {
        className: 'form-dex-section',
        children: [
          jsx('span', { className: 'form-dex-section-title', children: 'Regional sets' }),
          jsx('div', {
            className: 'form-dex-sets',
            children: formDexModel.regionalSets.map((set) => {
              const completion = formDexCompletion(set.targets, caughtSet, genders)
              return jsxs(
                'div',
                {
                  className: `form-dex-set${completion.complete ? ' complete' : ''}`,
                  children: [
                    jsxs('div', {
                      className: 'form-dex-set-head',
                      children: [
                        jsx('span', { className: 'form-dex-set-name', children: set.label }),
                        rewardSets.has(set.id) &&
                          jsx('span', { className: 'form-dex-rewarded', title: 'Reward paid', children: '\u2714' }),
                        jsxs('span', {
                          className: 'form-dex-set-count',
                          children: [completion.collected, '/', completion.total],
                        }),
                      ],
                    }),
                    jsx('div', {
                      className: 'form-dex-progress small',
                      children: jsx('div', {
                        className: 'form-dex-progress-fill',
                        style: {
                          width: `${completion.total > 0 ? Math.round((completion.collected / completion.total) * 100) : 0}%`,
                        },
                      }),
                    }),
                  ],
                },
                set.id
              )
            }),
          }),
        ],
      }),
      jsxs('div', {
        className: 'form-dex-section',
        children: [
          jsx('span', { className: 'form-dex-section-title', children: 'Generations' }),
          jsx('div', {
            className: 'form-dex-generations',
            children: formDexModel.generationTargets.map((targets, index) => {
              const completion = formDexCompletion(targets, caughtSet, genders)
              return jsxs(
                'div',
                {
                  className: `form-dex-generation${completion.complete ? ' complete' : ''}`,
                  children: [
                    jsxs('span', {
                      className: 'form-dex-generation-name',
                      children: ['Gen ', index + 1],
                    }),
                    rewardGenerations.has(index) &&
                      jsx('span', { className: 'form-dex-rewarded', children: '\u2714' }),
                    jsxs('span', {
                      className: 'form-dex-generation-count',
                      children: [completion.collected, '/', completion.total],
                    }),
                  ],
                },
                index
              )
            }),
          }),
        ],
      }),
      jsxs('div', {
        className: 'form-dex-section form-dex-section-grow',
        children: [
          jsx('div', {
            className: 'form-dex-filters',
            children: [
              ...[{ id: 0, label: 'All' }]
                .concat(Array.from({ length: 9 }, (_, index) => ({ id: index + 1, label: String(index + 1) })))
                .map((option) =>
                  jsx(
                    'button',
                    {
                      className: `form-dex-filter-tab${generation === option.id ? ' active' : ''}`,
                      onClick: () => setGeneration(option.id),
                      children: option.label,
                    },
                    option.id
                  )
                ),
              jsx('button', {
                className: `form-dex-filter-tab${showBaseOnly ? ' active' : ''}`,
                onClick: () => setShowBaseOnly(!showBaseOnly),
                title: 'Also list families with no alternate forms',
                children: showBaseOnly ? 'All families' : 'Forms only',
              }, 'form-dex-show-base-only'),
            ],
          }),
          jsx('div', {
            className: 'form-dex-families',
            children: [
              ...visibleFamilies.map((family) => {
                const completion = formDexCompletion(family.targets, caughtSet, genders)
                return jsxs(
                  'div',
                  {
                    className: `form-dex-family${completion.complete ? ' complete' : ''}`,
                    children: [
                      jsxs('div', {
                        className: 'form-dex-family-head',
                        children: [
                          jsx('span', {
                            className: 'form-dex-family-name',
                            children: family.name,
                          }),
                          jsx('span', {
                            className: 'form-dex-family-dex',
                            children: `#${String(family.dexId).padStart(3, '0')}`,
                          }),
                          rewardFamilies.has(family.base) &&
                            jsx('span', { className: 'form-dex-rewarded', children: '\u2714' }),
                          jsxs('span', {
                            className: 'form-dex-family-count',
                            children: [completion.collected, '/', completion.total],
                          }),
                        ],
                      }),
                      jsx('div', {
                        className: 'form-dex-targets',
                        children: family.targets.map((target) => {
                          const collected = isFormDexTargetCollected(target, caughtSet, genders)
                          return jsx(
                            'button',
                            {
                              className: `form-dex-target${collected ? ' collected' : ''}`,
                              onClick: () => onSelectSpecies(target.base ?? family.base),
                              title: `${family.name} \u2014 open its Pok\u00e9dex entry`,
                              children: formDexTargetLabel(target, formLabels),
                            },
                            `${family.base}:${target.speciesKey}:${target.gender ?? 'base'}`
                          )
                        }),
                      }),
                    ],
                  },
                  family.base
                )
              }),
              visibleFamilies.length === 0 &&
                jsx('span', {
                  className: 'form-dex-empty',
                  children: 'No form families in this generation yet.',
                }),
            ],
          }),
        ],
      }),
    ],
  })
}
