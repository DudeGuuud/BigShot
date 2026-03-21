import React, { createContext, useContext, useState} from "react";

interface BigShotContextType {
  characterId: string | null;
  profileObjectId: string | null;
  setCharacterId: (id: string | null, profileObjId?: string | null) => void;
}

const BigShotContext = createContext<BigShotContextType | undefined>(undefined);

export const BigShotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [characterId, setCharacterIdState] = useState<string | null>(null);
  const [profileObjectId, setProfileObjectIdState] = useState<string | null>(null);

  // Update state without localStorage
  const setCharacterId = (id: string | null, profileObjId?: string | null) => {
    setCharacterIdState(id);
    setProfileObjectIdState(profileObjId || null);
  };

  return (
    <BigShotContext.Provider value={{ characterId, profileObjectId, setCharacterId }}>
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
