import { BusinessReportData } from '../types';

/**
 * Check if an ASIN is a Parent ASIN
 * Parent ASIN: When SKU (Child ASIN column) equals Parent ASIN column value
 * OR when this ASIN appears as a parentAsin value for other rows (has children)
 */
export function isParentAsin(asin: string, allBusinessReports: BusinessReportData[]): boolean {
  const asinLower = asin.toLowerCase().trim();
  if (!asinLower) return false;
  
  // First, check if this ASIN has its own row in the data
  const asinData = allBusinessReports.find(br => br.sku.toLowerCase().trim() === asinLower);
  
  if (asinData) {
    // If this ASIN has a row, check if its parentAsin equals itself (Parent)
    if (asinData.parentAsin) {
      const parentAsinLower = asinData.parentAsin.toLowerCase().trim();
      if (parentAsinLower === asinLower) {
        return true; // It's a Parent ASIN (SKU == Parent ASIN)
      }
    }
    
    // If we found the row but parentAsin != sku, it's NOT a parent (it's a child)
    // So we should not return true here
  }
  
  // Second check: If this ASIN doesn't have its own row, check if it appears 
  // as parentAsin value in other rows (has children)
  // This handles cases where Parent ASIN doesn't have its own row
  const hasChildren = allBusinessReports.some(br => {
    if (!br.parentAsin) return false;
    const brParentAsin = br.parentAsin.toLowerCase().trim();
    const brSku = br.sku.toLowerCase().trim();
    // If this ASIN is the parent ASIN for another row (and that row's SKU is different)
    return brParentAsin === asinLower && brSku !== asinLower;
  });
  
  // Only return true if it has children AND doesn't have its own row (or has own row where sku == parentAsin)
  // If it has its own row where sku != parentAsin, it's a child, not parent
  if (hasChildren && !asinData) {
    return true; // Parent ASIN that doesn't have its own row but has children
  }
  
  return false;
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
