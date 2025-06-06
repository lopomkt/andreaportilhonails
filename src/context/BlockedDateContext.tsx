
import React, { createContext, useContext, useState } from "react";
import { BlockedDate } from "@/types";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface BlockedDateContextType {
  blockedDates: BlockedDate[];
  loading: boolean;
  error: string | null;
  fetchBlockedDates: () => Promise<void>;
  addBlockedDate: (blockedDate: Omit<BlockedDate, "id">) => Promise<any>;
}

const BlockedDateContext = createContext<BlockedDateContextType>({
  blockedDates: [],
  loading: false,
  error: null,
  fetchBlockedDates: async () => {},
  addBlockedDate: async () => ({}),
});

export const BlockedDateProvider = ({ children }: { children: React.ReactNode }) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError, handleSuccess } = useErrorHandler();
  
  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      setError(null);
      // Actual implementation would fetch from API
      setLoading(false);
    } catch (err) {
      handleError(err, "Failed to fetch blocked dates");
      setError("Failed to fetch blocked dates");
      setLoading(false);
    }
  };
  
  const addBlockedDate = async (blockedDate: Omit<BlockedDate, "id">) => {
    try {
      setLoading(true);
      setError(null);
      // Implementation would add a blocked date to the database
      // For now, we'll just return a mock success response
      handleSuccess('Data bloqueada', 'Data bloqueada com sucesso');
      setLoading(false);
      return { success: true };
    } catch (err) {
      handleError(err, "Failed to add blocked date");
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
        addBlockedDate,
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
