
import { useContext } from 'react';
import { DataContext } from '@/context/DataContext';

/**
 * Custom hook to safely access DataContext
 * This ensures proper error handling when the context is used outside its provider
 */
export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
