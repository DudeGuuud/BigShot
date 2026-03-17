"use client";

import { useConnection } from "@/hooks/useConnection";
import { useSmartCharacter } from "@/hooks/useSmartCharacter";
import { User, ShieldCheck, MoveRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function BindPage() {
  const { isConnected, address } = useConnection();
  const { profiles, isLoading } = useSmartCharacter(address);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <ShieldCheck size={48} className="text-white/20" />
        <h2 className="text-2xl font-bold uppercase tracking-widest">Unauthorized Access</h2>
        <p className="text-eve-cream/60">Connect your EVE Vault identity to bind a Smart Character.</p>
        <Link href="/" className="eve-btn">Back to Landing</Link>
      </div>
    );
  }

  return (
    <div className="py-12 space-y-12">
      <div className="space-y-4">
        <h1 className="page-title">Identity <span className="text-white/20">Binding</span></h1>
        <p className="text-eve-cream/60 max-w-xl">
          Select a Smart Character from your EVE Vault to map to the BigShot protocol. 
          Bounties issued and claimed will be tethered to this character identity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-martian-red" size={32} />
            <p className="text-xs font-bold uppercase tracking-widest text-eve-cream/30">Querying Smart Assemblies...</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.character_id} className="industrial-panel group cursor-pointer hover:border-martian-red/50">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-eve-cream/5 border border-eve-cream/10 flex items-center justify-center text-eve-cream/20">
                  <User size={24} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-martian-red bg-martian-red/5 px-2 py-0.5 border border-martian-red/20">
                  ID: {profile.character_id}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2 group-hover:text-martian-red transition-colors">{profile.name}</h3>
              <p className="text-xs text-eve-cream/40 mb-8 uppercase tracking-widest">Smart Character // Verified</p>

              <Link href="/list" className="eve-btn w-full text-xs">
                Bind Identity <MoveRight size={14} className="ml-2" />
              </Link>
            </div>
          ))
        )}
      </div>

      <div className="industrial-panel bg-martian-red/5 border-martian-red/20 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-martian-red flex items-center gap-2">
          <ShieldCheck size={16} /> Security Warning
        </h4>
        <p className="text-sm text-eve-cream/60">
          Mapping a Smart Character is permanent for this session. Assets transferred to the bounty board via this identity 
          are governed by the BigShot Ownership Model. Ensure you have the necessary permissions for the EVE Vault.
        </p>
      </div>
    </div>
  );
}
