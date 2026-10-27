# random-pokemon-mcp

Offline TypeScript MCP server using `@modelcontextprotocol/sdk` and stdio. Node.js >=20. No backend, keys, telemetry or runtime API requests. Companion website: https://random-pokemon-generator.org

**0.3.0 changelog:** expanded local `calc_damage` with weather, terrain, supported damage items/abilities and Terastallization, Gen IX stepwise rounding, explicit support tables and warnings. Calls without new fields retain 0.2.0 numeric results. Not yet published; npm publication remains manual.

**0.2.0 changelog:** added real abilities (including hidden flags), independent legendary/mythical filtering, and learnable damaging-move type coverage from an offline PokeAPI snapshot. National Dex 1–1025, bundled English names, default forms only. Generation filters mean introduction generation; matchups use Gen VI+ types.

## 两种使用方式，让用户自己选

- **本地版（stdio）**：使用下方 `npx -y random-pokemon-mcp@0.3.0` 安装配置；数据随包离线提供，无需 API 密钥。
- **托管版（网站 Worker）**：支持远程 MCP 的客户端可使用 `https://random-pokemon-generator.org/api/mcp`，无需本地安装。托管服务独立开发、部署与更新，功能和数据版本可能与本地版不同。

## Install and configure

After the package is manually published, run `npx -y random-pokemon-mcp@0.3.0`. Before publication use `npm ci && npm run build`, then configure `node /absolute/path/random-pokemon-mcp/dist/index.js`.

Claude Code:

```sh
claude mcp add random-pokemon -- npx -y random-pokemon-mcp@0.3.0
```

Cursor (`.cursor/mcp.json`) and Claude Desktop (`claude_desktop_config.json`):

```json
{"mcpServers":{"random-pokemon":{"command":"npx","args":["-y","random-pokemon-mcp@0.3.0"]}}}
```

VS Code (`.vscode/mcp.json`):

```json
{"servers":{"random-pokemon":{"type":"stdio","command":"npx","args":["-y","random-pokemon-mcp@0.3.0"]}}}
```

On Windows use `npx.cmd` if required by the client. stdout contains MCP protocol only.

## Exactly five tools

| Tool | Input and behavior |
|---|---|
| `get_pokemon` | `pokemon`: English name or numeric National Dex ID. Types, base stats, generation, URL-only artwork, real abilities with `is_hidden`/`slot`, and `is_legendary`/`is_mythical`. |
| `get_type_effectiveness` | Optional `attacking` and/or `defending` (1–2 distinct lowercase English types); at least one required. Attack groups, defense groups and product when both supplied. |
| `random_team` | `seed` string (default `random-pokemon`), optional `generations` 1–9 and any-matching `types`; six distinct species, per-member defensive groups and exact 2x/4x team counts. `includeLegendary` and `includeMythical` default true; false independently excludes that category. Existing parameter names/defaults remain compatible; false now succeeds instead of returning the 0.1.0 missing-data error. Unlike the website’s combined legendary/mythical set, these are separate PokeAPI classifications; disabling legendary alone still permits mythical species and vice versa. |
| `analyze_team` | `text`: 1–6 Showdown sets separated by blank lines, including nicknames. Defensive groups, team counts, learnable damaging-move type coverage against single types, descending base-speed tiers and explicit unknown-role evidence. Submitted moves are echoed but are not used to calculate coverage or legality checked. Coverage unions every non-status move in the default form’s PokeAPI learnset across all version groups. It describes potential options, not a simultaneous four-move set; it does not guarantee availability in a particular game, generation or format. Dynamic move-type mechanics are not modeled. No scores or rankings. EVs, IVs, level, nature, items and abilities in text are not simulated. |
| `calc_damage` | Required `attacker`, `defender`, `moveType`, `power` 1–300, `category` physical/special. Existing optional `level` (50), `attack`/`defense` {iv:31,ev:0,nature:neutral,stage:0}, `hpIV` (31), `hpEV` (0), `currentHP` (max). Nature: neutral/boosted/hindered; stage −6…6. Same level for both sides; no EV-total legality validation. Optional extensions below. |

### Damage calculation in 0.3.0

All new fields are optional. **No new fields means exact 0.2.0 numeric compatibility**, including its combined final flooring and no implicit abilities. Passing any new field (even `weather:"none"` or `useAbilities:false`) enables Gen IX single-target stepwise rounding. Output reports assumptions, modified stats, power, weather, STAB, effectiveness, selected abilities, warnings, 16 random rolls, HP percentages and OHKO counts. Every success/error declares omissions; success distinguishes included mechanics from remaining limits.

