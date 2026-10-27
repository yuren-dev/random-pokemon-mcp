# Acceptance — 0.3.0 — 2026-10-27

Local MCP only. No website/hosted MCP edits, npm login/publish, Registry submission or deployment. Package, lock root, MCP server and Registry manifest versions are 0.3.0; dependency tree is unchanged. README includes changelog, all parameters, item/ability support tables and remaining limitations.

- `npm run build`: passed. `npm run smoke`: passed, preserving the original Inspector/SDK/data checks and now also running `scripts/damage-check.mjs`. Sandboxed Node child process spawn returned EPERM; the same verification was run successfully outside the sandbox.
- **Compatibility:** no new fields preserves 0.2.0 numbers and computed/assumptions/damage/OHKO structures. Any supplied new field opts into stepwise Gen IX rounding, so even neutral new fields may change rounding relative to legacy. Abilities are opt-in (`useAbilities:true` / explicit ability / `auto`), avoiding silent old-call changes. Auto selects first non-hidden slot from the offline snapshot; explicit overrides support hidden abilities and take precedence. Unsupported selected abilities produce named warnings; unsupported items return readable errors listing supported items.
- **Coverage:** sun/rain Fire/Water boosts and reductions; sand Rock special defense; snow Ice defense; hail explicitly no direct multiplier/chip omitted. Grounded Electric/Grassy/Psychic power boosts, Misty Dragon reduction, Grassy Earthquake/Bulldoze/Magnitude reduction, Psychic priority protection. Terrain does not grant Ground immunity; Flying and selected Levitate immunity remain independent. Grounded overrides only control terrain eligibility.
- **Items:** Choice Band/Specs, Life Orb, Expert Belt and 18 type boosters are enumerated in code and README; every supported identifier was exercised over MCP. Fixed-point factors: terrain/Sand Force 5325, Life Orb 5324, Expert Belt/type boosters 4915, denominator 4096. Tests check category and super-effective conditions.
- **Abilities:** Huge Power/Pure Power, Unaware, Adaptability, Technician, Sniper, Solar Power, Sand Force, Dry Skin, Air Lock/Cloud Nine, Levitate and listed type-absorption immunities. Pure Power is 瑜伽之力, not 纯朴; Unaware/纯朴 ignores opposing stat stages. Recognized speed/accuracy/healing abilities have no direct damage effect; setters require caller-supplied current weather. No inferred switch order or ability activation state.
- **Tera:** 18 types, retained original STAB, new type STAB, matching-original ×2, Adaptability new ×2 / original ×2.25 and original non-Tera STAB ×1.5; defender changes to single Tera type before effectiveness and weather defense/grounding checks. Explicit critical hits and Sniper are included, critical probability is omitted.

## Independent hand calculations

All rows use level 50 Mew attacking Mew, 31 IV, 0 EV, neutral nature, stage 0, power 90 unless stated. Base stats 100 give A=D=floor((200+31)/2)+5=120; base damage B=floor(floor(22×P×A/D)/50)+2=41. Psychic rows explicitly set defender Tera Normal to isolate STAB from Mew's Psychic resistance. Fire is non-STAB and neutral except where stated. R rounds nearest with ties down; random step floors for each integer 85…100. Expected endpoints were written from this arithmetic independently of the implementation and asserted over MCP.

| Vector | Hand intermediate | Expected = actual damage |
|---|---|---|
| Sun Fire / Rain Water | R(41×1.5)=61 | 51–61 |
| Rain Fire | R(41/2)=20 | 17–20 |
| Psychic terrain + STAB | P=R(90×5325/4096)=117; B=53; random45…53; R(×1.5) | 67–79 |
| Electric / Grassy corresponding type | P117; B53; no STAB | 45–53 |
| Misty Dragon, grounded defender | P45; B21 | 17–21 |
| Choice Band physical / Specs special | A180; B61 | 51–61 |
| Life Orb | random34…41; R(×5324/4096) | 44–53 |
| Charcoal | P108; B49 | 41–49 |
| Expert Belt, defender Tera Grass | random34…41; Fire ×2; R(×4915/4096) | 82–98 |
| Adaptability Psychic | random34…41; STAB2 | 68–82 |
| Huge Power / Pure Power physical | A240; B81 | 68–81 |
| Solar Power + sun Fire | A180; B61; weather91 | 77–91 |
| Technician, input P60 | P90; B41 | 34–41 |
| Critical + Sniper | critical B=floor(41×1.5)=61; final R(×1.5) | 76–91 |
| Tera Fire (new STAB) / original Psychic retained | STAB1.5 | 51–61 |
| Tera Psychic (original matching) | STAB2 | 68–82 |
| Adaptability Tera Psychic | STAB2.25 | 76–92 |
| Adaptability Tera Fire using original Psychic | STAB1.5 | 51–61 |
| Defender Tera Grass, Fire | effectiveness2 | 68–82 |
| Sand, defender Tera Rock, Dragon special | D180; B28 | 23–28 |
| Snow, defender Tera Ice, Normal physical | D180; B28 | 23–28 |
| Hail Fire | unchanged B41 | 34–41 |
| Grassy Earthquake / ordinary Ground | P45/B21 versus P90/B41 | 17–21 / 34–41 |

The complete Sun roll array is independently fixed as `[51,52,53,53,54,54,55,56,56,57,57,58,59,59,60,61]`. Additional checks: airborne terrain eligibility, priority protection, Flying/Levitate/Ground-type immunity, Cloud Nine suppressing sun, Dry Skin absorbing rain Water, Unaware on both sides ignoring +2 opposing stages, auto Medicham Pure Power Attack160 versus explicit none Attack80, unsupported ability warning, unsupported item error, and support-list enumeration.

## 0.2.0 regression comparison

