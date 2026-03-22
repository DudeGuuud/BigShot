/**
 * BigShot contract constants.
 * Values are populated from environment variables (.env).
 * After `sui client publish`, fill in the deployment-specific IDs.
 */

// ─── EVE Frontier World (testnet) ────────────────────────────────────────────
export const WORLD_PACKAGE_ID: string = import.meta.env.VITE_EVE_WORLD_PACKAGE_ID;

// LUX coin type (game-internal credit)
export const LUX_COIN_TYPE = `${WORLD_PACKAGE_ID}::lux::LUX`;

export const EVE_COIN_TYPE: string = import.meta.env.VITE_EVE_TOKEN_TYPE;

// SUI native coin type
export const SUI_COIN_TYPE = "0x2::sui::SUI";

// PlayerProfile object type — used to look up character_id from wallet address
export const PLAYER_PROFILE_TYPE = `${WORLD_PACKAGE_ID}::character::PlayerProfile`;

// Sui GraphQL endpoint
export const GRAPHQL_URL: string = import.meta.env.VITE_SUI_GRAPHQL_ENDPOINT;

// ─── BigShot Extension (fill in after deploy) ────────────────────────────────
export const BIGSHOT_PACKAGE_ID: string = import.meta.env.VITE_BIGSHOT_PACKAGE_ID;

export const EXTENSION_CONFIG_ID: string = import.meta.env.VITE_EXTENSION_CONFIG_ID;

export const TREASURY_LUX_ID: string = import.meta.env.VITE_TREASURY_LUX_ID;

export const TREASURY_EVE_ID: string = import.meta.env.VITE_TREASURY_EVE_ID;

export const TREASURY_SUI_ID: string = import.meta.env.VITE_TREASURY_SUI_ID;

export const KILLMAIL_REGISTRY_ID: string = import.meta.env.VITE_KILLMAIL_REGISTRY_ID;

// ─── Sui system constants ─────────────────────────────────────────────────────
export const SUI_CLOCK_OBJECT_ID = "0x0000000000000000000000000000000000000000000000000000000000000006";

/** True when all BigShot contract IDs have been configured */
export const IS_CONTRACT_DEPLOYED =
  !!BIGSHOT_PACKAGE_ID && !!EXTENSION_CONFIG_ID && (!!TREASURY_EVE_ID || !!TREASURY_SUI_ID);

/** BigShot Bounty object type string — used for GraphQL queries */
export const BOUNTY_TYPE = (coinType: string) =>
  `${BIGSHOT_PACKAGE_ID}::bigshot::Bounty<${coinType}>`;
