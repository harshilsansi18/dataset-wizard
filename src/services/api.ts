
// Import required services
import { getDatasets, getDatasetById, uploadDataset, deleteDataset, downloadDataset, createDataset, updateDataset } from './datasetService';
import { runValidation, getAllValidationResults } from './validationService';
import { compareDatasets, getAllComparisonResults, getComparisonResultById, getComparisonHistory } from './comparisonService';

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
  compareDatasets,
  getAllComparisonResults, 
  getComparisonResultById,
  getComparisonHistory
};

// Re-export types
export type { DatasetType, ValidationResult, ComparisonResultType } from './types';
