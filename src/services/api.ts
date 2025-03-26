
// Import required services
import { getDatasets, getDatasetById, uploadDataset, deleteDataset, downloadDataset, createDataset, updateDataset } from './datasetService';
import { validateDataset, createValidation, getValidationResults } from './validationService';
import { compareDatasets, getComparisonResults, saveComparisonResult, getComparisonHistory } from './comparisonService';

// Re-export all service functions to streamline imports
export {
  getDatasets,
  getDatasetById,
  uploadDataset,
  deleteDataset,
  downloadDataset,
  createDataset,
  updateDataset,
  validateDataset,
  createValidation,
  getValidationResults,
  compareDatasets,
  getComparisonResults,
  saveComparisonResult,
  getComparisonHistory
};

// Re-export types
export type { DatasetType, ValidationResult, ComparisonResultType } from './types';
