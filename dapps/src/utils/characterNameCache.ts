/**
 * Shared character name resolver with in-memory caching.
 * Fetches character names from Utopia V2 only (per project requirements).
 * Both useBounties and useBountyDetail share this cache to avoid duplicate fetches.
 */

import { getObjectsByType } from "@evefrontier/dapp-kit";
import { CHARACTER_TYPE } from "../constants";

// ─── Cache ───────────────────────────────────────────────────────────────────

let nameMap: Record<string, string> | null = null;
let fetchPromise: Promise<Record<string, string>> | null = null;

/**
 * Fetch all character names (Utopia V2 only) with pagination.
 * Results are cached for the entire session.
 * Returns a map of character item_id (u64 string) → pilot name.
 */
export async function getCharacterNameMap(): Promise<Record<string, string>> {
  // Return cached result
  if (nameMap) return nameMap;

  // Deduplicate concurrent requests
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const map: Record<string, string> = {};

    try {
      const results: any[] = [];
      let hasNext = true;
      let cursor: string | null = null;

      // Paginate up to 4 pages (200 characters max)
      for (let i = 0; i < 4 && hasNext; i++) {
        const res: any = await getObjectsByType(
          CHARACTER_TYPE,
          cursor ? { after: cursor } : undefined
        );
        const nodes = res.data?.objects?.nodes ?? [];
        results.push(...nodes);
        hasNext = res.data?.objects?.pageInfo?.hasNextPage ?? false;
        cursor = res.data?.objects?.pageInfo?.endCursor ?? null;
      }

      for (const node of results) {
        const json = node.asMoveObject?.contents?.json;
        if (!json) continue;

        const itemId = String(
          json.key?.item_id || json.key?.fields?.item_id || ""
        );
        let name = "";
        if (json.metadata) {
          const m = Array.isArray(json.metadata)
            ? json.metadata[0]
            : json.metadata;
          name = m?.fields?.name || m?.name || "";
        }
        if (itemId && name) {
          map[itemId] = name;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch character names:", e);
    }

    nameMap = map;
    fetchPromise = null;
    return map;
  })();

  return fetchPromise;
}

/**
 * Resolve a single character item_id to a pilot name.
 * Falls back to "PILOT-XXXX" if not found.
 */
export async function resolveCharacterName(
  characterItemId: string
): Promise<string> {
  const map = await getCharacterNameMap();
  return map[characterItemId] || `PILOT-${characterItemId.slice(-4)}`;
}

/**
 * Invalidate the cache (e.g., after a new character is created).
 */
export function invalidateCharacterCache() {
  nameMap = null;
  fetchPromise = null;
}
