// The Switch battle style: after a party Pokemon faints the idle loop pauses in
// the `chooseSwitch` phase and this overlay asks which Pokemon goes out next.
// With the default Set style the loop sends the next one out automatically and
// this never renders.
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, isBattleReady, pokemonDisplayName } from '../game/pokemon.js'
import { isFemalePokemon } from '../game/breeding.js'
import { HpBar } from './hp-bar.js'

export function SwitchPrompt() {
  const { state, dispatch } = useGame()
  if (state.phase !== 'chooseSwitch') return null
  const activeIndex = state.activePlayerPokemonIndex,
    options = state.party
      .map((member, index) => ({ member, index }))
      .filter(
        ({ member, index }) =>
          index !== activeIndex && isBattleReady(member) && pokemonSpecies[member.speciesKey]
      )
  if (options.length === 0) return null
  return jsx('div', {
    className: 'switch-prompt-overlay',
    children: jsxs('div', {
      className: 'switch-prompt',
      children: [
        jsx('div', {
          className: 'switch-prompt-title',
          children: `${state.playerPokemon ? pokemonDisplayName(state.playerPokemon) : 'Your Pokemon'} fainted!`,
        }),
        jsx('div', {
          className: 'switch-prompt-hint',
          children: 'Choose your next Pokemon.',
        }),
        jsx('div', {
          className: 'switch-prompt-list',
          children: options.map(({ member, index }) => {
            const species = pokemonSpecies[member.speciesKey],
              isFemale = isFemalePokemon(member)
            return jsxs(
              'button',
              {
                type: 'button',
                className: 'switch-prompt-option',
                onClick: () => {
                  dispatch({
                    type: 'SWITCH_PLAYER_POKEMON',
                    payload: { newPokemonIndex: index },
                  })
                  dispatch({ type: 'RELEASE_FAINTED' })
                },
                children: [
                  jsx('img', {
                    className: 'switch-prompt-sprite',
                    src: getPokemonSpriteUrl(species.id, !1, member.isShiny, isFemale),
                    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                      (event.target.src = getPokemonSpriteFallbackUrl(
                        species.id,
                        !1,
                        member.isShiny,
                        isFemale
                      )),
                    alt: member.name,
                  }),
                  jsxs('div', {
                    className: 'switch-prompt-info',
                    children: [
                      jsxs('span', {
                        className: 'switch-prompt-name',
                        children: [pokemonDisplayName(member), ' Lv.', member.level],
                      }),
                      jsx(HpBar, {
                        current: member.currentHp,
                        max: member.maxHp,
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
  })
}
