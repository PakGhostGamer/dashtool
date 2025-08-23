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
    // First, capture all sections from the current view without switching tabs
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Track current Y position for placing content
    let currentY = 20; // Start with 20mm margin from top
    let totalHeight = 20; // Track total height needed
    
    // Capture all sections from the current dashboard view
    const sections = [
      { label: 'Overall Account', selector: '.overview-section, #overview-content, .overall-section' },
      { label: 'PPC View', selector: '.ppc-section, #ppc-content, .ppc-view-section' },
      { label: 'Organic View', selector: '.organic-section, #organic-content, .organic-view-section' },
      { label: 'ASIN View', selector: '.asin-section, #asin-content, .asin-view-section' },
      { label: 'PPC Audit', selector: '.ppc-audit-section, #ppc-audit-content, .ppc-audit-section' }
    ];
    
    for (let i = 0; i < sections.length; i++) {
      const { label, selector } = sections[i];
      // Wait a bit for any animations or lazy loading to complete
      await wait(200);
      // Find the section element using the selector
      let targetElem = document.querySelector(selector);
      
      if (!targetElem) {
        console.warn(`Section not found for ${label} with selector: ${selector}`);
        // Try alternative selectors
        if (label === 'Overall Account') {
          targetElem = document.querySelector('.container.mx-auto') || document.querySelector('main');
        } else if (label === 'PPC View') {
          targetElem = document.querySelector('[data-tab="ppc"]') || document.querySelector('.ppc-content');
        } else if (label === 'Organic View') {
          targetElem = document.querySelector('[data-tab="organic"]') || document.querySelector('.organic-content');
        } else if (label === 'ASIN View') {
          targetElem = document.querySelector('[data-tab="asin"]') || document.querySelector('.asin-content');
        } else if (label === 'PPC Audit') {
          targetElem = document.querySelector('[data-tab="ppcaudit"]') || document.querySelector('.ppc-audit-content');
        }
        
        // If still no target, skip this section
        if (!targetElem) {
          console.warn(`Skipping ${label} - no element found`);
          continue;
        }
      }
      
      if (!targetElem) {
        console.warn(`Section not found for ${label}, using body as fallback`);
        targetElem = document.body;
      }
      
      // Ensure the section is visible and scroll into view
      if (targetElem && targetElem !== document.body) {
        targetElem.scrollIntoView({ behavior: 'instant', block: 'start' });
        await wait(300);
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
      
      console.log(`PDF Export: Adding ${label} - Section: ${targetElem.tagName}${targetElem.id ? '#' + targetElem.id : ''}${targetElem.className ? '.' + targetElem.className.split(' ').join('.') : ''}`);
      console.log(`PDF Export: Section dimensions - Width: ${targetElem.scrollWidth || targetElem.offsetWidth}px, Height: ${targetElem.scrollHeight || targetElem.offsetHeight}px`);
      console.log(`PDF Export: Canvas dimensions - Width: ${canvas.width}px, Height: ${canvas.height}px`);
      console.log(`PDF Export: Image dimensions - Width: ${imgWidth.toFixed(1)}mm x Height: ${imgHeight.toFixed(1)}mm`);
      
      // Add title for this section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 10, currentY);
      
      // Add the full image below the title
      pdf.addImage(imgData, 'PNG', 10, currentY + 10, imgWidth, imgHeight, '', 'FAST');
      
      // Move to next section position (add some spacing between sections)
      currentY += imgHeight + 30;
      
      // Update total height needed
      totalHeight = currentY;
    }
    
    // Resize the page to fit all content
    console.log(`PDF Export: Total height needed: ${totalHeight.toFixed(1)}mm`);
    pdf.internal.pageSize.setHeight(totalHeight + 20); // Add 20mm bottom margin
    
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