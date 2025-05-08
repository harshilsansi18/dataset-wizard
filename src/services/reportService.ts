
import { ValidationResult, ValidationTemplate, ValidationReport } from './types';
import { toast } from "@/hooks/use-toast";

// Storage keys
const VALIDATION_TEMPLATES_STORAGE_KEY = "soda_core_validation_templates";
const VALIDATION_REPORTS_STORAGE_KEY = "soda_core_validation_reports";

// Initialize store from localStorage
const initializeTemplatesStore = () => {
  try {
    const storedData = localStorage.getItem(VALIDATION_TEMPLATES_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error(`Error initializing templates store:`, error);
    return [];
  }
};

const initializeReportsStore = () => {
  try {
    const storedData = localStorage.getItem(VALIDATION_REPORTS_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error(`Error initializing reports store:`, error);
    return [];
  }
};

// In-memory stores
let templatesStore: ValidationTemplate[] = initializeTemplatesStore();
let reportsStore: ValidationReport[] = initializeReportsStore();

// Save to localStorage
const saveTemplatesToStorage = () => {
  try {
    localStorage.setItem(VALIDATION_TEMPLATES_STORAGE_KEY, JSON.stringify(templatesStore));
  } catch (error) {
    console.error(`Error saving validation templates:`, error);
    toast({
      title: "Storage Error",
      description: "Failed to save validation templates locally.",
      variant: "destructive",
    });
  }
};

const saveReportsToStorage = () => {
  try {
    localStorage.setItem(VALIDATION_REPORTS_STORAGE_KEY, JSON.stringify(reportsStore));
  } catch (error) {
    console.error(`Error saving validation reports:`, error);
    toast({
      title: "Storage Error",
      description: "Failed to save validation reports locally.",
      variant: "destructive",
    });
  }
};

// Template management
export const createValidationTemplate = (template: Omit<ValidationTemplate, "id">): ValidationTemplate => {
  const newTemplate: ValidationTemplate = {
    ...template,
    id: `vt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };
  
  templatesStore = [...templatesStore, newTemplate];
  saveTemplatesToStorage();
  
  toast({
    title: "Template Created",
    description: `Validation template "${template.name}" has been created.`,
  });
  
  return newTemplate;
};

export const getValidationTemplates = (): Promise<ValidationTemplate[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...templatesStore]);
    }, 300);
  });
};

export const getValidationTemplateById = (id: string): Promise<ValidationTemplate | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const template = templatesStore.find(template => template.id === id);
      resolve(template);
    }, 300);
  });
};

export const updateValidationTemplate = (id: string, updates: Partial<ValidationTemplate>): Promise<ValidationTemplate | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = templatesStore.findIndex(template => template.id === id);
      if (index >= 0) {
        templatesStore[index] = { ...templatesStore[index], ...updates };
        saveTemplatesToStorage();
        
        toast({
          title: "Template Updated",
          description: `Validation template "${templatesStore[index].name}" has been updated.`,
        });
        
        resolve(templatesStore[index]);
      } else {
        toast({
          title: "Update Failed",
          description: "Could not find validation template to update.",
          variant: "destructive",
        });
        resolve(null);
      }
    }, 300);
  });
};

export const deleteValidationTemplate = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = templatesStore.findIndex(template => template.id === id);
      if (index >= 0) {
        const templateName = templatesStore[index].name;
        templatesStore = templatesStore.filter(template => template.id !== id);
        saveTemplatesToStorage();
        
        toast({
          title: "Template Deleted",
          description: `Validation template "${templateName}" has been deleted.`,
        });
        
        resolve(true);
      } else {
        toast({
          title: "Delete Failed",
          description: "Could not find validation template to delete.",
          variant: "destructive",
        });
        resolve(false);
      }
    }, 300);
  });
};

// Report generation
export const generateValidationReport = (
  datasetId: string, 
  datasetName: string, 
  results: ValidationResult[]
): Promise<ValidationReport> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Generating validation report for:", datasetName, "with", results.length, "results");
      // Add categories to results if they don't have one
      const categorizedResults = results.map(result => {
        if (!result.category) {
          // Extract category from check name or use default
          const words = result.check.split(' ');
          const category = words.length > 0 ? words[0] : 'Other';
          return { ...result, category };
        }
        return result;
      });
      
      const summary = categorizedResults.reduce(
        (acc, result) => {
          acc.total += 1;
          acc[result.status.toLowerCase() as keyof typeof acc] += 1;
          return acc;
        },
        { total: 0, pass: 0, fail: 0, warning: 0, info: 0 }
      );
      
      const newReport: ValidationReport = {
        id: `vr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        datasetId,
        datasetName,
        timestamp: new Date().toISOString(),
        summary,
        results: categorizedResults,
      };
      
      reportsStore = [newReport, ...reportsStore];
      saveReportsToStorage();
      
      console.log("Generated new validation report:", newReport);
      
      toast({
        title: "Report Generated",
        description: `Validation report for "${datasetName}" has been created.`,
      });
      
      resolve(newReport);
    }, 300);
  });
};

