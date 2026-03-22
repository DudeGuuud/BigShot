import systemsStillness from "../data/systems_stillness.json";
import systemsUtopia from "../data/systems_utopia.json";

export interface StarSystem {
  id: number;
  name: string;
  constellationId: number;
  regionId: number;
  location: {
    x: number;
    y: number;
    z: number;
  };
}

// Map for quick lookup
const stillnessMap = new Map<number, StarSystem>(
  (systemsStillness as StarSystem[]).map((s) => [s.id, s])
);

const utopiaMap = new Map<number, StarSystem>(
  (systemsUtopia as StarSystem[]).map((s) => [s.id, s])
);

/**
 * Get star system info by ID.
 * Defaults to Utopia as requested.
 */
export function getStarSystem(id: number | string, world: 'stillness' | 'utopia' = 'utopia'): StarSystem | undefined {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  const map = world === 'stillness' ? stillnessMap : utopiaMap;
  return map.get(numericId);
}

/**
 * Get human-readable name for a star system.
 */
export function getStarSystemName(id: number | string, world: 'stillness' | 'utopia' = 'utopia'): string {
  const system = getStarSystem(id, world);
  return system ? system.name : `System ${id}`;
}
