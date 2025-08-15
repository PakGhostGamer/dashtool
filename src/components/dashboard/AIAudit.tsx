import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { Brain, Lightbulb, AlertTriangle, Target, TrendingUp, RefreshCw, Download } from 'lucide-react';

interface AIAnalysis {
  summary: string;
  insights: string[];
  issues: string[];
  actions: string[];
  score: number;
  scoreExplanation: string;
  keywordStrategy: string;
  topKeywords: string[];
  problemKeywords: string[];
}

interface AuditData {
  totalTerms: number;
  totalSpend: number;
  totalSales: number;
  totalOrders: number;
  totalClicks: number;
  totalImpressions: number;
  campaigns: string[];
  highAcosTerms: number;
  zeroSaleTerms: number;
  wastedSpend: number;
}

export function AIAudit() {
  const { state } = useApp();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAIAnalysis = async () => {
    if (!state.searchTermReports.length || !state.businessReports.length) {
      setError('Please upload both Search Term Report and Business Report first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ai-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTermReports: state.searchTermReports,
          businessReports: state.businessReports,
          costInputs: state.costInputs
        }),
      });

      const data = await response.json();
      console.log('🔍 AI Audit Response:', data);

      if (data.success) {
        console.log('✅ Setting analysis:', data.analysis);
        setAnalysis(data.analysis);
        setAuditData(data.rawData);
      } else {
        console.log('❌ AI analysis failed:', data.error);
        setError(data.error || 'AI analysis failed');
        // Use fallback data if available
        if (data.fallback) {
          console.log('⚠️ Using fallback data:', data.fallback);
          setAnalysis(data.fallback);
        }
      }
    } catch (err) {
      setError('Failed to connect to AI service. Please try again.');
      console.error('AI audit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  const downloadReport = () => {
    if (!analysis || !auditData) return;

    const reportContent = `
AI-Powered PPC Audit Report
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
${analysis.summary}

PERFORMANCE SCORE: ${analysis.score}/10 (${getScoreLabel(analysis.score)})
${analysis.scoreExplanation}

KEY INSIGHTS
${analysis.insights.map(insight => `• ${insight}`).join('\n')}

CRITICAL ISSUES
${analysis.issues.map(issue => `• ${issue}`).join('\n')}

IMMEDIATE ACTION ITEMS
${analysis.actions.map(action => `• ${action}`).join('\n')}

KEYWORD STRATEGY
${analysis.keywordStrategy || 'Not available'}

TOP PERFORMING KEYWORDS
${analysis.topKeywords && analysis.topKeywords.length > 0 ? analysis.topKeywords.map(keyword => `• ${keyword}`).join('\n') : 'None identified'}

PROBLEM KEYWORDS
${analysis.problemKeywords && analysis.problemKeywords.length > 0 ? analysis.problemKeywords.map(keyword => `• ${keyword}`).join('\n') : 'None identified'}

AUDIT DATA SUMMARY
• Total Search Terms: ${auditData.totalTerms}
• Total Spend: $${auditData.totalSpend.toFixed(2)}
• Total Sales: $${auditData.totalSales.toFixed(2)}
• Total Orders: ${auditData.totalOrders}
• High ACoS Terms: ${auditData.highAcosTerms}
• Zero Sale Terms: ${auditData.zeroSaleTerms}
• Wasted Spend: $${auditData.wastedSpend.toFixed(2)}
• Campaigns: ${auditData.campaigns.join(', ')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_audit_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Auto-generate analysis when component mounts if data is available
    if (state.searchTermReports.length > 0 && state.businessReports.length > 0) {
      generateAIAnalysis();
    }
  }, [state.searchTermReports, state.businessReports]);

  return (
    <div id="ai-audit-content" className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          🤖 AI-Powered PPC Audit
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get intelligent insights and actionable recommendations powered by Google's Gemini AI. 
          Our AI analyzes your PPC data to identify opportunities and optimize performance.
        </p>
      </div>

      {/* Generate Analysis Button */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
            <h2 className="text-xl font-semibold text-purple-800">AI Analysis Engine</h2>
          </div>
          
          {!analysis ? (
            <Button
              onClick={generateAIAnalysis}
              disabled={loading || !state.searchTermReports.length || !state.businessReports.length}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate AI Audit
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={generateAIAnalysis}
                disabled={loading}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Analysis
              </Button>
              <Button
                onClick={downloadReport}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {(!state.searchTermReports.length || !state.businessReports.length) && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-700">
              ⚠️ Please upload both Search Term Report and Business Report to generate AI analysis.
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {analysis && (
        <>
          {/* Performance Score */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                <Target className="w-5 h-5" />
                AI Performance Score
              </h3>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreColor(analysis.score)} mb-4`}>
                  {analysis.score}/10
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  {getScoreLabel(analysis.score)} Performance
                </h4>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {analysis.scoreExplanation}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Executive Summary
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-lg leading-relaxed">
                {analysis.summary || 'No summary available'}
              </p>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Key Performance Insights
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Critical Issues
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{issue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Immediate Action Items
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.actions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyword Strategy */}
          {analysis.keywordStrategy && (
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Keyword Strategy Recommendations
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-lg leading-relaxed mb-4">
                  {analysis.keywordStrategy}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Keywords */}
          {analysis.topKeywords && analysis.topKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Top Performing Keywords
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.topKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{keyword}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Problem Keywords */}
          {analysis.problemKeywords && analysis.problemKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Problem Keywords (Needs Attention)
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.problemKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{keyword}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

                {/* Debug Information (Development Only) */}
          {process.env.NODE_ENV === 'development' && analysis && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <h3 className="text-lg font-semibold text-yellow-800">🐛 Debug Info (Development)</h3>
              </CardHeader>
              <CardContent>
                <details className="text-sm">
                  <summary className="cursor-pointer text-yellow-700">Click to see raw analysis data</summary>
                  <pre className="mt-2 p-3 bg-white rounded border text-xs overflow-auto">
                    {JSON.stringify(analysis, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}

          {/* Data Requirements */}
          <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Data Requirements for AI Analysis</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Required:</h4>
              <ul className="space-y-1">
                <li>• Search Term Report (Amazon PPC data)</li>
                <li>• Business Report (Sales performance data)</li>
                <li>• Cost Inputs (Optional, for enhanced analysis)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">AI Analyzes:</h4>
              <ul className="space-y-1">
                <li>• Campaign performance patterns</li>
                <li>• High ACoS search terms</li>
                <li>• Wasted spend identification</li>
                <li>• Optimization opportunities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
