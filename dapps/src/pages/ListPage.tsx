import { useState } from "react";
import { Search, Filter, ArrowUpRight, Loader2, AlertTriangle } from "lucide-react";
import { ThreatBadge } from "../components/ThreatBadge";
import { useBounties, OnChainBounty } from "../hooks/useBounties";
import { IS_CONTRACT_DEPLOYED } from "../constants";

// Mock fallback — shown when the contract is not yet deployed
const MOCK_BOUNTIES: OnChainBounty[] = [
  { id: "b1", issuer: "7778881", targetCharacterId: "Kyla Vheren",      rewardAmount: "5,000",  coinType: "eve_token", asset: "EVE", expiryTimestampMs: Date.now() + 48*3600000, threatLevel: 4, threatClass: "S", isClaimed: false },
  { id: "b2", issuer: "9992224", targetCharacterId: "Siren's Call",      rewardAmount: "1,200",  coinType: "lux",       asset: "LUX", expiryTimestampMs: Date.now() +  8*3600000, threatLevel: 2, threatClass: "B", isClaimed: false },
  { id: "b3", issuer: "Admin",   targetCharacterId: "Malfunctioning AI", rewardAmount: "10,000", coinType: "eve_token", asset: "EVE", expiryTimestampMs: Date.now() + 96*3600000, threatLevel: 4, threatClass: "S", isClaimed: false },
  { id: "b4", issuer: "1234567", targetCharacterId: "Miner X-Ray",       rewardAmount: "450",    coinType: "lux",       asset: "LUX", expiryTimestampMs: Date.now() -  1*3600000, threatLevel: 1, threatClass: "C", isClaimed: true },
];

export function ListPage() {
  const [search, setSearch] = useState("");
  const { bounties: onChainBounties, loading, error } = useBounties();

  // Use on-chain data when deployed, mock otherwise
  const source = IS_CONTRACT_DEPLOYED ? onChainBounties : MOCK_BOUNTIES;
  const filtered = source.filter((b) =>
    b.targetCharacterId.toLowerCase().includes(search.toLowerCase()) ||
    b.issuer.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ paddingTop: "3rem" }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
            Contract <span className="dim">Board</span>
          </h1>
          <p style={{ fontSize: "0.8rem", color: "rgba(250,250,229,0.4)" }}>
            {IS_CONTRACT_DEPLOYED
              ? "Live on-chain kill contracts within Frontier nodes."
              : "⚠ Preview mode — contract not yet deployed. Showing mock data."}
          </p>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(250,250,229,0.04)", border: "1px solid var(--eve-border)", padding: "0.25rem" }}>
          <Search size={14} style={{ color: "rgba(250,250,229,0.3)", marginLeft: "0.5rem" }} />
          <input
            type="text"
            className="form-input"
            placeholder="SEARCH CONTRACTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", width: "220px", padding: "0.4rem 0.5rem" }}
          />
          <button className="eve-btn" style={{ padding: "0.4rem 0.6rem" }}>
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "3rem", justifyContent: "center" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--brand)" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--brand)" }}>
            Querying Frontier Nodes…
          </span>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", background: "rgba(255,145,0,0.05)", border: "1px solid rgba(255,145,0,0.2)", marginBottom: "1.5rem", fontSize: "0.75rem", color: "var(--amber)" }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="industrial-panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Threat</th>
                  <th>Target ID</th>
                  <th>Reward</th>
                  <th>Issuer</th>
                  <th style={{ textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "3rem", opacity: 0.3, fontSize: "0.8rem" }}>
                      No active contracts found.
                    </td>
                  </tr>
                ) : filtered.map((b) => {
                  const isExpired = Date.now() > b.expiryTimestampMs;
                  const status = b.isClaimed ? "Claimed" : isExpired ? "Expired" : "Active";
                  return (
                    <tr key={b.id} style={{ cursor: "pointer" }}>
                      <td><ThreatBadge level={b.threatClass} /></td>
                      <td>
                        <a href={`#/bounty/${b.id}`} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}>
                            {b.targetCharacterId}
                            <ArrowUpRight size={12} style={{ color: "var(--brand)", opacity: 0.6 }} />
                          </span>
                          <span className="mono dim" style={{ fontSize: "0.65rem" }}>
                            {b.id.startsWith("0x") ? `${b.id.slice(0, 10)}…${b.id.slice(-4)}` : `0x${b.id.toUpperCase()}…7F`}
                          </span>
                        </a>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{b.rewardAmount}</span>
                          <span className="tag tag-brand">{b.asset}</span>
                        </div>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: "0.75rem", opacity: 0.4 }}>
                          {b.issuer.startsWith("0x") ? `${b.issuer.slice(0,8)}…` : b.issuer}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`status-${status.toLowerCase()}`} style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
        <button className="eve-btn" style={{ padding: "0.6rem 3rem" }}>Load Archived Records</button>
      </div>
    </div>
  );
}
