import { useConnection } from "@evefrontier/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { ArrowRight, Shield, Zap, Lock } from "lucide-react";

const FEATURES = [
  {
    icon: <Shield size={20} />,
    title: "On-Chain Escrow",
    desc: "LUX / EVE Token staked in a trustless Move smart contract. No middlemen, no custodians.",
  },
  {
    icon: <Zap size={20} />,
    title: "Native Killmail Proof",
    desc: "Claim rewards using the native Frontier Killmail object — no screenshots, no disputes.",
  },
  {
    icon: <Lock size={20} />,
    title: "Anonymous Claims",
    desc: "zkLogin lets hunters receive rewards with zero on-chain identity exposure.",
  },
];

export function HomePage() {
  const { handleConnect } = useConnection();
  const account = useCurrentAccount();

  return (
    <div style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      {/* Hero */}
      <div className="animate-in" style={{ maxWidth: "680px", marginBottom: "5rem" }}>
        <p className="section-label" style={{ marginBottom: "1.5rem" }}>
          EVE Frontier // Decentralised Bounty Protocol
        </p>
        <h1 className="page-title" style={{ marginBottom: "1.5rem" }}>
          Hunt.<br />
          <span className="dim">Collect.</span><br />
          Survive.
        </h1>
        <p style={{ fontSize: "1rem", color: "rgba(250,250,229,0.5)", lineHeight: "1.7", marginBottom: "2.5rem", maxWidth: "480px" }}>
          Post asset-backed kill orders against any Frontier character.
          Hunters claim rewards by submitting the on-chain Killmail — fully trustless.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {account ? (
            <a href="#/list" className="eve-btn eve-btn--primary">
              View Bounty Board <ArrowRight size={14} />
            </a>
          ) : (
            <button className="eve-btn eve-btn--primary" onClick={handleConnect}>
              Connect EVE Vault <ArrowRight size={14} />
            </button>
          )}
          <a href="#/create" className="eve-btn">Post a Bounty</a>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="industrial-panel animate-in"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div style={{ color: "var(--brand)", marginBottom: "1rem" }}>{f.icon}</div>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>
              {f.title}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "rgba(250,250,229,0.45)", lineHeight: "1.6" }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div
        className="industrial-panel"
        style={{ marginTop: "4rem", display: "flex", gap: "3rem", flexWrap: "wrap" }}
      >
        {[
          { label: "Active Bounties", val: "—" },
          { label: "Total Staked (LUX)", val: "—" },
          { label: "Kills Confirmed", val: "—" },
          { label: "Protocol Version", val: "v0.1.0" },
        ].map((s) => (
          <div key={s.label}>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(250,250,229,0.3)", marginBottom: "0.3rem" }}>
              {s.label}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 700, color: "var(--brand)" }}>
              {s.val}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
