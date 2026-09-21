# TODO

Ideas and follow-ups that aren't implemented yet. Current game version: **0.8.1**
(`src/data/changelog.js`). See `AGENTS.md` for architecture, commands and data
conventions.

The two features below are the only items still open from the original feature
menu; the rest of this file is things raised in passing that were never scoped.

---

## 1. Healing items / Potions (#9)

The bag has **no consumables at all** — the only healing is the full-party heal
animation between battles (`HEAL_PARTY` / `healing-scene.js`). Add potions and
revives as a money sink and a tactical option.

- [ ] Add items to `src/data/items.js` (`activeItems` or a new consumable
      category): Potion / Super Potion / Hyper Potion / Revive, with `buyPrice`.
- [ ] Sell them in marts (`martShopItems` for Kanto, the generated `mart` blocks
      in `map-data`).
- [ ] Add a "Use item" action (reducer) that heals a party member / revives a
      fainted one, plus a bag UI to use it in and out of battle.
- [ ] Decide whether to auto-use at low HP (the game is idle) or require a
      manual/auto threshold setting.

Effort: **small**. No new data files.

## 2. Abilities, natures and held items (#2)

The biggest remaining feature. `pokemon-species.json` has only
`id/name/types/baseStats/baseExpYield/growthRate/catchRate` — no abilities,
natures or held items. Do it in slices:

### 2a. Abilities
- [ ] Fetch per-species abilities from PokéAPI (use `tools/fetch-breeding-data.cjs`
      as the template — same caching pattern, writes a new
      `public/data/ability-data.json`, loaded via `assets/gameDataInjector.js`).
- [ ] Assign each Pokémon an ability (slot 1, or random of its slots) in
      `createPokemon` (`src/game/pokemon.js`).
- [ ] Hook ability effects into battle (`src/game/combat.js`): e.g. Intimidate
      (on switch-in), Levitate (ground immunity), Sturdy (focus sash at full HP),
      weather/type immunities, contact effects, etc. Start with a small set.
- [ ] Show the ability in the stats panel.

### 2b. Natures
- [ ] Fetch/derive natures (fixed 25-name table is fine; no fetch needed) and
      give each Pokémon a nature in `createPokemon`.
- [ ] Apply the ±10% stat modifier in `calculatePokemonStats`.
- [ ] Save/display it; decide how natures are re-rollable (mints?).

### 2c. Held items
- [ ] Add a held-item slot to `Pokemon` (type in `src/types.d.ts`, saved in
      `context.js`).
- [ ] Give wild/trainer/raid Pokémon held items from a pool.
- [ ] Implement a first set of effects (Leftovers, type boosters/plates, Choice
      Band/Specs/Scarf, Focus Sash, berries).
- [ ] UI to give/take items from the bag.

Effort: **large** (mostly 2a/2c). New data file(s) required.

## 3. Daycare inheritance (IVs / egg moves / natures)

Breeding now respects gender + egg groups and shiny odds, but eggs are level-1
with **random IVs**, no inherited moves and no nature.

- [ ] Inherit IVs: pass down a few of the parents' best IVs (real games: 3 of
      6 from the parents, plus a Destiny Knot option).
- [ ] Egg moves: let the parents' family learnset seed the baby's moves.
- [ ] Inherit/hold nature (Everstone-style), especially once #2b lands.
- [ ] `createPokemon` currently rolls random IVs and ignores parents — would
      need an options argument.

