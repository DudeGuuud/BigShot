import { useState, useCallback } from "react";
import { getObjectWithJson } from "@evefrontier/dapp-kit";
import { EVE_COIN_TYPE, KILLMAIL_REGISTRY_ID } from "../constants";

export interface TacticalReport {
  targetId: string;
  walletAddress: string;
  pilotName: string;
  tribeId: number;
  eveBalance: number;
  recentKills: number;
  recentDeaths: number;
  logisticsActivity: number;
  assembliesDetected: number;
  threatClass: "S" | "A" | "B" | "C" | "D";
  riskLevel: string;
  formattedReport: string;
}

export function useThreatAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<TacticalReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (targetCharacterId: string) => {
    if (!targetCharacterId) return null;
    setAnalyzing(true);
    setError(null);
    setReport(null);

    try {
      // 1. Fetch Character object from the blockchain
      const charResult = await getObjectWithJson(targetCharacterId);
      const charObj = charResult?.data?.object?.asMoveObject;
      const json = charObj?.contents?.json as any;

      if (!json || !json.character_address) {
        throw new Error("Target Character ID not found or invalid on-chain.");
      }

      const walletAddress = json.character_address;
      const tribeId = Number(json.tribe_id || 0);

      // Extract Pilot Name from Metadata Option
      let pilotName = "UNKNOWN ALIAS";
      if (json.metadata) {
        const m = Array.isArray(json.metadata) ? json.metadata[0] : json.metadata;
        if (m) {
           pilotName = m.fields?.name || m.name || "UNKNOWN ALIAS";
        }
      }

      // 2. Prepare Parallel On-Chain Queries
      
      // Query A: LUX Balance via RPC
      const rpcFetch = fetch("https://fullnode.testnet.sui.io:443", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "suix_getBalance",
          params: [walletAddress, EVE_COIN_TYPE]
        })
      }).then(res => res.json()).catch(() => null);

      // Query B: Recent 50 Killmails globally via GraphQL
      const killmailQuery = `
        query GetLastSeenKillmail($registryId: SuiAddress!) {
          object(address: $registryId) {
            dynamicFields(first: 50) {
              nodes {
                name { type { repr } json }
                value {
                  ... on MoveValue { type { repr } json }
                  ... on MoveObject { contents { type { repr } json } }
                }
              }
            }
          }
        }
      `;
      const gqlFetch = fetch(import.meta.env.VITE_SUI_GRAPHQL_ENDPOINT || "https://graphql.testnet.sui.io/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: killmailQuery, variables: { registryId: KILLMAIL_REGISTRY_ID } }),
      }).then(res => res.json()).catch(() => null);

      // Query C: Character-Owned Objects (Smart Assemblies, SSUs, Turrets, etc.)
      const ownedObjectsFetch = fetch("https://fullnode.testnet.sui.io:443", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "suix_getOwnedObjects",
          params: [
            targetCharacterId, // The character itself is the owner of OwnerCaps
            { options: { showType: true } },
            null,
            50 
          ]
        })
      }).then(res => res.json()).catch(() => null);

      const [rpcData, kmData, ownedData] = await Promise.all([rpcFetch, gqlFetch, ownedObjectsFetch]);

      // Parse Balance
      let eveBalance = 0;
      if (rpcData?.result?.totalBalance) {
        // 9 decimals for EVE Coin (standard Sui token decimal)
        eveBalance = Number(rpcData.result.totalBalance) / 1_000_000_000;
      }

      // Parse PvP Activity (Kills / Deaths)
      let recentKills = 0;
      let recentDeaths = 0;
      const kmNodes = kmData?.data?.object?.dynamicFields?.nodes || [];
      for (const node of kmNodes) {
        const kmJson = node.value?.contents?.json || node.value?.json;
        if (!kmJson || !kmJson.killer_id || !kmJson.victim_id) continue;
        
        if (kmJson.killer_id === targetCharacterId) recentKills++;
        if (kmJson.victim_id === targetCharacterId) recentDeaths++;
      }

      // Parse Smart Deployments & Infrastructure
      // We look for OwnerCap<...::turret::Turret>, OwnerCap<...::storage_unit::StorageUnit>, etc.
      let logisticsActivity = 0; // Represents Storage Units (SSUs)
      let assembliesDetected = 0; // Represents Turrets, Gates, Power Nodes
      
      const objects = ownedData?.result?.data || [];
      for (const obj of objects) {
        const typeStr = obj.data?.type || "";
        if (typeStr.includes("::storage_unit::StorageUnit")) {
          logisticsActivity++;
        }
        if (typeStr.includes("::turret::Turret") || typeStr.includes("::gate::Gate") || typeStr.includes("::network_node::NetworkNode")) {
          assembliesDetected++;
        }
      }

      // 3. Compute Multidimensional Threat Score
      let score = 0;
      
      // Asset weight (EVE)
      if (eveBalance > 50000) score += 5;
      else if (eveBalance > 10000) score += 4;
      else if (eveBalance > 5000) score += 3;
      else if (eveBalance > 1000) score += 2;
      else if (eveBalance > 0) score += 1;

      // PvP Combat Weight
      score += (recentKills * 0.8);
      
      const totalEngagements = recentKills + recentDeaths;
      if (totalEngagements > 0) {
        score += 1; // Base active combatant bonus
      }

      // Territorial Control & Base Building
      // SSUs indicate massive logistics
      if (logisticsActivity >= 2) score += 3;
      else if (logisticsActivity === 1) score += 1.5;

      // Turrets and Gates are extreme threat multipliers
      if (assembliesDetected > 0) {
        score += (assembliesDetected * 2.0);
      }

      let threatClass: "S" | "A" | "B" | "C" | "D" = "D";
      let riskLevel = "MINIMAL";

      if (score >= 8.0) { threatClass = "S"; riskLevel = "EXTREME"; }
      else if (score >= 5.5) { threatClass = "A"; riskLevel = "SEVERE"; }
      else if (score >= 3.5) { threatClass = "B"; riskLevel = "HIGH"; }
      else if (score >= 1.5) { threatClass = "C"; riskLevel = "MODERATE"; }
      else { threatClass = "D"; riskLevel = "MINIMAL"; }

      const finalScoreMath = Math.min(score, 10.0);

      const formattedReport = `[TACTICAL EVALUATION: ON-CHAIN SCAN]
-----------------------------------------
TARGET ID:  ${targetCharacterId}
ALIAS:      ${pilotName}
TRIBE ID:   ${tribeId}
-----------------------------------------
METRICS:
  CONFIRMED ASSETS: ${eveBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} EVE
  RECENT KILLS:     ${recentKills}
  RECENT DEATHS:    ${recentDeaths}
  SSU DEPLOYMENTS:  ${logisticsActivity > 0 ? logisticsActivity + " Storage Units" : "None"}
  DEFENSE MATRIX:   ${assembliesDetected > 0 ? assembliesDetected + " Active Turrets/Gates" : "None detected"}
  ESTIMATED SCORE:  ${finalScoreMath.toFixed(1)}/10.0

RESULT:
  THREAT CLASS:  ${threatClass}
  RISK LEVEL:    ${riskLevel}
-----------------------------------------
RECOMMENDATION:
${threatClass === "S" || threatClass === "A" ? "🎯 HIGH VALUE TARGET. Recommend immediate interdiction." : "Standard engagement protocols apply."}`;

      const finalReportObj: TacticalReport = {
        targetId: targetCharacterId,
        walletAddress,
        pilotName,
        tribeId,
        eveBalance,
        recentKills,
        recentDeaths,
        logisticsActivity,
        assembliesDetected,
        threatClass,
        riskLevel,
        formattedReport
      };

      setReport(finalReportObj);
      return finalReportObj;
    } catch (e: any) {
      setError(e.message || "Failed to analyze target");
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return { analyze, analyzing, report, error };
}
