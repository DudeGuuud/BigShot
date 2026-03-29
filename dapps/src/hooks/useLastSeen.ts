/**
 * useLastSeen — Tactical Timeline hook.
 *
 * Fetches all on-chain activity for a target character:
 * - KillmailCreatedEvent (combat kills/deaths)
 * - JumpEvent (gate travel)
 * - ItemDepositedEvent (SSU interactions)
 * - ItemWithdrawnEvent (SSU interactions)
 *
 * All event queries are batched into a single HTTP request via JSON-RPC batch.
 *
 * Target matching:
 * - Events use `character_id` (Sui Object ID, hex) and `character_key.item_id` (u64 string)
 * - Killmails use `killer_id.item_id` / `victim_id.item_id` (u64 strings)
 * - We match against BOTH formats to maximize coverage
 */

import { useState, useEffect } from "react";
import { fetchEventsBatch, UTOPIA_EVENT_TYPES } from "../utils/suiClient";
import { getStarSystemName } from "../utils/systems";

export type TimelineEvent = {
  id: string;
  type: "Killmail" | "Jump" | "Deposit" | "Withdraw" | "Unknown";
  locationId: string;
  locationName: string;
  timestamp: number;
  txDigest: string;
  /** Role of the target in this event */
  role?: "killer" | "victim" | "traveler" | "depositor" | "withdrawer";
  /** Additional context (e.g., gate IDs, item types) */
  detail?: string;
};

/**
 * Check if a target ID matches a character in an event.
 * Events have both `character_id` (Sui hex ID) and `character_key.item_id` (u64).
 * The target could be either format depending on how the bounty stores it.
 */
function matchesTarget(
  targetId: string,
  suiObjectId: string | undefined,
  tenantItemId: { item_id?: string } | undefined
): boolean {
  if (!targetId) return false;
  const targetNorm = targetId.toLowerCase();

  // Match Sui Object ID
  if (suiObjectId && suiObjectId.toLowerCase() === targetNorm) return true;

  // Match u64 item_id
  if (tenantItemId?.item_id && String(tenantItemId.item_id) === targetId)
    return true;

  return false;
}

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
        // ── Single batched RPC call for ALL event types ──
        const events = await fetchEventsBatch(
          [
            UTOPIA_EVENT_TYPES.killmailCreated,
            UTOPIA_EVENT_TYPES.jump,
            UTOPIA_EVENT_TYPES.itemDeposited,
            UTOPIA_EVENT_TYPES.itemWithdrawn,
          ],
          50 // per event type
        );

        if (cancelled) return;

        const compiled: TimelineEvent[] = [];

        for (const ev of events) {
          const json = ev.parsedJson;

          // ── KillmailCreatedEvent ──
          if (ev.type.includes("::killmail::KillmailCreatedEvent")) {
            const isKiller = matchesTarget(
              targetCharacterId,
              undefined,
              json.killer_id
            );
            const isVictim = matchesTarget(
              targetCharacterId,
              undefined,
              json.victim_id
            );
            if (!isKiller && !isVictim) continue;

            const solarSystemId = String(
              json.solar_system_id?.item_id || ""
            );
            compiled.push({
              id: `km-${ev.txDigest}-${ev.eventSeq}`,
              type: "Killmail",
              locationId: solarSystemId,
              locationName: getStarSystemName(solarSystemId),
              timestamp: Number(json.kill_timestamp || 0) * 1000, // Unix seconds → ms
              txDigest: ev.txDigest,
              role: isKiller ? "killer" : "victim",
              detail: isKiller
                ? `Killed ${json.victim_id?.item_id || "unknown"}`
                : `Killed by ${json.killer_id?.item_id || "unknown"}`,
            });
            continue;
          }

          // ── JumpEvent ──
          if (ev.type.includes("::gate::JumpEvent")) {
            if (
              !matchesTarget(
                targetCharacterId,
                json.character_id,
                json.character_key
              )
            )
              continue;

            const destGateId = json.destination_gate_id || "";
            const destGateItemId = String(
              json.destination_gate_key?.item_id || ""
            );
            const srcGateItemId = String(
              json.source_gate_key?.item_id || ""
            );

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

          // ── ItemDepositedEvent ──
          if (ev.type.includes("::inventory::ItemDepositedEvent")) {
            if (
              !matchesTarget(
                targetCharacterId,
                json.character_id,
                json.character_key
              )
            )
              continue;

            const assemblyId = json.assembly_id || "";
            const assemblyItemId = String(
              json.assembly_key?.item_id || ""
            );

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

          // ── ItemWithdrawnEvent ──
          if (ev.type.includes("::inventory::ItemWithdrawnEvent")) {
            if (
              !matchesTarget(
                targetCharacterId,
                json.character_id,
                json.character_key
              )
            )
              continue;

            const assemblyId = json.assembly_id || "";
            const assemblyItemId = String(
              json.assembly_key?.item_id || ""
            );

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

        // Sort descending by time
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

  // Backward compatibility: lastSeen = the most recent event with a solar system location
  const lastSeen = (() => {
    // Prefer killmails since they have the most precise location data (solar system)
    const killmailEvent = timeline.find((e) => e.type === "Killmail");
    if (killmailEvent) {
      return {
        solarSystemId: killmailEvent.locationId,
        timestamp: killmailEvent.timestamp,
      };
    }
    // Fall back to any event
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
