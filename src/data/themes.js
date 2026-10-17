// Selectable site themes. The visual tokens themselves live in the
// `:root` / `[data-theme]` blocks at the top of `assets/style.css`; this table
// is the player-facing metadata behind the Settings picker (and the sanitiser
// that keeps a bad stored value from breaking the boot).
//
// All themes are dark: the stylesheet mixes surface colours and text colours
// (light parchment panels sit on dark chrome), so a true light theme would need
// a full inversion pass. `classic` restores the original decompiled brown skin,
// textures included.

/** The theme applied when none is set (the redesigned default). */
export const DEFAULT_THEME = 'poke'

/**
 * @typedef {{ value: string, label: string, hint: string }} ThemeOption
 * @type {ThemeOption[]}
 */
export const THEMES = [
  {
    value: 'poke',
    label: 'Pokédex',
    hint: 'Midnight navy with a Pokéball-red accent (default).',
  },
  {
    value: 'verdant',
    label: 'Verdant',
    hint: 'Deep forest greens with a leaf highlight.',
  },
  {
    value: 'noir',
    label: 'Noir',
    hint: 'OLED black with a cool teal highlight.',
  },
  {
    value: 'classic',
    label: 'Classic',
    hint: 'The original brown-and-gold pixel skin.',
  },
]

/**
 * The label for a stored theme value, falling back to the default theme's
 * label so a control can always render something sensible.
 * @param {string | undefined | null} value
 * @returns {string}
 */
export function themeLabel(value) {
  return (THEMES.find((theme) => theme.value === value) ?? THEMES[0]).label
}

/**
 * Coerce a stored theme value to one the stylesheet actually defines.
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizeTheme(value) {
  return THEMES.some((theme) => theme.value === value)
    ? /** @type {string} */ (value)
    : DEFAULT_THEME
}
