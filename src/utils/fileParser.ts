import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { BusinessReportData, SearchTermData } from '../types';

export interface ParseResult<T> {
  data: T[];
  errors: string[];
  success: boolean;
}

// Expected columns for Business Report
const BR_COLUMN_MAPPINGS = {
  sku: ['sku', 'asin', 'child asin'],
  parentAsin: ['parent asin', 'parent'],
  title: ['title', 'product name', 'product title', 'name'],
  sessions: ['sessions', 'sessions - total', 'session count', 'total sessions'],
  unitsOrdered: ['units ordered', 'units sold', 'quantity sold', 'ordered units'],
  sales: ['sales', 'ordered product sales', 'revenue', 'total sales', 'product sales', 'ordered  product  sales'], // Added extra spaces variant
  conversionRate: ['conversion rate', 'unit session percentage', 'cvr', 'conversion %', 'unit session %']
};

// Expected columns for Search Term Report
const STR_REQUIRED_COLUMNS = [
  'date',
  'campaign',
  'ad group',
  'search term',
  'match type',
  'impressions',
  'clicks',
  'spend',
  'sales',
  'orders'
];

export const parseBusinessReport = (file: File, reportDate: string): Promise<ParseResult<BusinessReportData>> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const data: BusinessReportData[] = [];

        // Get headers and normalize them
        const headers = Object.keys(results.data[0] || {}).map(h => h.toLowerCase().trim());
        
        // Find column mappings
        const columnMap: { [key: string]: string } = {};
        const missingColumns: string[] = [];
        
        Object.entries(BR_COLUMN_MAPPINGS).forEach(([key, possibleNames]) => {
          let foundHeader = headers.find(h => 
            possibleNames.some(name => h.replace(/\s+/g, ' ').includes(name.toLowerCase().replace(/\s+/g, ' ')))
          );
          // Fallback for sales: match any column with 'sales' in the name if not found
          if (!foundHeader && key === 'sales') {
            foundHeader = headers.find(h => h.includes('sales'));
          }
          if (foundHeader) {
            // Find the original header name (with proper casing)
            const originalHeader = Object.keys(results.data[0] || {}).find(orig => 
              orig.toLowerCase().trim().replace(/\s+/g, ' ') === foundHeader
            );
            if (originalHeader) {
              columnMap[key] = originalHeader;
            }
          } else if (key !== 'parentAsin' && key !== 'title') {
            // Only mark required columns as missing (parentAsin and title are optional)
            missingColumns.push(key);
          }
        });
        // Debug: Log the detected columns
        console.log('Detected columns:', columnMap);
        console.log('Parent ASIN column detected:', columnMap.parentAsin);
        console.log('Detected sales column:', columnMap.sales);

        if (missingColumns.length > 0) {
          const expectedColumns = missingColumns.map(col => {
            const examples = BR_COLUMN_MAPPINGS[col as keyof typeof BR_COLUMN_MAPPINGS];
            return `${col} (e.g., ${examples.join(', ')})`;
          });
          errors.push(`Missing required columns: ${expectedColumns.join('; ')}`);
          resolve({ data: [], errors, success: false });
          return;
        }

        // Parse each row
        results.data.forEach((row: any, index: number) => {
          try {
            // Extract values using the mapped columns
            const sku = row[columnMap.sku] || '';
            const parentAsinValue = columnMap.parentAsin ? row[columnMap.parentAsin] : null;
            const parentAsin = parentAsinValue ? parentAsinValue.toString().trim() : undefined;
            // Debug: Log parent ASIN detection
            if (index < 3) {
              console.log(`Row ${index + 1} - SKU: ${sku}, Parent ASIN: ${parentAsin}, Column detected: ${columnMap.parentAsin}`);
            }
            const title = row[columnMap.title] || '';
            const sessions = row[columnMap.sessions] || '';
            const unitsOrdered = row[columnMap.unitsOrdered] || '';
            const sales = row[columnMap.sales] || '';
            const conversionRate = row[columnMap.conversionRate] || '';
            // Debug: Log the sales value for each row
            console.log(`Row ${index + 1} sales value:`, sales);

            // Validate required fields
            if (!sku) {
              errors.push(`Row ${index + 1}: Missing SKU`);
              return;
            }

            // Parse and validate numbers
            const cleanNumber = (val: string | number) => {
              if (typeof val === 'number') return val;
              if (!val) return 0;
              // Remove all except digits, dot, minus
              const cleaned = val.replace(/[^0-9.-]+/g, '');
              return parseFloat(cleaned) || 0;
            };
            const parsedSessions = cleanNumber(sessions);
            const parsedUnits = cleanNumber(unitsOrdered);
            const parsedSales = cleanNumber(sales);
            // Handle percentage conversion (if it's in percentage format like "5.2%" convert to 5.2)
            let parsedCVR = cleanNumber(conversionRate);
            if (typeof conversionRate === 'string' && conversionRate.includes('%')) {
              parsedCVR = cleanNumber(conversionRate.replace('%', ''));
            }

            data.push({
              date: reportDate,
              sku: sku.toString().trim(),
              parentAsin: parentAsin || undefined,
              title: title.toString().trim(),
              sessions: parsedSessions,
              unitsOrdered: parsedUnits,
              sales: parsedSales,
              conversionRate: parsedCVR
            });
          } catch (error) {
            errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
          }
        });

        resolve({
          data,
          errors,
          success: errors.length === 0 && data.length > 0
        });
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [`File parsing error: ${error.message}`],
          success: false
        });
      }
    });
  });
};

