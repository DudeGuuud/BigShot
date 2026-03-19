import { useState } from "react";
import { useDAppKit } from "@mysten/dapp-kit-react";
import { buildCreateBountyTx, CreateBountyParams } from "../transactions/buildCreateBountyTx";

/**
 * Hook to call `bigshot::create_bounty` via EVE Vault wallet.
 *
 * Usage:
 *   const { createBounty, loading, error, txDigest } = useCreateBounty();
 *   await createBounty({ ... });
 */
export function useCreateBounty() {
  const { signAndExecuteTransaction } = useDAppKit();
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  async function createBounty(params: CreateBountyParams) {
    setLoading(true);
    setError(null);
    setTxDigest(null);
    try {
      const tx     = buildCreateBountyTx(params);
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

  return { createBounty, loading, error, txDigest };
}
