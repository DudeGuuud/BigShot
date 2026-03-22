import { useState, useEffect } from "react";
export { getObjectsByType } from "@evefrontier/dapp-kit";
import { getObjectsByType } from "@evefrontier/dapp-kit";
import {
  BIGSHOT_PACKAGE_ID,
  IS_CONTRACT_DEPLOYED,
  EVE_COIN_TYPE,
  SUI_COIN_TYPE,
} from "../constants";
import { formatTokenAmount } from "../utils/formatters";

export interface OnChainBounty {
  id: string;
  issuer: string;
  targetCharacterId: string;
  rewardAmount: string;
  coinType: string;
  asset: "SUI" | "EVE";
  expiryTimestampMs: number;
  threatLevel: number;
  threatClass: "S" | "A" | "B" | "C" | "D";
  rewardRaw: number;
  isClaimed: boolean;
  pilotAlias: string;
}

const THREAT_MAP: Record<number, "S" | "A" | "B" | "C" | "D"> = {
  4: "S",
  3: "A",
  2: "B",
  1: "C",
  0: "D",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBounty(id: string, json: any, coinType: string): OnChainBounty {
  const level = Number(json?.threat_level ?? 0);
  const expiryMs = Number(json?.expiry_timestamp_ms ?? 0);
  // In Version 2, reward_pool might be a direct string or nested under .value depending on provider
  const rewardRaw = Number(json?.reward_pool?.value ?? json?.reward_pool ?? 0);
  return {
    id,
    issuer: json?.issuer ?? "",
    targetCharacterId: String(json?.target_character_id ?? ""),
    rewardAmount: formatTokenAmount(rewardRaw),
    rewardRaw,
    coinType,
    asset: coinType.includes("sui") ? "SUI" : "EVE",
    expiryTimestampMs: expiryMs,
    threatLevel: level,
    threatClass: THREAT_MAP[level] ?? "D",
    isClaimed: rewardRaw === 0,
    pilotAlias: "UNKNOWN PILOT",
  };
}

export const WORLD_V1 = "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75";
export const WORLD_V2 = "0x33226d2eedda428eb7e1a56faf525bd5300f9394a5d61ffbbbcb3993d45a7145";

/**
 * Fetches all active Bounty objects of both SUI and EVE coin types from the chain.
 * Falls back to an empty array if the contract is not yet deployed.
 */
export function useBounties() {
  const [bounties, setBounties] = useState<OnChainBounty[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!IS_CONTRACT_DEPLOYED) {
      setLoading(false);
      return;
    }

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const eveType = `${BIGSHOT_PACKAGE_ID}::bigshot::Bounty<${EVE_COIN_TYPE}>`;
        const suiType = `${BIGSHOT_PACKAGE_ID}::bigshot::Bounty<${SUI_COIN_TYPE}>`;

        const [eveResult, suiResult] = await Promise.all([
          getObjectsByType(eveType),
          getObjectsByType(suiType),
        ]);

        const eveNodes = eveResult.data?.objects?.nodes ?? [];
        const suiNodes = suiResult.data?.objects?.nodes ?? [];

        const parsed: OnChainBounty[] = [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...eveNodes.map((n: any) =>
            parseBounty(n.address, n.asMoveObject?.contents?.json, EVE_COIN_TYPE)
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...suiNodes.map((n: any) =>
            parseBounty(n.address, n.asMoveObject?.contents?.json, SUI_COIN_TYPE)
          ),
        ];

        // Fetch pilot names (aliases) from both old and new world versions with pagination
        try {
          const charTypeNew = `${WORLD_V2}::character::Character`;
          const charTypeOld = `${WORLD_V1}::character::Character`;
          
          const fetchChars = async (type: string) => {
             const results: any[] = [];
             let hasNext = true;
             let cursor: string | null = null;
             // Limit to 4 pages (200 chars) for performance
             for (let i = 0; i < 4 && hasNext; i++) {
                const res: any = await getObjectsByType(type, cursor ? { after: cursor } : undefined);
                results.push(...(res.data?.objects?.nodes ?? []));
                hasNext = res.data?.objects?.pageInfo?.hasNextPage;
                cursor = res.data?.objects?.pageInfo?.endCursor;
             }
             return results;
          };

          const [nodesNew, nodesOld] = await Promise.all([
            fetchChars(charTypeNew),
            fetchChars(charTypeOld)
          ]);

          const charNodes = [...nodesNew, ...nodesOld];
          
          const nameMap: Record<string, string> = {};
          charNodes.forEach((node: any) => {
            const json = node.asMoveObject?.contents?.json;
            if (json) {
              const itemId = String(json.key?.item_id || json.key?.fields?.item_id || "");
              let name = "";
              if (json.metadata) {
                const m = Array.isArray(json.metadata) ? json.metadata[0] : json.metadata;
                name = m?.fields?.name || m?.name || "";
              }
              if (itemId && name) nameMap[itemId] = name;
            }
          });

          // Apply names to bounties
          parsed.forEach(b => {
             if (nameMap[b.targetCharacterId]) {
               b.pilotAlias = nameMap[b.targetCharacterId];
             } else {
               // Fallback: If no name found, show ID
               b.pilotAlias = `PILOT-${b.targetCharacterId.slice(-4)}`;
             }
          });
        } catch (e) {
          console.error("Failed to fetch pilot aliases:", e);
        }

        setBounties(parsed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch bounties");
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, []);

  return { bounties, loading, error };
}
