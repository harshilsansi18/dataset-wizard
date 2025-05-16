
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDatasets, DatasetType } from '@/services/api';

interface DatasetsContextType {
  datasets: DatasetType[];
  refreshDatasets: () => Promise<void>;
  loading: boolean;
}

const DatasetsContext = createContext<DatasetsContextType>({
  datasets: [],
  refreshDatasets: async () => {},
  loading: false,
});

export const DatasetsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshDatasets = async () => {
    setLoading(true);
    try {
      const fetchedDatasets = await getDatasets();
      setDatasets(fetchedDatasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDatasets();
  }, []);

  return (
    <DatasetsContext.Provider value={{ datasets, refreshDatasets, loading }}>
      {children}
    </DatasetsContext.Provider>
  );
};

export const useDatasets = () => useContext(DatasetsContext);
