
// Import required services
import { getDatasets, getDatasetById, uploadDataset, deleteDataset, downloadDataset, createDataset, updateDataset, getPublicDatasets, toggleDatasetPublicStatus } from './datasetService';
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
  clearDatabaseData,
  validateConnectionParams,
  API_URL
} from './databaseService';
import {
  createValidationTemplate,
  getValidationTemplates,
  getValidationTemplateById,
  updateValidationTemplate,
  deleteValidationTemplate,
  generateValidationReport,
  getValidationReports,
  getValidationReportById,
  getValidationReportsByDatasetId,
  deleteValidationReport,
  downloadReportAsCSV,
  downloadReportAsPDF
} from './reportService';

// Re-export all service functions to streamline imports
export {
  getDatasets,
  getDatasetById,
  uploadDataset,
  deleteDataset,
  downloadDataset,
  createDataset,
  updateDataset,
  getPublicDatasets,
  toggleDatasetPublicStatus,
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
  clearDatabaseData,
  validateConnectionParams,
  API_URL,
  // Report and template related functions
  createValidationTemplate,
  getValidationTemplates,
  getValidationTemplateById,
  updateValidationTemplate,
  deleteValidationTemplate,
  generateValidationReport,
  getValidationReports,
  getValidationReportById,
  getValidationReportsByDatasetId,
  deleteValidationReport,
  downloadReportAsCSV,
  downloadReportAsPDF
};

// Re-export types
export type { DatasetType, ValidationResult, ComparisonResultType, ValidationTemplate, ValidationReport } from './types';

// Export validation method types for better TypeScript support
export const ValidationMethods = {
  BASIC: "basic",
  ADVANCED: "advanced",
  CUSTOM: "custom",
  FORMAT_CHECKS: "format_checks",
  VALUE_LOOKUP: "value_lookup",
  DATA_COMPLETENESS: "data_completeness",
  DATA_QUALITY: "data_quality",
  STATISTICAL_ANALYSIS: "statistical_analysis",
  TEXT_ANALYSIS: "text_analysis",
  CROSS_COLUMN: "cross_column",
  REGEX_PATTERN: "regex_pattern",
  SCHEMA_VALIDATION: "schema_validation"
};
