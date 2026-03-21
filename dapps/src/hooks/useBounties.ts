import { useState, useEffect } from "react";
import { getObjectsByType } from "@evefrontier/dapp-kit";
import {
  BIGSHOT_PACKAGE_ID,
  IS_CONTRACT_DEPLOYED,
  EVE_COIN_TYPE,
  SUI_COIN_TYPE,
} from "../constants";

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
  isClaimed: boolean;
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
  const rewardRaw = Number(json?.reward_pool?.value ?? 0);
  return {
    id,
    issuer: json?.issuer ?? "",
    targetCharacterId: String(json?.target_character_id ?? ""),
    rewardAmount: rewardRaw.toLocaleString(),
    coinType,
    asset: coinType.includes("sui") ? "SUI" : "EVE",
    expiryTimestampMs: expiryMs,
    threatLevel: level,
    threatClass: THREAT_MAP[level] ?? "D",
    isClaimed: rewardRaw === 0,
  };
}

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
