import { useState, useEffect } from "react";
import { KILLMAIL_REGISTRY_ID } from "../constants";
import { getStarSystemName } from "../utils/systems";

const SUI_GRAPHQL_URL = import.meta.env.VITE_SUI_GRAPHQL_ENDPOINT || "https://graphql.testnet.sui.io/graphql";

export type TimelineEvent = {
  id: string;
  type: "Killmail" | "Jump" | "Deposit" | "Withdraw" | "Unknown";
  locationId: string;
  locationName: string; // Human-readable name
  timestamp: number;
  txDigest: string;
};

export function useLastSeen(targetCharacterId: string) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetCharacterId || !KILLMAIL_REGISTRY_ID) {
      setTimeline([]);
      return;
    }

    async function fetchChronology() {
      setLoading(true);
      setError(null);
      try {
        const query = `
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

        // 1. Fetch Killmails via GraphQL (Parallel)
        const killmailPromise = fetch(SUI_GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables: { registryId: KILLMAIL_REGISTRY_ID } }),
        }).then(res => res.json());

        // 2. Fetch Interaction Events via Sui RPC (Parallel)
        // Ensure graceful failure if the RPC node does not support MoveEventField
        const eventsPromise = new Promise<any>(async (resolve) => {
          try {
            const worldV1 = "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75";
            const worldV2 = "0x33226d2eedda428eb7e1a56faf525bd5300f9394a5d61ffbbbcb3993d45a7145";
            
            const res = await fetch("https://fullnode.testnet.sui.io/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "suix_queryEvents",
                params: [
                  { Any: [
                    { MoveEventType: `${worldV1}::gate::JumpEvent` },
                    { MoveEventType: `${worldV2}::gate::JumpEvent` },
                    { MoveEventType: `${worldV1}::inventory::ItemDepositedEvent` },
                    { MoveEventType: `${worldV2}::inventory::ItemDepositedEvent` },
                    { MoveEventType: `${worldV1}::inventory::ItemWithdrawnEvent` },
                    { MoveEventType: `${worldV2}::inventory::ItemWithdrawnEvent` }
                  ]},
                  null,
                  100, // Fetch more to filter locally
                  true
                ]
              })
            }).then(r => r.json());
            
            if (res.error) {
               console.warn("RPC fetch error:", res.error);
               resolve({ data: [] });
            } else {
               resolve(res.result || { data: [] });
            }
          } catch (e) {
            console.warn("RPC fetch failed or event indexer not supported for dynamic fields, falling back to GraphQL killmails only.", e);
            resolve({ data: [] });
          }
        });

        const [graphqlResult, eventsResult] = await Promise.all([killmailPromise, eventsPromise]);

        if (graphqlResult.errors) {
          throw new Error(graphqlResult.errors[0]?.message || "GraphQL Error");
        }

        const compiledTimeline: TimelineEvent[] = [];

        // Parse Killmails
        const nodes = graphqlResult.data?.object?.dynamicFields?.nodes || [];
        for (const node of nodes) {
          const contents = node.value?.contents?.json;
          if (!contents) continue;
          
          // In Version 2, IDs are u64 (strings in JSON)
          const victimId = String(contents.victim_id?.item_id || "");
          if (victimId === String(targetCharacterId)) {
            compiledTimeline.push({
              id: "km-" + (contents.id?.id || Math.random().toString()),
              type: "Killmail",
              locationId: String(contents.solar_system_id?.item_id || "Unknown Sector"),
              locationName: getStarSystemName(String(contents.solar_system_id?.item_id || "")),
              timestamp: Number(contents.kill_timestamp || 0) * 1000,
              txDigest: "N/A"
            });
          }
        }

        // Parse Interactions
        for (const ev of eventsResult.data) {
          let eventType: TimelineEvent["type"] = "Unknown";
          let locId = "Unknown";
          const json = ev.parsedJson as Record<string, any>;

          if (ev.type.includes("::gate::JumpEvent")) {
            if (String(json.character_id) !== String(targetCharacterId)) continue;
            eventType = "Jump";
            locId = json.source_gate_id || "Unknown Gate";
          } else if (ev.type.includes("::inventory::ItemDepositedEvent")) {
            if (String(json.character_id) !== String(targetCharacterId)) continue;
            eventType = "Deposit";
            locId = json.assembly_id || "Unknown SSU";
          } else if (ev.type.includes("::inventory::ItemWithdrawnEvent")) {
            if (String(json.character_id) !== String(targetCharacterId)) continue;
            eventType = "Withdraw";
            locId = json.assembly_id || "Unknown SSU";
          } else {
            continue; // Skip unrecognized events
          }

          compiledTimeline.push({
            id: ev.id.txDigest + "-" + ev.id.eventSeq,
            type: eventType,
            locationId: locId,
            locationName: locId.startsWith("0x") ? `Gate ${locId.slice(0, 6)}` : getStarSystemName(locId),
            timestamp: Number(ev.timestampMs || 0),
            txDigest: ev.id.txDigest
          });
        }

        // Sort descending by time
        compiledTimeline.sort((a, b) => b.timestamp - a.timestamp);
        setTimeline(compiledTimeline);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tactical timeline");
      } finally {
        setLoading(false);
      }
    }

    fetchChronology();
  }, [targetCharacterId]);

  // Provide backward compatibility for existing code using lastSeen directly
  const lastSeen = timeline.length > 0 ? {
    solarSystemId: timeline[0].locationId,
    timestamp: timeline[0].timestamp
  } : null;

  return { lastSeen, timeline, loading, error };
}
