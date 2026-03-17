"use client";

import { useState, useCallback } from "react";

export const useConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    // Simulate wallet connection delay
    setTimeout(() => {
      setIsConnected(true);
      setAddress("0xeve...vault");
    }, 800);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
  }, []);

  return { isConnected, address, handleConnect, handleDisconnect };
};
