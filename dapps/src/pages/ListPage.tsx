import { useState } from "react";
import { Search, Filter, ArrowUpRight } from "lucide-react";
import { ThreatBadge } from "../components/ThreatBadge";

// Mock data — will be replaced with on-chain query
const MOCK_BOUNTIES = [
  { id: "b1", target: "Kyla Vheren",       issuerId: "7778881", amount: "5,000",  asset: "EVE Token", status: "Active",  threat: "S" as const },
  { id: "b2", target: "Siren's Call",       issuerId: "9992224", amount: "1,200",  asset: "LUX",       status: "Active",  threat: "B" as const },
  { id: "b3", target: "Malfunctioning AI",  issuerId: "Admin",   amount: "10,000", asset: "EVE Token", status: "Active",  threat: "S" as const },
  { id: "b4", target: "Miner X-Ray",        issuerId: "1234567", amount: "450",    asset: "LUX",       status: "Claimed", threat: "C" as const },
];

export function ListPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_BOUNTIES.filter((b) =>
    b.target.toLowerCase().includes(search.toLowerCase()),
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
            Active player-to-player kill contracts within Frontier nodes.
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

      {/* Table */}
      <div className="industrial-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Threat</th>
                <th>Target Identity</th>
                <th>Reward</th>
                <th>Issuer ID</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ cursor: "pointer" }}>
                  <td><ThreatBadge level={b.threat} /></td>
                  <td>
                    <a href={`#/bounty/${b.id}`} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem" }}>
                        {b.target}
                        <ArrowUpRight size={12} style={{ color: "var(--brand)", opacity: 0.6 }} />
                      </span>
                      <span className="mono dim" style={{ fontSize: "0.65rem" }}>
                        0x{b.id.toUpperCase()}...7F
                      </span>
                    </a>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{b.amount}</span>
                      <span className="tag tag-brand">{b.asset}</span>
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: "0.75rem", opacity: 0.4 }}>{b.issuerId}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`status-${b.status.toLowerCase()}`} style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
        <button className="eve-btn" style={{ padding: "0.6rem 3rem" }}>Load Archived Records</button>
      </div>
    </div>
  );
}
