
import { useData } from '@/context/DataProvider';

export const useDataContext = () => {
  const context = useData();
  
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  
  return context;
};
