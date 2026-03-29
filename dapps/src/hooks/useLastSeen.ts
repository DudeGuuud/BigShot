/**
 * useLastSeen — Tactical Timeline hook.
 *
 * Fetches on-chain activity for a specific target character:
 * - Jump/Deposit/Withdraw: server-side filtered by sender=walletAddress
 * - Killmail: client-side filtered by character item_id (small limit)
 * All combined in 1 GraphQL request.
 */

import { useState, useEffect } from "react";
import { fetchTargetedEvents } from "../utils/suiClient";
import { resolveWalletAddress, resolveCharacterItemId } from "../utils/characterNameCache";
import { getStarSystemName } from "../utils/systems";

export type TimelineEvent = {
  id: string;
  type: "Killmail" | "Jump" | "Deposit" | "Withdraw" | "Unknown";
  locationId: string;
  locationName: string;
  timestamp: number;
  txDigest: string;
  role?: "killer" | "victim" | "traveler" | "depositor" | "withdrawer";
  detail?: string;
};

export function useLastSeen(targetCharacterId: string) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetCharacterId) {
      setTimeline([]);
      return;
    }

    let cancelled = false;

    async function fetchTimeline() {
      setLoading(true);
      setError(null);
      try {
        // Resolve character ID to canonical formats:
        // - u64 item_id (for killmail matching)
        // - wallet address (for sender-based server-side filtering)
        const [itemId, walletAddress] = await Promise.all([
          resolveCharacterItemId(targetCharacterId),
          resolveWalletAddress(targetCharacterId),
        ]);

        const effectiveItemId = itemId || targetCharacterId;

        // Single GraphQL request with targeted filters
        const events = await fetchTargetedEvents(
          walletAddress,
          effectiveItemId,
          25
        );

        if (cancelled) return;

        const compiled: TimelineEvent[] = [];

        for (const ev of events) {
          const json = ev.parsedJson;

          // ── KillmailCreatedEvent ──
          if (ev.type.includes("::killmail::KillmailCreatedEvent")) {
            const isKiller = String(json.killer_id?.item_id || "") === effectiveItemId;
            const isVictim = String(json.victim_id?.item_id || "") === effectiveItemId;
            if (!isKiller && !isVictim) continue;

            const solarSystemId = String(json.solar_system_id?.item_id || "");
            compiled.push({
              id: `km-${ev.txDigest}-${ev.eventSeq}`,
              type: "Killmail",
              locationId: solarSystemId,
              locationName: getStarSystemName(solarSystemId),
              timestamp: Number(json.kill_timestamp || 0) * 1000,
              txDigest: ev.txDigest,
              role: isKiller ? "killer" : "victim",
              detail: isKiller
                ? `Killed ${json.victim_id?.item_id || "unknown"}`
                : `Killed by ${json.killer_id?.item_id || "unknown"}`,
            });
            continue;
          }

          // ── JumpEvent (already server-filtered by sender) ──
          if (ev.type.includes("::gate::JumpEvent")) {
            const destGateId = json.destination_gate_id || "";
            const destGateItemId = String(json.destination_gate_key?.item_id || "");
            const srcGateItemId = String(json.source_gate_key?.item_id || "");

            compiled.push({
              id: `jump-${ev.txDigest}-${ev.eventSeq}`,
              type: "Jump",
              locationId: destGateId,
              locationName: destGateId
                ? `Gate ${destGateId.slice(0, 8)}…`
                : "Unknown Gate",
              timestamp: Number(ev.timestampMs || 0),
              txDigest: ev.txDigest,
              role: "traveler",
              detail: `From gate ${srcGateItemId} → ${destGateItemId}`,
            });
            continue;
          }

          // ── ItemDepositedEvent (already server-filtered by sender) ──
          if (ev.type.includes("::inventory::ItemDepositedEvent")) {
            const assemblyId = json.assembly_id || "";
            const assemblyItemId = String(json.assembly_key?.item_id || "");

            compiled.push({
              id: `dep-${ev.txDigest}-${ev.eventSeq}`,
              type: "Deposit",
              locationId: assemblyId,
              locationName: assemblyId
                ? `SSU ${assemblyId.slice(0, 8)}…`
                : "Unknown SSU",
              timestamp: Number(ev.timestampMs || 0),
              txDigest: ev.txDigest,
              role: "depositor",
              detail: `Deposited ${json.quantity || "?"} items (type ${json.type_id || "?"}) at assembly ${assemblyItemId}`,
            });
            continue;
          }

          // ── ItemWithdrawnEvent (already server-filtered by sender) ──
          if (ev.type.includes("::inventory::ItemWithdrawnEvent")) {
            const assemblyId = json.assembly_id || "";
            const assemblyItemId = String(json.assembly_key?.item_id || "");

            compiled.push({
              id: `wd-${ev.txDigest}-${ev.eventSeq}`,
              type: "Withdraw",
              locationId: assemblyId,
              locationName: assemblyId
                ? `SSU ${assemblyId.slice(0, 8)}…`
                : "Unknown SSU",
              timestamp: Number(ev.timestampMs || 0),
              txDigest: ev.txDigest,
              role: "withdrawer",
              detail: `Withdrew ${json.quantity || "?"} items (type ${json.type_id || "?"}) from assembly ${assemblyItemId}`,
            });
            continue;
          }
        }

        compiled.sort((a, b) => b.timestamp - a.timestamp);

        if (!cancelled) {
          setTimeline(compiled);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch tactical timeline"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTimeline();

    return () => {
      cancelled = true;
    };
  }, [targetCharacterId]);

  const lastSeen = (() => {
    const killmailEvent = timeline.find((e) => e.type === "Killmail");
    if (killmailEvent) {
      return {
        solarSystemId: killmailEvent.locationId,
        timestamp: killmailEvent.timestamp,
      };
    }
    if (timeline.length > 0) {
      return {
        solarSystemId: timeline[0].locationId,
        timestamp: timeline[0].timestamp,
      };
    }
    return null;
  })();

  return { lastSeen, timeline, loading, error };
}
