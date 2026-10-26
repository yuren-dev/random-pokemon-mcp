/**
 * Pokémon type effectiveness chart (Gen VI+, 18 types).
 * Only non-1x matchups are listed; anything missing is 1x.
 */
export const TYPES_18 = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type ChartType = (typeof TYPES_18)[number];

type Chart = Record<ChartType, Partial<Record<ChartType, number>>>;

const CHART: Chart = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

/** Effectiveness of an attacking type against a single defending type. */
export function effectiveness(attacking: ChartType, defending: ChartType): number {
  return CHART[attacking][defending] ?? 1;
}

/**
 * Effectiveness of an attacking type against a dual-type defender.
 * Multiplies both matchups (e.g. 2 x 2 = 4, 2 x 0.5 = 1, anything x 0 = 0).
 */
export function dualEffectiveness(
  attacking: ChartType,
  defending: [ChartType] | [ChartType, ChartType],
): number {
  return defending.reduce((acc, t) => acc * effectiveness(attacking, t), 1);
}

/** Group defending types by effectiveness against the given attacking type. */
export function attackMatchups(attacking: ChartType): Record<string, ChartType[]> {
  const groups: Record<string, ChartType[]> = { "4": [], "2": [], "1": [], "0.5": [], "0.25": [], "0": [] };
  for (const defending of TYPES_18) {
    const mult = effectiveness(attacking, defending);
    groups[String(mult)].push(defending);
  }
  return groups;
}

/** Group attacking types by effectiveness against the given defending type(s). */
export function defenseMatchups(
  defending: [ChartType] | [ChartType, ChartType],
): Record<string, ChartType[]> {
  const groups: Record<string, ChartType[]> = { "4": [], "2": [], "1": [], "0.5": [], "0.25": [], "0": [] };
  for (const attacking of TYPES_18) {
    const mult = dualEffectiveness(attacking, defending);
    const key = String(mult);
    if (key in groups) groups[key].push(attacking);
    else groups["1"].push(attacking);
  }
  return groups;
}
