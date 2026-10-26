# Acceptance — 2026-10-26

- GitHub API confirmed `yuren-dev/random-pokemon-mcp` public and empty before implementation.
- `npm run build`: passed.
- `npm run smoke`: passed. Inspector CLI tools/list returns exactly five tools; Inspector CLI successfully calls each tool. SDK checks meaningful outputs, unknown species, invalid types, empty teams, missing classification errors, damage invalid input, server recovery, reproducible seed, six unique filtered species, immunity and damage omission declarations.
- 1025 species JSON, 18×18 website type chart; original source SHA-256 retained. No Pokémon data fetched externally. Website checkout was never entered or edited.
- `npm pack --dry-run --json` and `node scripts/validate-package.mjs`: passed. Explicit file allowlist excludes images, secrets, node_modules and development scripts. Shebang present; build makes bin executable. Published-registry npx execution cannot be tested before manual publication; stdio bin is exercised locally by Inspector.
- `server.json` passes the downloaded official 2025-12-11 Registry schema using Ajv. No OAuth or Registry publication executed.
- **Not accepted / source-data blockers:** get_pokemon abilities, random_team legendary/mythical exclusion. Both authorized website JSON files were inspected; neither contains these fields. No invented classifications or abilities. The filter flags are exposed but false returns a readable error. True includes all species.
- **Limited acceptance:** analyze_team move coverage and roles are explicitly unknown; available evidence supports only theoretical species-STAB coverage, raw submitted move names and base-speed tiers. No reliable move metadata/learnsets exist in the permitted source. No role absence claims, scores or rankings.
- Simplified damage is an estimate, not cartridge-exact; omissions are declared in description and all outputs including schema errors.
- No npm login/publish, Glama claim or mcp.so submission performed. See README for manual release checklist.
