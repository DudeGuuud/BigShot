import { useState, useCallback } from "react";
import { getOwnedObjectsByType } from "@evefrontier/dapp-kit";
import { WORLD_PACKAGE_ID } from "../constants";

const PLAYER_PROFILE_TYPE = `${WORLD_PACKAGE_ID}::character::PlayerProfile`;

/**
 * Hook to resolve a wallet address to an EVE Frontier character_id.
 *
 * Queries the wallet's `PlayerProfile` object and returns the numeric character_id.
 *
 * Usage:
 *   const { resolve, characterId, loading, error } = useCharacterId();
 *   await resolve(walletAddress);
 */
export function useCharacterId() {
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const resolve = useCallback(async (walletAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOwnedObjectsByType(walletAddress, PLAYER_PROFILE_TYPE);
      const nodes  = result.data?.address?.objects?.nodes ?? [];
      if (nodes.length === 0) {
        throw new Error("No PlayerProfile found. Have you created a character in EVE Frontier?");
      }
      // PlayerProfile's `character_id` field is at the top level of JSON contents
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = nodes[0] as any;
      const cid = profile?.asMoveObject?.contents?.json?.character_id?.toString();
      if (!cid) throw new Error("Could not read character_id from PlayerProfile.");
      setCharacterId(cid);
      return cid;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to resolve character ID";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { resolve, characterId, loading, error };
}
