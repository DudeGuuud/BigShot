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

  async function createBounty(params: CreateBountyParams) {
    if (!account) {
      const msg = "Wallet not connected";
      setError(msg);
      throw new Error(msg);
    }

    setLoading(true);
    setError(null);
    setTxDigest(null);
    try {
      // 1. Fetch coins of the required type using GraphQL
      const fullCoinType = `0x2::coin::Coin<${params.coinType}>`;
      const result = await getOwnedObjectsByType(account.address, fullCoinType);
      
      const nodes = result.data?.address?.objects?.nodes ?? [];
      const coins = nodes.map((n: any) => ({
        coinObjectId: n.address,
        balance: n.asMoveObject?.contents?.json?.balance ?? "0",
      }));

      if (coins.length === 0) {
        throw new Error(`No coins of type ${params.coinType} found in wallet.`);
      }

      // 2. Sum balance and check if sufficient
      const totalBalance = coins.reduce((acc: bigint, c: any) => acc + BigInt(c.balance), BigInt(0));
      if (totalBalance < params.paymentAmount) {
        throw new Error(`Insufficient balance. Required: ${params.paymentAmount.toString()}, Available: ${totalBalance.toString()}`);
      }

      // 3. Pass coin object IDs to the builder
      const coinObjectIds = coins.map((c: any) => c.coinObjectId);
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
