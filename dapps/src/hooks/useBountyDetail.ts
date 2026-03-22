import { useState, useEffect } from "react";
import { getObjectWithJson } from "@evefrontier/dapp-kit";
import { SUI_COIN_TYPE, EVE_COIN_TYPE } from "../constants";
import { OnChainBounty, getObjectsByType, WORLD_V1, WORLD_V2 } from "./useBounties";
import { formatTokenAmount } from "../utils/formatters";

const THREAT_MAP: Record<number, "S" | "A" | "B" | "C" | "D"> = {
  4: "S",
  3: "A",
  2: "B",
  1: "C",
  0: "D",
};

/**
 * Fetches a single Bounty object by its on-chain object ID.
 */
export function useBountyDetail(objectId: string) {
  const [bounty, setBounty]   = useState<OnChainBounty | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!objectId) {
      return;
    }

    async function fetch() {
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

        let pilotAlias = `PILOT-${String(json.target_character_id || "").slice(-4)}`;
        try {
           const targetId = String(json.target_character_id || "");
           const charTypeNew = `${WORLD_V2}::character::Character`;
           const charTypeOld = `${WORLD_V1}::character::Character`;
           
           const fetchChars = async (type: string) => {
             const results: any[] = [];
             let hasNext = true; let cursor = null;
             for (let i = 0; i < 4 && hasNext; i++) {
                const res: any = await getObjectsByType(type, cursor ? { after: cursor } : undefined);
                results.push(...(res.data?.objects?.nodes ?? []));
                hasNext = res.data?.objects?.pageInfo?.hasNextPage;
                cursor = res.data?.objects?.pageInfo?.endCursor;
             }
             return results;
           };

           const [nodesNew, nodesOld] = await Promise.all([fetchChars(charTypeNew), fetchChars(charTypeOld)]);
           const charNodes = [...nodesNew, ...nodesOld];
           
           const found = charNodes.find((node: any) => {
              const cj = node.asMoveObject?.contents?.json;
              return String(cj?.key?.item_id || cj?.key?.fields?.item_id || "") === targetId;
           });

           if (found && found.asMoveObject?.contents?.json) {
              const cj = found.asMoveObject?.contents?.json;
              const m = Array.isArray(cj.metadata) ? cj.metadata[0] : cj.metadata;
              const nameValue = m?.fields?.name || m?.name;
              if (nameValue) pilotAlias = nameValue;
           }
        } catch (e) {
           console.warn("Failed to resolve pilot alias for detail view:", e);
        }

        setBounty({
          id: objectId,
          issuer: String(json?.issuer ?? ""),
          targetCharacterId: String(json?.target_character_id ?? ""),
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

    fetch();
  }, [objectId]);

  return { bounty, loading, error };
}
