import { Link2, User, CheckCircle2, Loader2 } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useConnection } from "@evefrontier/dapp-kit";
import { useCharacterId } from "../hooks/useCharacterId";
import { useBigShot } from "../context/BigShotContext";

export function BindPage() {
  const account = useCurrentAccount();
  const { handleConnect } = useConnection();

  const { setCharacterId: saveCharacterId } = useBigShot();
  const { resolve, characterId, loading, error: resolveError } = useCharacterId();

  async function fetchCharacterId() {
    if (!account) return;
    const cid = await resolve(account.address);
    if (cid) {
      saveCharacterId(cid);
    }
  }

  return (
    <div style={{ paddingTop: "3rem", maxWidth: "560px" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
          Bind <span className="dim">Identity</span>
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
        {characterId && (
          <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <CheckCircle2 size={20} style={{ color: "var(--green)", flexShrink: 0 }} />
            <div>
              <p className="form-label">Character ID Resolved</p>
              <p className="mono" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--green)" }}>
                {characterId}
              </p>
            </div>
          </div>
        )}

        {resolveError && (
          <p style={{ fontSize: "0.7rem", color: "var(--martian-red)" }}>{resolveError}</p>
        )}

        {/* How it works */}
        <div style={{ fontSize: "0.7rem", color: "rgba(250,250,229,0.35)", lineHeight: "1.8" }}>
          <p style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>How identity binding works</p>
          <ol style={{ paddingLeft: "1rem" }}>
            <li>Connect your EVE Vault wallet.</li>
            <li>We query your wallet address for a <code className="mono">PlayerProfile</code> object.</li>
            <li>The <code className="mono">character_id</code> field is extracted and stored locally.</li>
            <li>Use this ID when posting or claiming bounties.</li>
          </ol>
        </div>

        {/* Action */}
        {account ? (
          <button
            className={`eve-btn eve-btn--primary eve-btn--full ${characterId ? "" : ""}`}
            onClick={fetchCharacterId}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Querying PlayerProfile…</>
            ) : characterId ? (
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
