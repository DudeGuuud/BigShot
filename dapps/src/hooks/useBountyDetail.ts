import { useState, useEffect } from "react";
import { getObjectWithJson } from "@evefrontier/dapp-kit";
import { SUI_COIN_TYPE, EVE_COIN_TYPE } from "../constants";
import { OnChainBounty } from "./useBounties";
import { formatTokenAmount } from "../utils/formatters";
import { resolveCharacter } from "../utils/characterNameCache";

const THREAT_MAP: Record<number, "S" | "A" | "B" | "C" | "D"> = {
  4: "S",
  3: "A",
  2: "B",
  1: "C",
  0: "D",
};

/**
 * Fetches a single Bounty object by its on-chain object ID.
 * Uses shared character name cache for pilot name resolution.
 */
export function useBountyDetail(objectId: string) {
  const [bounty, setBounty]   = useState<OnChainBounty | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!objectId) {
      return;
    }

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const result = await getObjectWithJson(objectId);
        const obj    = result.data?.object?.asMoveObject;
        if (!obj) throw new Error("Object not found or not a Move object");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = obj.contents?.json as any;
        const typeRepr = (obj.contents?.type as any)?.repr ?? "";
        const isSui = typeRepr.includes("sui");
        const coinType = isSui ? SUI_COIN_TYPE : EVE_COIN_TYPE;

        const level = Number(json?.threat_level ?? 0);
        const expiryMs = Number(json?.expiry_timestamp_ms ?? 0);
        const rewardRaw = Number(json?.reward_pool?.value ?? json?.reward_pool ?? 0);

        // Resolve pilot name and Sui info via shared cache (single lightweight call)
        const targetId = String(json.target_character_id || "");
        let pilotAlias = `PILOT-${targetId.slice(-4)}`;
        let targetCharacterSuiId: string | undefined = targetId.startsWith("0x") ? targetId : undefined;
        try {
          const charInfo = await resolveCharacter(targetId);
          if (charInfo) {
            pilotAlias = charInfo.name || pilotAlias;
            targetCharacterSuiId = charInfo.suiObjectId;
          }
        } catch (e) {
          console.warn("Failed to resolve pilot details for detail view:", e);
        }

        setBounty({
          id: objectId,
          issuer: String(json?.issuer ?? ""),
          targetCharacterId: targetId,
          targetCharacterSuiId,
          rewardAmount: formatTokenAmount(rewardRaw),
          rewardRaw,
          coinType,
          asset: isSui ? "SUI" : "EVE",
          expiryTimestampMs: expiryMs,
          threatLevel: level,
          threatClass: THREAT_MAP[level] ?? "D",
          isClaimed: rewardRaw === 0,
          pilotAlias,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load bounty");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [objectId]);

  return { bounty, loading, error };
}
