"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpRight, Timer, Target } from "lucide-react";

const MOCK_BOUNTIES = [
  { id: "b1", target: "Kyla Vheren", issuerId: "7778881", amount: "5,000", asset: "EVE", status: "Active", threat: "S" },
  { id: "b2", target: "Siren's Call", issuerId: "9992224", amount: "1,200", asset: "SUI", status: "Active", threat: "B" },
  { id: "b3", target: "Malfunctioning AI", issuerId: "Admin", amount: "10,000", asset: "EVE", status: "Active", threat: "S" },
  { id: "b4", target: "Miner X-Ray", issuerId: "1234567", amount: "450", asset: "SUI", status: "Claimed", threat: "C" },
];

export default function ListPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBounties = MOCK_BOUNTIES.filter(b => 
    b.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="page-title mb-0">Contract <span className="text-white/20">Board</span></h1>
          <p className="text-eve-cream/60">Active player-to-player bounty contracts within Frontier nodes.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-eve-cream/5 border border-eve-cream/10 p-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-eve-cream/30" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH CONTRACTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs font-bold tracking-widest pl-10 pr-4 py-2 w-64 outline-none"
            />
          </div>
          <button className="p-2 hover:bg-martian-red/10 text-eve-cream/40 hover:text-martian-red transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="industrial-panel p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-eve-cream/5 text-[10px] font-bold uppercase tracking-[0.2em] text-eve-cream/30 border-b border-eve-cream/10">
              <tr>
                <th className="px-6 py-4">Threat</th>
                <th className="px-6 py-4">Target Identity</th>
                <th className="px-10 py-4">Reward Asset</th>
                <th className="px-6 py-4">Issuer ID</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-eve-cream/5">
              {filteredBounties.map((b) => (
                <tr key={b.id} className="group hover:bg-martian-red/[0.02] transition-colors cursor-pointer relative">
                  <td className="px-6 py-5">
                    <div className={`w-8 h-8 flex items-center justify-center font-bold text-black text-xs ${b.threat === 'S' ? 'bg-martian-red shadow-[0_0_10px_rgba(255,71,0,0.3)]' : 'bg-eve-cream'}`}>
                      {b.threat}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Link href={`/bounty/${b.id}`} className="flex flex-col">
                      <span className="text-sm font-bold group-hover:text-martian-red transition-colors flex items-center gap-2">
                        {b.target} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-martian-red" />
                      </span>
                      <span className="text-[10px] text-eve-cream/30 font-mono">0x{b.id.toUpperCase()}...7F</span>
                    </Link>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{b.amount}</span>
                      <span className="text-[10px] text-martian-red font-bold px-1.5 py-0.5 border border-martian-red/30 bg-martian-red/5">
                        {b.asset}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-mono text-eve-cream/40">{b.issuerId}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${b.status === 'Active' ? 'text-green-500' : 'text-eve-cream/20'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button className="eve-btn px-12 text-xs">Load Archived Records</button>
      </div>
    </div>
  );
}
