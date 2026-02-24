export interface TooltipData {
  title: string;
  description: string;
  dataSource: string;
}

export const tooltipData: Record<string, TooltipData> = {
  // Overall Metrics
  'Total Sales': {
    title: 'Total Sales',
    description: 'The total revenue generated from all sales (both organic and PPC) across all products and campaigns.',
    dataSource: 'Amazon Business Reports - Sales column'
  },
  'Organic Sales': {
    title: 'Organic Sales',
    description: 'Sales from natural search results without paid ads. Calculated as Total Sales minus PPC Sales.',
    dataSource: 'Calculated from Business Reports and Search Term Reports'
  },
  'PPC Sales': {
    title: 'PPC Sales',
    description: 'Sales directly attributed to paid advertising campaigns and search terms.',
    dataSource: 'Amazon Search Term Reports - Sales column'
  },
  'Total Orders': {
    title: 'Total Orders',
    description: 'The total number of orders placed across all products and sales channels.',
    dataSource: 'Amazon Business Reports - Units Ordered column'
  },
  'Organic Orders': {
    title: 'Organic Orders',
    description: 'Orders generated from organic (non-paid) search results.',
    dataSource: 'Calculated from Business Reports and Search Term Reports'
  },
  'PPC Orders': {
    title: 'PPC Orders',
    description: 'Orders directly attributed to paid advertising campaigns.',
    dataSource: 'Amazon Search Term Reports - Orders column'
  },

  // PPC Metrics
  'ACoS': {
    title: 'Advertising Cost of Sales (ACoS)',
    description: 'Percentage of ad spend relative to sales. Lower = better efficiency. Formula: (Spend / Sales) × 100',
    dataSource: 'Calculated from Search Term Reports'
  },
  'ROAS': {
    title: 'Return on Ad Spend (ROAS)',
    description: 'Revenue generated per dollar spent on ads. Higher = better performance. Formula: Sales / Spend',
    dataSource: 'Calculated from Search Term Reports'
  },
  'CTR': {
    title: 'Click-Through Rate (CTR)',
    description: 'Percentage of impressions that resulted in clicks. Formula: (Clicks / Impressions) × 100',
    dataSource: 'Amazon Search Term Reports'
  },
  'CVR': {
    title: 'Conversion Rate (CVR)',
    description: 'Percentage of clicks that resulted in orders. Formula: (Orders / Clicks) × 100',
    dataSource: 'Amazon Search Term Reports'
  },
  'CPC': {
    title: 'Cost Per Click (CPC)',
    description: 'Average amount spent per click on ads. Formula: Spend / Clicks',
    dataSource: 'Calculated from Search Term Reports'
  },
  'CPM': {
    title: 'Cost Per Mille (CPM)',
    description: 'Cost per 1,000 impressions. Formula: (Spend / Impressions) × 1000',
    dataSource: 'Calculated from Search Term Reports'
  },

  // Organic Metrics
  'Sessions': {
    title: 'Sessions',
    description: 'Unique visits to your product detail pages. Each session can include multiple page views.',
    dataSource: 'Amazon Business Reports - Sessions column'
  },
  'Unit Session Percentage': {
    title: 'Unit Session Percentage',
    description: 'Percentage of sessions that resulted in a purchase. Amazon\'s version of conversion rate.',
    dataSource: 'Amazon Business Reports - Unit Session Percentage column'
  },
  'Page Views': {
    title: 'Page Views',
    description: 'The total number of times your product detail pages were viewed.',
    dataSource: 'Amazon Business Reports - Page Views column'
  },

  // ASIN/SKU Metrics
  'SKU': {
    title: 'Stock Keeping Unit (SKU)',
    description: 'Unique identifier for each product variant. Used to track individual product performance.',
    dataSource: 'Amazon Business Reports - SKU column'
  },
  'ASIN': {
    title: 'Amazon Standard Identification Number (ASIN)',
    description: 'Amazon\'s unique product identifier. Each product has a unique ASIN.',
    dataSource: 'Amazon Business Reports - ASIN column'
  },
  'Parent ASIN': {
    title: 'Parent ASIN',
    description: 'The main ASIN that groups related product variants together.',
    dataSource: 'Amazon Business Reports - Parent ASIN column'
  },

  // Campaign Terms
  'Campaign': {
    title: 'Campaign',
    description: 'Group of ad groups sharing same budget and targeting settings.',
    dataSource: 'Amazon Search Term Reports - Campaign column'
  },
  'Ad Group': {
    title: 'Ad Group',
    description: 'Collection of keywords and ads sharing same targeting and bidding strategy.',
    dataSource: 'Amazon Search Term Reports - Ad Group column'
  },
  'Search Term': {
    title: 'Search Term',
    description: 'Actual words customers typed in Amazon search that triggered your ads.',
    dataSource: 'Amazon Search Term Reports - Search Term column'
  },
  'Match Type': {
    title: 'Match Type',
    description: 'How keywords match customer search terms: Broad, Phrase, or Exact match.',
    dataSource: 'Amazon Search Term Reports - Match Type column'
  },

  // Financial Terms
  'Spend': {
    title: 'Ad Spend',
    description: 'The total amount spent on advertising campaigns.',
    dataSource: 'Amazon Search Term Reports - Spend column'
  },
  'Revenue': {
    title: 'Revenue',
    description: 'The total sales amount before any deductions for fees or costs.',
    dataSource: 'Amazon Business Reports - Sales column'
  },
  'Profit': {
    title: 'Profit',
    description: 'Revenue minus all costs including Amazon fees, product costs, and advertising spend.',
    dataSource: 'Calculated from multiple data sources'
  },
  'Amazon Fees': {
    title: 'Amazon Fees',
    description: 'Fees Amazon charges for selling on platform, including referral and FBA fees.',
    dataSource: 'User input in Cost Inputs section'
  },
  'COGS': {
    title: 'Cost of Goods Sold (COGS)',
    description: 'Direct costs for producing or purchasing products you sell.',
    dataSource: 'User input in Cost Inputs section'
  },

  // Performance Indicators
  'High ACoS': {
    title: 'High ACoS',
    description: 'Campaigns/terms with ACoS above threshold (25-35%), indicating inefficient ad spend.',
    dataSource: 'Calculated from Search Term Reports data'
  },
  'Low ACoS': {
    title: 'Low ACoS',
    description: 'Campaigns/terms with ACoS below threshold, indicating efficient ad spend.',
    dataSource: 'Calculated from Search Term Reports data'
  },
  'Wasted Spend': {
    title: 'Wasted Spend',
    description: 'Ad spend that generated no sales, indicating poor targeting or performance.',
    dataSource: 'Search Term Reports where Sales = 0'
  },
  'Top Performing': {
    title: 'Top Performing',
    description: 'Campaigns/terms with best performance (low ACoS, high ROAS, good conversion rates).',
    dataSource: 'Calculated from Search Term Reports data'
  },

  // Date and Time
  'Date': {
    title: 'Date',
    description: 'Date when data was recorded. Business Reports are daily, Search Term Reports can be daily/weekly.',
    dataSource: 'Amazon Business Reports and Search Term Reports - Date column'
  },

  // Units and Quantities
  'Units Ordered': {
    title: 'Units Ordered',
    description: 'Number of individual product units that were ordered.',
    dataSource: 'Amazon Business Reports - Units Ordered column'
  },
  'Units Sold': {
    title: 'Units Sold',
    description: 'Number of individual product units that were actually sold and shipped.',
    dataSource: 'Amazon Business Reports - Units Sold column'
  },

  // Impressions and Visibility
  'Impressions': {
    title: 'Impressions',
    description: 'Number of times your ads were shown to potential customers.',
    dataSource: 'Amazon Search Term Reports - Impressions column'
  },
  'Clicks': {
    title: 'Clicks',
    description: 'Number of times customers clicked on your ads.',
    dataSource: 'Amazon Search Term Reports - Clicks column'
  }
};

// Helper function to get tooltip content
export function getTooltipContent(key: string): TooltipData | null {
  return tooltipData[key] || null;
}

// Helper function to format tooltip content
export function formatTooltipContent(data: TooltipData): string {
  return `${data.description}\n\nSource: ${data.dataSource}`;
} 