export const getValidationReports = (): Promise<ValidationReport[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Fetching validation reports:", reportsStore.length);
      resolve([...reportsStore]);
    }, 300);
  });
};

export const getValidationReportById = (id: string): Promise<ValidationReport | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const report = reportsStore.find(report => report.id === id);
      resolve(report);
    }, 300);
  });
};

export const getValidationReportsByDatasetId = (datasetId: string): Promise<ValidationReport[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reports = reportsStore.filter(report => report.datasetId === datasetId);
      resolve(reports);
    }, 300);
  });
};

export const deleteValidationReport = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = reportsStore.findIndex(report => report.id === id);
      if (index >= 0) {
        reportsStore = reportsStore.filter(report => report.id !== id);
        saveReportsToStorage();
        
        toast({
          title: "Report Deleted",
          description: "Validation report has been deleted.",
        });
        
        resolve(true);
      } else {
        toast({
          title: "Delete Failed",
          description: "Could not find validation report to delete.",
          variant: "destructive",
        });
        resolve(false);
      }
    }, 300);
  });
};

// Default validation templates
export const initializeDefaultTemplates = (): void => {
  // Only add default templates if none exist
  if (templatesStore.length === 0) {
    const defaultTemplates: Omit<ValidationTemplate, "id">[] = [
      {
        name: "Basic Data Quality",
        description: "Essential checks for data quality and completeness",
        validationMethods: ["basic", "data_completeness", "format_checks"]
      },
      {
        name: "Advanced Analysis",
        description: "In-depth statistical and quality analysis",
        validationMethods: ["data_quality", "statistical_analysis", "text_analysis"]
      },
      {
        name: "Standard Compliance",
        description: "Validates data against standard formats and values",
        validationMethods: ["value_lookup", "format_checks", "data_completeness"]
      }
    ];
    
    defaultTemplates.forEach(template => {
      createValidationTemplate(template);
    });
  }
};

// Export file generation utilities
export const generateCSVReport = (report: ValidationReport): string => {
  const headers = ["Check", "Status", "Details", "Timestamp"];
  const rows = report.results.map(result => [
    result.check,
    result.status,
    result.details,
    result.timestamp
  ]);
  
  const csvContent = [
    `Dataset: ${report.datasetName}`,
    `Generated: ${new Date(report.timestamp).toLocaleString()}`,
    `Summary: Total: ${report.summary.total}, Pass: ${report.summary.pass}, Fail: ${report.summary.fail}, Warning: ${report.summary.warning}, Info: ${report.summary.info}`,
    "",
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  return csvContent;
};

export const downloadReportAsCSV = (report: ValidationReport): void => {
  const csvContent = generateCSVReport(report);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `validation_report_${report.datasetName}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export PDF generation (basic implementation)
export const generatePDFReport = async (report: ValidationReport): Promise<Blob> => {
  // This is a placeholder. In a real implementation, you would use a library like jsPDF
  // For now, we'll just return a text blob with a PDF mime type
  const textContent = `
    Dataset: ${report.datasetName}
    Generated: ${new Date(report.timestamp).toLocaleString()}
    Summary: Total: ${report.summary.total}, Pass: ${report.summary.pass}, Fail: ${report.summary.fail}, Warning: ${report.summary.warning}, Info: ${report.summary.info}
    
    Results:
    ${report.results.map(r => `${r.check}: ${r.status} - ${r.details}`).join('\n')}
  `;
  
  return new Blob([textContent], { type: 'application/pdf' });
};

export const downloadReportAsPDF = async (report: ValidationReport): Promise<void> => {
  try {
    const pdfBlob = await generatePDFReport(report);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `validation_report_${report.datasetName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast({
      title: "PDF Generation Failed",
      description: "Could not generate PDF report. Try downloading as CSV instead.",
      variant: "destructive",
    });
  }
};

// Initialize default templates on module load
initializeDefaultTemplates();
