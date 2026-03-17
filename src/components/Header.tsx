"use client";

import Link from "next/link";
import { useConnection } from "@/hooks/useConnection";
import { Wallet, LogOut } from "lucide-react";

export const Header = () => {
  const { isConnected, address, handleConnect, handleDisconnect } = useConnection();

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-[#fafae520] bg-eve-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-martian-red">
            BIGSHOT
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/list" className="nav-link">Bounties</Link>
            <Link href="/create" className="nav-link">Post Bounty</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-eve-cream/50 bg-eve-cream/5 px-2 py-1 border border-eve-cream/10">
                {address}
              </span>
              <button 
                onClick={handleDisconnect}
                className="p-2 text-eve-cream/50 hover:text-martian-red transition-colors"
                title="Disconnect"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnect}
              className="eve-btn eve-btn--primary text-xs"
            >
              <Wallet size={16} className="mr-1" />
              Connect EVE Vault
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
