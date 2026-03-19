import React, { createContext, useContext, useState, useEffect } from "react";

interface BigShotContextType {
  characterId: string | null;
  setCharacterId: (id: string | null) => void;
}

const BigShotContext = createContext<BigShotContextType | undefined>(undefined);

const STORAGE_KEY = "bigshot-character-id";

export const BigShotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [characterId, setCharacterIdState] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCharacterIdState(saved);
    }
  }, []);

  // Update state and localStorage
  const setCharacterId = (id: string | null) => {
    setCharacterIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <BigShotContext.Provider value={{ characterId, setCharacterId }}>
      {children}
    </BigShotContext.Provider>
  );
};

export const useBigShot = () => {
  const context = useContext(BigShotContext);
  if (context === undefined) {
    throw new Error("useBigShot must be used within a BigShotProvider");
  }
  return context;
};
