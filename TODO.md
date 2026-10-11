# TODO

Open ideas and follow-ups. Current game version: **0.24.0**
(`src/data/changelog.js`). Finished work lives in the changelog, not here — this
file only tracks what is **still open**. See `AGENTS.md` for architecture,
commands and data conventions.

Section numbers are stable references (`#24`, `#36`, …) and are deliberately not
renumbered, so the gaps below are items that shipped.

---

## Priority order (effort vs. gain)

**Effort**: S (small) < S–M < M < M–L < L. **Gain** is the player-facing value
(★ = nice to have, ★★★★★ = core missing feature).

### Tier 1 — High impact, worth the effort

1. **#24 Move data pass** — M · ★★★ — the doubles-only moves and the
   PP / Z-Move keep-or-drop decisions.
2. **#25 Battle engine pass** — M–L · ★★★ — the remaining doubles abilities,
   Illusion, more berries / Rocky Helmet, and battle polish.
3. **#18 Better settings** — M · ★★★ — cosmetic options, the default catch
   rule in Settings, auto-heal; account controls blocked on #19.
4. **#43 Multi-battles (triple / rotation)** — M–L · ★★½ — build on the
   shipped doubles engine.

### Tier 2 — Big / low-return, defer

5. **#56 Multi-effect move pass (residual)** — S · ★★ — moves that carry a
   third effect, which the single `secondary` slot cannot express.
6. **#19 Online sync** — L · ★★★ — the project's first backend; needs a design
   doc and real ops for modest player value today.

### Tier 3 — New ideas (route activities, idle depth, endgame)

7. **#69 Legendary quests** — M · ★★★.
8. **#65 Prestige perks** — M–L · ★★★.
9. **#71 Breeding project queue** — M · ★★★.
10. **#62 Offline depth** — M · ★★★.
11. **#72 QoL pass** — S–M · ★★★.
12. **#67 Ribbons + ribbon case** — S–M · ★★½.
13. **#68 Generation-completion rewards** — S · ★★.
14. **#59 Activity goals & per-route mastery** — S–M · ★★.
15. **#61 Focus / target hunting** — S–M · ★★½.
16. **#66 Battle Frontier facilities** — M–L · ★★½.
17. **#70 Recurring rival** — M · ★★½.

---

## 18. Better settings

`settings-modal.js` exposes gameplay, notification, display and audio toggles,
and the preferences live outside the save (`pokemon-idle-settings`,
`src/game/settings.js`) so they survive a save reset and are shared across slots.

Still open:

- [ ] **Display**: more cosmetic options beyond the sprite style
      (animated / static) that shipped.
- [ ] **Account**: sign in / sync controls — blocked on #19.
- [ ] **Gameplay**: surface the default catch rule in Settings (it lives only
      in the Catch Settings modal) and add auto-heal. Auto-switch and
      auto-travel already exist as the Battle Style and Auto-Proceed settings.

Effort: **medium** (mostly UI plus a small settings slice).

## 19. Online sync (cloud saves via a database)

This would be the project's **first backend** — the app is deliberately
client-only today with `localStorage` saves. Worth a short design doc first.

- [ ] Pick a backend: a managed BaaS (Supabase / Firebase — auth + Postgres /
      Firestore) vs a small custom API.
- [ ] Auth: an anonymous device id that can later be linked to an account
      (email / OAuth) so a save can follow the player across devices.
- [ ] Sync model: a save is a single JSON blob, so at minimum keep a
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

## 24. Move data pass (mostly done)

`possible-moves.json` carries `name / type / category / power / accuracy / pp /
priority / effect`, and `src/data/move-effects.js` layers richer effects on top.
Healing, multi-hit, crit stages, Protect, statuses, screens, entry hazards,
Taunt/Substitute, weather setters, weather accuracy, terrain synergy, phazing,
swaps, the two-turn/charging moves, the status-condition conditionals, the
multi-status rolls (Tri Attack, Dire Claw), Retaliate, Round / Echoed Voice and
the faint-heals all shipped.

Not done:

