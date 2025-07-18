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
    const tabOrder = [
      { id: 'overall', label: 'Overall Account' },
      { id: 'ppc', label: 'PPC View' },
      { id: 'organic', label: 'Organic View' },
      { id: 'asin', label: 'ASIN View' },
      { id: 'ppcaudit', label: 'PPC Audit' },
    ];
    // Use A4 landscape for better fit
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < tabOrder.length; i++) {
      const { id, label } = tabOrder[i];
      // Switch tab
      window.dispatchEvent(new CustomEvent('dashboard-export-tab', { detail: id }));
      // Wait for content to render
      await wait(500);
      // Wait for container to be visible
      let tries = 0;
      let containerElem = document.querySelector('.container.mx-auto');
      while ((!containerElem || (containerElem as HTMLElement).offsetHeight === 0) && tries < 10) {
        await wait(200);
        containerElem = document.querySelector('.container.mx-auto');
        tries++;
      }
      console.log('PDF Export: containerElem', containerElem);
      // DEBUG: Try capturing document.body instead of containerElem
      const targetElem = document.body;
      // Capture content with better quality
      const canvas = await html2canvas(targetElem as HTMLElement, { 
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fff'
      });
      const imgData = canvas.toDataURL('image/png');
      // Calculate proper scaling to fit content
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      // Check if content needs multiple pages
      const titleHeight = 15; // Space for title
      const availableHeight = pageHeight - 30; // 15mm margin top and bottom
      if (imgHeight <= availableHeight) {
        // Content fits on one page
        if (i > 0) pdf.addPage();
        // Add title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 10, 15);
        // Add content
        pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight, '', 'FAST');
      } else {
        // Content needs multiple pages - split it
        const pagesNeeded = Math.ceil(imgHeight / availableHeight);
        for (let page = 0; page < pagesNeeded; page++) {
          if (i > 0 || page > 0) pdf.addPage();
          // Add title only on first page of this section
          if (page === 0) {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(label, 10, 15);
          }
          // Calculate crop area for this page
          const cropY = page * availableHeight;
          const cropHeight = Math.min(availableHeight, imgHeight - cropY);
          // Create a temporary canvas to crop the image
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = cropHeight * (canvas.width / imgWidth);
          if (tempCtx) {
            tempCtx.drawImage(
              canvas,
              0, cropY * (canvas.width / imgWidth), // source x, y
              canvas.width, tempCanvas.height, // source width, height
              0, 0, // destination x, y
              tempCanvas.width, tempCanvas.height // destination width, height
            );
          }
          const croppedImgData = tempCanvas.toDataURL('image/png');
          // Add cropped content
          const yOffset = page === 0 ? 25 : 15; // Account for title on first page
          pdf.addImage(croppedImgData, 'PNG', 10, yOffset, imgWidth, cropHeight, '', 'FAST');
        }
      }
    }
    pdf.save('dashboard.pdf');
    document.body.classList.remove('pdf-exporting');
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