
import { toast } from "@/components/ui/use-toast";
import { DatasetType, ValidationResult, ComparisonResultType } from "./types";
import { 
  getDatasets as getDatasetsList,
  getDatasetById as getDataset,
  uploadDataset as uploadDatasetFile,
  createDataset as createNewDataset,
  updateDataset as updateExistingDataset,
  deleteDataset as removeDataset 
} from "./datasetService";

import { 
  runValidation as validateDataset,
  getAllValidationResults as getValidationResults
} from "./validationService";

import {
  compareDatasetsByIds,
  getAllComparisonResults as getAllSavedComparisonResults,
  getComparisonResultById as getSavedComparisonResult,
  getComparisonHistory as getComparisonHistoryList
} from "./comparisonService";

// Re-export dataset functions
export const getDatasets = getDatasetsList;
export const getDatasetById = getDataset;
export const uploadDataset = uploadDatasetFile;
export const createDataset = createNewDataset;
export const updateDataset = updateExistingDataset;
export const deleteDataset = removeDataset;

// Re-export validation functions
export const runValidation = validateDataset;
export const getAllValidationResults = getValidationResults;

// Re-export comparison functions
export const compareDatasets = compareDatasetsByIds;
export const getAllComparisonResults = getAllSavedComparisonResults;
export const getComparisonResultById = getSavedComparisonResult;
export const getComparisonHistory = getComparisonHistoryList;

// Re-export types for backward compatibility
export type { DatasetType, ValidationResult, ComparisonResultType };
