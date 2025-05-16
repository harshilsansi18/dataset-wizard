
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

/**
 * Processes Excel files (XLSX, XLS) and converts them to a dataset format
 * @param file The Excel file to process
 * @returns Promise with the processed dataset
 */
export const processExcelFile = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error("Failed to read Excel file");
        }
        
        // Parse the Excel file
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract headers (first row)
        const headers = jsonData[0] as string[];
        
        // Extract content (remaining rows)
        const content = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          const rowObj: Record<string, any> = {};
          
          // Map values to headers
          for (let j = 0; j < headers.length; j++) {
            rowObj[headers[j]] = row[j];
          }
          
          content.push(rowObj);
        }
        
        // Create dataset object
        const currentDate = new Date().toISOString();
        const dataset = {
          id: `excel_${uuidv4()}`,
          name: file.name,
          type: "Excel",
          columnCount: headers.length,
          rowCount: content.length,
          dateUploaded: currentDate,
          status: "Not Validated",
          size: `${Math.round(file.size / 1024)} KB`,
          lastUpdated: currentDate,
          content: content,
          headers: headers,
          isPublic: false,
          source: {
            type: "file",
            fileName: file.name
          }
        };
        
        resolve(dataset);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading Excel file"));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
