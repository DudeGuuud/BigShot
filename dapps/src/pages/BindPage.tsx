import { useEffect, useState } from "react";
import { Link2, User, CheckCircle2, Loader2, Copy, ExternalLink, Check } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useCharacterId } from "../hooks/useCharacterId";
import { useBigShot } from "../context/BigShotContext";

export function BindPage() {
  const account = useCurrentAccount();
  const { handleConnect } = useConnection();

  const { characterId: savedCharacterId, setCharacterId: saveCharacterId } = useBigShot();
  const { resolve, characterId, loading, error: resolveError } = useCharacterId();
  const [copied, setCopied] = useState(false);

  // Automatically fetch characterId if wallet is connected but no character ID is saved
  useEffect(() => {
    if (account && !savedCharacterId && !loading && !characterId) {
      resolve(account.address).then(res => {
        if (res?.characterId) saveCharacterId(res.characterId, res.profileAddress);
      });
    }
  }, [account, savedCharacterId, loading, characterId, resolve, saveCharacterId]);

  async function fetchCharacterId() {
    if (!account) return;
    const res = await resolve(account.address);
    if (res?.characterId) {
      saveCharacterId(res.characterId, res.profileAddress);
    }
  }

  return (
    <div style={{ paddingTop: "3rem", maxWidth: "560px" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
          Bind <span style={{ color: "var(--brand)" }}>Identity</span>
        </h1>
        <p style={{ fontSize: "0.8rem", color: "rgba(250,250,229,0.4)", lineHeight: "1.6" }}>
          Link your EVE Vault wallet to your Frontier character.
          Your <code className="mono">character_id</code> is required to post or claim bounties.
        </p>
      </div>

      <div className="industrial-panel" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <p className="section-label"><Link2 size={14} /> Wallet → PlayerProfile → Character ID</p>

        {/* Wallet status */}
        <div style={{ background: "rgba(250,250,229,0.03)", border: "1px solid var(--eve-border)", padding: "1rem" }}>
          <p className="form-label">Connected Wallet</p>
          {account ? (
            <p className="mono" style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>{account.address}</p>
          ) : (
            <p style={{ fontSize: "0.8rem", opacity: 0.3 }}>No wallet connected</p>
          )}
        </div>

        {/* Character ID result */}
        {(savedCharacterId || characterId) && (() => {
          const displayId = savedCharacterId || characterId;
          const trunactedId = displayId!.length > 10 
            ? `${displayId!.slice(0, 4)}...${displayId!.slice(-4)}` 
            : displayId;
          return (
            <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <CheckCircle2 size={20} style={{ color: "var(--green)", flexShrink: 0 }} />
                <div>
                  <p className="form-label">Character ID Resolved</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <p className="mono" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--green)" }} title={displayId || ""}>
                      {trunactedId}
                    </p>
                    <button 
                      onClick={() => {
                        if (displayId) navigator.clipboard.writeText(displayId);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      style={{ background: "transparent", border: "none", color: "var(--green)", opacity: 0.7, cursor: "pointer", padding: "0.2rem" }}
                      title="Copy Full ID"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
              <a 
                href={displayId ? `https://suiscan.xyz/testnet/object/${displayId}` : `https://suiscan.xyz/testnet/address/${account?.address}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ color: "var(--brand)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 700, textTransform: "uppercase" }}
              >
                Character on Suiscan <ExternalLink size={12} />
              </a>
            </div>
          );
        })()}

        {resolveError && (
          <p style={{ fontSize: "0.7rem", color: "var(--martian-red)" }}>{resolveError}</p>
        )}

        {/* How it works */}
        <div style={{ fontSize: "0.7rem", color: "rgba(250,250,229,0.35)", lineHeight: "1.8" }}>
          <p style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>How identity binding works</p>
          <ol style={{ paddingLeft: "1rem" }}>
            <li>Connect your EVE Vault wallet.</li>
            <li>We query your wallet address for a <code className="mono">PlayerProfile</code> object.</li>
            <li>Use this ID when posting or claiming bounties.</li>
          </ol>
        </div>

        {/* Action */}
        {account ? (
          <button
            className={`eve-btn eve-btn--primary eve-btn--full ${savedCharacterId ? "" : ""}`}
            onClick={fetchCharacterId}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Querying PlayerProfile…</>
            ) : savedCharacterId ? (
              <><CheckCircle2 size={14} /> Re-scan Character</>
            ) : (
              <><User size={14} /> Fetch Character ID</>
            )}
          </button>
        ) : (
          <button className="eve-btn eve-btn--primary eve-btn--full" onClick={handleConnect}>
            Connect EVE Vault First
          </button>
        )}
      </div>
    </div>
  );
}
