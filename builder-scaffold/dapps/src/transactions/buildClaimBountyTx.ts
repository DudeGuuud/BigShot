import { Transaction } from "@mysten/sui/transactions";
import { BIGSHOT_PACKAGE_ID, SUI_CLOCK_OBJECT_ID } from "../constants";

export interface ClaimBountyParams {
  /** Shared `Bounty<T>` object ID */
  bountyId: string;
  /** Coin type of the bounty */
  coinType: string;
  /** On-chain `world::killmail::Killmail` shared object ID */
  killmailId: string;
  /** Caller's `world::character::Character` shared object ID */
  hunterCharacterId: string;
}

/**
 * Builds a `claim_bounty` Transaction for the BigShot extension.
 * The caller must sign and execute the returned transaction via `useDAppKit()`.
 */
export function buildClaimBountyTx(params: ClaimBountyParams): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${BIGSHOT_PACKAGE_ID}::bigshot::claim_bounty`,
    typeArguments: [params.coinType],
    arguments: [
      tx.object(params.bountyId),
      tx.object(params.killmailId),
      tx.object(params.hunterCharacterId),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}
