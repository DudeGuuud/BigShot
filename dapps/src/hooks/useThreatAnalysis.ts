import { useState, useCallback } from "react";
import { getObjectWithJson } from "@evefrontier/dapp-kit";
import { EVE_COIN_TYPE } from "../constants";
import { fetchEventsBatch, fetchBalanceAndObjects, UTOPIA_EVENT_TYPES } from "../utils/suiClient";

export interface TacticalReport {
  targetId: string;
  characterIdU64: string;
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

      if (!json || (!json.character_address && !json.character_id)) {
        throw new Error("Target Character ID not found or invalid on-chain.");
      }

      // If they passed PlayerProfile, fetch Character
      let charJsonToUse = json;
      if (json.character_id && !json.character_address) {
        const cRes = await getObjectWithJson(json.character_id);
        charJsonToUse = cRes?.data?.object?.asMoveObject?.contents?.json as any || json;
      }

      const walletAddress = charJsonToUse.character_address || "UNKNOWN";
      const tribeId = Number(charJsonToUse.tribe_id || 0);

      // Extract U64 from TenantItemId
      let charU64 = "0";
      if (charJsonToUse.key?.item_id) {
         charU64 = String(charJsonToUse.key.item_id);
      } else if (charJsonToUse.key?.fields?.item_id) {
         charU64 = String(charJsonToUse.key.fields.item_id);
      }

      // Extract Pilot Name from Metadata Option
      let pilotName = "UNKNOWN ALIAS";
      if (charJsonToUse.metadata) {
        const m = Array.isArray(charJsonToUse.metadata) ? charJsonToUse.metadata[0] : charJsonToUse.metadata;
        if (m) {
           pilotName = m.fields?.name || m.name || "UNKNOWN ALIAS";
        }
      }

      // 2. Combined GraphQL queries — balance + objects + killmail events
      const [{ balance, objects }, killmailEvents] = await Promise.all([
        // GraphQL: balance + owned objects in one request
        fetchBalanceAndObjects(walletAddress, EVE_COIN_TYPE, targetCharacterId),
        // GraphQL: killmail events
        fetchEventsBatch([UTOPIA_EVENT_TYPES.killmailCreated], 50),
      ]);

      // Parse Balance
      let eveBalance = 0;
      if (balance?.totalBalance) {
        eveBalance = Number(balance.totalBalance) / 1_000_000_000;
      }

      // Parse PvP Activity — match by killer_id.item_id / victim_id.item_id (TenantItemId)
      let recentKills = 0;
      let recentDeaths = 0;
      for (const ev of killmailEvents) {
        const kmJson = ev.parsedJson;
        if (!kmJson?.killer_id || !kmJson?.victim_id) continue;

        // Match by u64 item_id (TenantItemId) against character's u64 ID
        const killerId = String(kmJson.killer_id.item_id || "");
        const victimId = String(kmJson.victim_id.item_id || "");

        if (killerId === charU64) recentKills++;
        if (victimId === charU64) recentDeaths++;

        // Also match by Sui Object ID (targetCharacterId) if it's a hex address
        if (targetCharacterId.startsWith("0x")) {
          // For killmails, the character_id field is not present,
          // only killer_id/victim_id as TenantItemId, so u64 match is primary
        }
      }

      // Parse Smart Deployments & Infrastructure
      let logisticsActivity = 0;
      let assembliesDetected = 0;
      
      for (const obj of objects) {
        const typeStr = obj.type || "";
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
        score += 1;
      }

      // Territorial Control & Base Building
      if (logisticsActivity >= 2) score += 3;
      else if (logisticsActivity === 1) score += 1.5;

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
        characterIdU64: charU64,
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
