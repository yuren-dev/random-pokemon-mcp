# random-pokemon-mcp

Offline TypeScript MCP server using `@modelcontextprotocol/sdk` and stdio. Node.js >=20. No backend, keys, telemetry or runtime API requests. Companion website: https://random-pokemon-generator.org

**0.2.0 changelog:** added real abilities (including hidden flags), independent legendary/mythical filtering, and learnable damaging-move type coverage from an offline PokeAPI snapshot. National Dex 1–1025, bundled English names, default forms only. Generation filters mean introduction generation; matchups use Gen VI+ types.

## 两种使用方式，让用户自己选

- **本地版（stdio）**：使用下方 `npx -y random-pokemon-mcp@0.2.0` 安装配置；数据随包离线提供，无需 API 密钥。
- **托管版（网站 Worker）**：支持远程 MCP 的客户端可使用 `https://random-pokemon-generator.org/api/mcp`，无需本地安装。托管服务独立开发、部署与更新，功能和数据版本可能与本地版不同。**托管版即将上线，部署完成后可用。**

## Install and configure

After the package is manually published, run `npx -y random-pokemon-mcp@0.2.0`. Before publication use `npm ci && npm run build`, then configure `node /absolute/path/random-pokemon-mcp/dist/index.js`.

Claude Code:

```sh
claude mcp add random-pokemon -- npx -y random-pokemon-mcp@0.2.0
```

Cursor (`.cursor/mcp.json`) and Claude Desktop (`claude_desktop_config.json`):

```json
{"mcpServers":{"random-pokemon":{"command":"npx","args":["-y","random-pokemon-mcp@0.2.0"]}}}
```

VS Code (`.vscode/mcp.json`):

```json
{"servers":{"random-pokemon":{"type":"stdio","command":"npx","args":["-y","random-pokemon-mcp@0.2.0"]}}}
```

On Windows use `npx.cmd` if required by the client. stdout contains MCP protocol only.

## Exactly five tools

| Tool | Input and behavior |
|---|---|
| `get_pokemon` | `pokemon`: English name or numeric National Dex ID. Types, base stats, generation, URL-only artwork, real abilities with `is_hidden`/`slot`, and `is_legendary`/`is_mythical`. |
| `get_type_effectiveness` | Optional `attacking` and/or `defending` (1–2 distinct lowercase English types); at least one required. Attack groups, defense groups and product when both supplied. |
| `random_team` | `seed` string (default `random-pokemon`), optional `generations` 1–9 and any-matching `types`; six distinct species, per-member defensive groups and exact 2x/4x team counts. `includeLegendary` and `includeMythical` default true; false independently excludes that category. Existing parameter names/defaults remain compatible; false now succeeds instead of returning the 0.1.0 missing-data error. Unlike the website’s combined legendary/mythical set, these are separate PokeAPI classifications; disabling legendary alone still permits mythical species and vice versa. |
| `analyze_team` | `text`: 1–6 Showdown sets separated by blank lines, including nicknames. Defensive groups, team counts, learnable damaging-move type coverage against single types, descending base-speed tiers and explicit unknown-role evidence. Submitted moves are echoed but are not used to calculate coverage or legality checked. Coverage unions every non-status move in the default form’s PokeAPI learnset across all version groups. It describes potential options, not a simultaneous four-move set; it does not guarantee availability in a particular game, generation or format. Dynamic move-type mechanics are not modeled. No scores or rankings. EVs, IVs, level, nature, items and abilities in text are not simulated. |
| `calc_damage` | Required `attacker`, `defender`, `moveType`, `power` (1–300), `category` (`physical`/`special`). Optional `level` (default 50), `attack`/`defense` objects (`iv` 31, `ev` 0, `nature` neutral/boosted/hindered, `stage` 0), `hpIV` 31, `hpEV` 0, `currentHP` full. Simplified regular base-damage formula, STAB and typing, 85–100% rolls; min/max HP and percentages, possible/guaranteed OHKO thresholds. User supplies move facts; no move database or EV-total legality checking. |

Damage description and every success/error declare **未计入项：天气/场地/道具/特性/太晶、暴击、烧伤、墙、双打修正、特殊招式机制及逐步定点舍入**. Estimates can differ from cartridge mechanics; this is not a battle simulator. Immunities yield zero damage. Shedinja's base HP rule is handled. No TCG, GO or Nuzlocke scope.

## Data provenance

Base facts come from the companion site's local `libs/pokemon/data/pokemon.json` (1025 records: names, types, stats, introduction generation and image URLs). `src/type-chart.ts` retains its 18×18 Gen VI+ chart. Original source-byte hashes remain in `data/source-sha256.json`.

Additional snapshot: **PokeAPI**, fetched **2026-10-26**, covering default Pokémon IDs **1–1025** through `https://pokeapi.co/api/v2/pokemon/{id}` and `https://pokeapi.co/api/v2/pokemon-species/{id}`. Referenced `/api/v2/move/{id}` responses supply type and damage class. `data/pokeapi.json` stores only abilities, separate classification flags and a sorted set of learnable non-status move types per species, plus provenance. Response SHA-256 hashes are in `data/pokeapi-sha256.json`. No move names/individual learnsets/version details are bundled: this keeps the package small but cannot validate submitted moves, game legality or infer battle roles. Roles remain explicitly unknown.

Reproduce with Python 3 + `requests` installed, then `python3 scripts/snapshot-pokeapi.py [cache-directory]` (default cache `/tmp/random-pokemon-pokeapi-cache`). Three workers, 200ms pause per request, up to five attempts with exponential backoff, cached raw responses and fail-on-error; output files are written only after every required response succeeds. Keep the cache for raw-data audits; it is excluded from npm. Runtime never calls PokeAPI. No image files are fetched or bundled; artwork stays URL-only. Pokémon names/artwork remain the property of their respective owners. MIT covers this project's code; no ownership of third-party Pokémon material is asserted.

## Development and verification

```sh
npm ci
npm run build
npm run smoke
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