| Optional field | Accepted values / behavior |
|---|---|
| `weather` | `none`, `sun`, `rain`, `sand`, `hail`, `snow`. Sun fire ×1.5/water ×0.5; rain reverses these. Sand has no direct move multiplier but boosts Rock special defense ×1.5. Snow boosts Ice defense ×1.5. Hail has no direct move multiplier. No weather chip damage. Hail is an explicit legacy-weather extension to the Gen IX formula. |
| `terrain` | `none`, `electric`, `grassy`, `psychic`, `misty`. Grounded attacker gets corresponding Electric/Grass/Psychic power ×5325/4096 (approximately 1.3). Misty halves Dragon power against grounded defenders. Psychic blocks positive-priority attacks against grounded defenders. |
| `moveName`, `priority` | `other`, `earthquake`, `bulldoze`, `magnitude`; grassy terrain halves these three moves against grounded defenders. Other Ground moves are unaffected. `priority` −7…5, assumed 0 when absent; supply current effective priority. Move name does not infer type/power/category. |
| `attackerGrounded`, `defenderGrounded` | Optional booleans for **terrain eligibility only**. Default uses current defensive type (including Tera) and selected Levitate. Does not remove Flying/Levitate Ground immunity or model Gravity, Iron Ball or Air Balloon. Terrain itself never grants Ground immunity. |
| `item` | Attacker-held item; English identifiers below, spaces/underscores/case normalized. Unknown/unsupported items return a readable error with the supported list. |
| `useAbilities` | `true` selects each species' first non-hidden ability by slot from bundled data. Multiple possible abilities are not a known battle set: this is an explicit deterministic assumption. Default disabled for compatibility. |
| `attackerAbility`, `defenderAbility` | English PokeAPI identifier, `auto` (same data selection), or `none`. Explicit overrides take precedence, including hidden/non-native abilities; legality is not checked. Unsupported abilities produce named warnings and are excluded. Supplying weather/terrain/Tera alone does not enable abilities. |
| `teraType`, `defenderTeraType` | One of 18 English types. Attacker retains original offensive STAB ×1.5; new Tera type gains ×1.5, or ×2 if originally matching. Adaptability applies only to the Tera type after Tera (×2 for new type, ×2.25 for original type). Defender's defensive types become only its Tera type. Stellar unsupported. |
| `critical` | Explicit boolean, default false: critical damage ×1.5, ignores negative attack/positive defense stages; Sniper adds ×1.5. Critical probability is not calculated. |

**Supported items** (source of truth: `SUPPORTED_ITEMS` / `TYPE_ITEMS` in `src/damage.ts`): `none`, `choice-band` (physical Attack ×1.5), `choice-specs` (Special Attack ×1.5), `life-orb` (final modifier 5324/4096), `expert-belt` (super-effective only, 4915/4096), plus type power boosters (4915/4096):

| Type | Item | Type | Item |
|---|---|---|---|
| normal | silk-scarf | fire | charcoal |
| water | mystic-water | electric | magnet |
| grass | miracle-seed | ice | never-melt-ice |
| fighting | black-belt | poison | poison-barb |
| ground | soft-sand | flying | sharp-beak |
| psychic | twisted-spoon | bug | silver-powder |
| rock | hard-stone | ghost | spell-tag |
| dragon | dragon-fang | dark | black-glasses |
| steel | metal-coat | fairy | fairy-feather |

**Supported ability effects:** Huge Power/Pure Power double physical Attack (大力士/瑜伽之力); Unaware (纯朴) instead ignores the opponent's relevant stat stages. Adaptability modifies STAB, Technician boosts power ≤60, Sniper boosts explicit critical hits, Solar Power boosts Special Attack in sun, Sand Force boosts Ground/Rock/Steel power in sand, Dry Skin boosts incoming Fire power and grants Water immunity. Air Lock/Cloud Nine suppress weather. Levitate grants Ground immunity; Water Absorb/Storm Drain/Dry Skin, Flash Fire, Lightning Rod/Volt Absorb/Motor Drive and Sap Sipper grant the corresponding type immunity. Absorption's later stat boosts and activated Flash Fire damage boost are not modeled.

