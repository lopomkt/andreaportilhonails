
import React, { createContext, useContext, useState } from "react";
import { BlockedDate } from "@/types";

interface BlockedDateContextType {
  blockedDates: BlockedDate[];
  loading: boolean;
  error: string | null;
  fetchBlockedDates: () => Promise<void>;
}

const BlockedDateContext = createContext<BlockedDateContextType>({
  blockedDates: [],
  loading: false,
  error: null,
  fetchBlockedDates: async () => {},
});

export const BlockedDateProvider = ({ children }: { children: React.ReactNode }) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      // Actual implementation would fetch from API
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch blocked dates");
      setLoading(false);
    }
  };

  return (
    <BlockedDateContext.Provider
      value={{
        blockedDates,
        loading,
        error,
        fetchBlockedDates,
      }}
    >
      {children}
    </BlockedDateContext.Provider>
  );
};

export const useBlockedDates = () => {
  const context = useContext(BlockedDateContext);
  if (!context) {
    throw new Error("useBlockedDates must be used within a BlockedDateProvider");
  }
  return context;
};
