/**
 * Shared Sui GraphQL query utilities.
 *
 * Migrated from JSON-RPC per Sui SDK 2.0 guidelines.
 *
 * Event query strategy for targeted fetching:
 * - Jump/Deposit/Withdraw: filtered by `sender: walletAddress` (server-side)
 * - Killmail: filtered by `item_id` (client-side, small limit)
 * All combined into a single GraphQL request via aliases.
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

// ─── Event Node Fragment ─────────────────────────────────────────────────────

const EVENT_NODE_FIELDS = `
  timestamp
  sequenceNumber
  contents { type { repr } json }
  transaction { digest }
`;

// ─── Targeted Event Fetching ─────────────────────────────────────────────────

/**
 * Fetch events targeted to a specific character.
 *
 * Strategy:
 * - Jump/Deposit/Withdraw events are filtered server-side by `sender: walletAddress`
 *   because the player's wallet submits these transactions.
 * - Killmail events are fetched with a small limit and filtered client-side by
 *   `killer_id.item_id` / `victim_id.item_id`, because killmails are created by
 *   the game server (not the player's wallet).
 *
 * All queries are combined into 1 GraphQL request via aliases.
 *
 * @param walletAddress - The player's wallet address (for server-side sender filter)
 * @param characterItemId - The u64 item_id (for client-side killmail filter)
 * @param limit - Max events per type
 */
export async function fetchTargetedEvents(
  walletAddress: string | null,
  characterItemId: string,
  limit: number = 25
): Promise<ParsedEvent[]> {
  const parts: string[] = [];

  // Killmail: always fetched (small limit), filtered client-side
  parts.push(`
    killmails: events(
      last: ${limit}
      filter: { type: "${WORLD_PACKAGE_ID}::killmail::KillmailCreatedEvent" }
    ) { nodes { ${EVENT_NODE_FIELDS} } }
  `);

  // Jump/Deposit/Withdraw: only if we have walletAddress for sender filter
  if (walletAddress) {
    parts.push(`
      jumps: events(
        last: ${limit}
        filter: {
          type: "${WORLD_PACKAGE_ID}::gate::JumpEvent"
          sender: "${walletAddress}"
        }
      ) { nodes { ${EVENT_NODE_FIELDS} } }
    `);

    parts.push(`
      deposits: events(
        last: ${limit}
        filter: {
          type: "${WORLD_PACKAGE_ID}::inventory::ItemDepositedEvent"
          sender: "${walletAddress}"
        }
      ) { nodes { ${EVENT_NODE_FIELDS} } }
    `);

    parts.push(`
      withdrawals: events(
        last: ${limit}
        filter: {
          type: "${WORLD_PACKAGE_ID}::inventory::ItemWithdrawnEvent"
          sender: "${walletAddress}"
        }
      ) { nodes { ${EVENT_NODE_FIELDS} } }
    `);
  }

  const query = `query TargetedEvents { ${parts.join("\n")} }`;
  const data = await graphqlQuery(query);

  const allEvents: ParsedEvent[] = [];

  // Parse helper
  const parseNodes = (nodes: any[]) => {
    for (const node of nodes) {
      const typeRepr = node.contents?.type?.repr || "";
      const jsonData = node.contents?.json || {};

      allEvents.push({
        type: typeRepr,
        parsedJson: typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData,
        timestampMs: node.timestamp
          ? String(new Date(node.timestamp).getTime())
          : "0",
        txDigest: node.transaction?.digest || "",
        eventSeq: String(node.sequenceNumber ?? 0),
      });
    }
  };

  // Parse all aliases
  if (data?.killmails?.nodes) parseNodes(data.killmails.nodes);
  if (data?.jumps?.nodes) parseNodes(data.jumps.nodes);
  if (data?.deposits?.nodes) parseNodes(data.deposits.nodes);
  if (data?.withdrawals?.nodes) parseNodes(data.withdrawals.nodes);

  // Client-side filter for killmails: only keep events involving this character
  return allEvents.filter((ev) => {
    if (ev.type.includes("::killmail::KillmailCreatedEvent")) {
      const killerId = String(ev.parsedJson.killer_id?.item_id || "");
      const victimId = String(ev.parsedJson.victim_id?.item_id || "");
      return killerId === characterItemId || victimId === characterItemId;
    }
    // Jump/Deposit/Withdraw are already server-filtered by sender
    return true;
  });
}

// ─── Generic Event Batch (for threat analysis, etc.) ─────────────────────────

/**
 * Fetch events by type without sender filter (for global queries like threat analysis).
 */
export async function fetchEventsBatch(
  eventTypes: string[],
  limit: number = 50
): Promise<ParsedEvent[]> {
  if (eventTypes.length === 0) return [];

  const aliases = eventTypes.map((type, i) => `
    ev_${i}: events(
      last: ${limit}
      filter: { type: "${type}" }
    ) { nodes { ${EVENT_NODE_FIELDS} } }
  `);

  const query = `query FetchEvents { ${aliases.join("\n")} }`;
  const data = await graphqlQuery(query);

  const allEvents: ParsedEvent[] = [];
  for (let i = 0; i < eventTypes.length; i++) {
    const nodes = data?.[`ev_${i}`]?.nodes || [];
    for (const node of nodes) {
      allEvents.push({
        type: node.contents?.type?.repr || eventTypes[i],
        parsedJson: typeof node.contents?.json === "string"
          ? JSON.parse(node.contents.json)
          : (node.contents?.json || {}),
        timestampMs: node.timestamp
          ? String(new Date(node.timestamp).getTime())
          : "0",
        txDigest: node.transaction?.digest || "",
        eventSeq: String(node.sequenceNumber ?? i),
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

export async function fetchBalanceAndObjects(
  ownerAddress: string,
  coinType: string,
  objectOwner?: string
): Promise<{ balance: BalanceResult; objects: OwnedObjectInfo[] }> {
  const objectsOwner = objectOwner || ownerAddress;

  const query = `
    query BalanceAndObjects($addr: SuiAddress!, $coinType: String!, $objOwner: SuiAddress!) {
      walletBalance: address(address: $addr) {
        balance(coinType: $coinType) {
          totalBalance
        }
      }
      ownedObjects: address(address: $objOwner) {
        objects(first: 50) {
          nodes {
            address
            contents { type { repr } }
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
    const typeStr = node.contents?.type?.repr || "";
    if (typeStr) {
      objects.push({ type: typeStr, objectId: node.address || "" });
    }
  }

  return { balance, objects };
}

// ─── Convenience: Utopia Event Types ─────────────────────────────────────────

export const UTOPIA_EVENT_TYPES = {
  killmailCreated: `${WORLD_PACKAGE_ID}::killmail::KillmailCreatedEvent`,
  jump: `${WORLD_PACKAGE_ID}::gate::JumpEvent`,
  itemDeposited: `${WORLD_PACKAGE_ID}::inventory::ItemDepositedEvent`,
  itemWithdrawn: `${WORLD_PACKAGE_ID}::inventory::ItemWithdrawnEvent`,
} as const;
