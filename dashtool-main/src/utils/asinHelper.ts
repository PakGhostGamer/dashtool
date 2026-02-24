import { BusinessReportData } from '../types';

/**
 * Check if an ASIN is a Parent ASIN
 * Parent ASIN: When SKU (Child ASIN column) equals Parent ASIN column value in the same row
 */
export function isParentAsin(asin: string, allBusinessReports: BusinessReportData[]): boolean {
  const asinLower = asin.toLowerCase().trim();
  if (!asinLower) return false;
  
  // Find this ASIN in the data (check if it has its own row)
  const asinData = allBusinessReports.find(br => br.sku.toLowerCase().trim() === asinLower);
  
  if (!asinData || !asinData.parentAsin) {
    return false;
  }
  
  // If Parent ASIN column equals SKU column in the same row, it's a Parent ASIN
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
  
  // Check if parentAsin field exists in any reports
  const hasParentAsin = allBusinessReports.some(br => br.parentAsin);
  if (!hasParentAsin) {
    return null;
  }
  
  // Check Parent first (because Parent can also have its own row)
  const isParent = isParentAsin(asin, allBusinessReports);
  if (isParent) {
    return 'P';
  }
  
  // Then check Child (only if not Parent)
  const isChild = isChildAsin(asin, allBusinessReports);
  if (isChild) {
    return 'C';
  }
  
  return null;
}