Chlorophyll, Swift Swim, Rain Dish, Sand Rush, Sand Veil, Snow Cloak, Slush Rush and Ice Body are recognized as having no direct damage effect in this calculation; speed, accuracy and healing are outside scope. Drought, Drizzle, Sand Stream and Snow Warning are recognized setters, but **the caller supplies current weather**; switch-in order and weather activation are not inferred. `snow-warning` does not infer hail versus snow. `SUPPORTED_ABILITIES` in code/output is the complete supported table; every other selected ability produces a warning.

Example (local MCP):

```json
{"attacker":"charizard","defender":"venusaur","moveType":"fire","power":90,"category":"special","weather":"sun","item":"life-orb","attackerAbility":"solar-power","teraType":"fire"}
```

Still omitted: burn, Reflect/Light Screen/Aurora Veil, doubles/spread modifiers, special move mechanics (including Tera's conditional 60-power minimum, Tera Blast, multi-hit and fixed damage), Stellar, unsupported abilities/items, healing/chip, integer overflow at extreme inputs, critical chance and move legality. Supply an ordinary single-hit move's already determined type/power/category. Immunities yield zero damage; Shedinja HP is 1. No TCG, GO or Nuzlocke scope.

Mechanics checked against the primary [Smogon damage calculator implementation](https://github.com/smogon/damage-calc/blob/master/calc/src/mechanics/gen789.ts) and its [rounding/STAB utilities](https://github.com/smogon/damage-calc/blob/master/calc/src/mechanics/util.ts). These references are development evidence; no new runtime dependencies or network calls.

## Data provenance

Base facts come from the companion site's local `libs/pokemon/data/pokemon.json` (1025 records: names, types, stats, introduction generation and image URLs). `src/type-chart.ts` retains its 18×18 Gen VI+ chart. Original source-byte hashes remain in `data/source-sha256.json`.

Additional snapshot: **PokeAPI**, fetched **2026-10-26**, covering default Pokémon IDs **1–1025** through `https://pokeapi.co/api/v2/pokemon/{id}` and `https://pokeapi.co/api/v2/pokemon-species/{id}`. Referenced `/api/v2/move/{id}` responses supply type and damage class. `data/pokeapi.json` stores only abilities, separate classification flags and a sorted set of learnable non-status move types per species, plus provenance. Response SHA-256 hashes are in `data/pokeapi-sha256.json`. No move names/individual learnsets/version details are bundled: this keeps the package small but cannot validate submitted moves, game legality or infer battle roles. Roles remain explicitly unknown.

Reproduce with Python 3 + `requests` installed, then `python3 scripts/snapshot-pokeapi.py [cache-directory]` (default cache `/tmp/random-pokemon-pokeapi-cache`). Three workers, 200ms pause per request, up to five attempts with exponential backoff, cached raw responses and fail-on-error; output files are written only after every required response succeeds. Keep the cache for raw-data audits; it is excluded from npm. Runtime never calls PokeAPI. No image files are fetched or bundled; artwork stays URL-only. Pokémon names/artwork remain the property of their respective owners. MIT covers this project's code; no ownership of third-party Pokémon material is asserted.

## Development and verification

```sh
npm ci
npm run build
npm run smoke
node scripts/damage-check.mjs # optional argument: path to a built 0.2.0 dist/index.js
npm pack --dry-run --json > pack-dry-run.json
node scripts/validate-package.mjs
```

Smoke invokes the MCP Inspector CLI for tools/list and each tool, plus the SDK client for successful calls to all five tools, invalid inputs and recovery, deterministic seeds, chart/data invariants and damage declarations. Lockfile pins the dependency tree. Inspector is a development dependency only.

## Manual release checklist (not executed)

1. Review the offline snapshot provenance, limitations and acceptance checks.
2. Check npm name ownership, run checks above; manually `npm login`, then `npm publish --access public` when ready.
3. Validate `server.json` against the [official Registry schema](https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json); after npm publication follow [official Registry publishing](https://github.com/modelcontextprotocol/registry/tree/main/docs) to verify `io.github.yuren-dev` ownership and publish with `mcp-publisher`. npm `mcpName` matches the manifest.
4. Manually submit/claim GitHub/package details on Glama and mcp.so after checking current submission requirements. No OAuth, registry publishing, directory claim or submission is performed by this repository's scripts.

License: [MIT](LICENSE).
