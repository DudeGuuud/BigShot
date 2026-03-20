Component Interaction Intelligence: "Last Seen"
The user's intuition was exactly right: relying solely on Killmail only provides location data upon a character's death. However, EVE Frontier's smart contract design inherently supports tracking characters through their interactions with in-game components (Smart Assemblies).

Relevant World Contract Events
By analyzing the evefrontier/world-contracts repository, we found that several core player interactions emit events that bind the player's character_id to a specific assembly_id.

1. Smart Gates (JumpEvent)
When a character jumps through a Smart Gate, the contract emits a JumpEvent:

move
public struct JumpEvent has copy, drop {
    source_gate_id: ID,          // The gate they jumped from
    destination_gate_id: ID,     // The gate they jumped to
    character_id: ID,            // The player's identity
    // ...
}
2. Smart Storage Units (ItemDepositedEvent / ItemWithdrawnEvent)
When a character interacts with an inventory (like depositing fuel or withdrawing items from an SSU), it emits:

move
public struct ItemDepositedEvent has copy, drop {
    assembly_id: ID,             // The storage unit they interacted with
    character_id: ID,            // The player's identity
    // ...
}
How to Derive Location from an Event
These events do not contain the raw coordinates (like $x, y, z$). Due to EVE Frontier's spatial privacy design (which obscurities coordinates to prevent map scraping), the pipeline for deriving the location is:

GraphQL Event Query: Query the Sui GraphQL node for MoveEventType: ...::inventory::ItemDepositedEvent filtering by character_id = <bounty_target>.
Assembly Lookup: Extract the assembly_id from the latest event and fetch the Assembly object on-chain.
Location Hash Extraction: Read the location_hash dynamic field attached to that Assembly object.
Off-chain Resolution: Pass the location_hash to the EVE Game Server API (/api/location/:hash) to resolve the human-readable System Name, Constellation, and Region.
Next Step Implementation
To implement this in our frontend, we would need to:

Augment 
useLastSeen.ts
 to perform an events query (in addition to the Killmail dynamic field query).
Fetch the associated Assembly object to read its location hash.
Show the assembly_id (or resolved sector name if the Game API is available) in the 
BountyDetailPage
.
Note: If we do not have an active game bridge API to resolve hashes in our current development server, we can still display the assembly_id as the "Last Known Assembly Hub".

