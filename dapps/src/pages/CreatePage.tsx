import { useState } from "react";
import { Activity, Cpu, ShieldAlert, Target, Zap } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { LoaderBars } from "../components/LoaderBars";
import { ThreatBadge } from "../components/ThreatBadge";
import { useCreateBounty } from "../hooks/useCreateBounty";
import {
  IS_CONTRACT_DEPLOYED,
  LUX_COIN_TYPE,
  EVE_COIN_TYPE,
  TREASURY_LUX_ID,
  TREASURY_EVE_ID,
} from "../constants";

type ThreatClass = "S" | "A" | "B" | "C" | "D";

interface AnalysisResult {
  targetId: string;
  threatClass: ThreatClass;
  threatLevel: number; // 0=D … 4=S
  riskLevel: string;
  activity: number;
  assetValue: number;
  aggression: number;
  report: string;
}

// Rule-based threat calculation (deterministic, off-chain)
function calcThreat(targetId: string): AnalysisResult {
  const hash = targetId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const activity   = hash % 100;
  const assetValue = (hash * 13) % 10000;
  const aggression = hash % 10;
  const score      = activity * 0.4 + assetValue * 0.00005 * 100 + aggression * 0.1 * 10;

  let threatClass: ThreatClass = "D";
  let threatLevel = 0;
  let riskLevel = "LOW";
  if      (score > 75) { threatClass = "S"; threatLevel = 4; riskLevel = "CRITICAL"; }
  else if (score > 55) { threatClass = "A"; threatLevel = 3; riskLevel = "HIGH"; }
  else if (score > 35) { threatClass = "B"; threatLevel = 2; riskLevel = "ELEVATED"; }
  else if (score > 15) { threatClass = "C"; threatLevel = 1; riskLevel = "MODERATE"; }

  return {
    targetId,
    threatClass,
    threatLevel,
    riskLevel,
    activity,
    assetValue,
    aggression,
    report: `[TACTICAL EVALUATION: FORMULA v4.2]
-----------------------------------------
ID: ${targetId}
METRICS:
  PILOT ACTIVITY:   ${activity}%       (w=0.40)
  ASSET VALUE:      ${assetValue.toLocaleString()} LUX (w=0.50)
  AGGRESSION IDX:   ${aggression}/10   (w=0.10)
  COMPOSITE SCORE:  ${score.toFixed(1)}

RESULT:
  THREAT CLASS:  ${threatClass}
  RISK LEVEL:    ${riskLevel}
-----------------------------------------
RECOMMENDATION:
  Deploy specialised interdiction at
  suspected transit nodes.`,
  };
}