- [ ] The doubles-only moves (After You, Ally Switch, Follow Me, Helping Hand,
      Quick/Wide Guard, Rage Powder, …) — the main game is singles, and the
      doubles minigame (#43) does not use them yet.
- [ ] PP is stored but unused; decide whether to implement it or drop it.
- [ ] Z-moves / G-Max moves are otherwise dead data — decide keep/drop.

Effort: **medium** (the effect set is done; what is left is design calls).

## 25. Battle engine pass (mostly done)

`resolveBattleTurn` (`src/game/combat.js`) is fairly complete for damage +
status + stat changes. Healing, multi-hit, Protect, hazards, accuracy/evasion
stages, the extra statuses, weather/terrain, the crit-rate pass, the
auto-battler AI, the contact abilities, the mid-battle form-change subsystem,
the battle-only synthetic-species table, and most singles abilities
(Synchronize, Magic Bounce, Rivalry, Quick Draw, Stakeout, Supreme Overlord,
Choice locking) have shipped.

Not done:

- [ ] The remaining doubles abilities: Telepathy, Aroma/Flower Veil, Costar,
      Commander, Hospitality, Symbiosis, Gulp Missile. (Battery, Power Spot,
      Friend Guard and Healer work in the Battle Maison doubles engine.)
- [ ] Illusion (deferred: its disguise is cosmetic plus an AI read, which an
      idle auto-battler barely shows).
- [ ] Overworld-only abilities (no effect in an idle auto-battler): Illuminate,
      Run Away.
- [ ] The remaining item nuances: more berries (the pinch berries beyond
      Sitrus/Lum) and Rocky Helmet (blocked on a bag sprite). Choice locking
      shipped.
- [ ] Battle polish: move animations / damage numbers / hit feedback.

*(Switching on a bad matchup is intentionally discarded: an auto-switching
opponent is frustrating to play against.)*

Effort: **medium–large** (do it in slices).

## 28. More region areas (DLC, caves, POIs)

The Galar / Paldea DLC and Kanto's Sevii Islands are first-class `isDlc`
regions, the Unova Black 2 / White 2 areas and ~100 landmark areas are on the
map (`tools/lib/ordinary-areas.cjs`), Johto's Whirl Islands is a zone, and the
service POI set (Day-Care, Berry Garden, Battle Tower, Raid Den, Legendary
Shrine, Cafe) is in. **No open items.**

## 36. Zones — route-like chunks of areas

The map is a graph of single nodes joined pair-wise. The zone model shipped in
0.13.0: `type: 'zone'` nodes group sub-areas that are hidden routes with their
own encounter buckets, and existing routes can be grouped too (`GROUP_ZONES` —
Alola's islands, Paldea's provinces).

Shipped: the Galar Wild Area (13 habitats), the four DLC zones, Alola's
islands, Paldea's provinces and Area Zero, and Johto's Whirl Islands all have
their sub-areas, spaced in a ring for the focused map view. **No open items.**

## 43. Multi-battles (double / triple / rotation) as a minigame

The **doubles** 2v2 minigame shipped at Kalos's Battle Maison: two of the party
face two foes, every battler picks a target, spread moves hit both, fainted
Pokemon tag in from the bench, and the ally abilities (Battery, Power Spot,
Friend Guard, Healer) work. It reuses the singles engine one action at a time.

Still open:

- [ ] Triple and rotation battles.
- [ ] A 3-way / 4-way free-for-all variant (the Battle Royal is the closest
      thing today).
- [ ] A doubles home in more regions (currently only Kalos's Battle Maison).
- [ ] The doubles-only moves (Follow Me, Helping Hand, Quick/Wide Guard) and
      the remaining ally abilities (#25) still do nothing.

Relevant code: `src/game/minigames/doubles.js`,
`src/components/doubles-scene.js`, `src/game/reducer/minigames.js`, and
`src/game/minigames/registry.js`.

## 56. Multi-effect move pass (mostly done)

Shipped: the move data supports a primary effect plus one `secondary`, the
recharge flag is back, the missing secondaries were filled in, the elemental
fangs carry both effects, Fake Out is first-turn-only, and
`public/reference.html` is the live checklist of every implemented effect.

Still open:

- [ ] Moves that carry a third effect (a primary effect plus two riders), which
      the single `secondary` slot still cannot express.

Relevant code: `src/data/move-effects.js`, `src/game/combat/turn.js`,
`src/game/move-info.js`, and `public/reference.html` (regenerate with
`node tools/generate-reference.cjs`).

Effort: **small** (the remaining bits are one-offs).

## 59. Activity goals & per-route mastery

Persist the best hit quality per route/activity, grant a mastery bonus once a
route's activities are all cleared, and add activity-flavoured daily quests.

Effort: **small–medium**.

## 61. Focus / target hunting

Pick a species or type to focus; boost its wild and activity encounter rate and
track hunt progress (encounters, best quality, time to catch).

Effort: **small–medium**.

## 62. Offline depth

Richer offline reports and queued work: which routes/activities ran, what was
caught, and a catch-up simulation that matches `offline.js`.

Effort: **medium**.

## 65. Prestige perks

Prestige currently only resets map progress for Victory Tokens; add a
persistent talent tree so prestiging invests in something across runs.

Effort: **medium–large**.

## 66. Battle Frontier facilities

Rule-variant facilities (inverse battles, rental teams, no-items) built on the
Tower / Maison scenes.

Effort: **medium–large**.

## 67. Ribbons + ribbon case

Award ribbons for contest wins, tower clears, gym sweeps and the like, with a
per-Pokemon ribbon case UI. Contest minigame already exists.

Effort: **small–medium**.

## 68. Generation-completion rewards

Per-generation Pokedex certificates/items beyond the Shiny Charm.

Effort: **small**.

## 69. Legendary quests

Multi-step relic hunts for the box legendaries instead of pure Raid RNG.

Effort: **medium**.

## 70. Recurring rival

A rival who appears at badge/Champion milestones with a scaling team and
dialogue.

Effort: **medium**.

## 71. Breeding project queue & shiny tracking

A day-care project queue, surfaced Masuda odds, and a shiny-egg tracker.

Effort: **medium**.

## 72. QoL pass

Team presets, box bulk-release/sort by IV, damage/effectiveness preview on the
battle move buttons, and JSON save export/import.

Effort: **small–medium**.

## Map cleanup reference maps
All eight non-Kanto regions have hand-measured `REGION_MAP_LAYOUTS` overrides.
`tools/map-compare/overlay-region-maps.py` draws the game's nodes on top of each
reference image (`tools/map-compare/refs/`, fetched by `fetch-refs.cjs`) to
check them. Re-run the overlay after moving or adding nodes.

Reference images kept for future checks:

- **Sinnoh** — https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e3b63315-f949-4899-bfec-5e53edcb71bc/de3deoc-13a15e88-ca36-4f15-8824-44f4f7c83833.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9lM2I2MzMxNS1mOTQ5LTQ4OTktYmZlYy01ZTUzZWRjYjcxYmMvZGUzZGVvYy0xM2ExNWU4OC1jYTM2LTRmMTUtODgyNC00NGY0ZjdjODM4MzMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.2o7QyN1MjdspHH1EYhWWIpV8_2aer0TBwtswDubtGzw
- **Galar** — https://static0.polygonimages.com/wordpress/wp-content/uploads/chorus/uploads/chorus_asset/file/19375993/Pokemon_sword_shield_galar_map_locations.jpg?q=50&fit=crop&w=750&dpr=1.5
- **Kalos** — https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fm77o7e9nfw371.jpg
- **Unova** — https://upload.wikimedia.org/wikipedia/commons/2/2b/Unova_Map.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail_unscaled&_=20231229170134

---

## Map polish (visual)

The generated maps are readable graphs. The zone marker shows its sub-area
count, town and area/zone labels stay on screen, and a legend explains the node
types and services, so what is left here is **art**:

- [ ] Add more battle background art. There are only four base scenes
      (grassland, beach, mountain, cave) plus the biome colour grades; real
      forest/desert/swamp/volcano/tundra art would let `routeBackground` stop
      tinting a handful of images.

## Useful references when picking these up

- **Data-pipeline template:** `tools/fetch-breeding-data.cjs` — cached PokéAPI
  fetch, form ids resolved to base species, writes a `public/data/*.json`, then
  add the key to `assets/gameDataInjector.js` and re-export in
  `src/data/gameData.js`.
- **Battle hooks:** status conditions / drain live in `src/game/combat/turn.js`
  (`resolveBattleTurn`); volatile state is threaded through the game loop and
  the reducer's `UPDATE_VOLATILE`.
- **Save shape:** new state fields go in `initialGameState`, `context.js`
  (save + sanitising restore) and `src/types.d.ts`. Bump `SAVE_VERSION`
  (`src/data/config.js`) only for incompatible shape changes (add
  `LEGACY_SAVE_KEYS`).
- **Config constants** live in `src/data/config.js`.
- **Scenes / pausing phases:** the minigames (`mining`, `gameCorner`,
  `battleRoyal`, `doubles`, …), Wonder Trade, evolution, healing and the Master
  Ball throw are all phase-driven scenes rendered by
  `src/components/battle-scene.js`; the idle loop pauses for them in
  `src/game/use-game-loop.js`.
- **Verifying:** `npm test`, `npm run typecheck`, `npm run validate`,
  `npm run quickplay` and `npm run build`. A headless test (mock
  `window.gameDataInjector.data` with the JSON files and `import()` the module)
  works well for reducer/combat logic.
- **Versioning:** fold a change into the top `CHANGELOG` entry; cut a new
  `GAME_VERSION` only at a milestone (secrets stay out of the changelog by
  convention).
- **Commit** each logical change; never `git push`.
