"use client";

import { useConnection } from "@/hooks/useConnection";
import { MoveLeft, Target, ShieldCheck, Zap, History, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function BountyDetailsPage({ params }: { params: { id: string } }) {
  const { isConnected } = useConnection();
  const [isSettling, setIsSettling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Mock data for the specific bounty
  const bounty = {
    id: params.id,
    target: params.id === "b1" ? "Kyla Vheren" : "Designated Target",
    amount: "5,000",
    asset: "EVE Token",
    threat: "S",
    issuer: "Character_7778881",
    created: "2026-03-15",
    status: isCompleted ? "Settled" : "Active",
  };

  const handleSettle = () => {
    setIsSettling(true);
    setTimeout(() => {
      setIsSettling(false);
      setIsCompleted(true);
    }, 2500);
  };

  return (
    <div className="py-12 space-y-12">
      <Link href="/list" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-eve-cream/40 hover:text-martian-red transition-colors">
        <MoveLeft size={14} /> Return to Board
      </Link>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Contract Details */}
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <div 
              className="w-12 h-12 flex items-center justify-center font-bold text-black text-lg transition-colors"
              style={{
                backgroundColor: 
                  bounty.threat === 'S' ? '#FF2A2A' : 
                  bounty.threat === 'A' ? '#FF9100' : 
                  bounty.threat === 'B' ? '#FFD700' : 
                  bounty.threat === 'C' ? '#00E5FF' : 
                  '#A0A0A0'
              }}
            >
              {bounty.threat}
            </div>
            <h1 className="page-title mb-0">{bounty.target}</h1>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-eve-cream/30">
              <span className="flex items-center gap-2 px-2 py-0.5 border border-eve-cream/10 bg-eve-cream/5 text-eve-cream/60">
                <Target size={12} /> CID: {bounty.id.toUpperCase()}
              </span>
              <span>Issued: {bounty.created}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="industrial-panel space-y-2">
              <span className="text-[10px] uppercase text-eve-cream/30 font-bold tracking-widest">Stake Escrow</span>
              <div className="text-3xl font-bold flex items-baseline gap-2">
                {bounty.amount} <span className="text-sm text-martian-red uppercase">{bounty.asset}</span>
              </div>
            </div>
            <div className="industrial-panel space-y-2">
              <span className="text-[10px] uppercase text-eve-cream/30 font-bold tracking-widest">Contract Issuer</span>
              <div className="text-base font-mono text-eve-cream/60">{bounty.issuer}</div>
            </div>
          </div>

          <div className="industrial-panel space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-martian-red flex items-center gap-2">
              <History size={16} /> Operational Ownership Data
            </h3>
            <div className="space-y-4 text-sm text-eve-cream/60 leading-relaxed">
              <p>
                Pursuant to the **BigShot Ownership Model**, this contract is trustlessly collateralized. 
                Liquidated assets are held in a secure multi-sig arrangement linked to the Frontier Sandbox.
              </p>
              <div className="flex items-center gap-3 bg-martian-red/5 border border-martian-red/20 p-3 text-[11px] font-mono">
                <ShieldCheck size={14} className="text-martian-red" /> 
                PERMISSION_CHECK: ALL_IDENTITIES_MAPPED
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Action Center */}
        <div className="lg:w-96">
          <div className="industrial-panel h-full border-martian-red/30 bg-martian-red/[0.03] space-y-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-martian-red flex items-center gap-2">
              <Zap size={16} /> Action Center
            </h2>

            {isCompleted ? (
              <div className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 border border-green-500/30">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-widest text-green-500">Contract Settled</h3>
                  <p className="text-xs text-eve-cream/40">Reward assets have been trustlessly released to the hunter address.</p>
                </div>
                <Link href="/list" className="eve-btn w-full text-xs">Return to Board</Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-xs text-eve-cream/50 leading-relaxed">
                    To claim the reward, the native <strong>Frontier Killmail Object</strong> must be submitted via the neural link.
                  </p>
                  <div className="industrial-panel bg-eve-black p-4 border-dashed border-martian-red/20">
                    <p className="text-[10px] text-eve-cream/20 uppercase font-bold text-center italic">
                      [SUBMIT KILLMAIL OBJECT]
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleSettle}
                  disabled={isSettling || !isConnected}
                  className="eve-btn eve-btn--primary w-full text-xs disabled:opacity-50"
                >
                  {isSettling ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={14} />
                      Verifying Killmail...
                    </>
                  ) : (
                    "Submit Killmail & Settle"
                  )}
                </button>
                
                {!isConnected && (
                  <p className="text-[9px] text-martian-red text-center uppercase font-bold animate-pulse">
                    Identity not connected. Access restricted.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
