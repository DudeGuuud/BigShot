"use client";

import { useState, useEffect } from "react";

export interface PlayerProfile {
  character_id: string;
  name: string;
  avatar_url?: string;
}

export const useSmartCharacter = (address: string | null) => {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchProfiles = async () => {
      if (!address) {
        setProfiles([]);
        return;
      }

      setIsLoading(true);
      // Simulate fetching profiles owned by the wallet
      setTimeout(() => {
        if (!active) return;
        setProfiles([
          { character_id: "7778881", name: "Caldari Prime", avatar_url: "" },
          { character_id: "9992224", name: "Jita Trader", avatar_url: "" },
        ]);
        setIsLoading(false);
      }, 1200);
    };

    fetchProfiles();
    return () => { active = false; };
  }, [address]);

  return { profiles, isLoading };
};