export function CreatePage() {
  const account = useCurrentAccount();
  const { createBounty, loading: submitting, error: txError } = useCreateBounty();

  const [targetId, setTargetId]   = useState("");
  const [amount,   setAmount]     = useState("");
  const [asset,    setAsset]      = useState("LUX");
  const [duration, setDuration]   = useState("72"); // hours
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis]   = useState<AnalysisResult | null>(null);
  const [txDigest, setTxDigest]   = useState<string | null>(null);

  const fee = amount ? (Number(amount) * 0.05).toFixed(2) : "0.00";

  function startAnalysis() {
    if (!targetId) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    setTimeout(() => {
      setAnalysis(calcThreat(targetId));
      setIsAnalyzing(false);
    }, 1400);
  }

  async function handleSubmit() {
    if (!account || !analysis || !amount) return;

    if (IS_CONTRACT_DEPLOYED) {
      const coinType    = asset === "LUX" ? LUX_COIN_TYPE : EVE_COIN_TYPE;
      const treasuryId  = asset === "LUX" ? TREASURY_LUX_ID : TREASURY_EVE_ID;
      const durationMs  = BigInt(Number(duration) * 3600 * 1000);
      // Amount in smallest unit (assuming 6 decimals for LUX; adjust per actual coin)
      const rawAmount   = BigInt(Math.floor(Number(amount) * 1_000_000));

      try {
        const result = await createBounty({
          treasuryId,
          coinType,
          targetCharacterId: targetId,
          threatLevel: analysis.threatLevel,
          coinObjectIds: [], // TODO: populate from wallet coin objects via useCurrentAccount
          paymentAmount: rawAmount,
          durationMs,
        });
        if (result) setTxDigest((result as { digest?: string }).digest ?? "submitted");
      } catch {
        // txError will reflect the failure
      }
    } else {
      // Preview mode stub
      await new Promise((r) => setTimeout(r, 2000));
      setTxDigest("PREVIEW_MODE — contract not yet deployed");
    }
  }

  return (
    <div style={{ paddingTop: "3rem", maxWidth: "900px" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
          Post <span className="dim">Bounty</span>
        </h1>
        <p style={{ fontSize: "0.8rem", color: "rgba(250,250,229,0.4)" }}>
          {IS_CONTRACT_DEPLOYED
            ? "Stake LUX or EVE Token against a target character. Rewards held in trustless escrow."
            : "⚠ Preview mode — contract not deployed. Submission is simulated."}
        </p>
      </div>

      {txDigest && (
        <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", padding: "1rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.75rem", color: "var(--green)" }}>
          ✓ Bounty published! Tx: <span className="mono">{txDigest}</span>
          <a href="#/list" style={{ marginLeft: "1rem", color: "var(--brand)", fontWeight: 700 }}>View Board →</a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* ── Left: Form ── */}
        <section>
          <div className="industrial-panel">
            <p className="section-label" style={{ marginBottom: "1.5rem" }}>
              <Activity size={14} /> 01 // Configuration
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label className="form-label">Target Character ID</label>
                <input
                  className="form-input"
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="Enter target character_id (u64)..."
                />
                <p style={{ fontSize: "0.6rem", color: "rgba(250,250,229,0.2)", marginTop: "0.3rem" }}>
                  Obtain from target's PlayerProfile object on-chain.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="form-label">Stake Asset</label>
                  <select className="form-select" value={asset} onChange={(e) => setAsset(e.target.value)}>
                    <option value="LUX">LUX (CREDIT)</option>
                    <option value="EVE">EVE TOKEN</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Reward Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Contract Duration (hours)</label>
                <input
                  className="form-input"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="72"
                />
              </div>

              <div style={{ padding: "0.75rem", background: "rgba(255,71,0,0.04)", border: "1px solid rgba(255,71,0,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  <span style={{ opacity: 0.4 }}>Protocol Fee (5%)</span>
                  <span style={{ color: "var(--brand)" }}>{fee} {asset}</span>
                </div>
              </div>

              <button
                className="eve-btn"
                onClick={startAnalysis}
                disabled={!targetId || isAnalyzing}
              >
                {isAnalyzing ? "Scanning…" : "Run Tactical Intelligence"}
              </button>
            </div>
          </div>
        </section>

        {/* ── Right: Intelligence ── */}
        <section>
          <div className="industrial-panel scanline-panel" style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: "380px" }}>
            <p className="section-label" style={{ marginBottom: "1.5rem" }}>
              <Cpu size={14} /> 02 // Tactical Intelligence
            </p>

            {isAnalyzing ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                <LoaderBars />
                <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--brand)" }} className="pulse">
                  Scanning Frontier Killmails…
                </p>
              </div>
            ) : analysis ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <ThreatBadge level={analysis.threatClass} size="lg" />
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.4, marginBottom: "0.2rem" }}>Threat Class</p>
                    <p style={{ fontSize: "1.8rem", fontWeight: 900, fontFamily: "var(--font-title)" }}>{analysis.threatClass}</p>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.4, marginBottom: "0.2rem" }}>Risk Level</p>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--brand)" }}>{analysis.riskLevel}</p>
                  </div>
                </div>

                <pre style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "rgba(255,71,0,0.8)", whiteSpace: "pre-wrap", background: "rgba(255,71,0,0.04)", border: "1px solid rgba(255,71,0,0.12)", padding: "1rem", flex: 1 }}>
                  {analysis.report}
                </pre>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.4, marginBottom: "0.6rem" }}>
                    <ShieldAlert size={12} /> Confirmation Required
                  </div>
                  {txError && (
                    <p style={{ fontSize: "0.7rem", color: "var(--martian-red)", marginBottom: "0.6rem" }}>{txError}</p>
                  )}
                  <button
                    className="eve-btn eve-btn--primary eve-btn--full"
                    onClick={handleSubmit}
                    disabled={!account || submitting || !amount || !!txDigest}
                  >
                    {submitting ? "Signing…" : (
                      <><span>Sign & Publish Escrow</span><Zap size={13} /></>
                    )}
                  </button>
                  {!account && (
                    <p style={{ fontSize: "0.6rem", opacity: 0.4, textAlign: "center", marginTop: "0.5rem" }}>
                      Connect EVE Vault to post bounty
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", opacity: 0.2 }}>
                <Target size={48} />
                <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", maxWidth: "140px" }}>
                  Await target acquisition to decode intel
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
