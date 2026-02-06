const { put } = require('@vercel/blob');
const config = require('./config');

async function testVercelBlob() {
  try {
    console.log('🧪 Testing Vercel Blob integration...');
    console.log('Token preview:', config.vercel.blobToken ? config.vercel.blobToken.substring(0, 20) + '...' : 'None');
    
    // Test data
    const testData = [
      { name: 'Test Product 1', sales: 100, cost: 50 },
      { name: 'Test Product 2', sales: 200, cost: 75 }
    ];
    
    // Convert to CSV
    const csvContent = testData.map(row => `${row.name},${row.sales},${row.cost}`).join('\n');
    const csvHeaders = 'name,sales,cost\n';
    const fullCsv = csvHeaders + csvContent;
    
    console.log('📊 Test CSV content:');
    console.log(fullCsv);
    
    // Upload to Vercel Blob
    const filename = `test_${Date.now()}.csv`;
    console.log(`📤 Uploading ${filename} to Vercel Blob...`);
    
    const { url } = await put(filename, fullCsv, { 
      access: 'public',
      token: config.vercel.blobToken
    });
    
    console.log('✅ Upload successful!');
    console.log('📥 Download URL:', url);
    console.log('🔗 Test the URL in your browser to verify it works');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testVercelBlob();