Built the unmodified pre-task HEAD `61b28f0` sources in `/tmp/pokemon-v020`, then called both old and new servers over MCP. Compared all assumptions, computed fields, **all 16 rolls**, percentages and OHKO fields, not just endpoints. New limitations text is intentionally different.

| Old call (no new fields; L50/P90/special) | 0.2.0 = 0.3.0 |
|---|---|
| Mew → Mew, Fire (neutral) | 34–41 |
| Mew → Venusaur, Fire (super-effective without STAB) | 69–82 |
| Charizard → Venusaur, Fire (STAB + weakness) | 112–132 |
| Pikachu → Diglett, Electric (immune) | 0–0 |
| Mew → Mew, Psychic, attack stage +2 (STAB + resistance) | 51–60 |

First four full-roll fixtures are retained in the normal smoke test. Live dual-server comparison can be repeated with `node scripts/damage-check.mjs /path/to/0.2.0/dist/index.js`.

## Package and remaining limits

`npm pack --dry-run --json --cache /tmp/random-pokemon-npm-cache` and `node scripts/validate-package.mjs` passed: **11 files; 192,344 bytes compressed; 1,211,779 bytes unpacked**, below 2 MB. Explicit allowlist contains only three compiled JS modules, four JSON data/provenance files, README, LICENSE, package.json and server.json. No images, credentials, node_modules, local configuration or test scripts are packaged. `pack-dry-run.json` records the exact inventory. Official Registry schema and executable shebang checks passed.

Every new-mode success declares included features and remaining omissions: burn, Reflect/Light Screen/Aurora Veil, doubles/spread, conditional Tera 60-power floor, Tera Blast/dynamic type/category, multi-hit/fixed-damage/other special moves, Stellar, unlisted abilities/items, chip/healing and extreme integer overflow. Critical chance, legality and current set selection are not modeled. Original-call output continues to declare its legacy omissions. Ordinary move type/power/category and current weather/terrain are caller inputs; this is not a full battle simulator.

Mechanics were checked against primary Smogon calculator code: https://github.com/smogon/damage-calc/blob/master/calc/src/mechanics/gen789.ts and https://github.com/smogon/damage-calc/blob/master/calc/src/mechanics/util.ts . No runtime network access or added dependencies.

---

# Acceptance — 0.2.0 — 2026-10-26

The three 0.1.0 source-data blockers are resolved with an offline PokeAPI snapshot. No website repository was entered or edited.

- `npm run build`: passed.
- `npm run smoke`: passed (Inspector tools/list = exactly five; Inspector calls all five tools; SDK output/error/recovery checks, type chart and damage checks retained). The obsolete expected error for disabling legendary species is replaced with successful independent-filter checks. Initial sandbox child-process EPERM was resolved by running the same smoke command outside the sandbox.
- **Abilities:** all 1025 default Pokémon IDs have PokeAPI abilities, `is_hidden` and `slot`. Pikachu returns `static` (静电), normal slot 1, and `lightning-rod` (避雷针), hidden slot 3. Names are English API identifiers, not translated labels.
- **Classification:** PokeAPI `/pokemon-species/{id}` provides separate flags for every species: 71 legendary and 23 mythical; the sets do not intersect. Mewtwo is legendary, Mew is mythical. All four inclusion-flag combinations are seed-reproducible. A Gen 1 psychic test confirms disabling legendary still permits mythical, and disabling mythical still permits legendary. Existing `includeLegendary` / `includeMythical` names and true defaults remain compatible; false now filters instead of returning the 0.1.0 error. Unlike the website’s combined legendary/mythical set, the local server filters the two PokeAPI classes independently.
- **Move coverage:** actual `/pokemon/{id}` learnsets plus referenced `/move/{id}` type/damage-class metadata. Coverage is the union of learnable non-status move types across all reported version groups, rather than species STAB. Raw Pikachu learnset references `dig` (ground, physical) and `mud-slap` (ground, special); `analyze_team` includes ground. Submitted moves are echoed, not verified or used as the coverage basis.
- **Provenance:** fetched 2026-10-26 from `https://pokeapi.co/api/v2/`, 1025 Pokémon responses, 1025 species responses and 797 referenced move responses. Compact facts are in `data/pokeapi.json`; all 2847 raw-response hashes are in `data/pokeapi-sha256.json`. Existing website facts/chart and source hashes are retained. `scripts/snapshot-pokeapi.py` uses three workers, throttling, five-attempt retries and an external raw cache; no runtime requests. `scripts/audit-snapshot.mjs` independently compares all 1025 records and all response hashes with the cached originals.
- **Package:** `npm pack --dry-run --json --cache /tmp/random-pokemon-npm-cache` and `node scripts/validate-package.mjs` passed. Ten files, compressed 186,285 bytes and unpacked 1,196,861 bytes at verification. Both are below 2 MB. Explicit file allowlist excludes images, keys, node_modules, scripts, raw cache and local logs. Only sprite/artwork URL strings are stored. Executable shebang and official Registry manifest schema validation pass; no Registry submission performed.
- **Remaining limits:** default forms and English names only; move-type union does not prove current game/format legality, submitted four-move coverage, simultaneous availability or dynamic move types. Role inference remains `unknown`; compact data does not establish hazards, removal, recovery, priority or speed control. Base-speed tiers and simplified damage remain estimates with declared omissions, not a battle simulator. No missing records in the three requested data categories.
- README section **“两种使用方式，让用户自己选”** appears before **Install and configure**. It gives local npx stdio configuration and the independent website Worker endpoint `https://random-pokemon-generator.org/api/mcp`. Hosted availability is reserved for the main release session to verify; it was not tested here. npx from npm cannot be tested before publication.
- No npm login/publish, official Registry/Glama/mcp.so submission or website deployment performed.
