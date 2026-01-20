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
    console.log('getAsinBadge: Early return - no ASIN or no reports', { asin, reportCount: allBusinessReports.length });
    return null;
  }
  
  // Debug: Check if parentAsin field exists
  const hasParentAsin = allBusinessReports.some(br => br.parentAsin);
  if (!hasParentAsin) {
    console.warn('getAsinBadge: No parentAsin field found in any business reports. Make sure Parent ASIN column exists in CSV.');
    console.log('Sample report structure:', allBusinessReports[0]);
    return null;
  }
  
  // Find matching report for this ASIN
  const asinData = allBusinessReports.find(br => {
    const brSku = String(br.sku || '').toLowerCase().trim();
    const asinLower = String(asin || '').toLowerCase().trim();
    return brSku === asinLower;
  });
  
  if (!asinData) {
    console.log('getAsinBadge: No matching report found for ASIN:', asin);
    return null;
  }
  
  console.log('getAsinBadge:', {
    asin,
    sku: asinData.sku,
    parentAsin: asinData.parentAsin,
    isParent: isParentAsin(asin, allBusinessReports),
    isChild: isChildAsin(asin, allBusinessReports)
  });
  
  if (isParentAsin(asin, allBusinessReports)) {
    return 'P';
  }
  if (isChildAsin(asin, allBusinessReports)) {
    return 'C';
  }
  return null;
}
