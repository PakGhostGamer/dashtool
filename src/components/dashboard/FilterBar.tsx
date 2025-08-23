import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Moon, Sun, Download, Globe } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const translations: Record<string, Record<string, string>> = {
  en: {
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    exportCSV: 'Export CSV',
    exportPDF: 'Export PDF',
  },
  ur: {
    darkMode: 'ڈارک موڈ',
    lightMode: 'لائٹ موڈ',
    language: 'زبان',
    exportCSV: 'CSV ایکسپورٹ کریں',
    exportPDF: 'PDF ایکسپورٹ کریں',
  },
  ar: {
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',
    exportCSV: 'تصدير CSV',
    exportPDF: 'تصدير PDF',
  },
  hi: {
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    language: 'भाषा',
    exportCSV: 'CSV निर्यात करें',
    exportPDF: 'PDF निर्यात करें',
  },
  zh: {
    darkMode: '深色模式',
    lightMode: '浅色模式',
    language: '语言',
    exportCSV: '导出CSV',
    exportPDF: '导出PDF',
  },
  es: {
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    language: 'Idioma',
    exportCSV: 'Exportar CSV',
    exportPDF: 'Exportar PDF',
  },
  fr: {
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    language: 'Langue',
    exportCSV: 'Exporter CSV',
    exportPDF: 'Exporter PDF',
  },
  de: {
    darkMode: 'Dunkler Modus',
    lightMode: 'Heller Modus',
    language: 'Sprache',
    exportCSV: 'CSV exportieren',
    exportPDF: 'PDF exportieren',
  },
};

export function FilterBar() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  const t = translations[language] || translations['en'];

  // Helper to wait for DOM updates
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Main export function
  const exportToPDF = async () => {
    document.body.classList.add('pdf-exporting');
    
    try {
      // Create PDF in portrait mode for better content flow
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Find the main dashboard container with better debugging
      console.log('PDF Export: Searching for dashboard container...');
      
      let dashboardContainer = document.querySelector('.min-h-screen.bg-gray-50');
      console.log('PDF Export: .min-h-screen.bg-gray-50:', dashboardContainer);
      
      if (!dashboardContainer) {
        dashboardContainer = document.querySelector('.container.mx-auto');
        console.log('PDF Export: .container.mx-auto:', dashboardContainer);
      }
      
      if (!dashboardContainer) {
        dashboardContainer = document.querySelector('main');
        console.log('PDF Export: main:', dashboardContainer);
      }
      
      if (!dashboardContainer) {
        dashboardContainer = document.querySelector('#root') || document.querySelector('#app');
        console.log('PDF Export: #root/#app:', dashboardContainer);
      }
      
      if (!dashboardContainer) {
        dashboardContainer = document.body;
        console.log('PDF Export: Using document.body as fallback');
      }
      
      console.log('PDF Export: Final dashboard container:', dashboardContainer);
      console.log('PDF Export: Container dimensions:', {
        offsetWidth: dashboardContainer.offsetWidth,
        offsetHeight: dashboardContainer.offsetHeight,
        scrollWidth: dashboardContainer.scrollWidth,
        scrollHeight: dashboardContainer.scrollHeight,
        clientWidth: dashboardContainer.clientWidth,
        clientHeight: dashboardContainer.clientHeight
      });
      
      // Capture the entire dashboard with full height
      console.log('PDF Export: Starting html2canvas capture...');
      
      const captureOptions = {
        scale: 1.5, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fff',
        scrollX: 0,
        scrollY: 0,
        // Capture the full scrollable content
        width: dashboardContainer.scrollWidth || dashboardContainer.offsetWidth,
        height: dashboardContainer.scrollHeight || dashboardContainer.offsetHeight,
        windowWidth: dashboardContainer.scrollWidth || dashboardContainer.offsetWidth,
        windowHeight: dashboardContainer.scrollHeight || dashboardContainer.offsetHeight
      };
      
      console.log('PDF Export: html2canvas options:', captureOptions);
      
      const canvas = await html2canvas(dashboardContainer as HTMLElement, captureOptions);
      console.log('PDF Export: html2canvas capture completed');
      console.log('PDF Export: Canvas created with dimensions:', canvas.width, 'x', canvas.height);
      
      const imgData = canvas.toDataURL('image/png');
      console.log('PDF Export: Image data URL created, length:', imgData.length);
      
      // Calculate dimensions to fit the page width
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log(`PDF Export: Dashboard dimensions - Width: ${dashboardContainer.scrollWidth || dashboardContainer.offsetWidth}px, Height: ${dashboardContainer.scrollHeight || dashboardContainer.offsetHeight}px`);
      console.log(`PDF Export: Canvas dimensions - Width: ${canvas.width}px, Height: ${canvas.height}px`);
      console.log(`PDF Export: Final PDF dimensions - Width: ${imgWidth.toFixed(1)}mm x Height: ${imgHeight.toFixed(1)}mm`);
      
      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Amazon Dashboard Report', 10, 15);
      
      // Add the full dashboard image
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight, '', 'FAST');
      
      // Resize the page to fit the content
      const requiredHeight = imgHeight + 40; // Image height + margins + title
      pdf.internal.pageSize.setHeight(requiredHeight);
      
      console.log(`PDF Export: Page resized to height: ${requiredHeight.toFixed(1)}mm`);
      
      // Save the PDF
      pdf.save('amazon-dashboard-report.pdf');
      console.log('PDF Export: Successfully created dashboard.pdf');
      
      // Verify the PDF was created with content
      if (canvas.width === 0 || canvas.height === 0) {
        console.warn('PDF Export: Canvas has zero dimensions, PDF may be blank');
        alert('Warning: The PDF may be blank. Check console for details.');
      } else {
        console.log('PDF Export: Canvas has valid dimensions, PDF should contain content');
      }
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Error creating PDF. Please try again.');
    } finally {
      document.body.classList.remove('pdf-exporting');
    }
  };

  const exportToCSV = () => {
    alert(t.exportCSV);
  };

  // Toggle dark mode using Tailwind's dark class on <html>
  const handleDarkModeToggle = () => {
    setDarkMode((prev) => {
      const next = !prev;
      const html = document.documentElement;
      if (next) {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.remove('dark');
        html.classList.add('light');
      }
      return next;
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Dark/Light mode toggle removed */}
          {/*
          <div className="flex items-center gap-2">
            <button
              onClick={handleDarkModeToggle}
              className={`w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'}`}
              aria-label="Toggle dark/light mode"
            >
              <span className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${darkMode ? 'translate-x-8' : ''}`}>{darkMode ? <Moon className="w-4 h-4 text-yellow-300" /> : <Sun className="w-4 h-4 text-yellow-500" />}</span>
            </button>
            <span className="text-sm font-medium text-gray-700">
              {darkMode ? t.darkMode : t.lightMode}
            </span>
          </div>
          */}

          {/* Language selector removed */}
          {/*
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
              <option value="zh">Chinese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
            <span className="text-sm font-medium text-gray-700">{t.language}</span>
          </div>
          */}

          <div className="ml-auto flex gap-2">
            {/* CSV export button hidden */}
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Download className="w-4 h-4 mr-2" />
              {t.exportPDF}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}