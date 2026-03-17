"use client";

import { useState } from "react";
import { MoveRight, Target, Activity, Zap, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";

export default function CreateBountyPage() {
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState("SUI");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const startAnalysis = () => {
    if (!targetId) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysis(`[TACTICAL EVALUATION COMPLETE]
-----------------------------------------
ID: ${targetId}
THREAT CLASS: S (EXTREME)
RISK LEVEL: 94.2% CRITICAL
-----------------------------------------
VULNERABILITY DETECTED: 
Target exhibits consistent transit routes through 
unsecured wormhole nodes. Recommendation: 
Deploy Interdictor-class bubbles at gate 0-G8TT.`);
    }, 2000);
  };

  return (
    <div className="py-12 space-y-8 max-w-4xl">
      <div className="space-y-4">
        <h1 className="page-title mb-0">Post <span className="text-white/20">Bounty</span></h1>
        <p className="text-eve-cream/60">Initialize an asset-staked contract against a target identity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Issuance Form */}
        <section className="space-y-6">
          <div className="industrial-panel space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-martian-red flex items-center gap-2">
              <Activity size={16} /> 01 // Configuration
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-eve-cream/30 tracking-widest">Target Player ID</label>
                <input 
                  type="text" 
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="PLAYER_IDENTITY..."
                  className="w-full bg-eve-black border border-eve-cream/10 p-3 text-sm focus:border-martian-red/50 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-eve-cream/30 tracking-widest">Stake Asset</label>
                  <select 
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="w-full bg-eve-black border border-eve-cream/10 p-3 text-sm focus:border-martian-red/50 outline-none transition-colors appearance-none"
                  >
                    <option value="SUI">SUI_NETWORK</option>
                    <option value="EVE">EVE_TOKEN</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-eve-cream/30 tracking-widest">Reward Amount</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-eve-black border border-eve-cream/10 p-3 text-sm focus:border-martian-red/50 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="p-3 bg-martian-red/5 border border-martian-red/20 rounded-sm">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-eve-cream/40">Protocol Fee (5%)</span>
                  <span className="text-martian-red">{amount ? (Number(amount) * 0.05).toFixed(2) : "0.00"} {asset}</span>
                </div>
              </div>

              <button 
                onClick={startAnalysis}
                disabled={!targetId || isAnalyzing}
                className="eve-btn eve-btn--primary w-full text-xs disabled:opacity-50"
              >
                {isAnalyzing ? "Processing Intelligence..." : "Initiate Tactical Briefing"}
              </button>
            </div>
          </div>
        </section>

        {/* Tactical Intel */}
        <section className="space-y-6">
          <div className="industrial-panel h-full flex flex-col min-h-[300px]">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-martian-red flex items-center gap-2 mb-6">
              <Cpu size={16} /> 02 // Tactical Briefing (LLM)
            </h2>

            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <LoaderAnimation />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff4700] animate-pulse">Scraping Frontier Killmails...</p>
              </div>
            ) : analysis ? (
              <div className="flex-1 space-y-6">
                <pre className="text-[11px] font-mono leading-relaxed text-[#ff4700] whitespace-pre-wrap bg-martian-red/5 p-4 border border-martian-red/20">
                  {analysis}
                </pre>
                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 text-[10px] text-eve-cream/30 uppercase font-bold tracking-widest">
                    <ShieldAlert size={14} /> Confirmation Required
                  </div>
                  <button className="eve-btn eve-btn--primary w-full text-xs">
                    Sign & Publish Escrow <Zap size={14} className="ml-2" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                <Target size={48} />
                <p className="text-[10px] font-bold uppercase tracking-widest max-w-[150px]">Await target acquisition to decode intel</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function LoaderAnimation() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div 
          key={i}
          className="w-1.5 h-6 bg-martian-red animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
