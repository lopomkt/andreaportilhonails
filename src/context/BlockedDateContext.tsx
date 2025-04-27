
import React, { createContext, useContext, useState } from "react";
import { BlockedDate } from "@/types";

interface BlockedDateContextType {
  blockedDates: BlockedDate[];
  loading: boolean;
  error: string | null;
  fetchBlockedDates: () => Promise<void>;
  addBlockedDate: (blockedDate: Omit<BlockedDate, "id">) => Promise<any>; // Add the missing method
}

const BlockedDateContext = createContext<BlockedDateContextType>({
  blockedDates: [],
  loading: false,
  error: null,
  fetchBlockedDates: async () => {},
  addBlockedDate: async () => ({}), // Add the missing method
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
  
  const addBlockedDate = async (blockedDate: Omit<BlockedDate, "id">) => {
    try {
      setLoading(true);
      // Implementation would add a blocked date to the database
      // For now, we'll just return a mock success response
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError("Failed to add blocked date");
      setLoading(false);
      return { success: false, error: err };
    }
  };

  return (
    <BlockedDateContext.Provider
      value={{
        blockedDates,
        loading,
        error,
        fetchBlockedDates,
        addBlockedDate, // Add the missing method to the context provider
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
