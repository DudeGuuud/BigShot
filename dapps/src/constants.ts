/**
 * BigShot contract constants.
 * Values are populated from environment variables (.env).
 * After `sui client publish`, fill in the deployment-specific IDs.
 */

// ─── EVE Frontier World (testnet) ────────────────────────────────────────────
export const WORLD_PACKAGE_ID: string =
  import.meta.env.VITE_EVE_WORLD_PACKAGE_ID ??
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// LUX coin type (game-internal credit)
export const LUX_COIN_TYPE = `${WORLD_PACKAGE_ID}::lux::LUX`;

// EVE Token coin type
export const EVE_COIN_TYPE = `${WORLD_PACKAGE_ID}::eve_token::EVE_TOKEN`;

// PlayerProfile object type — used to look up character_id from wallet address
export const PLAYER_PROFILE_TYPE = `${WORLD_PACKAGE_ID}::character::PlayerProfile`;

// Sui GraphQL endpoint
export const GRAPHQL_URL: string =
  import.meta.env.VITE_SUI_GRAPHQL_ENDPOINT ??
  "https://graphql.testnet.sui.io/graphql";

// ─── BigShot Extension (fill in after deploy) ────────────────────────────────
export const BIGSHOT_PACKAGE_ID: string =
  import.meta.env.VITE_BIGSHOT_PACKAGE_ID ?? "";

export const EXTENSION_CONFIG_ID: string =
  import.meta.env.VITE_EXTENSION_CONFIG_ID ?? "";

export const TREASURY_LUX_ID: string =
  import.meta.env.VITE_TREASURY_LUX_ID ?? "";

export const TREASURY_EVE_ID: string =
  import.meta.env.VITE_TREASURY_EVE_ID ?? "";

// ─── Sui system constants ─────────────────────────────────────────────────────
export const SUI_CLOCK_OBJECT_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000006";

/** True when all BigShot contract IDs have been configured */
export const IS_CONTRACT_DEPLOYED =
  !!BIGSHOT_PACKAGE_ID && !!EXTENSION_CONFIG_ID && !!TREASURY_LUX_ID;

/** BigShot Bounty object type string — used for GraphQL queries */
export const BOUNTY_TYPE = (coinType: string) =>
  `${BIGSHOT_PACKAGE_ID}::bigshot::Bounty<${coinType}>`;
