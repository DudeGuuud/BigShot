"use client";

import Link from "next/link";
import { useConnection } from "@/hooks/useConnection";
import { MoveRight, ShieldCheck, Zap, Target } from "lucide-react";

export default function LandingPage() {
  const { isConnected, handleConnect } = useConnection();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 text-center relative z-10">
      {/* Hero Content */}
      <div className="max-w-4xl space-y-8 animate-fade-in-up">


        <h1 className="page-title">
          The Frontier&apos;s <br />
          <span className="text-white/20">Premiere Bounty Board</span>
        </h1>

        <p className="text-xl text-eve-cream/60 max-w-2xl mx-auto font-light leading-relaxed">
          Staked player-to-player contracts for the EVE Frontier living sandbox.
          Enforce justice, settle debts, and eliminate threats with cryptographic certainty.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          {isConnected ? (
            <Link href="/bind" className="eve-btn eve-btn--primary px-10">
              Enter Operations Center <MoveRight size={18} className="ml-2" />
            </Link>
          ) : (
            <button
              onClick={handleConnect}
              className="eve-btn eve-btn--primary px-10"
            >
              Access with EVE Vault <MoveRight size={18} className="ml-2" />
            </button>
          )}
          <Link href="/list" className="eve-btn px-10">
            View Public Board
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
        <div className="industrial-panel space-y-4 text-left">
          <div className="text-martian-red flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
            <ShieldCheck size={16} /> Identity Based
          </div>
          <p className="text-sm text-eve-cream/50 leading-relaxed">
            Directly mapped to Smart Characters. No aliases, no hiding. Identity is the ultimate collateral.
          </p>
        </div>

        <div className="industrial-panel space-y-4 text-left">
          <div className="text-martian-red flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
            <Target size={16} /> Proof of Kill
          </div>
          <p className="text-sm text-eve-cream/50 leading-relaxed">
            Automated contract settlement via Killmail verification. Fast, trustless, and immutable.
          </p>
        </div>

        <div className="industrial-panel space-y-4 text-left">
          <div className="text-martian-red flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
            <Zap size={16} /> Asset Escrow
          </div>
          <p className="text-sm text-eve-cream/50 leading-relaxed">
            Bounty assets are locked in the EVE Vault until the kill is confirmed. 0% risk for bounty hunters.
          </p>
        </div>
      </div>
    </div>
  );
}


