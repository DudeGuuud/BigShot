import { abbreviateAddress, useConnection } from "@evefrontier/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { Crosshair, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { label: "Board", href: "#/list" },
  { label: "Post Bounty", href: "#/create" },
  { label: "Bind Identity", href: "#/bind" },
];

export function Header() {
  const { handleConnect, handleDisconnect } = useConnection();
  const account = useCurrentAccount();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentHash = window.location.hash;

  return (
    <header className="site-header">
      <a href="#/" className="site-logo">
        <Crosshair size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
        BIGSHOT
      </a>

      {/* Desktop nav */}
      <nav className="site-nav" style={{ display: "flex" }}>
        {NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            className={`nav-link ${currentHash === n.href ? "active" : ""}`}
          >
            {n.label}
          </a>
        ))}
      </nav>

      {/* Wallet button */}
      <button
        className="eve-btn"
        onClick={() => (account?.address ? handleDisconnect() : handleConnect())}
      >
        {account ? abbreviateAddress(account.address) : "Connect EVE Vault"}
      </button>

      {/* Mobile menu toggle */}
      <button
        className="eve-btn"
        style={{ display: "none" }}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={16} /> : <Menu size={16} />}
      </button>
    </header>
  );
}
