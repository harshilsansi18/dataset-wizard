
// Import required services
import { getDatasets, getDatasetById, uploadDataset, deleteDataset, downloadDataset, createDataset, updateDataset } from './datasetService';
import { runValidation, getAllValidationResults } from './validationService';
import { compareDatasetsByIds, getAllComparisonResults, getComparisonResultById, getComparisonHistory } from './comparisonService';
import { 
  connectToDatabase, 
  getDatabaseTables, 
  importTableAsDataset, 
  disconnectDatabase, 
  postgresConfig,
  initDatabaseConnection,
  getImportedDatasets,
  refreshImportedDatasets,
  ensureImportedDatasetsAvailable,
  clearDatabaseData
} from './databaseService';

// Re-export all service functions to streamline imports
export {
  getDatasets,
  getDatasetById,
  uploadDataset,
  deleteDataset,
  downloadDataset,
  createDataset,
  updateDataset,
  runValidation,
  getAllValidationResults,
  compareDatasetsByIds as compareDatasets,
  getAllComparisonResults, 
  getComparisonResultById,
  getComparisonHistory,
  // Database related functions
  connectToDatabase,
  getDatabaseTables,
  importTableAsDataset,
  disconnectDatabase,
  postgresConfig,
  initDatabaseConnection,
  getImportedDatasets,
  refreshImportedDatasets,
  ensureImportedDatasetsAvailable,
  clearDatabaseData
};

// Re-export types
export type { DatasetType, ValidationResult, ComparisonResultType } from './types';
