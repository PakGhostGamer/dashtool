import { BusinessReportData } from '../types';

/**
 * Check if an ASIN is a Parent ASIN
 * A Parent ASIN is one where:
 * - It has a parentAsin field and it equals the sku (itself), OR
 * - It appears as a parentAsin for other ASINs (has children)
 */
export function isParentAsin(asin: string, allBusinessReports: BusinessReportData[]): boolean {
  const asinLower = asin.toLowerCase().trim();
  
  // Check if this ASIN has parentAsin field and it equals itself
  const asinData = allBusinessReports.find(br => br.sku.toLowerCase().trim() === asinLower);
  if (asinData?.parentAsin && asinData.parentAsin.toLowerCase().trim() === asinLower) {
    return true;
  }
  
  // Check if this ASIN appears as a parentAsin for other ASINs (has children)
  const hasChildren = allBusinessReports.some(br => {
    if (!br.parentAsin) return false;
    const parentAsinLower = br.parentAsin.toLowerCase().trim();
    const skuLower = br.sku.toLowerCase().trim();
    // Parent ASIN should match but SKU should be different
    return parentAsinLower === asinLower && skuLower !== asinLower;
  });
  
  return hasChildren;
}

/**
 * Check if an ASIN is a Child ASIN
 * A Child ASIN is one where:
 * - It has a parentAsin field and it's different from the sku
 */
export function isChildAsin(asin: string, allBusinessReports: BusinessReportData[]): boolean {
  const asinLower = asin.toLowerCase().trim();
  const asinData = allBusinessReports.find(br => br.sku.toLowerCase().trim() === asinLower);
  
  if (!asinData?.parentAsin) {
    return false;
  }
  
  // If parentAsin exists and is different from sku, it's a child
  const parentAsinLower = asinData.parentAsin.toLowerCase().trim();
  return parentAsinLower !== asinLower;
}

/**
 * Get ASIN type badge - returns "P" for Parent, "C" for Child, or null
 */
export function getAsinBadge(asin: string, allBusinessReports: BusinessReportData[]): 'P' | 'C' | null {
  if (isParentAsin(asin, allBusinessReports)) {
    return 'P';
  }
  if (isChildAsin(asin, allBusinessReports)) {
    return 'C';
  }
  return null;
}
