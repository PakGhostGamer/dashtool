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
      // Capture each section individually with its full height
      let targetElem;
      
      // Find the specific section element based on the label
      if (label === 'Overview') {
        targetElem = document.querySelector('#overview-content') || document.querySelector('.overview-section');
      } else if (label === 'ASIN Performance') {
        targetElem = document.querySelector('#asin-content') || document.querySelector('.asin-section');
      } else if (label === 'PPC Audit') {
        targetElem = document.querySelector('#ppc-audit-content') || document.querySelector('.ppc-audit-section');
      } else if (label === 'AI Audit') {
        targetElem = document.querySelector('#ai-audit-content') || document.querySelector('.ai-audit-section');
      } else if (label === 'Organic View') {
        targetElem = document.querySelector('#organic-content') || document.querySelector('.organic-section');
      } else {
        // Fallback to body if section not found
        targetElem = document.body;
      }
      
      if (!targetElem) {
        console.warn(`Section not found for ${label}, using body as fallback`);
        targetElem = document.body;
      }
      
      // Ensure the section is fully visible and expanded
      if (targetElem !== document.body) {
        // Scroll the section into view
        targetElem.scrollIntoView({ behavior: 'instant', block: 'start' });
        
        // Wait a bit for any animations or lazy loading to complete
        await wait(300);
        
        // Force any hidden content to be visible
        const style = window.getComputedStyle(targetElem);
        if (style.display === 'none') {
          console.warn(`Section ${label} is hidden, attempting to make visible`);
        }
      }
      
      // Capture the specific section with full height
      const canvas = await html2canvas(targetElem as HTMLElement, { 
        scale: 1.5, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fff',
        scrollX: 0,
        scrollY: 0,
        // Use the actual element dimensions, not the entire document
        width: targetElem.scrollWidth || targetElem.offsetWidth,
        height: targetElem.scrollHeight || targetElem.offsetHeight,
        // Ensure we capture the full content
        windowWidth: targetElem.scrollWidth || targetElem.offsetWidth,
        windowHeight: targetElem.scrollHeight || targetElem.offsetHeight
      });
      const imgData = canvas.toDataURL('image/png');
      // Calculate proper scaling to fit content
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create one long page per section instead of splitting across multiple pages
      if (i > 0) pdf.addPage();
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 10, 15);
      
      console.log(`PDF Export: Adding ${label} - Section: ${targetElem.tagName}${targetElem.id ? '#' + targetElem.id : ''}${targetElem.className ? '.' + targetElem.className.split(' ').join('.') : ''}`);
      console.log(`PDF Export: Section dimensions - Width: ${targetElem.scrollWidth || targetElem.offsetWidth}px, Height: ${targetElem.scrollHeight || targetElem.offsetHeight}px`);
      console.log(`PDF Export: Canvas dimensions - Width: ${canvas.width}px, Height: ${canvas.height}px`);
      console.log(`PDF Export: Final PDF dimensions - Width: ${imgWidth.toFixed(1)}mm x Height: ${imgHeight.toFixed(1)}mm`);
      
      // Add the full image - it will create a long page automatically
      // jsPDF will automatically extend the page height to accommodate the full image
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight, '', 'FAST');
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