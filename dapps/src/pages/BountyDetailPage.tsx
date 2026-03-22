
import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { ThreatBadge } from "../components/ThreatBadge";
import { useBountyDetail } from "../hooks/useBountyDetail";
import { useClaimBounty } from "../hooks/useClaimBounty";
import { useLastSeen } from "../hooks/useLastSeen";
import { TacticalTimelineModal } from "../components/TacticalTimelineModal";
import { IS_CONTRACT_DEPLOYED } from "../constants";
import { formatCountdown, formatAddress } from "../utils/formatters";
import { useBigShot } from "../context/BigShotContext";
import { getStarSystemName } from "../utils/systems";

export function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const account = useCurrentAccount();
  const { characterId } = useBigShot();

  // On-chain fetch
  const { bounty, loading: detailLoading } = useBountyDetail(id || "");
  const { claimBounty, loading: claiming, error: claimError } = useClaimBounty();

  // Fetch Last Seen info if we have the target's ID
  const { lastSeen, loading: lastSeenLoading } = useLastSeen(bounty?.targetCharacterId || "");

  const [countdown, setCountdown] = useState(0); // Initialized to 0, will be set by useEffect
  const [killmailId, setKillmailId] = useState("");
  const [hunterCharacterId, setHunterCharacterId] = useState(characterId || "");
  const [settled, setSettled] = useState(false);

  // Set countdown once bounty data is available
  useEffect(() => {
    if (bounty?.expiryTimestampMs) {
      setCountdown(bounty.expiryTimestampMs - Date.now());
    }
  }, [bounty?.expiryTimestampMs]);

  // Live countdown ticker
  useEffect(() => {
    if (!bounty?.expiryTimestampMs) return;
    const timer = setInterval(() => setCountdown(bounty.expiryTimestampMs - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [bounty?.expiryTimestampMs]);

  const isExpired = countdown <= 0;

  async function handleClaim() {
    if (!account || !killmailId) return;
    if (IS_CONTRACT_DEPLOYED && bounty) {
      try {
        await claimBounty({
          bountyId: id || "",
          coinType: bounty.coinType,
          killmailId,
          hunterCharacterId: hunterCharacterId,
        });
        setSettled(true);
      } catch {
        // claimError will be set by the hook
      }
    } else {
      // Preview mode stub
      await new Promise((r) => setTimeout(r, 1500));
      setSettled(true);
    }
  }

  if (detailLoading) {
    return (
      <div style={{ paddingTop: "5rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--brand)" }} />
        <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--brand)" }}>
          Loading Contract…
        </span>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div style={{ paddingTop: "5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
        <AlertTriangle size={40} style={{ color: "var(--amber)" }} />
        <p style={{ fontSize: "0.8rem", color: "rgba(250,250,229,0.5)" }}>Contract not found on-chain.</p>
        <a href="#/list" className="eve-btn">Return to Board</a>
      </div>
    );
  }

  const {
    targetCharacterId: displayTarget,
    rewardAmount: displayAmount,
    asset: displayAsset,
    issuer: displayIssuer,
    threatClass: displayThreat,
  } = bounty;


  return (
    <div style={{ paddingTop: "3rem" }}>
      {/* Back */}
      <a href="#/list" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(250,250,229,0.3)", marginBottom: "2.5rem" }}>
        <ArrowLeft size={12} /> Return to Board
      </a>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
        {/* ── Left: Details ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>
            <ThreatBadge level={displayThreat} size="lg" />
            <div>
              <h1 className="page-title glitch-hover" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "0.3rem" }}>
                {displayTarget}
              </h1>
              <p className="mono dim" style={{ fontSize: "0.7rem" }}>
                Contract ID: {id?.startsWith("0x") ? id.slice(0, 14) + "…" + id.slice(-6) : "0x" + id?.toUpperCase() + "…FF"}
              </p>
            </div>
          </div>

          <p className="dim" style={{ fontSize: "0.85rem", margin: "1rem 0" }}>
            This individual has been marked for termination by <span className="mono">{formatAddress(bounty.issuer)}</span>. Any licensed pod pilot who provides verifiable proof of termination inside a Frontier node is eligible to claim the reward pool.
          </p>

          {/* Tactical Intelligence: Last Seen */}
          <div style={{ marginTop: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.8rem", color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <MapPin size={14} /> TACTICAL INTELLIGENCE
              </h3>
              <TacticalTimelineModal targetCharacterId={bounty.targetCharacterId} targetName={displayTarget} />
            </div>
            <div style={{ background: "rgba(250,250,229,0.03)", border: "1px solid var(--eve-border)", padding: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span className="dim" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>Last Known Area</span>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "0.2rem", color: lastSeen ? "var(--brand)" : "var(--eve-text)" }}>
                    {lastSeenLoading ? "SCANNING..." : (lastSeen ? getStarSystemName(lastSeen.solarSystemId) : "UNKNOWN DEEP SPACE")}
                  </div>
                </div>
                <div>
                  <span className="dim" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>Signal Age</span>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: "0.2rem", color: lastSeen ? "var(--eve-text)" : "var(--eve-text)" }}>
                    {lastSeenLoading ? "..." : (lastSeen ? Math.floor((Date.now() - lastSeen.timestamp) / 60000) + " MINS AGO" : "N/A")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="industrial-panel">
            <p className="section-label" style={{ marginBottom: "1.25rem" }}>01 // Contract Parameters</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
              {[
                { label: "Reward", val: displayAmount + " " + displayAsset },
                { label: "Issuer", val: displayIssuer.startsWith("0x") ? displayIssuer.slice(0, 8) + "…" : displayIssuer },
                { label: "Coin Type", val: displayAsset },
              ].map((s) => (
                <div key={s.label}>
                  <p className="form-label">{s.label}</p>
                  <p className="mono" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="industrial-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p className="form-label">Contract Expires In</p>
              <p className="mono" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em", color: isExpired ? "var(--gray)" : "var(--brand)" }}>
                {formatCountdown(countdown)}
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
              <div>
                <p style={{ fontSize: "0.75rem", color: "rgba(250,250,229,0.5)", lineHeight: "1.7", marginBottom: "1rem" }}>
                  Submit the on-chain <strong>Frontier Killmail Object</strong> ID to claim the reward.
                  The contract verifies <em>victim_id</em>, <em>killer_id</em>, and kill timestamp.
                </p>

                {isExpired && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "var(--amber)", background: "rgba(255,145,0,0.07)", border: "1px solid rgba(255,145,0,0.2)", padding: "0.6rem 0.8rem", marginBottom: "1rem" }}>
                    <AlertTriangle size={14} />
                    Bounty has expired — only issuer can reclaim funds.
                  </div>
                )}
              </div>

              {/* Killmail Object ID */}
              <div>
                <label className="form-label">Killmail Object ID</label>
                <input
                  className="form-input"
                  type="text"
                  value={killmailId}
                  onChange={(e) => setKillmailId(e.target.value)}
                  placeholder="0x... (on-chain Killmail shared object ID)"
                  disabled={isExpired}
                />
                <p style={{ fontSize: "0.6rem", opacity: 0.25, marginTop: "0.3rem" }}>
                  Find the Killmail ID in your EVE Frontier client after a confirmed kill.
                </p>
              </div>

              {/* Hunter Character ID (needed for on-chain verification) */}
              {IS_CONTRACT_DEPLOYED && (
                <div>
                  <label className="form-label">Your Character Object ID</label>
                  <input
                    className="form-input"
                    type="text"
                    value={hunterCharacterId}
                    onChange={(e) => setHunterCharacterId(e.target.value)}
                    placeholder="0x... (your Character shared object ID)"
                    disabled={isExpired}
                  />
                </div>
              )}

              {claimError && (
                <p style={{ fontSize: "0.7rem", color: "var(--martian-red)" }}>{claimError}</p>
              )}

              <button
                className="eve-btn eve-btn--primary eve-btn--full"
                onClick={handleClaim}
                disabled={claiming || !account || !killmailId || isExpired || (IS_CONTRACT_DEPLOYED && !hunterCharacterId)}
                style={{ marginTop: "auto" }}
              >
                {claiming ? (
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
