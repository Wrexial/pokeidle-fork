# TODO

Ideas and follow-ups that aren't implemented yet. Current game version: **0.9.3**
(`src/data/changelog.js`). See `AGENTS.md` for architecture, commands and data
conventions.

The two features below are the only items still open from the original feature
menu; the rest of this file is things raised in passing that were never scoped.

---

## Priority order (effort vs. gain)

A ranked work order, best return first. **Effort**: S (small) < S–M < M < M–L
< L. **Gain** is the player-facing value of shipping it (★ = nice to have,
★★★★★ = core missing feature). The numbered sections below are **unchanged**
so cross-references (`#2c`, `#24`, …) keep working — treat this list as the
working order, and the numbered sections as the details.

### Tier 1 — Quick wins (small effort, high gain)

**Shipped** in 0.9.x: #13 auto-travel, #26 README/licence, #30 caught badge +
toast queue, #1 healing items, #12 dex rewards, #21 unlock tokens, #33
Rare/Exp. Candies, #34 sellable valuables, #15 save export/import (slots and
share codes still open), #41 box "New" sort prepend, #37 the Master Ball
button, and #2b natures. The remaining items, best return first:

1. **#14 Lightweight test suite** — S–M · ★★★½ (dev value) — pays off every
   future change.
2. **#5 Daily / periodic events** — S–M · ★★★ — cheap engagement loop.
3. **#16 More ideas (grab bag)** — mostly S · ★★★ — mine the quick ones
   (achievement rewards, release/selling, map QoL, notifications).

### Tier 2 — High impact, worth the effort (medium–large)

16. **#7 Offline / idle progress** — M–L · ★★★★★ — the biggest missing *idle*
    feature; a returning player currently gets nothing.
17. **#8 Pokémon management / IV checker** — M · ★★★★½ — IVs are generated
    but invisible; box search, nicknames and lock are all high-use.
18. **#20 Honey/Repel DexNav hunting** — M · ★★★★½ — turns the existing
    shiny chain into a usable system.
19. **#24 Move data pass** — M–L · ★★★★½ — ~290 moves currently do nothing;
    do it in slices (healing/screens/setup first).
20. **#25 Battle engine pass** — M–L · ★★★★½ — pairs with #24; AI + healing +
    multi-hit first.
