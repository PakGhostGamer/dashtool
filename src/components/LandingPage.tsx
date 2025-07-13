import React from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { BarChart3, Upload, DollarSign, TrendingUp, Shield, Download } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onGuest: () => void;
}

export function LandingPage({ onLogin, onGuest }: LandingPageProps) {
  const features = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: 'Upload Reports',
      description: 'Import Business Reports and Search Term Reports with automatic validation'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboard with PPC, organic, and ASIN performance views'
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: 'Profit Tracking',
      description: 'Real-time profit calculations with customizable cost inputs'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'PPC Optimization',
      description: 'Identify high ACoS terms, wasted spend, and optimization opportunities'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Storage',
      description: 'Your data is encrypted and stored securely in the cloud'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Reports',
      description: 'Generate PDF and CSV exports for all your analysis'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Amazon Seller
            <span className="text-blue-600"> Analytics Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your Amazon Business Reports and Search Term data into actionable insights. 
            Track profits, optimize PPC campaigns, and grow your business with advanced analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              onClick={onLogin} 
              size="lg" 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              Login / Sign Up
            </Button>
            <Button 
              onClick={onGuest} 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto"
            >
              Continue as Guest
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            <span className="font-medium">Guest Mode:</span> Data will not be saved after session ends
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900">
              How It Works
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload Reports</h3>
                <p className="text-sm text-gray-600">Import your Amazon Business Reports and Search Term Reports</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Enter Costs</h3>
                <p className="text-sm text-gray-600">Add sale prices, Amazon fees, and cost of goods sold</p>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-yellow-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Analyze</h3>
                <p className="text-sm text-gray-600">View comprehensive analytics across multiple dashboard tabs</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Export</h3>
                <p className="text-sm text-gray-600">Generate PDF reports and CSV exports for further analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}