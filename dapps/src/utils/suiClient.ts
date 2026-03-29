/**
 * Shared Sui query utilities — GraphQL only.
 *
 * Migrated from JSON-RPC per Sui SDK 2.0 guidelines:
 * https://sdk.mystenlabs.com/sui/migrations/sui-2.0/json-rpc-migration
 *
 * Uses GraphQL for ALL queries:
 * - Events: combined via aliases in a single request
 * - Balance: via address query
 * - Owned objects: via address query
 * - Dynamic fields: via object query
 */

import { GRAPHQL_URL, WORLD_PACKAGE_ID } from "../constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedEvent {
  type: string;
  parsedJson: Record<string, any>;
  timestampMs: string;
  txDigest: string;
  eventSeq: string;
}

// ─── Core GraphQL ────────────────────────────────────────────────────────────

/**
 * Execute a GraphQL query against the Sui GraphQL endpoint.
 */
export async function graphqlQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.warn("GraphQL errors:", json.errors);
    throw new Error(json.errors[0]?.message || "GraphQL Error");
  }
  return json.data as T;
}

// ─── Event Queries (GraphQL with aliases) ────────────────────────────────────

/**
 * Build a GraphQL fragment for querying events of a single type.
 * Returns the fragment string and its alias name.
 */
function buildEventAlias(alias: string, eventType: string, limit: number): string {
  return `
    ${alias}: events(
      last: ${limit}
      filter: { eventType: "${eventType}" }
    ) {
      nodes {
        timestamp
        type { repr }
        json
        sendingModule { package { address } name }
      }
    }
  `;
}

/**
 * Fetch events of multiple types in a SINGLE GraphQL request using aliases.
 * Each event type becomes a separate aliased query combined into one HTTP call.
 *
 * Example: 4 event types → 1 HTTP request with 4 aliased sub-queries.
 */
export async function fetchEventsBatch(
  eventTypes: string[],
  limit: number = 50
): Promise<ParsedEvent[]> {
  if (eventTypes.length === 0) return [];

  // Build combined query with aliases
  const aliases = eventTypes.map((type, i) => {
    const alias = `ev_${i}`;
    return buildEventAlias(alias, type, limit);
  });

  const query = `query FetchAllEvents { ${aliases.join("\n")} }`;

  const data = await graphqlQuery(query);

  // Parse all aliased results into flat event array
  const allEvents: ParsedEvent[] = [];

  for (let i = 0; i < eventTypes.length; i++) {
    const alias = `ev_${i}`;
    const nodes = data?.[alias]?.nodes || [];

    for (const node of nodes) {
      const typeRepr = node.type?.repr || eventTypes[i];
      const jsonData = node.json || {};

      allEvents.push({
        type: typeRepr,
        parsedJson: typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData,
        timestampMs: node.timestamp ? String(new Date(node.timestamp).getTime()) : "0",
        txDigest: "", // GraphQL events don't directly expose txDigest in this schema
        eventSeq: String(i),
      });
    }
  }

  return allEvents;
}

// ─── Balance + Objects (GraphQL) ─────────────────────────────────────────────

export interface BalanceResult {
  totalBalance: string;
}

export interface OwnedObjectInfo {
  type: string;
  objectId: string;
}

/**
 * Fetch balance and owned objects for an address in a single GraphQL request.
 */
export async function fetchBalanceAndObjects(
  ownerAddress: string,
  coinType: string,
  objectOwner?: string
): Promise<{ balance: BalanceResult; objects: OwnedObjectInfo[] }> {
  // If objectOwner is different from walletAddress (e.g. character ID owns OwnerCaps)
  const objectsOwner = objectOwner || ownerAddress;

  const query = `
    query BalanceAndObjects($addr: SuiAddress!, $coinType: String!, $objOwner: SuiAddress!) {
      walletBalance: address(address: $addr) {
        balance(type: $coinType) {
          totalBalance
        }
      }
      ownedObjects: owner(address: $objOwner) {
        objects(first: 50) {
          nodes {
            address
            asMoveObject {
              contents { type { repr } }
            }
          }
        }
      }
    }
  `;

  const data = await graphqlQuery(query, {
    addr: ownerAddress,
    coinType,
    objOwner: objectsOwner,
  });

  const balance: BalanceResult = {
    totalBalance: data?.walletBalance?.balance?.totalBalance || "0",
  };

  const objects: OwnedObjectInfo[] = [];
  const nodes = data?.ownedObjects?.objects?.nodes || [];
  for (const node of nodes) {
    const typeStr = node.asMoveObject?.contents?.type?.repr || "";
    if (typeStr) {
      objects.push({ type: typeStr, objectId: node.address || "" });
    }
  }

  return { balance, objects };
}

// ─── Convenience: Utopia Event Types ─────────────────────────────────────────

/** All trackable event types for the Utopia world package */
export const UTOPIA_EVENT_TYPES = {
  killmailCreated: `${WORLD_PACKAGE_ID}::killmail::KillmailCreatedEvent`,
  jump: `${WORLD_PACKAGE_ID}::gate::JumpEvent`,
  itemDeposited: `${WORLD_PACKAGE_ID}::inventory::ItemDepositedEvent`,
  itemWithdrawn: `${WORLD_PACKAGE_ID}::inventory::ItemWithdrawnEvent`,
} as const;

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

const cache = new Map<string, { data: any; expiry: number }>();

/**
 * Cache wrapper with TTL (ms).
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiry > now) {
    return entry.data as T;
  }
  const data = await fetcher();
  cache.set(key, { data, expiry: now + ttlMs });
  return data;
}
