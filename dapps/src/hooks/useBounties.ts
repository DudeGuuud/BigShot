import { useState, useEffect } from "react";
import { getObjectsByType } from "@evefrontier/dapp-kit";
import {
  BIGSHOT_PACKAGE_ID,
  IS_CONTRACT_DEPLOYED,
  EVE_COIN_TYPE,
  SUI_COIN_TYPE,
} from "../constants";
import { formatTokenAmount } from "../utils/formatters";
import { getCharacterMap } from "../utils/characterNameCache";

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
  targetCharacterSuiId?: string;
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

/**
 * Fetches all active Bounty objects of both SUI and EVE coin types from the chain.
 * Uses shared character name cache for pilot resolution (Utopia V2 only).
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

    async function fetchBounties() {
      setLoading(true);
      setError(null);
      try {
        const eveType = `${BIGSHOT_PACKAGE_ID}::bigshot::Bounty<${EVE_COIN_TYPE}>`;
        const suiType = `${BIGSHOT_PACKAGE_ID}::bigshot::Bounty<${SUI_COIN_TYPE}>`;

        // Fetch bounties and character map in parallel
        const [eveResult, suiResult, charMap] = await Promise.all([
          getObjectsByType(eveType),
          getObjectsByType(suiType),
          getCharacterMap(),
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

        // Apply pilot names and Sui Object IDs from shared cache
        parsed.forEach(b => {
           const charInfo = charMap[b.targetCharacterId];
           if (charInfo) {
             b.pilotAlias = charInfo.name || `PILOT-${b.targetCharacterId.slice(-4)}`;
             b.targetCharacterSuiId = charInfo.suiObjectId;
           } else {
             b.pilotAlias = `PILOT-${b.targetCharacterId.slice(-4)}`;
             b.targetCharacterSuiId = b.targetCharacterId.startsWith("0x") ? b.targetCharacterId : undefined;
           }
        });

        setBounties(parsed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch bounties");
      } finally {
        setLoading(false);
      }
    }

    fetchBounties();
  }, []);

  return { bounties, loading, error };
}
