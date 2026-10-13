// The Trainer Card: a compact identity card showing the player's name, chosen
// title, outfit, favourite Pokemon and badge case. Presentational only — the
// caller passes a `TrainerCardData` view model (see game/trainer-profile.js),
// so the same component renders the live card and a save slot's mini card.

import { jsx, jsxs } from 'react/jsx-runtime'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/** @param {{ card: TrainerCardData | null, compact?: boolean }} props */
export function TrainerCard({ card, compact = false }) {
  if (!card) return null
  const favorite = card.favourite
  return jsxs('div', {
    className: `trainer-card${compact ? ' compact' : ''}`,
    style: {
      background: `linear-gradient(135deg, ${card.outfit.bg[0]}, ${card.outfit.bg[1]})`,
      '--trainer-shirt': card.outfit.shirt,
      '--trainer-skin': card.outfit.skin,
    },
    children: [
      jsxs('div', {
        className: 'trainer-card-head',
        children: [
          jsxs('div', {
            className: 'trainer-card-avatar',
            style: { backgroundColor: card.outfit.shirt },
            children: [
              jsx('span', {
                className: 'trainer-card-avatar-head',
                style: { backgroundColor: card.outfit.skin },
              }),
              jsx('span', {
                className: 'trainer-card-avatar-emblem',
                children: card.outfit.emblem,
              }),
            ],
          }),
          jsxs('div', {
            className: 'trainer-card-identity',
            children: [
              jsx('div', { className: 'trainer-card-name', children: card.name }),
              card.title
                ? jsx('div', { className: 'trainer-card-title', children: card.title })
                : jsx('div', {
                    className: 'trainer-card-title empty',
                    children: 'No title',
                  }),
              jsxs('div', {
                className: 'trainer-card-region',
                children: [card.regionName, ' \u00b7 Lv.', card.level],
              }),
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'trainer-card-body',
        children: [
          jsxs('div', {
            className: 'trainer-card-favourite',
            children: favorite
              ? [
                  jsx('img', {
                    className: 'trainer-card-favourite-sprite',
                    src: getPokemonSpriteUrl(favorite.spriteId ?? 0, false, favorite.isShiny),
                    alt: favorite.name,
                    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                      (event.target.src = getPokemonSpriteFallbackUrl(
                        favorite.spriteId ?? 0,
                        false,
                        favorite.isShiny
                      )),
                  }),
                  jsxs('div', {
                    className: 'trainer-card-favourite-meta',
                    children: [
                      jsx('span', {
                        className: 'trainer-card-favourite-name',
                        children: favorite.name,
                      }),
                      jsx('span', {
                        className: 'trainer-card-favourite-level',
                        children: `Lv.${favorite.level}`,
                      }),
                    ],
                  }),
                ]
              : jsx('span', {
                  className: 'trainer-card-favourite-empty',
                  children: 'No favourite yet',
                }),
          }),
          jsxs('div', {
            className: 'trainer-card-stats',
            children: [
              jsxs('span', { children: ['Dex ', card.dex] }),
              jsxs('span', { children: ['Badges ', card.totalBadges] }),
            ],
          }),
        ],
      }),
      card.badges.length > 0
        ? jsx('div', {
            className: 'trainer-card-badges',
            children: card.badges.map((badge) =>
              jsx(
                'span',
                {
                  className: 'trainer-card-badge',
                  title: badge.name,
                  style: { backgroundColor: badge.color },
                },
                badge.id
              )
            ),
          })
        : null,
    ],
  })
}
