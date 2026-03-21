import { useState } from "react";
import { useDAppKit, useCurrentAccount } from "@mysten/dapp-kit-react";
import { getOwnedObjectsByType } from "@evefrontier/dapp-kit";
import { buildCreateBountyTx, CreateBountyParams } from "../transactions/buildCreateBountyTx";

/**
 * Hook to call `bigshot::create_bounty` via EVE Vault wallet.
 */
export function useCreateBounty() {
  const account = useCurrentAccount();
  const { signAndExecuteTransaction } = useDAppKit();
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  async function createBounty(params: Omit<CreateBountyParams, "coinObjectIds">) {
    if (!account) {
      const msg = "Wallet not connected";
      setError(msg);
      throw new Error(msg);
    }

    setLoading(true);
    setError(null);
    setTxDigest(null);
    try {
      // 1. Fetch coins of the required type using GraphQL (Skip for native SUI gas)
      let coinObjectIds: string[] = [];
      if (params.coinType !== "0x2::sui::SUI") {
        const fullCoinType = `0x2::coin::Coin<${params.coinType}>`;
        const result = await getOwnedObjectsByType(account.address, fullCoinType);
        
        const nodes = result.data?.address?.objects?.nodes ?? [];
        coinObjectIds = nodes.map((n: any) => n.address);

        if (coinObjectIds.length === 0) {
          throw new Error(`No coins of type ${params.coinType} found in wallet.`);
        }
      }

      // 3. Pass coin object IDs to the builder
      const tx = buildCreateBountyTx({ ...params, coinObjectIds });

      const signResult = await signAndExecuteTransaction({ transaction: tx });
      const digest = (signResult as any).digest ?? (signResult as any).Transaction?.digest;
      setTxDigest(digest ?? null);
      return signResult;
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
