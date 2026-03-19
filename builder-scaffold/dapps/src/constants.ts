/**
 * BigShot contract constants.
 * Populate after testnet deployment:
 *   sui client publish ... --gas-budget 100000000
 */

// Package ID — set after `sui client publish` in bigshot_extension/
export const BIGSHOT_PACKAGE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// Shared ExtensionConfig object
export const EXTENSION_CONFIG_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// Shared treasury objects (one per coin type)
// LUX coin type: replace with actual LUX coin type address
export const TREASURY_LUX_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// EVE Token treasury
export const TREASURY_EVE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// EVE Frontier world package (published on testnet)
export const WORLD_PACKAGE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// LUX coin type string
export const LUX_COIN_TYPE = `${WORLD_PACKAGE_ID}::lux::LUX`;

// EVE Token coin type string
export const EVE_COIN_TYPE = `${WORLD_PACKAGE_ID}::eve_token::EVE_TOKEN`;

// Sui GraphQL endpoint (testnet)
export const GRAPHQL_URL = "https://graphql.testnet.sui.io/graphql";

// Clock object ID (system clock, same on all Sui networks)
export const SUI_CLOCK_OBJECT_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000006";