// Helper to robustly parse STR dates (Excel serial, ISO, MM/DD/YYYY, etc.)
function parseSTRDate(val: any): string {
  if (!val) return '';
  // If it's a number or numeric string, treat as Excel serial date
  if (!isNaN(val) && val !== '' && val !== null) {
    const num = Number(val);
    if (!isNaN(num) && num > 59) { // Excel serial dates start at 1/1/1900, but 60 is 2/29/1900 (nonexistent)
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + (num - 1) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
  }
  // Try parsing as string date
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  // Try parsing as MM/DD/YYYY or DD/MM/YYYY
  if (typeof val === 'string') {
    const parts = val.split(/[\/-]/);
    if (parts.length === 3) {
      let [a, b, c] = parts.map(Number);
      // Heuristic: if year is first or last
      if (c > 1900) { // YYYY-MM-DD or MM-DD-YYYY
        const date = new Date(c, a - 1, b);
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      } else if (a > 1900) { // YYYY-MM-DD
        const date = new Date(a, b - 1, c);
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      } else { // MM-DD-YYYY or DD-MM-YYYY
        const date = new Date(c, a - 1, b);
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      }
    }
  }
  return '';
}

export const parseSearchTermReport = (file: File): Promise<ParseResult<SearchTermData>> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const errors: string[] = [];
        const parsedData: SearchTermData[] = [];

        if (jsonData.length < 2) {
          errors.push('File appears to be empty or has no data rows');
          resolve({ data: [], errors, success: false });
          return;
        }

        // Get headers from first row
        const headers = (jsonData[0] as string[]).map(h => h?.toLowerCase().trim() || '');
        
        // Check required columns
        const missingColumns = STR_REQUIRED_COLUMNS.filter(col => 
          !headers.some(h => h.includes(col.toLowerCase()))
        );

        if (missingColumns.length > 0) {
          errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
          resolve({ data: [], errors, success: false });
          return;
        }

        // Parse data rows
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          try {
            // Find column indices (flexible matching)
            const getColumnIndex = (searchTerms: string[]) => {
              for (const term of searchTerms) {
                const index = headers.findIndex(h => h.includes(term.toLowerCase()));
                if (index !== -1) return index;
              }
              return -1;
            };

            const dateIdx = getColumnIndex(['date']);
            const campaignIdx = getColumnIndex(['campaign']);
            const adGroupIdx = getColumnIndex(['ad group', 'adgroup']);
            const searchTermIdx = getColumnIndex(['search term', 'keyword']);
            const matchTypeIdx = getColumnIndex(['match type', 'match']);
            const impressionsIdx = getColumnIndex(['impressions', 'impr']);
            const clicksIdx = getColumnIndex(['clicks']);
            const spendIdx = getColumnIndex(['spend', 'cost']);
            const salesIdx = getColumnIndex(['sales', 'revenue']);
            const ordersIdx = getColumnIndex(['orders', 'conversions']);

            // Validate required fields
            if (dateIdx === -1 || !row[dateIdx]) {
              errors.push(`Row ${i + 1}: Missing date`);
              continue;
            }

            const date = parseSTRDate(row[dateIdx]);
            const campaign = row[campaignIdx]?.toString().trim() || 'Unknown Campaign';
            const adGroup = row[adGroupIdx]?.toString().trim() || 'Unknown Ad Group';
            const searchTerm = row[searchTermIdx]?.toString().trim() || 'Unknown Term';
            const matchType = row[matchTypeIdx]?.toString().trim() || 'Unknown';
            const impressions = parseFloat(row[impressionsIdx]) || 0;
            const clicks = parseFloat(row[clicksIdx]) || 0;
            const spend = parseFloat(row[spendIdx]) || 0;
            const sales = parseFloat(row[salesIdx]) || 0;
            const orders = parseFloat(row[ordersIdx]) || 0;

            parsedData.push({
              date,
              campaign,
              adGroup,
              searchTerm,
              matchType,
              impressions,
              clicks,
              spend,
              sales,
              orders
            });
          } catch (error) {
            errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
          }
        }

        resolve({
          data: parsedData,
          errors,
          success: errors.length === 0 && parsedData.length > 0
        });
      } catch (error) {
        resolve({
          data: [],
          errors: [`File parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          success: false
        });
      }
    };

    reader.onerror = () => {
      resolve({
        data: [],
        errors: ['Failed to read file'],
        success: false
      });
    };

    reader.readAsArrayBuffer(file);
  });
};