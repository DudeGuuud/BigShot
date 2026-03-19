import { useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { buildClaimBountyTx, ClaimBountyParams } from "../transactions/buildClaimBountyTx";

/**
 * Hook to call `bigshot::claim_bounty` via EVE Vault wallet.
 *
 * Usage:
 *   const { claimBounty, loading, error, txDigest } = useClaimBounty();
 *   await claimBounty({ bountyId, coinType, killmailId, hunterCharacterId });
 */
export function useClaimBounty() {
  const { signAndExecuteTransaction } = useDAppKit();
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  async function claimBounty(params: ClaimBountyParams) {
    setLoading(true);
    setError(null);
    setTxDigest(null);
    try {
      const tx     = buildClaimBountyTx(params);
      const result = await signAndExecuteTransaction({ transaction: tx });
      const digest = result.$kind === 'Transaction' ? result.Transaction.digest : undefined;
      setTxDigest(digest ?? null);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { claimBounty, loading, error, txDigest };
}
