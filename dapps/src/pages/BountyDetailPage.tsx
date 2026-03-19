import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { ThreatBadge } from "../components/ThreatBadge";

// Mock bounty data — replace with `getObjectWithJson(id)` query
function getMockBounty(id: string) {
  const map: Record<string, {
    id: string; target: string; amount: string; asset: string;
    threat: string; issuer: string; created: string; expiryMs: number;
  }> = {
    b1: { id, target: "Kyla Vheren",      amount: "5,000",  asset: "EVE Token", threat: "S", issuer: "7778881", created: "2026-03-15", expiryMs: Date.now() + 48 * 3600000 },
    b2: { id, target: "Siren's Call",      amount: "1,200",  asset: "LUX",       threat: "B", issuer: "9992224", created: "2026-03-16", expiryMs: Date.now() +  8 * 3600000 },
    b3: { id, target: "Malfunctioning AI", amount: "10,000", asset: "EVE Token", threat: "S", issuer: "Admin",   created: "2026-03-14", expiryMs: Date.now() + 96 * 3600000 },
  };
  return map[id] ?? { id, target: "Unknown Target", amount: "—", asset: "LUX", threat: "D", issuer: "Unknown", created: "—", expiryMs: Date.now() };
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "EXPIRED";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BountyDetailPage({ id }: { id: string }) {
  const account = useCurrentAccount();
  const bounty  = getMockBounty(id);

  const [killmailId, setKillmailId] = useState("");
  const [settling,   setSettling]   = useState(false);
  const [settled,    setSettled]    = useState(false);
  const [error,      setError]      = useState("");

  const remaining = bounty.expiryMs - Date.now();
  const isExpired = remaining <= 0;

  async function handleClaim() {
    if (!account || !killmailId) return;
    setSettling(true);
    setError("");
    // TODO: call useClaimBounty hook → buildClaimBountyTx
    await new Promise((r) => setTimeout(r, 2000));
    setSettling(false);
    setSettled(true);
  }

  return (
    <div style={{ paddingTop: "3rem" }}>
      {/* Back */}
      <a href="#/list" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(250,250,229,0.3)", marginBottom: "2.5rem" }}>
        <ArrowLeft size={12} /> Return to Board
      </a>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
        {/* ── Left: Details ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Title block */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>
            <ThreatBadge level={bounty.threat} size="lg" />
            <div>
              <h1 className="page-title glitch-hover" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "0.3rem" }}>
                {bounty.target}
              </h1>
              <p className="mono dim" style={{ fontSize: "0.7rem" }}>Contract ID: {bounty.id}.toUpperCase()…FF</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="industrial-panel">
            <p className="section-label" style={{ marginBottom: "1.25rem" }}>01 // Contract Parameters</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
              {[
                { label: "Reward",   val: `${bounty.amount} ${bounty.asset}` },
                { label: "Issuer ID", val: bounty.issuer },
                { label: "Posted",   val: bounty.created },
              ].map((s) => (
                <div key={s.label}>
                  <p className="form-label">{s.label}</p>
                  <p className="mono" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Countdown */}
          <div className="industrial-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p className="form-label">Contract Expires In</p>
              <p className="mono" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em", color: isExpired ? "var(--gray)" : "var(--brand)" }}>
                {formatCountdown(remaining)}
              </p>
            </div>
            {isExpired && (
              <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gray)", border: "1px solid var(--gray)", padding: "0.3rem 0.6rem" }}>
                EXPIRED
              </span>
            )}
          </div>
        </div>

        {/* ── Right: Action Center ── */}
        <div className="industrial-panel scanline-panel" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p className="section-label">02 // Action Center</p>

          {settled ? (
            /* Success state */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", textAlign: "center" }}>
              <CheckCircle2 size={40} style={{ color: "var(--green)" }} />
              <h3 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--green)" }}>
                Contract Settled
              </h3>
              <p style={{ fontSize: "0.7rem", opacity: 0.4, maxWidth: "220px" }}>
                Reward assets have been trustlessly released to your hunter address.
              </p>
              <a href="#/list" className="eve-btn eve-btn--full" style={{ marginTop: "0.5rem" }}>Return to Board</a>
            </div>
          ) : (
            <>
              {/* Info */}
              <div>
                <p style={{ fontSize: "0.75rem", color: "rgba(250,250,229,0.5)", lineHeight: "1.7", marginBottom: "1rem" }}>
                  Submit the native <strong>Frontier Killmail Object</strong> ID to claim the reward.
                  The contract will verify <em>victim_id</em>, <em>killer_id</em>, and kill timestamp on-chain.
                </p>

                {isExpired && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "var(--amber)", background: "rgba(255,145,0,0.07)", border: "1px solid rgba(255,145,0,0.2)", padding: "0.6rem 0.8rem", marginBottom: "1rem" }}>
                    <AlertTriangle size={14} />
                    Bounty has expired — only issuer can reclaim funds.
                  </div>
                )}
              </div>

              {/* Killmail input */}
              <div>
                <label className="form-label">Killmail Object ID</label>
                <input
                  className="form-input"
                  type="text"
                  value={killmailId}
                  onChange={(e) => setKillmailId(e.target.value)}
                  placeholder="0x... (on-chain Killmail ID)"
                  disabled={isExpired}
                />
                <p style={{ fontSize: "0.6rem", opacity: 0.25, marginTop: "0.3rem" }}>
                  Find your Killmail ID in EVE Frontier explorer after a confirmed kill.
                </p>
              </div>

              {error && (
                <p style={{ fontSize: "0.7rem", color: "var(--martian-red)" }}>{error}</p>
              )}

              {/* Claim button */}
              <button
                className="eve-btn eve-btn--primary eve-btn--full"
                onClick={handleClaim}
                disabled={settling || !account || !killmailId || isExpired}
                style={{ marginTop: "auto" }}
              >
                {settling ? (
                  <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Verifying Killmail…</>
                ) : (
                  "Submit Killmail & Claim"
                )}
              </button>

              {!account && (
                <p style={{ fontSize: "0.6rem", opacity: 0.3, textAlign: "center" }}>
                  Connect EVE Vault to claim
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
