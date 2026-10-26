# random-pokemon-mcp

Offline TypeScript MCP server using `@modelcontextprotocol/sdk` and stdio. Node.js >=20. No backend, keys, telemetry or runtime API requests. Companion website: https://random-pokemon-generator.org

**0.1.0 has known data gaps:** abilities, legendary/mythical classification and move metadata are absent from the authorized source. Abilities return `null`; excluding legendary/mythical species returns an explicit error. Team offense is theoretical STAB type coverage, not submitted-move coverage. These features are not claimed complete. National Dex 1–1025, bundled English species names, default forms only. Generation filters mean introduction generation; all matchups use Gen VI+ types.

## Install and configure

After the package is manually published, run `npx -y random-pokemon-mcp@0.1.0`. Before publication use `npm ci && npm run build`, then configure `node /absolute/path/random-pokemon-mcp/dist/index.js`.

Claude Code:

```sh
claude mcp add random-pokemon -- npx -y random-pokemon-mcp@0.1.0
```

Cursor (`.cursor/mcp.json`) and Claude Desktop (`claude_desktop_config.json`):

```json
{"mcpServers":{"random-pokemon":{"command":"npx","args":["-y","random-pokemon-mcp@0.1.0"]}}}
```

VS Code (`.vscode/mcp.json`):

```json
{"servers":{"random-pokemon":{"type":"stdio","command":"npx","args":["-y","random-pokemon-mcp@0.1.0"]}}}
```

On Windows use `npx.cmd` if required by the client. stdout contains MCP protocol only.

## Exactly five tools

| Tool | Input and behavior |
|---|---|
| `get_pokemon` | `pokemon`: English name or numeric National Dex ID. Types, base stats, generation, URL-only artwork and explicit missing abilities. |
| `get_type_effectiveness` | Optional `attacking` and/or `defending` (1–2 distinct lowercase English types); at least one required. Attack groups, defense groups and product when both supplied. |
| `random_team` | `seed` string (default `random-pokemon`), optional `generations` 1–9 and any-matching `types`; six distinct species, per-member defensive groups and exact 2x/4x team counts. `includeLegendary` and `includeMythical` default true; false returns missing-classification error. |
| `analyze_team` | `text`: 1–6 Showdown sets separated by blank lines, including nicknames. Defensive groups, team counts, theoretical species-STAB coverage against single types, descending base-speed tiers and explicit unknown-role evidence. Submitted moves are echoed but cannot be typed or legality checked. No scores or rankings. EVs, IVs, level, nature, items and abilities in text are not simulated. |
| `calc_damage` | Required `attacker`, `defender`, `moveType`, `power` (1–300), `category` (`physical`/`special`). Optional `level` (default 50), `attack`/`defense` objects (`iv` 31, `ev` 0, `nature` neutral/boosted/hindered, `stage` 0), `hpIV` 31, `hpEV` 0, `currentHP` full. Simplified regular base-damage formula, STAB and typing, 85–100% rolls; min/max HP and percentages, possible/guaranteed OHKO thresholds. User supplies move facts; no move database or EV-total legality checking. |

Damage description and every success/error declare **未计入项：天气/场地/道具/特性/太晶、暴击、烧伤、墙、双打修正、特殊招式机制及逐步定点舍入**. Estimates can differ from cartridge mechanics; this is not a battle simulator. Immunities yield zero damage. Shedinja's base HP rule is handled. No TCG, GO or Nuzlocke scope.

## Data provenance

Copied only factual data from the companion site's local `libs/pokemon/data/pokemon.json` (1025 records; names, types, base stats, generation and image URLs). `src/type-chart.ts` is copied verbatim from `libs/pokemon/type-chart.ts` (18×18 Gen VI+ matchups). `pokemon-details.json` was inspected for missing abilities/classification/moves and contains none; it is not bundled. Original source-byte SHA-256 hashes are in `data/source-sha256.json`; the packaged Pokémon JSON is compacted without changing records. Snapshot: 2026-10-26. No external Pokémon data was fetched. Sprite/artwork URLs retain upstream PokeAPI references; no images are bundled or downloaded. Pokémon names/artwork remain the property of their respective owners. MIT covers this project's code; no ownership of third-party Pokémon material is asserted.

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

1. Resolve missing offline ability/classification/move evidence before claiming full feature acceptance.
2. Check npm name ownership, run checks above; manually `npm login`, then `npm publish --access public` when ready.
3. Validate `server.json` against the [official Registry schema](https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json); after npm publication follow [official Registry publishing](https://github.com/modelcontextprotocol/registry/tree/main/docs) to verify `io.github.yuren-dev` ownership and publish with `mcp-publisher`. npm `mcpName` matches the manifest.
4. Manually submit/claim GitHub/package details on Glama and mcp.so after checking current submission requirements. No OAuth, registry publishing, directory claim or submission is performed by this repository's scripts.

License: [MIT](LICENSE).
