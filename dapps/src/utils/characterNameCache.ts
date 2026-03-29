/**
 * Shared character name resolver with in-memory caching.
 * Fetches character data from Utopia V2 only (per project requirements).
 * Both useBounties, useBountyDetail, and useLastSeen share this cache.
 */

import { getObjectsByType } from "@evefrontier/dapp-kit";
import { CHARACTER_TYPE } from "../constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CharacterInfo {
  /** u64 item_id from TenantItemId */
  itemId: string;
  /** Sui Object ID of the Character */
  suiObjectId: string;
  /** Player wallet address (character_address field) */
  walletAddress: string;
  /** Pilot display name */
  name: string;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

/** Map of item_id → CharacterInfo */
let characterMap: Record<string, CharacterInfo> | null = null;
let fetchPromise: Promise<Record<string, CharacterInfo>> | null = null;

/**
 * Fetch all character data (Utopia V2 only) with pagination.
 * Results are cached for the entire session.
 * Returns a map of character item_id (u64 string) → CharacterInfo.
 */
export async function getCharacterMap(): Promise<Record<string, CharacterInfo>> {
  if (characterMap) return characterMap;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const map: Record<string, CharacterInfo> = {};

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
        const suiObjectId = node.address || "";
        const walletAddress = json.character_address || "";

        let name = "";
        if (json.metadata) {
          const m = Array.isArray(json.metadata)
            ? json.metadata[0]
            : json.metadata;
          name = m?.fields?.name || m?.name || "";
        }

        if (itemId) {
          map[itemId] = { itemId, suiObjectId, walletAddress, name };
        }
      }
    } catch (e) {
      console.warn("Failed to fetch character data:", e);
    }

    characterMap = map;
    fetchPromise = null;
    return map;
  })();

  return fetchPromise;
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

/**
 * Get the name map (item_id → name string) for backward compatibility.
 */
export async function getCharacterNameMap(): Promise<Record<string, string>> {
  const map = await getCharacterMap();
  const nameMap: Record<string, string> = {};
  for (const [id, info] of Object.entries(map)) {
    nameMap[id] = info.name || `PILOT-${id.slice(-4)}`;
  }
  return nameMap;
}

/**
 * Resolve any character identifier (u64 item_id OR Sui Object ID hex)
 * to full CharacterInfo.
 * 
 * - If input looks like "2112000175" → lookup by item_id (primary key)
 * - If input looks like "0x07ca93..." → lookup by suiObjectId (reverse search)
 */
export async function resolveCharacter(
  characterId: string
): Promise<CharacterInfo | null> {
  const map = await getCharacterMap();

  // Direct lookup by item_id
  if (map[characterId]) {
    return map[characterId];
  }

  // Reverse lookup by Sui Object ID
  if (characterId.startsWith("0x")) {
    const normalizedId = characterId.toLowerCase();
    for (const info of Object.values(map)) {
      if (info.suiObjectId.toLowerCase() === normalizedId) {
        return info;
      }
    }
  }

  return null;
}

/**
 * Resolve a single character to a pilot name.
 * Accepts both u64 item_id and Sui Object ID.
 */
export async function resolveCharacterName(
  characterId: string
): Promise<string> {
  const info = await resolveCharacter(characterId);
  return info?.name || `PILOT-${characterId.slice(-4)}`;
}

/**
 * Resolve a character to their wallet address.
 * Accepts both u64 item_id and Sui Object ID.
 */
export async function resolveWalletAddress(
  characterId: string
): Promise<string | null> {
  const info = await resolveCharacter(characterId);
  return info?.walletAddress || null;
}

/**
 * Resolve a character to their u64 item_id.
 * Accepts both u64 item_id and Sui Object ID.
 * This is the canonical ID used in killmail events.
 */
export async function resolveCharacterItemId(
  characterId: string
): Promise<string | null> {
  // If it's already a plain number string, return as-is
  if (characterId && !characterId.startsWith("0x")) {
    return characterId;
  }
  const info = await resolveCharacter(characterId);
  return info?.itemId || null;
}

/**
 * Invalidate the cache.
 */
export function invalidateCharacterCache() {
  characterMap = null;
  fetchPromise = null;
}

