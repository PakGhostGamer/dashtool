import { BusinessReportData } from '../types';

/**
 * Check if an ASIN is a Parent ASIN
 * Parent ASIN: When SKU (Child ASIN column) equals Parent ASIN column value
 */
export function isParentAsin(asin: string, allBusinessReports: BusinessReportData[]): boolean {
  const asinLower = asin.toLowerCase().trim();
  
  // Find this ASIN in the data
  const asinData = allBusinessReports.find(br => br.sku.toLowerCase().trim() === asinLower);
  
  if (!asinData?.parentAsin) {
    // If no parentAsin data, check if this ASIN appears as parent for others
    return allBusinessReports.some(br => 
      br.parentAsin && 
      br.parentAsin.toLowerCase().trim() === asinLower &&
      br.sku.toLowerCase().trim() !== asinLower
    );
  }
  
  // If Parent ASIN column equals SKU column, it's a Parent ASIN
  const parentAsinLower = asinData.parentAsin.toLowerCase().trim();
  return parentAsinLower === asinLower;
}

/**
 * Check if an ASIN is a Child ASIN
 * Child ASIN: When SKU (Child ASIN column) is different from Parent ASIN column value
 */
export function isChildAsin(asin: string, allBusinessReports: BusinessReportData[]): boolean {
  const asinLower = asin.toLowerCase().trim();
  const asinData = allBusinessReports.find(br => br.sku.toLowerCase().trim() === asinLower);
  
  if (!asinData?.parentAsin) {
    return false;
  }
  
  // If Parent ASIN column is different from SKU column, it's a Child ASIN
  const parentAsinLower = asinData.parentAsin.toLowerCase().trim();
  return parentAsinLower !== asinLower;
}

/**
 * Get ASIN type badge - returns "P" for Parent, "C" for Child, or null
 */
export function getAsinBadge(asin: string, allBusinessReports: BusinessReportData[]): 'P' | 'C' | null {
  if (!asin || !allBusinessReports || allBusinessReports.length === 0) {
    return null;
  }
  
  // Debug: Log first few checks
  if (allBusinessReports.length > 0) {
    const firstReport = allBusinessReports[0];
    if (firstReport && !firstReport.parentAsin) {
      console.log('Warning: No parentAsin field found in business reports. Make sure Parent ASIN column exists in CSV.');
    }
  }
  
  if (isParentAsin(asin, allBusinessReports)) {
    return 'P';
  }
  if (isChildAsin(asin, allBusinessReports)) {
    return 'C';
  }
  return null;
}