21. **#2a Abilities** (with **#2c Held items**) — L · ★★★★★ / ★★★★ — the
    biggest remaining battle-depth feature; natures (#2b) are already in
    Tier 1.
22. **#36 Zones (route chunks)** — M–L · ★★★★ — lets Alola/Galar/Paldea map
    as chunks of areas instead of a single-route-wide graph.
23. **#35 More Galar areas** — M · ★★★½ — Galar is the thinnest region map;
    add Wild Area sub-areas and DLC land, mostly data.
24. **#28 More region areas (DLC, caves, POIs)** — L · ★★★★½ — real content
    (Crown Tundra, Kitakami, landmark caves); data-heavy. Pairs with #35/#36.
25. **#38 Clean up the Raid Islands** — M · ★★★½ — later generations leave
    50–60 species on one raid pool, turning raids into a shapeless grab bag.
26. **#39 DLC regions from later games** — M–L · ★★★★ — promote Isle of
    Armor, Crown Tundra, Kitakami and the Terarium to first-class regions.
27. **#40 Alola / Galar / Paldea league structures** — M · ★★★½ — trials, the
    Champion Cup and any-order gyms don't fit the 8-gyms + E4 model.
28. **#18 Better settings** — M · ★★★★ — centralises QOL toggles and the
    export/import from #15.

### Tier 3 — Medium effort, medium gain

29. **#3 Daycare inheritance** — M · ★★★
30. **#6 Friendship / happiness** — M · ★★★
31. **#9 Move tutor / TMs** — M · ★★★
32. **#11 NPC gifts & static encounters** — M · ★★★
33. **#17 Pokéball variants** — M · ★★★
34. **#27 Gender-specific sprites** — M · ★★★ (assets are half-there)
35. **#29 Minigames** — M–L · ★★★ (small per minigame once one exists)
36. **#4 In-battle Mega evolution** — M–L · ★★★
37. **#32 Battle Tower tuning** — M · ★★★½ — auto-climb, sane Victory Token
    payout, and harder/faster teams (6 fully evolved, late legendaries).

### Tier 4 — Big and low-return, defer

38. **#10 Weather & terrain** — M · ★★½ (nice depth, no urgency)
39. **#19 Online sync** — L · ★★★ — the project's first backend; needs a
    design doc and real ops for modest player value today.

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

### 2b. ✅ Natures — shipped in 0.9.3

Done. `src/data/natures.js` holds the 25 natures; `createPokemon` rolls one,
`calculatePokemonStats` applies the ±10% modifier (`getLevelUpResults` callers
pass the Pokemon's nature so level-ups/evolutions stay consistent), and the
stats panel shows it. Existing saves are migrated in `repairSave` (a nature is
rolled and stats recomputed for Pokemon that lack one). Re-rolls use a
**Nature Mint** (2 Victory Tokens in the Reward Shop) consumed from the Bag on a
party Pokemon via `USE_ITEM_ON_POKEMON`. Daycare inheritance (#3) can now
inherit the parents' natures.

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

## 27. Gender-specific sprites

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

## 28. More region areas (DLC, caves, POIs)

The maps are built from PokéAPI/Bulbapedia **towns + numbered routes** only
(`tools/scrape-region-maps.cjs`), then `tools/generate-regions.cjs` turns them
into 21-52 locations per region (Kanto 49, Hoenn 52, Unova 45, …). That leaves
three gaps:

### 28a. DLC / expansion areas

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

### 28b. More ordinary areas

The scraper only keeps towns and routes, so caves, forests, tunnels, ruins,
towers, lakes/seas and safari zones are absent unless hand-added. `EXTRA_MAP_AREAS`
currently carries only Johto's Bell Tower / Whirl Islands / Mt. Silver.

- [ ] Grow `EXTRA_MAP_AREAS` (or scrape the remaining landmark locations) with
      their own species lists so they don't drag a whole generation slice in.
- [ ] Consider a real `type` / `areaType` field (cave, forest, sea, ruins, …)
      instead of the current binary town-vs-route; `location-panel.js` labels
      everything non-town as "Route 🌿", and the battle background comes from
      the `ROUTE_BACKGROUND_RULES` / dominant-type heuristic.

### 28c. Points of interest (POIs)

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

Effort: **large** (data-heavy; 28a/28b mostly data, 28c a small feature).

## 29. Minigames (fishing, companion care, and more)

Every activity is currently automatic: battles resolve on a timer, catches roll
from `autoCatch`/catch rules, breeding and swarms advance on battle counts. A
few optional minigames would give the player something hands-on without
disturbing the idle loop. They'd all sit alongside it — the player opts in, and
the idle game keeps running if they don't.

### 29a. Fishing minigame

Encounter data already keeps water/fishing methods in the scrape but the game
discards the method, so "fishing" is only flavour. Build a real one on water
routes:

- [ ] Rod tiers (Old / Good / Super) as items, each unlocking deeper water —
      then let the player cast from a water route for that route's water
      species only.
- [ ] A short timing minigame (a moving bar / reel-in window, Pokémon-style)
      where a good result improves the catch chance or the level/shiny odds,
      and a perfect one guarantees the encounter.
- [ ] Tie the result into the battle/catch flow (start a normal encounter on
      success) rather than a separate reward table, so it stays consistent.
- [ ] Persist water-only encounter pools (or re-derive them from the scraper
      `method`) so casting targets the right species.

### 29b. Companion / tamagotchi care

The Daycare is already a passive version of this (two parents → egg). A
hands-on companion that you feed/play with/rest would be the active counterpart
and would give the friendship idea (#6) a purpose:

- [ ] Pick (or pin) one party Pokémon as the companion; add `care` state
      (hunger / happiness / energy) that decays on a real-time timer or battle
      count.
- [ ] Feed / play / rest actions with small cooldowns, costing money or berries;
      raising friendship and a temporary bonus (EXP, catch rate, shiny odds).
- [ ] Visual feedback — an animated buddy panel / petting scene using the
      existing sprite helpers.
- [ ] Decide whether care is purely a bonus or feeds evolution/breeding (it
      pairs with friendship evolutions, #6).
- [ ] Keep it optional and non-punishing (the game is idle) — neglect should
      pause bonuses, not damage the Pokémon.

### 29c. More minigame ideas (pick from these)

Minigames can share one modal + reducer pattern (`type: 'minigame'` phase or a
small self-contained state slice), so adding a second is much cheaper than the
first:

- [ ] **Casino / slots / Voltorb Flip** — a money sink with tokens or items as
      prizes (ties into the Reward Shop economy).
- [ ] **Bug Catching Contest / Safari Zone** — timed, bait/ball limited, judged
      on the catch (Johto's National Park, Kanto's Safari Zone).
- [ ] **Berry growing + blending** — plant/pick berries on a timer, blend into
      Poffins/items (ties into care and held items, #2c).
- [ ] **Sinnoh Underground / mining** — tap-to-dig for fossils, stones and
      evolution items (a clean source for the item evolutions).
- [ ] **Battle Tower already exists** — extend it with its own rewards rather
      than a new mode.

Relevant code: the real-time loop and battle-count ticks (`src/hooks.js`
`useGameLoop`, `tickBattleCounters` in `src/game/progression.js`), the reducer's
`daycare` / `activeEffects` slices (`src/game/reducer.js`), the Daycare UI
(`src/components/daycare-modal.js`) and Battle Tower as a side-activity
precedent. New state goes in `initialGameState`, `context.js` and
`src/types.d.ts`.

Effort: **small per minigame, medium–large as a feature** (each is a
self-contained modal + state slice; fishing and care are the two biggest).

## 30. Caught / event QOL indicators

The save already tracks `pokedexSeen`, `pokedexCaught` and `shinyCaught`, and
the Pokédex + `route-encounter-grid` mark what you own — but the live battle
screen doesn't, and the only transient on-screen message is the hard-coded
`LevelUpNotification` (`levelUpNotification` + `CLEAR_LEVEL_UP`). Everything
else scrolls past in the battle log. Two small QOL wins, plus a reusable hook
for custom events.

### 30a. "Already caught" indicator

- [ ] Add a caught indicator to the enemy's name row in `enemy-info-box.js`
      when `pokedexCaught.includes(pokemon.speciesKey)`, so you can tell at a
      glance whether the wild Pokemon is new. **Use a Pokéball sprite** (reuse
      `PokeballIcon` / `pokeballColors` in `src/data/ui.js`), not a text ✓ —
      the ball reads instantly as "already in the ball".
- [ ] Mirror it on the encounter list / Pokedex tile (already shows caught) and
      distinguish *seen* vs *caught* vs *shiny caught* (`shinyCaught`), e.g. a
      plain ball vs a shiny-tinted ball.
- [ ] Maybe flag the battle sprite too (a small marker), and keep it off for
      trainer teams / raids where the species isn't the reward.

### 30b. Event toasts ("You found X!", "You caught Y!")

Generalise `LevelUpNotification` into a small notification queue so events can
surface without staring at the log:

- [ ] State `notifications: []` (`{ id, message, tone, icon?, speciesKey?,
      createdAt }`) with `PUSH_NOTIFICATION` / `DISMISS_NOTIFICATION`, rendered
      by a `<NotificationStack>` (auto-dismiss + queue cap + dedupe/cooldown so
      it never spams).
- [ ] Fire on meaningful events: first-time seen ("You found a wild X!"),
      first-time caught ("X was registered in the Pokédex!"), a duplicate
      catch, shiny found/caught, egg hatch, evolution, level-up
      (existing), badge / league win, region or route unlock, achievement, rare
      item, raid start. New-catch detection is just
      `!state.pokedexCaught.includes(speciesKey)` at the dispatch site in
      `src/hooks.js`.
- [ ] Keep the message at the dispatch site or centralise a `notify(...)`
      helper (`src/game/progression.js` / a small util) so the tone and copy
      stay consistent.
- [ ] **Custom events**: because `PUSH_NOTIFICATION` is generic, data-driven
      events (patch-note promos, anniversaries, seasonal/holiday bonuses, secret
      codes, the Konami cheat) can push their own toast without new state —
      optionally behind a tiny event registry mapping an event id → message /
      icon / duration.

Relevant code: `level-up-notification.js` and the `levelUpNotification` /
`CLEAR_LEVEL_UP` case (`src/game/reducer.js`), `enemy-info-box.js`,
`route-encounter-grid.js`, and the `MARK_SEEN` / `MARK_CAUGHT` flow
(`src/hooks.js`). Render the stack from `game-layout.js` so it works on every
screen.

Effort: **small–medium**.

## 32. Battle Tower should auto-climb, pay less, and hit harder

`buildTowerTeam(floor)` (`src/game/progression.js`) starts at
`TOWER_BASE_LEVEL` 50 + 2 per floor, grows from 2 to 6 Pokemon, and only starts
raising a `statMultiplier` at floor 25; its pool is every non-legendary, non-form
species. Each floor is a separate `START_TOWER` + `START_HEALING` triggered by
the Gym panel's Continue button (`src/components/gym-panel.js`), and a win bumps
`towerFloor` but returns to idle — so it never auto-climbs. The payout is
`Math.max(1, Math.floor(floor / 5))` Victory Tokens per floor, which is far too
generous.

- [ ] **Auto-climb**: on a tower win, immediately build + start the next floor
      (heal, `START_TOWER`, new team) instead of returning to the Continue
      button, so a run keeps going until you lose.
- [ ] **Payout**: 1 Victory Token per 10 floors (`Math.floor(floor / 10)`, no
      per-floor minimum) instead of `floor / 5`.
- [ ] **Difficulty**: start higher and scale faster — raise `TOWER_BASE_LEVEL`,
      steepen the per-floor level gain, and bring the stat multiplier in
      earlier so it feels like a climb rather than a walk.
- [ ] **Teams**: always 6 Pokemon, all fully evolved (`isFinalEvolution`), with
      at least one genuinely strong member (high `totalBaseStats`).
- [ ] **Late floors**: allow legendaries into the pool and cap every tower
      Pokemon at Lv.100 (the cap already exists; keep it).

Relevant code: `buildTowerTeam` (`src/game/progression.js`), `BOSS_BATTLE_END`
/ `START_TOWER` (`src/game/reducer.js`), `startTowerFloor`
(`src/components/gym-panel.js`), `TOWER_BASE_LEVEL`.

Effort: **medium**.

## 33. Rare Candy and EXP Candy as rare drops

Levelling only comes from battle EXP (`awardExperience`), and the only item
drops are balls plus the very rare wild **Master Ball**
(`wildMasterBallChance` in `src/data/config.js`, granted in the wild win path of
`src/game/reducer.js`). Add the Gen 6+ candies as rare finds so a lucky drop can
push a Pokemon forward:

- **Rare Candy** — +1 level instantly, capped at Lv.100.
- **EXP Candy S / M / L / XL** — a flat chunk of EXP (Sword/Shield style),
  tiered so bigger candies are rarer.

- [ ] Add the candies to `src/data/items.js` with a description and
      `buyPrice: null` (drops only, or a token-shop entry later).
- [ ] Add a `USE_CANDY` action that applies the level/EXP to a chosen party
      Pokemon, using `calculateRequiredExperience` and respecting the Lv.100
      cap and growth rate; needs a target picker (bag or stats panel).
- [ ] Hook a rare roll into the wild win path next to the Master Ball find
      (and optionally raids / the Tower as guaranteed or higher-tier drops):
      EXP Candy reasonably rare, Rare Candy much rarer.
- [ ] Decide tiers/amounts and whether any candy is region- or
      generation-gated.
- [ ] Add a **Candies** (or Consumables) category to `bagCategories` so they
      don't mix with balls/Key items.

Relevant code: `src/data/items.js`, the wild win path / inventory
(`src/game/reducer.js`), `awardExperience` (`src/game/progression.js`),
`calculateRequiredExperience` (`src/game/pokemon.js`), `wildMasterBallChance`
(`src/data/config.js`).

Effort: **small–medium**.

## 34. Valuable items you can sell (extend the shops)

Money only comes from winning battles and nothing can be sold: `BUY_ITEM`
(`src/game/reducer.js`) only handles `pokeBalls` and `activeItems`, no item has a
`sellPrice`, and the Bag has just `pokeballs` + `items` categories
(`bagCategories`). Add the classic treasures — Nugget, Big Nugget, Stardust,
Star Piece, Pearl, Big Pearl, Comet Shard, … — as rare drops that sell at marts.

- [ ] Add the valuables to `src/data/items.js` with a `sellPrice` (and
      `buyPrice: null`); they are found items, not stock.
- [ ] Add a `SELL_ITEM` action that removes from `inventory` and credits
      `sellPrice * quantity`, guarded by ownership.
- [ ] Extend the shops: a **Sell** tab/section in `ShopPanel`, or a sell action
      from the Bag. `ShopPanel` currently renders `shopDef.items` as buy rows
      and assumes every entry is a ball or active item.
- [ ] Add a **Valuables** bag category so treasures are listed separately.
- [ ] Roll the drops on the wild/trainer/raid win paths (like the Master Ball
      find), scaling the tier with the battle so late-game battles pay better.
- [ ] Balance selling against battle payouts (a bonus money source, not the
      dominant one), and decide whether the Reward Shop also takes treasures.
- [ ] Consider one item registry (`{ category, buyPrice, sellPrice, effect }`)
      instead of the separate `pokeBalls` / `activeItems` / `evolutionItems`
      shapes, since `BUY_ITEM` hardcodes the first two.

Relevant code: `src/data/items.js` (`bagCategories`, `martShopItems`,
`tokenShopItems`), `BUY_ITEM` / inventory (`src/game/reducer.js`), `ShopPanel`
(`src/components/shop-panel.js`), the generated `mart` blocks in
`public/data/map-data/*.json`, and the wild win path in `src/game/reducer.js`.

Effort: **small–medium** (items + sell action + a shop Sell section); larger if
the item registry is unified.

---

## 35. Go through the Galar map and add the missing areas

Galar is currently the thinnest region map. The generator only keeps PokéAPI
**towns + numbered routes**, so most of Galar is absent: the Wild Area is a
single node, and **Isle of Armor** / **Crown Tundra** (Expansion Pass) don't
exist at all. As a result a large slice of the Galar dex has no native route and
gets pushed into Galar's Raid Island pool. This is the focused Galar pass;
#28a/#28b cover the same gaps generally and #36 proposes the zone model the
Wild Area needs.

- [ ] Audit `public/data/map-data/galar.json` and
      `public/data/encounter-data/galar.json` against a real Galar map and
      write down what's missing — the Wild Area sub-areas (Rolling Fields,
      Dappled Grove, Giant's Mirror, Lake of Outrage, …), Slumbering Weald,
      Galar Mine, Glimwood Tangle, and any towns/routes the scraper skipped.
- [ ] Add what the scrapers can (`tools/scrape-region-maps.cjs` + cached
      Bulbapedia connections, then `tools/scrape-route-encounters.cjs` for the
      encounter tables); inject the rest with
      `EXTRA_MAP_AREAS` in `tools/generate-regions.cjs`, which already supports
      an explicit `node` / `species` / `connect` / `rank`.
- [ ] Model the Wild Area as a **zone** (#36) rather than one giant route, with
      each named sub-area holding its own encounter table/background.
- [ ] Re-run `tools/generate-regions.cjs` and re-check Galar's `raidPool` —
      species that now spawn natively must drop out of it.
- [ ] Keep the progression sensible: mainland Galar stays on the 5–75 curve,
      and the DLC is post-game (after the Champion) via a forced `rank` /
      `unlockOrder`.

Relevant code: `tools/scrape-region-maps.cjs` (`MANUAL_BRIDGES`, which already
carries the Wild Area links), `tools/scrape-route-encounters.cjs`,
`tools/generate-regions.cjs` (`EXTRA_MAP_AREAS`, `levelRoutes`, raid pools),
`public/data/map-data/galar.json` and `public/data/encounter-data/galar.json`,
and `raidPoolFor` in `src/data/gameData.js`.

Effort: **medium** (mostly data; the Wild Area zone work depends on #36).

## 36. Zones — route-like chunks of areas

The map is a graph of single nodes joined pair-wise: a town or one route per
node. That fits Kanto–Unova, but the later regions aren't a linear route chain,
and they map badly today:

- **Alola** is four islands of trial areas — the generator has no way to show an
  island as a unit, so areas are stitched on by proximity and several islands
  read as separate disconnected clusters.
- **Galar**'s Wild Area is dozens of named sub-areas wrapped around the map; it
  currently collapses to one node.
- **Paldea** is open-world provinces of "<Dir> Province (Area N)" with no
  numbered routes at all, so it falls back to BFS-depth ordering and trims each
  province to 15 species.

Introduce a **zone**: a map node that is a *chunk of areas* (like a route, but
grouping several sub-areas) instead of a single encounter table.

Design questions to settle first:

- [ ] **Data shape**: a `type: 'zone'` location carrying
      `subAreas: [{ id, name, routeKey/encounters, background, unlock? }]`, vs.
      first-class locations tagged with a `zone`/`parentZone` id. The first keeps
      the map graph small (one node per zone) and makes zones obvious; the
      second reuses all the existing route plumbing.
- [ ] **Travel & UI**: does a zone appear as one node that opens a sub-area
      picker, or as a cluster of sub-area nodes shown/hidden together? Decide
      how the active sub-area is chosen (player pick vs. rotation).
- [ ] **Encounters**: resolve against the active/selected sub-area —
      `resolvePokemonEncounter` and `encounterData[routeKey]` are keyed by a
      single `routeKey` today, so the zone needs to feed the right one (or hold
      its own bucket).
- [ ] **Progress**: do zones unlock as a unit, or do sub-areas gate
      individually? `computeUnlockedLocations` + each location's `unlock` seed
      the fixpoint, and `unlockOrder` must stay stable when a zone is added
      (currently `region generation * 100000 + route rank`).
- [ ] **Level curve**: `levelRoutes()` spreads routes across the 5–75 curve by
      route number / BFS depth — decide how a zone's sub-areas rank and how the
      DLC/post-game zones slot in.

Likely touch points: `src/components/map-node.js` (zone glyph / cluster),
`town-map.js` (roads + tab), `location-panel.js` (the Wild Pokémon header),
`route-encounter-grid.js` (sub-area tabs), `tools/generate-regions.cjs`
(`EXTRA_MAP_AREAS`, `levelRoutes`, ordering), `tools/scrape-region-maps.cjs`,
and the `map-data/` / `encounter-data/` region files.

Good first candidate: **Galar's Wild Area** (one zone, many sub-areas) together
with #35, then **Alola** (islands as zones) and **Paldea** (provinces as zones)
to replace the proximity stitching / 15-species trim.

Effort: **medium–large** (a small data-model change plus map/encounter UI, but
it unblocks the three regions that don't fit the route graph today).

## 37. ✅ Master Ball as a dedicated, animated catch — shipped in 0.9.2

Done. `THROW_MASTER_BALL` / `COMPLETE_MASTER_BALL` (`src/game/reducer.js`) catch
a live wild encounter (raids included) from a new `catching` phase that pauses
the idle loop; `MasterBallScene` (`src/components/master-ball-scene.js`) plays
the throw/flash/wobble/click animation before the catch resolves. The Master
Ball is excluded from `selectBestBall` (so auto-catch and the
always-catch-shinies rule can never spend one) and hidden from the
catch-settings ball picker; it is thrown only from the battle button. The catch
registers in the Pokedex and fires the usual new/repeat/shiny toasts.

## 38. Clean up the Raid Islands (later generations are bloated)

The raid scan gives each region its generation's species that appear on **no**
region's wild routes and can't be reached by breeding/evolving a route species.
Because later dexes are huge (and their DLC/regional forms have no native
route), the pools balloon:

| Region | Gen | raid pool |
| --- | --- | --- |
| Kanto | 1 | 9 |
| Johto | 2 | 12 |
| Hoenn | 3 | 15 |
| Sinnoh | 4 | 20 |
| Unova | 5 | 27 |
| Kalos | 6 | 10 |
| Alola | 7 | **51** |
| Galar | 8 | **59** |
| Paldea | 9 | **58** |

A 50–60 entry pool makes a Raid Island a shapeless grab bag: legendaries sit
alongside ordinary final stages, `START_RAID` rolls one uniform random entry,
and `pickRaidLegendary` just prefers unseen/uncaught — so the "special" feel is
diluted and a region's endgame becomes a big lottery. Trimming must not orphan
anything: the raid pool is the safety net for otherwise-unobtainable species,
and `npm run validate` checks every species is obtainable.

- [ ] Decide a target shape per region: e.g. keep **all** legendaries/mythicals
      (no other source) plus a capped non-legendary set (~10–15), and move the
      overflow to a real acquisition path (routed encounters, DLC areas #39,
      evolution items) rather than deleting it.
- [ ] Separate legendaries from the general pool in the data and the UI, so a
      raid can prioritise uncaught legends and ordinary finals are a distinct,
      lower-tier source.
- [ ] Consider weighting/level-gating the pool (by badges/prestige) instead of a
      uniform pick, and whether `raidPoolFor` should return the capped list.
- [ ] Explain *why* the later pools are big and fix the root cause where it is
      a data gap (regional/paradox forms and DLC mons with no native route),
      not just a cap (see #35, #39).
- [ ] Re-run `tools/generate-regions.cjs`, re-check every region's `raidPool`,
      and confirm `validate-data.cjs` still passes with nothing orphaned.

Relevant code: `tools/generate-regions.cjs` (`raidCandidates`,
`raidPoolSpecies`, `staysInRaidPool`, `FORM_RAID_REGION`, `paldeaExtrasFor`),
`public/data/regions.json` (`raidPool`), `pickRaidLegendary` / `resolveRoamer`
(`src/game/progression.js`), `START_RAID` (`src/game/reducer.js`), the raid UI
(`src/components/town-map.js`, `location-panel.js`) and `tools/validate-data.cjs`.

Effort: **medium** (mostly balance/data plus the generator; game logic is small).

## 39. Introduce DLC regions from later games

Later games shipped whole expansion areas that today are either folded into a
parent region, trimmed, or pushed into a raid pool:

- Galar — **Isle of Armor** and **Crown Tundra** (Sword/Shield Expansion Pass).
- Paldea — **Kitakami** (Teal Mask) and **Blueberry Academy / Terarium**
  (Indigo Disk). `paldea-mossui-town` is already scraped as a bare dead-end town.
- Optional older post-games: Kanto's **Sevii Islands** and Unova's Black/White 2
  areas.

#28a covers adding these as *areas inside their parent region*. This item is
about promoting them to **first-class regions** in `regions.json` — their own
`entry`, level curve, unlock path, raid pool and map — so they can be opened
with an Unlock Token like any other region.

- [ ] Decide the model: a region whose `generation` points at its parent gen,
      vs. a new `parentRegion` / `isDlc` flag. Regions currently map 1:1 to
      generations (`generation`, `speciesForGen`, per-gen raid pools and the
      per-generation Shiny Charm), so DLC needs an explicit answer.
- [ ] Add each area to `tools/region-maps.json` / `EXTRA_MAP_AREAS` with its own
      locations + encounters (`tools/scrape-region-maps.cjs` +
      `tools/scrape-route-encounters.cjs`, manual for Paldea-style provinces),
      and a `REGION_MAP_LAYOUTS` override where the layout needs hand-measuring.
- [ ] Give each a progression: post-game (after the parent Champion) or bought
      with an Unlock Token; decide whether it needs a league/Champion or just a
      raid/legendary endgame.
- [ ] Reconcile the dex/shininess/achievement structures:
      `GENERATION_DEX_RANGES` / `speciesKeysByGeneration` / `completedGenerations`
      key by national dex, so DLC mons already count toward their gen — decide
      whether DLC regions count toward region completion, Unlock Tokens and the
      World Tour achievement.
- [ ] Register the new region files in `assets/gameDataInjector.js` (the region
      list) and re-export in `src/data/gameData.js`.
- [ ] Re-check raid pools (#38) afterwards: DLC mons that gain a native DLC
      route must drop out of the parent generation's pool.
- [ ] Shape the maps with **zones** (#36) where they're open-world (the
      Terarium, Wild Area-style areas).
- [ ] Suggested order: Galar DLC (fits Galar's thin map, #35) → Paldea DLC
      (relieves Paldea's 15-species trim and 58-entry raid pool) → older
      post-games if worthwhile.

Relevant code: `public/data/regions.json`, `tools/generate-regions.cjs` (region
construction, `speciesForGen`, `levelRoutes`, the raid scan),
`tools/scrape-region-maps.cjs`, `assets/gameDataInjector.js` (region file list),
`src/game/progression.js` (`getRegionUnlockTokens`,
`computeUnlockedLocations`), and the Town Map (`src/components/town-map.js`).

Effort: **medium–large** (data-heavy, but shares groundwork with #28/#35/#36).

## 40. Handle Alola, Galar and Paldea's league structures

The league model assumes every region has **8 gym leaders in canonical order**,
then a **4-member Elite Four** and a Champion at a `leagueLocationKey`, gated by
`gymsRequired` / `badgesRequired` and unlocked along the route tree. That fits
Gens 1–6, but it misrepresents three regions:

- **Alola** has no gyms — 7 island trials (captain + totem Pokemon) award
  Z-Crystals, plus 4 grand trials against the Kahunas. The data currently
  fabricates **8** Z-Crystal "gyms" (e.g. a Groundium Z) and spreads them across
  towns, so trial captains are ordinary trainers and the grand trials/totems
  aren't modelled at all. Alola *does* have a real E4 + Champion (Mount
  Lanakila), so only the badge track is wrong.
- **Galar** has 8 gyms but **no Elite Four**: the Championship runs the Champion
  Cup semifinals (Marnie / Hop / Bede / Raihan) then Champion Leon, with a
  post-game rematch tournament. The data fakes an E4 from those rivals and
  labels it "Elite Four & Champion".
- **Paldea** has 8 gyms challengeable **in any order** and no fixed badge
  order — the generator imposes canonical order via `gymsRequired` gates (gym
  k's gate goes on the first route after it, and later routes inherit it).
  Victory Road is also only one of three storylines (Path of Legends, Starfall
  Street), so a badge-count gate is a poor fit.

Make the league structure **data-driven per region** rather than assumed:

- [ ] Decide the model: a per-region `league` block, e.g.
      `{ badgeLabel, badgeKind: 'gym' | 'trial' | 'battle', order: 'ordered' | 'free', eliteLabel, eliteKind: 'elite4' | 'cup' | 'none' }`,
      in `regions.json` (or a new data file), vs. flags on the existing
      gym/E4/champion entries.
- [ ] **Alola**: replace the 8 fabricated "gyms" with the 7 trials + 4 grand
      trials (or an explicit, documented 8-slot mapping); decide whether a trial
      is a captain battle, a totem battle, or both, and how Z-Crystals map to
      `defeatedGyms`/badges.
- [ ] **Galar**: keep the 8 gyms; relabel the endgame as the **Champion Cup**
      and treat the E4 list as the semifinal opponents (already Marnie / Hop /
      Bede / Raihan); decide what "E4 beaten" means and how the post-game
      tournament (rematches) works.
- [ ] **Paldea**: drop canonical badge ordering — allow any-order gyms (fixed
      or level-scaled teams) and gate the league on a badge **count** instead of
      ordered `gymsRequired`; decide whether Titans / Team Star are optional
      side content.
- [ ] Make `gym-panel.js` copy data-driven — badge track, "Gym Leaders" →
      "Trial Captains" / "Gym Leaders", "Elite Four & Champion" → "Champion
      Cup" / "Championship", "Badge" → "Z-Crystal" — instead of hardcoded
      strings.
- [ ] Update the generator's badge-order gate logic, `GYM_TOWNS` / `GYM_TYPES` /
      `E4_TYPES` / `CHAMPION_TYPES`, and `tools/validate-data.cjs` (it currently
      expects 8 gyms / 4 E4 / 1 champion per region).
- [ ] Make the achievements region-aware: `badgeFull` ("all 8 badges") and the
      `allBadgesOfARegion` check should use each region's own badge count.
- [ ] Save shape is likely fine — `defeatedGyms` / `defeatedEliteFour` /
      `defeatedChampions` stay id lists — so this is mostly data + UI + the
      unlock-gate change.

Relevant code: `tools/generate-regions.cjs` (gym placement, `gymsRequired`
gates, league construction, `BADGE_NAMES` / `GYM_TOWNS`), `public/data/regions.json`
+ `gym-leader-data.json` / `elite-4-data.json` / `champion-data.json`,
`src/components/gym-panel.js`, `src/game/reducer.js` (`BOSS_BATTLE_END`,
`RESET_ELITE_FOUR`), `src/data/achievements.js`, `tools/validate-data.cjs`.

Effort: **medium** (mostly data + panel copy; the Paldea any-order gate is the
only real progression change).

## 41. Box "New" sort should add new Pokemon at the front

New Pokemon are always **appended** to `state.box` (`[...state.box, newPokemon]`
in `CATCH_POKEMON`, `WITHDRAW_DAYCARE` and `HATCH_DAYCARE_EGG`). The box is only
re-sorted when `SET_BOX_SORT` cycles the mode, so with the **New** (`newest`)
sort selected a fresh catch/hatch shows up at the *end* of the list — the
opposite of the sort's intent, and easy to miss once the box is large.

- [ ] Add a small helper (e.g. `insertIntoBox(box, pokemon, boxSort)`) that
      **prepends** when `boxSort === 'newest'` and appends otherwise, and use it
      at the three append sites: `CATCH_POKEMON`, `WITHDRAW_DAYCARE`,
      `HATCH_DAYCARE_EGG`.
- [ ] Prefer the targeted prepend over re-running `sortBoxMembers` on every add —
      that would also wipe the player's manual `REORDER_BOX` drag order in the
      other sort modes.
- [ ] Keep manual reordering intact: only "New" mode auto-prepends; other modes
      keep appending so a deliberate drag order survives new catches.

Relevant code: the catch handler (`CATCH_POKEMON`), `WITHDRAW_DAYCARE`,
`HATCH_DAYCARE_EGG`, `SET_BOX_SORT` / `REORDER_BOX` (`src/game/reducer.js`),
`sortBoxMembers` / `nextBoxSortMode` (`src/game/pokemon.js`), `BOX_SORT_OPTIONS`
(`src/data/ui.js`) and `box-panel.js`.

Effort: **small** (one helper + three call sites, or a one-line conditional at
each).

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

0.9.3 (natures): every Pokemon rolls one of the 25 natures (shown on the stats
panel, applied in `calculatePokemonStats`, migrated for old saves); a Nature
Mint in the Reward Shop re-rolls a party Pokemon's nature.

0.9.2 (Master Ball moment): the Master Ball is no longer auto-spent. A button in
wild/raid battles throws it with a throw/flash/wobble/click animation and a
guaranteed catch, driven by a new `catching` phase that pauses the idle loop.

0.9.1 (save backup + box order): Settings can export the save to a JSON file
and import one back (stamped to the current version, so backups survive a save
shape bump); the box serializer is now shared with the autosave so the two
can't drift. With the box sorted by "New", freshly caught/hatched/withdrawn
Pokemon are prepended so they show up at the front rather than the end.

0.9.0 (Dex Rewards & Battle Clarity): potions/revives and marts, Rare/Exp.
Candies and sellable treasures with Medicine/Candies/Valuables bag tabs, dex
completion rewards + Records section, a caught-Pokemon battle indicator, a
toast notification queue, and leftover Region Unlock Tokens converting to
Victory Tokens once all regions are open.

QOL batch (box sort modes with a remembered choice, egg-hatch popup with quick
release, living-dex capture mode, and out-of-combat move editing with the
wrong-Pokemon move bug fixed); Pokemon data pass (form transformations are
reversible/all-to-all — Deoxys, Rotom, Therian formes, Kyurem, Necrozma,
Calyrex, Zygarde, Basculegion/Indeedee gender forms — plus corrected stats and
the missing Alolan Ninetales Fairy type); Cosmoem evolves; raid QOL (a wipe
ejects you from the raid zone, pools only offer final stages, level scaling caps
at 100, and the legendary pick favours species you haven't seen); status
conditions + drain moves; Battle Tower + endless scaling; roaming legendaries;
route swarms; Wonder Trade (with the hidden shiny-for-shiny perk); Records
panel; Daycare (gender/egg groups/shiny odds); Achievements; DexNav shiny chain;
region Unlock Tokens; region Prestige; working evolution items + Link Cable;
Mew / MissingNo / Master Ball secrets; and the bulk of the earlier data/audit
fixes (encounters, forms, learnsets, trainers, marts, maps, sprites).
