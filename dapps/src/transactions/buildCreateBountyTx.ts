import { Transaction } from "@mysten/sui/transactions";
import {
  BIGSHOT_PACKAGE_ID,
  EXTENSION_CONFIG_ID,
  SUI_CLOCK_OBJECT_ID,
} from "../constants";

export interface CreateBountyParams {
  /** Shared treasury object ID for this coin type */
  treasuryId: string;
  /** Coin type, e.g. LUX_COIN_TYPE */
  coinType: string;
  /** target character_id (u64 as string) */
  targetCharacterId: string;
  /** threat_level 0=D … 4=S */
  threatLevel: number;
  /** Coin object IDs to merge & use for payment */
  coinObjectIds: string[];
  /** Total payment amount (in smallest unit) */
  paymentAmount: bigint;
  /** Protocol duration in milliseconds */
  durationMs: bigint;
}

/**
 * Builds a `create_bounty` Transaction for the BigShot extension.
 * The caller must sign and execute the returned transaction via `useDAppKit()`.
 */
export function buildCreateBountyTx(params: CreateBountyParams): Transaction {
  const tx = new Transaction();

  let paymentCoin;
  if (params.coinType === "0x2::sui::SUI") {
    // For native SUI stakes, strictly use tx.gas to prevent CoinIsGasCoin merge collisions
    [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.paymentAmount)]);
  } else {
    // Merge all coin objects if there are multiple, then split for payment
    let primaryCoin;
    if (params.coinObjectIds.length === 1) {
      primaryCoin = tx.object(params.coinObjectIds[0]);
    } else {
      primaryCoin = tx.object(params.coinObjectIds[0]);
      tx.mergeCoins(
        primaryCoin,
        params.coinObjectIds.slice(1).map((id) => tx.object(id)),
      );
    }
    [paymentCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(params.paymentAmount)]);
  }

  tx.moveCall({
    target: `${BIGSHOT_PACKAGE_ID}::bigshot::create_bounty`,
    typeArguments: [params.coinType],
    arguments: [
      tx.object(EXTENSION_CONFIG_ID),
      tx.object(params.treasuryId),
      tx.pure.u64(BigInt(params.targetCharacterId)),
      tx.pure.u8(params.threatLevel),
      paymentCoin,
      tx.pure.u64(params.durationMs),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}