Effort: **medium**. Pairs with natures (#2b).

## 4. In-battle Mega evolution

Megas exist only as level-100 **evolutions** (`evolution-data.json`); there's no
mid-battle transformation.

- [ ] Give Mega-capable Pokémon a held Mega Stone (ties into #2c).
- [ ] Add a battle action / auto-trigger that swaps to the Mega form for the
      rest of the battle (stats + typing), then reverts.
- [ ] Decide whether this replaces the current level-100 evolution or sits
      alongside it.

Effort: **medium–large**.

## 5. Daily / periodic events

Raised once, never scoped. Could be a timed bonus (extra shiny odds, a boosted
route, a gift) on a real-time or battle-count cadence.

- [ ] Decide the cadence (real time vs battles) and where it surfaces.
- [ ] Reuse the swarm/daycare tick pattern in `gameReducer`.

Effort: **small–medium**.

## 6. Friendship / happiness

Raised once, never scoped. Could gate friendship evolutions, a small battle
bonus, or flavour.

- [ ] Add a friendship value per Pokémon, raised by levelling / battling.
- [ ] Wire any friendship evolutions still modelled as level evolutions.

Effort: **medium**.

## 7. Offline / idle progress

The game is called *Pokémon Idle* but only advances while the tab is open. This
is arguably the biggest missing idle feature: a returning player gets nothing
for the time away.

- [ ] Decide the model: bank "offline battles" and resolve them on return, or a
      simpler overnight bonus (money / EXP / encounters).
- [ ] Cap it (e.g. 8-24 hours) so it doesn't dwarf active play.
- [ ] Show a "while you were away" summary (battles, catches, shinies, money).
- [ ] Persist the timestamp in the save (`context.js`).

Effort: **medium–large** (a real design decision, but high impact).

## 8. Pokémon management / IV checker

IVs are generated in `createPokemon` but never shown, and the box has no search
or protection against releasing something valuable.

- [ ] IV display / judge (sum IVs stars, like the in-game judge).
- [ ] Nicknames.
- [ ] Favourite / lock a Pokémon so Release and Wonder Trade skip it.
- [ ] Box search + filter (name / type / level / shiny / favourite).
- [ ] "Release all duplicates" bulk tool.

Effort: **medium**.

## 9. Move tutor / TMs

`move-manager-panel.js` already lets a Pokémon (re)learn from its family's
learnset (`getFamilyLearnset`). TMs/tutors would add *cross-family* moves.

- [ ] A TM item list (one per move) bought/found, consumed on use.
- [ ] Compatibility rules (which species can learn which move).
- [ ] UI in the move manager to teach a TM move.

Effort: **medium**. Needs a compatibility data set.

## 10. Weather & terrain

A natural follow-on to status conditions; data-light and adds battle depth.

- [ ] A weather state threaded like the volatile state (rain / sun / sandstorm /
      snow), set by moves and/or per route.
- [ ] Damage modifiers, weather-damage ticks, and interactions with abilities
      (#2a) once those exist.
- [ ] Small battle indicator + log lines.

Effort: **medium**.

## 11. NPC gifts & static encounters

Towns are currently marts + gyms; a few one-off NPCs would add flavour and
content (and give fossils/starters a clean source outside the raid pool).

- [ ] A gift NPC per region (fossil, starter, an item) gated on a flag.
- [ ] Static overworld encounters (a fixed species/level you catch once).
- [ ] Reuse the boss-battle / wild-encounter plumbing.

Effort: **medium**. Needs small new state flags.

## 12. Dex-completion rewards

Completing a generation currently only unlocks that generation's Shiny Charm.

- [ ] Per-generation reward on completion (an item, tokens, a Master Ball, a
      rare encounter unlock).
- [ ] A "Dex rewards" section in the Records panel.

Effort: **small**.

## 13. Auto-travel / idle QoL

When a gate is satisfied the player still has to travel manually.

- [ ] Optionally advance to the next unlocked location automatically once the
      current route's gate is met.
- [ ] Optional auto-heal / auto-switch already partly exists (party switch on
      faint) — expose it as a setting.

Effort: **small**.

## 14. A lightweight test suite

There's no test runner (`AGENTS.md` calls `npm run validate` the closest thing),
so reducer/combat/breeding invariants are only checked by ad-hoc headless
scripts. `node --test` plus the existing `window.gameDataInjector.data` mock
pattern would lock them in.

- [ ] `npm test` running `node --test tools/../tests/*.test.mjs` (or similar).
- [ ] Cover: `computeUnlockedLocations` (prestige re-lock, unlock tokens),
      `resolveBattleTurn` (status/drain/flee), breeding compatibility, the
      reducer's key actions, `checkShinyOdds`.

Effort: **small–medium**, pays off every future change.

## 15. Save management & sharing

A save lives in one versioned `localStorage` key with no user-facing control.

- [ ] Export the save to a JSON file / import one back (reuse the repair path).
- [ ] Multiple save slots (pick a slot at boot).
- [ ] A shareable code (base64 of the save) for trading collections.

Effort: **small–medium**.

## 16. More ideas (unsorted)

Smaller or more speculative, roughly highest-value first:

- [ ] **Achievement rewards** — medals currently grant nothing; give tokens /
      items / a Master Ball per milestone.
- [ ] **Quests / missions** — active objectives with rewards, distinct from
      passive achievements (e.g. "catch 3 Water types at Route 12").
- [ ] **Ball variety** — see #17.
- [ ] **Pokérus** — a very rare virus that boosts EXP (and later EV) gain for a
      while; a nice idle-flavoured surprise.
- [ ] **Map QoL** — mark the active swarm / roamer location and add a searchable
      "jump to location" list.
- [ ] **Notifications** — browser notifications and an "away" alert (pairs
      with offline progress, #7).
- [ ] **Challenge modes** — Nuzlocke, monotype, randomizer, or a level-scaling
      toggle; big replay value from flags on the existing state.
- [ ] **Form-changing items** — Rotom / Deoxys / Shaymin / site-based forms —
      cosmetic but fills in the Pokedex.
- [ ] **Release rewards / item selling** — release a Pokémon for tokens or candy,
      and sell items back, to close the economy loop.
- [ ] **Accessibility** — reduced-motion toggle, colourblind-safe type badges,
      larger text option.
- [ ] **Audio** — region music and catch/level-up SFX (currently silent).
- [ ] **Combat feedback** — floating damage numbers and hit shake for feel.
- [ ] **Performance pass** — the idle loop dispatches a lot per tick; look at
      memoisation / batching if it ever gets heavy.

## 17. Pokéball variants

There are only four balls (`src/data/items.js`) with a flat `ballModifier`, and
`selectAutoCatchBall` just picks the strongest affordable one. In the real games
most balls are *situational*, which is where the fun is.

- [ ] Give `attemptCatch` / `selectBestBall` / `selectAutoCatchBall` the context
      they need: turn number, target level + types, whether it's already
      registered, encounter method (surfing/fishing/cave), weather/time.
- [ ] Add the conditional balls, e.g. Quick (×5 first turn), Timer (scales with
      turns), Repeat (×3.5 if already caught), Net (×3.5 Water/Bug), Dive
      (×3.5 on water), Dusk (×3 in caves / at night), Nest (scales with the
      target's level), Heal (heals on catch), Luxury/Friend/Premier (flavour /
      friendship).
- [ ] Let catch settings pick balls by situation (the auto-catch chooser).
- [ ] Colours/sprites: `pokeballColors` already exists — extend it.

Effort: **medium**.

## 18. Better settings

`settings-modal.js` currently only offers a save reset. A real settings panel:

- [ ] Gameplay: default catch rule, auto-catch / auto-heal / auto-switch /
      auto-proceed toggles, battle speed, "auto-travel to next unlock" (#13).
- [ ] Notifications: browser notifications and which events (shiny, rare, egg
      ready, box full) — pairs with #7 and #16.
- [ ] Display: reduced motion, damage numbers, larger text, colourblind-safe
      type badges, sprite style.
- [ ] Data: export/import the save (#15) and a confirmed reset.
- [ ] Account: sign in / sync controls (#19).
- [ ] Store settings separately from the save (a `localStorage` settings key) so
      they survive a save reset and sync independently.

Effort: **medium** (mostly UI plus a small settings slice).

## 19. Online sync (cloud saves via a database)

This would be the project's **first backend** — the app is deliberately
client-only today with one `localStorage` save. Worth a short design doc first.

- [ ] Pick a backend: a managed BaaS (Supabase / Firebase — auth + Postgres /
      Firestore) vs a small custom API.
- [ ] Auth: an anonymous device id that can later be linked to an account
      (email / OAuth) so a save can follow the player across devices.
- [ ] Sync model: the save is a single JSON blob, so at minimum keep a
      server-side revision + `savedAt` and never blindly overwrite a newer
      remote (last-write-wins is easy to lose a save with).
- [ ] Offline-first: the game must keep working with no network; sync in the
      background and reconcile on reconnect.
- [ ] Conflict handling: pick a winner / offer a choice; keep a small server
      history so a bad sync is recoverable.
- [ ] Privacy & security: ownership rules (RLS), rate limits, and what is
      stored.
- [ ] Migration: reuse `repairSave` on download and bump `SAVE_VERSION` if the
      save shape changes.

Effort: **large** (auth + conflict handling + a new server to run).

## 20. Make Honey/Repel actually enable DexNav shiny hunting

The shiny chain already exists (`state.shinyChain`, up to 4× odds at 120 in a
row) but it **resets whenever a different species appears**, and Honey only
doubles the chained species' weight while Repel only halves one species — so on
any route with a decent number of species the chain breaks before it builds.
Targeted shiny hunting for one Pokémon isn't really viable today.

What we want:

- [ ] Honey should be *much* stronger once a chain is going. E.g. at a 4+ chain,
      a Honey'd species should keep appearing ("shouldn't drop easily") instead
      of just getting a ×2 weight bump.
- [ ] Repel should suppress the *other* species during a chain, not just one, so
      the chain is protected from random breakers.
- [ ] Together, a player should be able to pick a target species on a route and
      chain-hunt it reliably with Honey (boost the target) + Repel (suppress the
      rest).

Implementation notes:

- Relevant code: `resolveActiveModifiers` + `resolvePokemonEncounter` +
      `shinyChainMultiplier` (`src/game/progression.js`), `USE_EFFECT_ITEM` /
      `activeEffects` / `UPDATE_SHINY_CHAIN` (`src/game/reducer.js`), config in
      `src/data/config.js`, R/H badges in `route-encounter-grid.js`.
- Consider scaling Honey's multiplier with the current chain length (or making
      it apply to the *chained* species regardless of which species it was
      applied to), and letting Repel suppress every non-target species.
- A "hunt target" concept (pick a species, Honey boosts it / Repel suppresses
      everything else) would make the intent explicit and could drive the UI.
- Keep it balanced: viable but not trivial — e.g. the guarantee only kicks in
      above a chain threshold, or the boost is capped.

Effort: **medium**, high player value (makes the shiny chain a real system).

## 21. Region Unlock Tokens once every region is unlocked

`getRegionUnlockTokens(state) = championsBeaten − (unlockedRegions − 1)`: each
Champion beat effectively grants one token and a token opens one region. With 9
regions, unlocking them all takes 8 tokens, so after that the mechanic is dead —
a leftover token has nothing to open, yet the Town Map still shows the
token banner / unlock prompt.

- [ ] Stop showing and granting tokens once `unlockedRegions.length ===
      regions.length` (hide the banner and the unlockable tab styling).
- [ ] Give leftover tokens a use: convert them to Victory Tokens (the Reward
      Shop currency), or a one-off bonus (money / a Master Ball / a raid
      re-roll), so beating the last Champions isn't wasted.
- [ ] Decide automatic vs manual conversion (e.g. auto-convert on unlocking the
      last region, or keep them and show a "convert" button).

Relevant code: `getRegionUnlockTokens` (`src/game/progression.js`), the token
banner + `UNLOCK_REGION` (`src/components/town-map.js`, `src/game/reducer.js`),
and `victoryTokens`.

Effort: **small**.

## 22. Multiple box sort modes (incl. level)

`SORT_BOX` has a single fixed order — dex id, then level descending, then shiny
— and the Box header's "Sort" button always applies it. There's no way to sort
by level alone.

- [ ] Add a **level** sort (highest / lowest first) — the most-wanted one.
- [ ] Other modes: dex number, name, level, shiny-first, newest, type, and
      favourite / IV total once #8 (management + IV checker) lands.
- [ ] Ascending / descending toggle.
- [ ] Remember the chosen mode (in the save or settings, #18), and replace the
      single "Sort" button with a mode picker / cycle.

Relevant code: `SORT_BOX` (`src/game/reducer.js`) and the Box header
(`src/components/box-panel.js`).

Effort: **small**.

## 23. Egg-hatch reveal popup (with quick release)

`HATCH_DAYCARE_EGG` currently drops the hatched Pokémon straight into the box
with only a battle-log line ("The Egg hatched into X!"), so a hatch is easy to
miss — especially a shiny.

- [ ] Show a popup on hatch with the result: sprite, name, level, shiny marker,
      gender, and IVs once #8 lands.
- [ ] Give it **Keep** / **Quick release** actions (release without opening the
      box), and optionally "release all non-shiny hatches".
- [ ] Consider an auto-release setting for hatches that don't meet a filter
      (e.g. not shiny), tying into #18 (settings) and #8 (management).
- [ ] Reuse the existing modal pattern (`battle-info-overlay`) or the
      evolution/scene style.

Relevant code: `HATCH_DAYCARE_EGG` (`src/game/reducer.js`),
`src/components/daycare-modal.js` (or a small new modal).

Effort: **small**.

## 24. Move data pass

`possible-moves.json` only carries `name / type / category / power / accuracy /
pp / priority / effect`, and the engine understands just three effect types
(`statChange`, `drain`, `status`). That leaves a lot of dead data and wrong
behaviour.

- [ ] ~290 power-0 moves have **no effect** and do literally nothing (Recover,
      Roost, Rest, Protect, Reflect/Light Screen, Spikes/Stealth Rock, Swords
      Dance, Taunt, …). Add effects for the important ones — healing, screens,
      hazards, protect, setup, etc. Either fetch effect data (PokéAPI /
      Showdown) or map move names to effects.
- [ ] Multi-hit moves (Bullet Seed, Icicle Spear, Rock Blast, Double Kick, …)
      are encoded as a single hit; add a hit-count range.
- [ ] High critical-hit-ratio moves (Slash, Razor Leaf, Night Slash, …) aren't
      flagged; add a crit stage.
- [ ] Audit `priority` — e.g. Water Shuriken is stored as 0 but is +1, and
      other priority moves (Quick Attack, Mach Punch, Extreme Speed) may be
      wrong.
- [ ] Data errors: the 3 G-Max moves (`gMaxDrumSolo`/`gMaxFireball`/
      `gMaxHydrosnipe`) have `category: 'status'` with power 160.
- [ ] PP is stored but unused; decide whether to implement it or drop it.
- [ ] Z-moves / G-Max moves are otherwise dead data — decide keep/drop.

Effort: **medium–large** (the effect set is the bulk of it).

## 25. Battle engine pass

`resolveBattleTurn` (`src/game/combat.js`) is fairly complete for damage +
status + stat changes, but move selection and several mechanics are missing.

- [ ] **AI**: `chooseBestMove` only ever considers damaging moves, so trainers
      never heal, set hazards, or use status/setup moves (and `chooseRandomMove`
      for wilds prefers a damaging move). Add a real chooser: heal when low,
      use useful utility moves, consider type effectiveness, maybe switch.
- [ ] **Healing moves** (Recover / Roost / Rest / Synthesis / …) need a `heal`
      effect and HP restore (see #24).
- [ ] **Multi-hit** execution (roll 2-5 hits) — see #24.
- [ ] **Critical-hit stages** and the high-crit moves / Scope Lens.
- [ ] **Protect / Detect / Substitute** and move blocking.
- [ ] **Entry hazards & screens** (Stealth Rock, Spikes, Reflect, Light Screen,
      Aurora Veil).
- [ ] **Accuracy / evasion stat stages** (currently only accuracy from the move
      itself, no stages).
- [ ] Additional statuses if added to the data — paralysis, confusion, badly
      poisoned (data currently only has poison/burn/freeze/sleep/flinch).
- [ ] Weather / terrain — see #10.
- [ ] Ability / held-item hooks — see #2.
- [ ] A damage / crit-rate **balance pass** (crit is a flat 1/16 today).
- [ ] Battle polish: move animations / damage numbers / hit feedback — see #16.

Effort: **medium–large** (do it in slices; AI + healing + multi-hit first).

## 26. README + GitHub "About"

The repo root has no `README.md` and no `LICENSE`, and the GitHub repo has no
About blurb — the front door is missing. `AGENTS.md` is developer-facing and too
long/technical to double as one.

- [ ] **Header**: the playable link (demo/deploy) up top, short **badges**
      (CI/build, license, current game version) and a one-line pitch.
- [ ] **What it is**: a client-only browser incremental Pokémon game (React 19 +
      Vite, no backend, no account); progress saves to `localStorage`.
- [ ] **Screenshots / GIF** of the battle scene, town map and Pokédex.
- [ ] **Features**: a highlight list linking the full player guide
      (`public/guide.html`) — 9 regions, gyms/Elite Four/Champion, raids,
      evolution items, breeding, Wonder Trade, shiny hunting, Battle Tower,
      prestige, region unlock tokens.
- [ ] **Current version** (`GAME_VERSION` in `src/data/changelog.js`) and a link
      to the changelog / patch notes.
- [ ] **Run locally**: `npm install`; `npm run dev` → http://localhost:5173;
      `npm run build` (static `dist/`); `npm run preview`; dev checks
      `npm run typecheck` and `npm run validate`.
- [ ] **Deploy**: it's a static bundle, so GitHub Pages / Netlify / any static
      host works (point them at `dist/`).
- [ ] **Project layout**: the short table, plus "read `AGENTS.md` before
      contributing" (the `src/` tree was decompiled/de-minified and follows
      specific conventions, e.g. no semicolons, `jsx()` runtime calls).
- [ ] **Data & credits**: content is scraped/derived from **PokéAPI** (species,
      encounters, learnsets, breeding data), **Bulbapedia** (region maps,
      Paldea areas) and **Pokémon Showdown / PokéAPI sprites** — thank them and
      state the unofficial, non-commercial fan-project status (Pokémon ©
      Nintendo / Creatures / GAME FREAK).
- [ ] **FAQ / troubleshooting**: "is this official?" (no), "where is my save?"
      (`localStorage`; reset it from Settings), "why did encounter data change?"
      (data is regenerated from real games), stale-dev-server note on Windows.
- [ ] **Community**: link the subreddit the patch notes already point to
      (`r/PkmnIdle`).
- [ ] **Roadmap**: link `TODO.md` and/or the changelog.
- [ ] Decide a license (currently none) and add a `LICENSE` file.
- [ ] **CI** (optional): a GitHub Action running `typecheck` + `validate` on
      PRs — doubles as the build badge.
- [ ] GitHub **About**: a short description, the playable URL, topics/tags
      (`pokemon`, `idle-game`, `incremental`, `react`, `vite`) and a
      social-preview image.
- [ ] Optional: `CONTRIBUTING.md`, issue/PR templates and a
      `CODE_OF_CONDUCT.md`.

Effort: **small**.

## 27. Wiping out of a raid should eject you from the raid zone

`COMPLETE_HEALING` only sends the player back to `preRaidLocation` when
`currentLocation === 'raidIsland'` — Kanto's hand-curated raid. Every other
region's raid is a separate location (`johto-raid`, `hoenn-raid`, `sinnoh-raid`,
…), so a full party wipe there heals the party but leaves the player standing on
the raid island: the raid keeps going and the legendary can be re-fought
immediately.

- [ ] Treat any `type: 'raid'` location (or `state.inRaid`) as "in a raid" in
      `COMPLETE_HEALING`, returning to `preRaidLocation` and clearing the raid
      state (`inRaid` / `raidLegendary` / `raidLevel`) for every region, not
      just Kanto.
- [ ] Confirm the raid cooldown / `raidCooldownEnd` still prevents an instant
      re-entry after the loss (see `RAID_COOLDOWN_MS` in
      `src/data/config.js`).
- [ ] Make sure the last-party-member faint goes through the same path
      (`START_HEALING` from the game loop), so a wipe — not just a single faint
      — is what triggers the ejection.

Relevant code: `COMPLETE_HEALING` / `START_RAID` / `END_RAID`
(`src/game/reducer.js`), the `START_HEALING` trigger in `src/hooks.js`, and the
`type: 'raid'` locations in `public/data/map-data/*.json`.

Effort: **small**.

## 28. Raid encounters should only offer fully evolved Pokemon

A region's `raidPool` is built from "species that turn up on no wild route and
can't be reached by evolving something that does"
(`tools/generate-regions.cjs`), but that can include a base or middle stage
(e.g. a starter line whose only route appearance is its final form). Now that
breeding exists a player can catch the final form and breed down for the
"smaller" stages, so a raid handing out the unevolved form is a worse reward —
and can leave the player with the baby before they have the parent.

- [ ] Filter each region's `raidPool` through the existing `isFinalEvolution`
      helper (already used by team generation in `generate-regions.cjs`) so
      raids only list final stages.
- [ ] Keep raid-only alternate forms and legendaries regardless (they have no
      evolution line), and be careful with species that **can't breed**
      (genderless / legendary) — don't drop their base form if that would
      orphan the dex entry.
- [ ] Re-run `tools/generate-regions.cjs` and `npm run validate`, then refresh
      `public/encounter-index.html` (`tools/generate-encounter-index.cjs`), so
      `regions.json`, the map/encounter data and the index all agree.
- [ ] Confirm consumers still get a non-empty pool: `raidPoolFor`
      (`src/components/town-map.js`), the roaming-legendary roll
      (`src/game/progression.js`) and the Raid Island panel
      (`src/components/location-panel.js`).

Relevant code: the raid-pool block in `tools/generate-regions.cjs`
(`routable` / `routableExpanded` / `isFinalEvolution`), `regions.json`
`raidPool`, and `src/game/reducer.js` (`START_RAID`).

Effort: **small** (data regeneration; no engine change).

## 29. Gender-specific sprites

Gender now exists (`genderForPokemon` in `src/game/breeding.js`, shown in the
stats panel) but sprites still ignore it: `getPokemonSpriteUrl(spriteId, isBack,
isShiny)` (`src/game/pokemon.js`) keys only by numeric id, so a female Pokemon
always renders the male artwork. Several species are visually different by
gender (Pikachu line, Hippopotas/Hippowdon, Unfezant, Frillish/Jellicent,
Meowstic, Pyroar, Indeedee, …), which is exactly the set the sprite tree already
carries `female/` folders for.

What already exists:

- Animated: `.../animated/female/`, `.../animated/shiny/female/`,
  `.../animated/back/female/`, `.../animated/back/shiny/female/` are committed
  for the ~96 ids that have a difference.
- Static: `public/sprites/pokemon/back/female/` and `back/shiny/female/` are
  committed (93/94 files), but the **front** and **front-shiny** female
  folders are missing, and `tools/download_pokemon_sprites.cjs` never fetches
  any female variant (see `STATIC_VARIANTS` / `ANIMATED_VARIANTS`).

- [ ] Thread gender into `getPokemonSpriteUrl` (a `gender`/`isFemale` argument,
      or look it up from the Pokemon) and build the `female/` path for each of
      the four variants; update `getPokemonSpriteFallbackUrl` too.
- [ ] Update the call sites that render a specific Pokemon (battle scene, box,
      party, daycare, dex?, bag) to pass the gender — a Pokemon's gender is
      derived from its id, so it must come from the object, not the species.
- [ ] Extend `tools/download_pokemon_sprites.cjs` with the four female
      variants (PokeAPI `female/{id}.png`, `back/female/...`,
      `shiny/female/...`, `back/shiny/...`) and download the missing front
      static files.
- [ ] Only use the female sprite for species that actually have one; fall back
      to the base sprite otherwise. Extend `animated-sprites.json` (or add a
      `gendered-sprites.json` list) so the fallback is a manifest lookup, not a
      404.
- [ ] Check genderless/undiscovered Pokemon (gender `genderless`) never request
      a female path.

Relevant code: `getPokemonSpriteUrl` / `getPokemonSpriteFallbackUrl`
(`src/game/pokemon.js`), `genderForPokemon` (`src/game/breeding.js`), the sprite
manifest loader (`src/data/gameData.js`), and
`tools/download_pokemon_sprites.cjs`.

Effort: **medium** (mostly asset plumbing; assets are partly there already).

## 30. More region areas (DLC, caves, POIs)

The maps are built from PokéAPI/Bulbapedia **towns + numbered routes** only
(`tools/scrape-region-maps.cjs`), then `tools/generate-regions.cjs` turns them
into 21-52 locations per region (Kanto 49, Hoenn 52, Unova 45, …). That leaves
three gaps:

### 30a. DLC / expansion areas

Later generations' DLC regions are simply missing, so those Pokemon have no
native route and fall into a Raid Island pool instead:

- Galar — **Isle of Armor** and **Crown Tundra** (Sword/Shield Expansion Pass).
- Paldea — **Kitakami** (Teal Mask) and **Blueberry Academy / Terarium**
  (Indigo Disk). `paldea-mossui-town` is already scraped into `paldea.json` but
  as a bare town with **no encounter bucket**, so it's a dead end.
- (Optionally earlier post-game islands: Kanto's Sevii Islands, Unova's
  Black/White 2 areas.)

- [ ] Add the DLC areas to `tools/region-maps.json` (scraper or a committed
      override) and give them encounter tables, or inject them with the
      existing `EXTRA_MAP_AREAS` mechanism, which already supports an explicit
      `node` / `species` / `connect` / `rank`.
- [ ] Slot them into the level curve and unlock order so they read as post-game
      (`levelRoutes()` ranks by route number / BFS depth today — DLC areas need
      a forced `rank` or `unlockOrder`).
- [ ] Re-check each region's `raidPool` after adding them — species that now
      have a native route must drop out of the raid pool.

### 30b. More ordinary areas

The scraper only keeps towns and routes, so caves, forests, tunnels, ruins,
towers, lakes/seas and safari zones are absent unless hand-added. `EXTRA_MAP_AREAS`
currently carries only Johto's Bell Tower / Whirl Islands / Mt. Silver.

- [ ] Grow `EXTRA_MAP_AREAS` (or scrape the remaining landmark locations) with
      their own species lists so they don't drag a whole generation slice in.
- [ ] Consider a real `type` / `areaType` field (cave, forest, sea, ruins, …)
      instead of the current binary town-vs-route; `location-panel.js` labels
      everything non-town as "Route 🌿", and the battle background comes from
      the `ROUTE_BACKGROUND_RULES` / dominant-type heuristic.

### 30c. Points of interest (POIs)

Non-route nodes that offer a service or flavour: a Daycare stop, a Move
Tutor / TM vendor, a fishing spot, a berry patch, a raid den, a static
encounter, a legendary shrine, a mart/café — whichever fits. Today services are
mostly global (Daycare) or attached to towns, so there's no map-level way to
surface them.

- [ ] Decide the model: a new `type: 'poi'` location that is selectable but
      doesn't spawn wild battles, vs. lightweight markers overlaid on existing
      locations.
- [ ] Handle rendering/copy in `map-node.js`, `town-map.js` and
      `location-panel.js` (icon, label, no battle loop), reusing the existing
      travel/unlock plumbing.
- [ ] Choose a first POI that reuses existing systems (an on-map Daycare or
      Move Tutor is the smallest win) so it isn't just decoration.

Relevant code: `tools/scrape-region-maps.cjs` (`MANUAL_BRIDGES`),
`tools/generate-regions.cjs` (`EXTRA_MAP_AREAS`, `levelRoutes`,
`ROUTE_BACKGROUND_RULES`, raid pools), `public/data/map-data/*.json`, and the map
UI (`src/components/map-node.js`, `town-map.js`, `location-panel.js`).

Effort: **large** (data-heavy; 30a/30b mostly data, 30c a small feature).

---

## Useful references when picking these up

- **Data-pipeline template:** `tools/fetch-breeding-data.cjs` — cached PokéAPI
  fetch, form ids resolved to base species, writes a `public/data/*.json`, then
  add the key to `assets/gameDataInjector.js` and re-export in
  `src/data/gameData.js`.
- **Battle hooks:** status conditions / drain live in `src/game/combat.js`
  (`resolveBattleTurn`); volatile state is threaded through `src/hooks.js` and
  the reducer's `UPDATE_VOLATILE`.
- **Save shape:** new state fields go in `initialGameState`, `context.js`
  (save + sanitising restore) and `src/types.d.ts`. Bump `SAVE_VERSION`
  (`src/data/config.js`) only for incompatible shape changes (add `LEGACY_SAVE_KEYS`).
- **Config constants** live in `src/data/config.js`.
- **Verifying:** `npm run typecheck`, `npm run build`, `npm run validate`, and a
  headless test (mock `window.gameDataInjector.data` with the JSON files and
  `import()` the module) works well for reducer/combat logic.
- **Versioning:** add a `GAME_VERSION` bump + `CHANGELOG` entry when a batch of
  work lands (secrets stay out of the changelog by convention).
- **Commit** each logical change; never `git push`.

## Recently done (context)

Status conditions + drain moves; Battle Tower + endless scaling; roaming
legendaries; route swarms; Wonder Trade (with the hidden shiny-for-shiny perk);
Records panel; Daycare (gender/egg groups/shiny odds); Achievements; DexNav
shiny chain; region Unlock Tokens; region Prestige; working evolution items +
Link Cable; Mew / MissingNo / Master Ball secrets; and the bulk of the earlier
data/audit fixes (encounters, forms, learnsets, trainers, marts, maps, sprites).
