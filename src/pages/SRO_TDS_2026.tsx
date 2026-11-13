import React, { useEffect, useRef, useState } from 'react';
import { SEO } from '@/components/SEO';

const escapeCsvCell = (value: string): string => {
  const cleaned = value.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
  return `"${cleaned.replace(/"/g, '""')}"`;
};

const triggerCsvDownload = (csvRows: string[], filename: string) => {
  // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel & offline spreadsheet tools render Bengali Unicode properly
  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const parseBengaliOrEnglishPercent = (raw: string): number | null => {
  const map: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };
  const normalized = raw.replace(/[০-৯]/g, (m) => map[m] || m);
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return Number.isFinite(val) ? val : null;
};

export const SRO_TDS_2026: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [globalQuery, setGlobalQuery] = useState<string>('');
  const [activeQuickRate, setActiveQuickRate] = useState<string>('');
  const [matchedStats, setMatchedStats] = useState<{
    visibleRows: number;
    totalRows: number;
    matchingTables: number;
    totalTables: number;
  }>({
    visibleRows: 99,
    totalRows: 99,
    matchingTables: 7,
    totalTables: 7,
  });

  // Interactive TDS & Rule 12 Gross-Up Calculator State
  const [billAmount, setBillAmount] = useState<string>('100000');
  const [tdsRate, setTdsRate] = useState<string>('5');
  const [isGrossUp, setIsGrossUp] = useState<boolean>(false);
  const [noPsrPenalty, setNoPsrPenalty] = useState<boolean>(false);
  const [selectedRuleLabel, setSelectedRuleLabel] = useState<string>('সাধারণ পণ্য সরবরাহ / সেবা');

  const showToast = (msg: string) => {
    setExportFeedback(msg);
    window.setTimeout(() => {
      setExportFeedback((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const applyGlobalFilterToAllTables = (textVal: string, rateVal: string) => {
    const root = containerRef.current;
    if (!root) return;
    const containers = root.querySelectorAll('.table-container');
    containers.forEach((container) => {
      const rateInput = container.querySelector('.search-rate') as HTMLInputElement | null;
      const textInput = container.querySelector('.search-text') as HTMLInputElement | null;
      if (rateInput) {
        rateInput.value = rateVal;
        rateInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (textInput) {
        textInput.value = textVal;
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  };

  const handleGlobalSearchChange = (val: string) => {
    setGlobalQuery(val);
    applyGlobalFilterToAllTables(val, activeQuickRate);
  };

  const handleQuickRateSelect = (rateChip: string) => {
    const nextRate = activeQuickRate === rateChip ? '' : rateChip;
    setActiveQuickRate(nextRate);
    applyGlobalFilterToAllTables(globalQuery, nextRate);
  };

  const handleKeywordTagSelect = (keyword: string) => {
    const nextQuery = globalQuery === keyword ? '' : keyword;
    setGlobalQuery(nextQuery);
    applyGlobalFilterToAllTables(nextQuery, activeQuickRate);
  };

  // Computed TDS & Rule 12 Gross-Up values
  const numericBill = Math.max(0, parseFloat(billAmount.replace(/,/g, '')) || 0);
  const baseRate = Math.max(0, Math.min(99, parseFloat(tdsRate) || 0));
  const effectiveRate = noPsrPenalty ? Math.min(99, baseRate * 1.5) : baseRate;

  // Rule 12 Formula: গ = (১০০ × ক) / (১০০ − খ)
  const grossedUpBase = isGrossUp
    ? (100 * numericBill) / Math.max(1, 100 - effectiveRate)
    : numericBill;
  const calculatedTds = (grossedUpBase * effectiveRate) / 100;
  const netPayableToVendor = isGrossUp ? numericBill : Math.max(0, numericBill - calculatedTds);

  // Export all currently visible (filtered) rows across all tables on the page
  const handleExportAllFilteredCsv = () => {
    const root = containerRef.current;
    if (!root) return;

    const tableContainers = root.querySelectorAll('.table-container');
    const csvRows: string[] = [
      [
        escapeCsvCell('বিধি / বিভাগ (Section)'),
        escapeCsvCell('ক্রমিক / শ্রেণি (SL / Category)'),
        escapeCsvCell('বর্ণনা / বিবরণ (Description)'),
        escapeCsvCell('উৎসে কর হার / বিস্তারিত (Rate / Details)'),
      ].join(','),
    ];

    let totalExported = 0;

    tableContainers.forEach((container) => {
      const sectionEl = container.closest('section');
      const sectionHeading =
        sectionEl?.querySelector('h2')?.textContent?.trim() || 'উৎসে কর বিধিমালা ২০২৬';
      const subHeading = container.previousElementSibling?.tagName === 'H3'
        ? ` — ${container.previousElementSibling.textContent?.trim()}`
        : '';
      const sectionTitle = `${sectionHeading}${subHeading}`;

      const rows = container.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const rowEl = row as HTMLElement;
        if (rowEl.style.display === 'none') return;

        const cells = Array.from(rowEl.querySelectorAll('td')).map(
          (td) => td.textContent?.trim() || ''
        );
        if (cells.length === 3) {
          csvRows.push(
            [
              escapeCsvCell(sectionTitle),
              escapeCsvCell(cells[0]),
              escapeCsvCell(cells[1]),
              escapeCsvCell(cells[2]),
            ].join(',')
          );
          totalExported++;
        } else if (cells.length === 2) {
          csvRows.push(
            [
              escapeCsvCell(sectionTitle),
              escapeCsvCell('-'),
              escapeCsvCell(cells[0]),
              escapeCsvCell(cells[1]),
            ].join(',')
          );
          totalExported++;
        }
      });
    });

    if (totalExported === 0) {
      showToast('কোনো ফলাফল পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।');
      return;
    }

    triggerCsvDownload(csvRows, 'SRO-273-TDS-2026-filtered-all.csv');
    showToast(`সফলভাবে ${totalExported}টি সারির CSV ফাইল ডাউনলোড হয়েছে!`);
  };

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      const progressBar = document.getElementById('progress-bar');
      if (progressBar) {
        progressBar.style.width = scrolled + '%';
      }

      const sections = document.querySelectorAll('.sro-page-wrapper section');
      const navLi = document.querySelectorAll('.sro-page-wrapper .toc-list a');
      let current = '';
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (window.scrollY >= sectionTop - 140) {
          current = section.getAttribute('id') || '';
        }
      });

      navLi.forEach((a) => {
        a.classList.remove('active');
        if (a.getAttribute('href') === '#' + current) {
          a.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);

    const toBengaliNumber = (str: string) => {
      const map: Record<string, string> = {
        '0': '০',
        '1': '১',
        '2': '২',
        '3': '৩',
        '4': '৪',
        '5': '৫',
        '6': '৬',
        '7': '৭',
        '8': '৮',
        '9': '৯',
      };
      return str.replace(/[0-9]/g, (match) => map[match]);
    };

    const toEnglishNumber = (str: string) => {
      const map: Record<string, string> = {
        '০': '0',
        '১': '1',
        '২': '2',
        '৩': '3',
        '৪': '4',
        '৫': '5',
        '৬': '6',
        '৭': '7',
        '৮': '8',
        '৯': '9',
      };
      return str.replace(/[০-৯]/g, (match) => map[match]);
    };

    const tableContainers = document.querySelectorAll('.sro-page-wrapper .table-container');
    const cleanupFns: Array<() => void> = [];

    const recomputeAggregateStats = () => {
      let visibleRows = 0;
      let totalRows = 0;
      let matchingTables = 0;
      const totalTables = tableContainers.length;

      tableContainers.forEach((container) => {
        const rows = container.querySelectorAll('tbody tr');
        let tableVisible = 0;
        rows.forEach((r) => {
          totalRows++;
          if ((r as HTMLElement).style.display !== 'none') {
            visibleRows++;
            tableVisible++;
          }
        });
        if (tableVisible > 0) {
          matchingTables++;
        }
      });

      setMatchedStats({
        visibleRows,
        totalRows,
        matchingTables,
        totalTables,
      });
    };

    const handleGlobalShortcut = (e: KeyboardEvent) => {
      const key = typeof e.key === 'string' ? e.key : '';
      const activeTag = document.activeElement?.tagName;
      if (
        key === '/' &&
        activeTag !== 'INPUT' &&
        activeTag !== 'TEXTAREA' &&
        activeTag !== 'SELECT'
      ) {
        e.preventDefault();
        keywordInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcut);
    cleanupFns.push(() => window.removeEventListener('keydown', handleGlobalShortcut));

    tableContainers.forEach((container, index) => {
      const rateInput = container.querySelector('.search-rate') as HTMLInputElement | null;
      const textInput = container.querySelector('.search-text') as HTMLInputElement | null;
      const resetBtn = container.querySelector('.reset-filter-btn') as HTMLButtonElement | null;
      const exportBtn = container.querySelector('.export-csv-btn') as HTMLButtonElement | null;
      const countBadge = container.querySelector('.row-count-badge') as HTMLElement | null;
      const rows = container.querySelectorAll('tbody tr');
      const noResultsMsg = container.querySelector('.no-results') as HTMLElement | null;

      if (!rows.length) return;

      const updateCountBadge = (visible: number, total: number) => {
        if (countBadge) {
          countBadge.textContent = `${toBengaliNumber(String(visible))} / ${toBengaliNumber(String(total))} টি সারি`;
        }
      };

      updateCountBadge(rows.length, rows.length);

      const filterTable = () => {
        const rateQuery = rateInput ? rateInput.value.trim().toLowerCase() : '';
        const textQuery = textInput ? textInput.value.trim().toLowerCase() : '';

        const rateQueryBengali = toBengaliNumber(rateQuery);
        const rateQueryEnglish = toEnglishNumber(rateQuery);

        // Split keyword query into tokens so multi-word searches match across any cells in the row
        const keywordTokens = textQuery
          .split(/\s+/)
          .map((t) => t.trim())
          .filter(Boolean);

        let visibleCount = 0;
        const hasActiveFilter = rateQuery !== '' || keywordTokens.length > 0;

        rows.forEach((row) => {
          const rowEl = row as HTMLTableRowElement;
          const normalizedRowText = (rowEl.textContent || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
          const lastCellIndex = rowEl.cells.length - 1;
          const rateCell =
            lastCellIndex >= 0
              ? (rowEl.cells[lastCellIndex].textContent || '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .toLowerCase()
              : normalizedRowText;

          const matchesRate =
            rateQuery === '' ||
            rateCell.includes(rateQuery) ||
            rateCell.includes(rateQueryBengali) ||
            rateCell.includes(rateQueryEnglish);

          const matchesText =
            keywordTokens.length === 0 ||
            keywordTokens.every((token) => {
              const tokenBn = toBengaliNumber(token);
              const tokenEn = toEnglishNumber(token);
              return (
                normalizedRowText.includes(token) ||
                normalizedRowText.includes(tokenBn) ||
                normalizedRowText.includes(tokenEn)
              );
            });

          if (matchesRate && matchesText) {
            rowEl.style.display = '';
            if (hasActiveFilter) {
              rowEl.classList.add('row-keyword-match');
            } else {
              rowEl.classList.remove('row-keyword-match');
            }
            visibleCount++;
          } else {
            rowEl.style.display = 'none';
            rowEl.classList.remove('row-keyword-match');
          }
        });

        updateCountBadge(visibleCount, rows.length);

        if (resetBtn) {
          resetBtn.style.display = hasActiveFilter ? 'inline-flex' : 'none';
        }

        if (noResultsMsg) {
          noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        recomputeAggregateStats();
      };

      const handleReset = () => {
        if (rateInput) rateInput.value = '';
        if (textInput) textInput.value = '';
        filterTable();
      };

      const handleExportTableCsv = () => {
        const sectionEl = container.closest('section');
        const sectionId = sectionEl?.getAttribute('id') || `table-${index + 1}`;
        const headerCells = Array.from(container.querySelectorAll('thead th')).map((th) =>
          escapeCsvCell(th.textContent || '')
        );

        const csvRows: string[] = [];
        if (headerCells.length > 0) {
          csvRows.push(headerCells.join(','));
        }

        let exportedCount = 0;
        rows.forEach((row) => {
          const rowEl = row as HTMLTableRowElement;
          if (rowEl.style.display === 'none') return;
          const cellValues = Array.from(rowEl.querySelectorAll('td')).map((td) =>
            escapeCsvCell(td.textContent || '')
          );
          if (cellValues.length > 0) {
            csvRows.push(cellValues.join(','));
            exportedCount++;
          }
        });

        if (exportedCount === 0) {
          showToast('এই টেবিলে এক্সপোর্ট করার মতো কোনো দৃশ্যমান সারি নেই।');
          return;
        }

        const filename = `SRO-273-TDS-2026-${sectionId}-filtered.csv`;
        triggerCsvDownload(csvRows, filename);
        showToast(`সফলভাবে ${exportedCount}টি সারির CSV ডাউনলোড হয়েছে (${filename})`);
      };

      const tableEl = container.querySelector('table');
      let activeColIndex: number | null = null;

      const clearColumnHighlight = () => {
        if (!tableEl || activeColIndex === null) return;
        tableEl.querySelectorAll('.col-hover, .cell-hover').forEach((el) => {
          el.classList.remove('col-hover', 'cell-hover');
        });
        activeColIndex = null;
      };

      const handleTableMouseOver = (e: Event) => {
        if (!tableEl) return;
        const target = e.target as HTMLElement | null;
        const cell = target?.closest('td, th') as HTMLTableCellElement | null;
        if (!cell || !tableEl.contains(cell)) {
          clearColumnHighlight();
          return;
        }

        const colIdx = cell.cellIndex;
        if (colIdx !== activeColIndex) {
          tableEl.querySelectorAll('.col-hover').forEach((el) => el.classList.remove('col-hover'));
          activeColIndex = colIdx;
          const allRows = tableEl.querySelectorAll('tr');
          allRows.forEach((tr) => {
            const targetCell = (tr as HTMLTableRowElement).cells[colIdx];
            if (targetCell) {
              targetCell.classList.add('col-hover');
            }
          });
        }

        tableEl.querySelectorAll('.cell-hover').forEach((el) => el.classList.remove('cell-hover'));
        if (cell.tagName === 'TD') {
          cell.classList.add('cell-hover');
        }
      };

      const handleTableMouseLeave = () => {
        clearColumnHighlight();
      };

      const handleTableClick = (e: Event) => {
        const target = e.target as HTMLElement | null;
        const rateCell = target?.closest('td.rate-col') as HTMLTableCellElement | null;
        if (!rateCell) return;
        const parsed = parseBengaliOrEnglishPercent(rateCell.textContent || '');
        if (parsed !== null) {
          const rowEl = rateCell.closest('tr');
          const descCell =
            rowEl && rowEl.cells.length >= 2
              ? rowEl.cells[rowEl.cells.length === 3 ? 1 : 0]?.textContent?.trim()
              : '';
          setTdsRate(String(parsed));
          if (descCell) {
            setSelectedRuleLabel(descCell.slice(0, 65) + (descCell.length > 65 ? '...' : ''));
          }
          showToast(`ক্যালকুলেটরে ${parsed}% উৎসে করহার সেট করা হয়েছে!`);
        }
      };

      if (rateInput) rateInput.addEventListener('input', filterTable);
      if (textInput) textInput.addEventListener('input', filterTable);
      if (resetBtn) resetBtn.addEventListener('click', handleReset);
      if (exportBtn) exportBtn.addEventListener('click', handleExportTableCsv);
      if (tableEl) {
        tableEl.addEventListener('mouseover', handleTableMouseOver);
        tableEl.addEventListener('mouseleave', handleTableMouseLeave);
        tableEl.addEventListener('click', handleTableClick);
      }

      cleanupFns.push(() => {
        if (rateInput) rateInput.removeEventListener('input', filterTable);
        if (textInput) textInput.removeEventListener('input', filterTable);
        if (resetBtn) resetBtn.removeEventListener('click', handleReset);
        if (exportBtn) exportBtn.removeEventListener('click', handleExportTableCsv);
        if (tableEl) {
          tableEl.removeEventListener('mouseover', handleTableMouseOver);
          tableEl.removeEventListener('mouseleave', handleTableMouseLeave);
          tableEl.removeEventListener('click', handleTableClick);
        }
      });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <div ref={containerRef} className="sro-page-wrapper">
      <SEO
        title="উৎসে কর বিধিমালা, ২০২৬ (SRO 273-Law/Income Tax-5/2026) | Musa & Musa"
        description="গণপ্রজাতন্ত্রী বাংলাদেশ সরকার ও জাতীয় রাজস্ব বোর্ড (NBR) কর্তৃক জারিকৃত উৎসে কর বিধিমালা, ২০২৬ (এস.আর.ও. নং-২৭৩-আইন/আয়কর-৫/২০২৬) - সম্পূর্ণ গেজেট, করহার টেবিল ও CSV ডাউনলোড।"
        canonicalUrl="https://musaandmusa.com/SRO/TDS2026"
      />
      <style>{`
        .sro-page-wrapper {
          --primary: #0f4c81;
          --primary-light: #e6f0fa;
          --secondary: #008080;
          --accent: #d9534f;
          --bg-body: #f4f7f6;
          --bg-card: #ffffff;
          --text-main: #2c3e50;
          --text-muted: #596a7a;
          --border-color: #dce4ec;
          --shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          --radius: 10px;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          font-family: 'Hind Siliguri', 'SolaimanLipi', system-ui, -apple-system, sans-serif;
          background-color: var(--bg-body);
          color: var(--text-main);
          line-height: 1.8;
          font-size: 16px;
        }

        .sro-page-wrapper #progress-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: transparent;
          z-index: 9999;
        }
        .sro-page-wrapper #progress-bar {
          height: 4px;
          background: linear-gradient(90deg, var(--secondary), var(--accent));
          width: 0%;
          transition: width 0.2s ease;
        }

        .sro-page-wrapper .gov-banner {
          width: 100%;
          box-sizing: border-box;
          background: linear-gradient(135deg, #0a2540 0%, var(--primary) 100%);
          color: #fff;
          text-align: center;
          padding: clamp(28px, 4vw, 48px) clamp(16px, 3vw, 40px) clamp(24px, 3.5vw, 38px);
          border-bottom: 5px solid var(--secondary);
          position: relative;
        }
        .sro-page-wrapper .gov-banner-inner {
          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
        }
        .sro-page-wrapper .gov-banner h1 {
          font-size: clamp(1.65rem, 2.8vw, 2.5rem);
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
          color: #fff;
        }
        .sro-page-wrapper .gov-banner .sub-title {
          font-size: clamp(0.98rem, 1.3vw, 1.2rem);
          color: #cbd5e1;
          margin-bottom: 18px;
        }
        .sro-page-wrapper .badge-container {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sro-page-wrapper .gov-badge {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(5px);
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.95rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fff;
        }
        .sro-page-wrapper .hero-actions {
          margin-top: 22px;
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sro-page-wrapper .hero-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .sro-page-wrapper .hero-btn-primary {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .sro-page-wrapper .hero-btn-primary:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        .sro-page-wrapper .hero-btn-secondary {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.35);
        }
        .sro-page-wrapper .hero-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.24);
        }

        .sro-page-wrapper .toast-banner {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #0a2540;
          color: #fff;
          border-left: 4px solid #10b981;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          z-index: 9999;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .sro-page-wrapper .layout-wrapper {
          width: 100%;
          max-width: 1527px;
          margin: 30px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 30px;
          align-items: start;
        }

        .sro-page-wrapper .sidebar {
          position: sticky;
          top: 25px;
          background: var(--bg-card);
          border-radius: var(--radius);
          padding: 25px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
          max-height: calc(100vh - 50px);
          overflow-y: auto;
        }
        .sro-page-wrapper .sidebar h3 {
          font-size: 1.2rem;
          color: var(--primary);
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--primary-light);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sro-page-wrapper .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sro-page-wrapper .toc-list li {
          margin-bottom: 8px;
        }
        .sro-page-wrapper .toc-list a {
          text-decoration: none;
          color: var(--text-muted);
          font-size: 0.95rem;
          display: block;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        .sro-page-wrapper .toc-list a:hover,
        .sro-page-wrapper .toc-list a.active {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
          transform: translateX(4px);
        }

        .sro-page-wrapper .main-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
          min-width: 0;
        }

        .sro-page-wrapper section {
          background: var(--bg-card);
          border-radius: var(--radius);
          padding: 35px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border-color);
          scroll-margin-top: 25px;
        }

        .sro-page-wrapper h2 {
          color: var(--primary);
          font-size: 1.6rem;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--primary-light);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sro-page-wrapper h2 span.num {
          background: var(--primary);
          color: #fff;
          font-size: 1rem;
          padding: 4px 12px;
          border-radius: 6px;
        }
        .sro-page-wrapper h3 {
          color: var(--secondary);
          font-size: 1.25rem;
          margin: 25px 0 12px;
        }
        .sro-page-wrapper p {
          margin-bottom: 15px;
          text-align: justify;
        }
        .sro-page-wrapper ul,
        .sro-page-wrapper ol {
          margin-left: 25px;
          margin-bottom: 15px;
        }
        .sro-page-wrapper li {
          margin-bottom: 8px;
        }

        .sro-page-wrapper .proviso {
          background: #fff8e6;
          border-left: 4px solid #f59e0b;
          padding: 15px 20px;
          border-radius: 0 8px 8px 0;
          margin: 15px 0;
          font-size: 0.95rem;
        }
        .sro-page-wrapper .formula-box {
          background: var(--primary-light);
          border: 1px dashed var(--primary);
          padding: 20px;
          border-radius: 8px;
          margin: 15px 0;
          font-weight: 500;
        }

        .sro-page-wrapper .sro-realtime-search-panel {
          background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
          border: 2px solid #0f4c81;
          border-radius: var(--radius);
          padding: 20px 24px;
          box-shadow: 0 8px 24px rgba(15, 76, 129, 0.08);
          position: sticky;
          top: 14px;
          z-index: 40;
        }
        .sro-page-wrapper .sro-realtime-search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .sro-page-wrapper .sro-realtime-search-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sro-page-wrapper .sro-realtime-stats-badge {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f4c81;
          background: #dbeafe;
          border: 1px solid #93c5fd;
          padding: 4px 12px;
          border-radius: 50px;
        }
        .sro-page-wrapper .sro-realtime-input-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .sro-page-wrapper .sro-realtime-input-wrap {
          flex: 1;
          min-width: 240px;
          position: relative;
        }
        .sro-page-wrapper .sro-realtime-input {
          width: 100%;
          padding: 11px 16px;
          border: 1.5px solid #94a3b8;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.98rem;
          color: var(--text-main);
          background: #ffffff;
          outline: none;
          transition: all 0.2s ease;
        }
        .sro-page-wrapper .sro-realtime-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(15, 76, 129, 0.14);
        }
        .sro-page-wrapper .sro-keyword-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .sro-page-wrapper .sro-keyword-chip {
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sro-page-wrapper .sro-keyword-chip:hover,
        .sro-page-wrapper .sro-keyword-chip.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }

        .sro-page-wrapper .table-container {
          margin: 20px 0;
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          overflow: hidden;
          background: #fff;
        }
        .sro-page-wrapper .table-controls {
          background: #f8fafc;
          padding: 14px 16px;
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          align-items: center;
        }
        .sro-page-wrapper .search-box {
          flex: 1;
          min-width: 200px;
          position: relative;
        }
        .sro-page-wrapper .search-box.search-box-rate {
          flex: 0.65;
          min-width: 165px;
        }
        .sro-page-wrapper .search-box input {
          width: 100%;
          padding: 9px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
          background: #fff;
          color: var(--text-main);
        }
        .sro-page-wrapper .search-box input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.1);
        }
        .sro-page-wrapper .table-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sro-page-wrapper .row-count-badge {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary);
          background: var(--primary-light);
          padding: 6px 12px;
          border-radius: 6px;
          white-space: nowrap;
        }
        .sro-page-wrapper .reset-filter-btn {
          display: none;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #475569;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sro-page-wrapper .reset-filter-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .sro-page-wrapper .export-csv-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 6px;
          border: 1px solid #0f4c81;
          background: #0f4c81;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .sro-page-wrapper .export-csv-btn:hover {
          background: #09355c;
          border-color: #09355c;
        }

        .sro-page-wrapper .table-wrap {
          overflow-x: auto;
          max-height: 600px;
        }
        .sro-page-wrapper table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .sro-page-wrapper th {
          background: var(--primary);
          color: #fff;
          padding: 14px 16px;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .sro-page-wrapper th.col-hover,
        .sro-page-wrapper table:has(tr > *:nth-child(1):hover) tr > th:nth-child(1),
        .sro-page-wrapper table:has(tr > *:nth-child(2):hover) tr > th:nth-child(2),
        .sro-page-wrapper table:has(tr > *:nth-child(3):hover) tr > th:nth-child(3) {
          background: #1663a6;
          box-shadow: inset 0 -3px 0 #38bdf8;
        }
        .sro-page-wrapper td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: top;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .sro-page-wrapper tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .sro-page-wrapper tbody tr:hover {
          background-color: #eef5fc;
        }
        .sro-page-wrapper tbody tr.row-keyword-match {
          background-color: #f0fdf4;
        }
        .sro-page-wrapper tbody tr.row-keyword-match td:first-child {
          box-shadow: inset 4px 0 0 #10b981;
        }
        .sro-page-wrapper td.col-hover,
        .sro-page-wrapper table:has(tr > *:nth-child(1):hover) tbody tr > td:nth-child(1),
        .sro-page-wrapper table:has(tr > *:nth-child(2):hover) tbody tr > td:nth-child(2),
        .sro-page-wrapper table:has(tr > *:nth-child(3):hover) tbody tr > td:nth-child(3) {
          background-color: rgba(15, 76, 129, 0.065);
        }
        .sro-page-wrapper tbody tr:hover td.col-hover,
        .sro-page-wrapper td.cell-hover {
          background-color: rgba(15, 76, 129, 0.13);
          box-shadow: inset 0 0 0 1px rgba(15, 76, 129, 0.22);
        }
        .sro-page-wrapper .rate-col {
          font-weight: 700;
          color: var(--accent);
          white-space: nowrap;
          text-align: center;
          background: rgba(217, 83, 79, 0.05);
          cursor: pointer;
        }
        .sro-page-wrapper .rate-col.col-hover,
        .sro-page-wrapper table:has(tr > *:nth-child(2):hover) tbody tr > td.rate-col:nth-child(2),
        .sro-page-wrapper table:has(tr > *:nth-child(3):hover) tbody tr > td.rate-col:nth-child(3) {
          background-color: rgba(217, 83, 79, 0.12);
        }
        .sro-page-wrapper tbody tr:hover .rate-col.col-hover,
        .sro-page-wrapper .rate-col.cell-hover {
          background-color: rgba(217, 83, 79, 0.18);
          box-shadow: inset 0 0 0 1px rgba(217, 83, 79, 0.35);
        }
        .sro-page-wrapper .no-results {
          display: none;
          text-align: center;
          padding: 25px;
          color: var(--accent);
          font-weight: 600;
        }

        .sro-page-wrapper details {
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin: 15px 0;
          overflow: hidden;
        }
        .sro-page-wrapper summary {
          padding: 15px 20px;
          font-weight: 600;
          color: var(--primary);
          cursor: pointer;
          background: #eef5fc;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sro-page-wrapper summary::-webkit-details-marker {
          display: none;
        }
        .sro-page-wrapper summary::after {
          content: '➕';
          font-size: 0.9rem;
        }
        .sro-page-wrapper details[open] summary::after {
          content: '➖';
        }
        .sro-page-wrapper .details-content {
          padding: 20px;
          border-top: 1px solid var(--border-color);
          max-height: 400px;
          overflow-y: auto;
        }

        @media (max-width: 992px) {
          .sro-page-wrapper .layout-wrapper {
            grid-template-columns: 1fr;
          }
          .sro-page-wrapper .sidebar {
            position: relative;
            top: 0;
            max-height: none;
            order: -1;
          }
          .sro-page-wrapper .gov-banner h1 {
            font-size: 1.8rem;
          }
          .sro-page-wrapper section {
            padding: 20px;
          }
        }

        @media print {
          .sro-page-wrapper .sidebar,
          .sro-page-wrapper .table-controls,
          .sro-page-wrapper .hero-actions,
          .sro-page-wrapper #progress-container {
            display: none !important;
          }
          .sro-page-wrapper .layout-wrapper {
            grid-template-columns: 1fr;
          }
          .sro-page-wrapper section {
            box-shadow: none;
            border: 1px solid #000;
            page-break-inside: avoid;
          }
          .sro-page-wrapper .table-wrap {
            max-height: none;
            overflow: visible;
          }
        }
      `}</style>

      <div id="progress-container">
        <div id="progress-bar"></div>
      </div>

      {exportFeedback && (
        <div className="toast-banner" role="status" aria-live="polite">
          ✅ {exportFeedback}
        </div>
      )}

      <header className="gov-banner">
        <div className="gov-banner-inner">
          <div className="sub-title">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • জাতীয় রাজস্ব বোর্ড (NBR)</div>
          <h1>উৎসে কর বিধিমালা, ২০২৬</h1>
          <div className="badge-container">
            <span className="gov-badge">📜 এস.আর.ও. নং-২৭৩-আইন/আয়কর-৫/২০২৬</span>
            <span className="gov-badge">📅 তারিখ: ২৪ আষাঢ়, ১৪৩৩ বঙ্গাব্দ / ০৮ জুলাই, ২০২৬ খ্রিষ্টাব্দ</span>
            <span className="gov-badge">⚖️ আয়কর আইন, ২০২৩ এর ধারা ৩৪৩ এর ক্ষমতাবলে</span>
          </div>

          {/* Global Multi-Table Search & Quick Rate Chips */}
          <div style={{ width: '100%', maxWidth: '1160px', margin: '22px auto 0' }}>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                background: 'rgba(255,255,255,0.12)',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                value={globalQuery}
                onChange={(e) => handleGlobalSearchChange(e.target.value)}
                placeholder="🔍 সকল তফসিল ও সারণীতে একসাথে খুঁজুন (যেমন: পরামর্শক, ভাড়া, সফটওয়্যার, কয়লা)..."
                style={{
                  flex: 1,
                  minWidth: 'min(100%, 220px)',
                  padding: '10px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#1e293b',
                  background: '#ffffff',
                }}
              />
              {(globalQuery || activeQuickRate) && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalQuery('');
                    setActiveQuickRate('');
                    applyGlobalFilterToAllTables('', '');
                  }}
                  className="hero-btn hero-btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  ✖ ফিল্টার মুছুন
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                marginTop: '10px',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1', marginRight: '4px' }}>
                ⚡ করহার অনুযায়ী ফিল্টার:
              </span>
              {['০.৫%', '১%', '১.৫%', '২%', '৩%', '৫%', '৮%', '১০%', '১৫%', '২০%'].map((chip) => {
                const isSelected = activeQuickRate === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleQuickRateSelect(chip)}
                    style={{
                      padding: '3px 11px',
                      borderRadius: '50px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.28)',
                      background: isSelected ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                      color: isSelected ? '#0f172a' : '#ffffff',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hero-actions">
            <button
              type="button"
              onClick={handleExportAllFilteredCsv}
              className="hero-btn hero-btn-primary"
            >
              📥 সকল ফিল্টারকৃত টেবিল CSV ডাউনলোড (Export All CSV)
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hero-btn hero-btn-secondary"
            >
              🖨️ প্রিন্ট / PDF সংরক্ষণ
            </button>
          </div>
        </div>
      </header>

      <div className="layout-wrapper">
        <main className="main-content">
          {/* Real-Time Keyword Search Bar directly above the SRO_TDS_2026_Content tables */}
          <div className="sro-realtime-search-panel" role="search" aria-label="টেবিল কীওয়ার্ড অনুসন্ধান">
            <div className="sro-realtime-search-header">
              <div className="sro-realtime-search-title">
                <span>🔎</span>
                <span>এস.আর.ও. ২৭৩ টেবিল রিয়েল-টাইম কীওয়ার্ড ফিল্টার (Real-Time Table Search)</span>
              </div>
              <span className="sro-realtime-stats-badge" aria-live="polite">
                দৃশ্যমান সারি: {matchedStats.visibleRows} / {matchedStats.totalRows} • সক্রিয় টেবিল:{' '}
                {matchedStats.matchingTables} / {matchedStats.totalTables}
              </span>
            </div>

            <div className="sro-realtime-input-row">
              <div className="sro-realtime-input-wrap">
                <input
                  ref={keywordInputRef}
                  id="sro-table-keyword-search"
                  type="search"
                  value={globalQuery}
                  onChange={(e) => handleGlobalSearchChange(e.target.value)}
                  placeholder="🔍 কীওয়ার্ড বা করহার লিখে রিয়েল-টাইমে টেবিলের সারি খুঁজুন (যেমন: পরামর্শক, সফটওয়্যার, ভাড়া, কয়লা, ১০%, 5%)... [Shortcut: /]"
                  aria-label="টেবিলের সারি কীওয়ার্ড দিয়ে খুঁজুন"
                  className="sro-realtime-input"
                />
              </div>
              {(globalQuery || activeQuickRate) && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalQuery('');
                    setActiveQuickRate('');
                    applyGlobalFilterToAllTables('', '');
                  }}
                  className="export-csv-btn"
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                >
                  ✖ ফিল্টার রিসেট
                </button>
              )}
            </div>

            <div className="sro-keyword-chips">
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                জনপ্রিয় কীওয়ার্ড:
              </span>
              {[
                'পরামর্শক',
                'সফটওয়্যার',
                'ভাড়া',
                'বিজ্ঞাপন',
                'পেট্রোলিয়াম',
                'কয়লা',
                'লভ্যাংশ',
                'আমদানি',
                'জুন',
              ].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleKeywordTagSelect(kw)}
                  className={`sro-keyword-chip ${globalQuery === kw ? 'active' : ''}`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1 */}
          <section id="sec1">
            <h2>
              <span className="num">০১</span> শিরোনাম ও প্রবর্তন
            </h2>
            <p>
              <strong>(১)</strong> এই বিধিমালা <strong>উৎসে কর বিধিমালা, ২০২৬</strong> নামে অভিহিত হইবে।
            </p>
            <p>
              <strong>(২)</strong> ইহা ১ জুলাই, ২০২৬ খ্রিষ্টাব্দ তারিখে কার্যকর হইয়াছে বলিয়া গণ্য হইবে।
            </p>
          </section>

          {/* Section 2 */}
          <section id="sec2">
            <h2>
              <span className="num">০২</span> সংজ্ঞা
            </h2>
            <p>বিষয় বা প্রসঙ্গের পরিপন্থি কোনো কিছু না থাকিলে, এই বিধিমালায়—</p>
            <ul>
              <li>
                <strong>(ক) “আইন”</strong> অর্থ আয়কর আইন, ২০২৩ (২০২৩ সনের ১২ নং আইন);
              </li>
              <li>
                <strong>(খ) “অনিবাসী”</strong> অর্থ ধারা ২ এর দফা (৪) এ সংজ্ঞায়িত অনিবাসী;
              </li>
              <li>
                <strong>(গ) “উৎসে কর”</strong> অর্থ আইনের অংশ ৭ এর অধীন উৎসে কর্তনযোগ্য বা আদায়যোগ্য কর;
              </li>
              <li>
                <strong>(ঘ) “তফসিল”</strong> অর্থ এই বিধিমালার সহিত সংযোজিত কোনো তফসিল;
              </li>
              <li>
                <strong>(ঙ) “ধারা”</strong> অর্থ আয়কর আইন, ২০২৩ এর কোনো ধারা;
              </li>
              <li>
                <strong>(চ) “নির্দিষ্ট ব্যক্তি”</strong> অর্থ ধারা ১৪০ এর উপ-ধারা (৩) এর দফা (ক) তে সংজ্ঞায়িত নির্দিষ্ট ব্যক্তি;
              </li>
              <li>
                <strong>(ছ) “বোর্ড”</strong> অর্থ ধারা ২ এর দফা (৬৩) তে সংজ্ঞায়িত বোর্ড;
              </li>
              <li>
                <strong>(জ) “চুক্তিমূল্য”, “বিলমূল্য” বা “প্রদেয় অর্থ”</strong> বলিতে চুক্তিমূল্য, বিলমূল্য বা প্রদেয় অর্থের সহিত মূল্য সংযোজন কর (মূসক) ব্যতীত অন্যান্য সকল কর ও শুল্ক যোগ করিয়া যেই মূল্য হয় সেই মূল্যকে বুঝাইবে;
              </li>
              <li>
                <strong>(ঝ) “ভিত্তিমূল্য”</strong> অর্থ—
                <ol>
                  <li>যেক্ষেত্রে কোনো পণ্য সরবরাহ বা চুক্তি সম্পাদন বা সেবা প্রদানের বিপরীতে পরিশোধিত অর্থের মধ্যে কমিশন বা ফি অন্তর্ভুক্ত থাকে, এবং পরিশোধের চালানে (invoice) পণ্যের মূল্য বা সেবার মূল্য এবং উক্ত কমিশন বা ফি পৃথকভাবে উল্লেখ থাকে, সেইক্ষেত্রে উল্লিখিত কমিশন বা ফি এর অংশ;</li>
                  <li>দফা (অ) তে উল্লিখিত ক্ষেত্র ব্যতীত অন্য যেকোনো ক্ষেত্রে মোট পরিশোধিত অর্থ।</li>
                </ol>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="sec3">
            <h2>
              <span className="num">০৩</span> ঠিকাদার, সরবরাহকারী ইত্যাদির অনুকূলে প্রদেয় অর্থ হইতে কর কর্তন
            </h2>
            <p>
              <strong>(১)</strong> যেইক্ষেত্রে কোনো পণ্য সরবরাহ বা চুক্তি বা সাব-কন্ট্রাক্ট সম্পাদনের জন্য কোনো নিবাসী কর্তৃক কোনো নির্দিষ্ট ব্যক্তি হইতে কোনো অর্থ গৃহীত হয় এবং উক্ত অর্থ ধারা ৮৯ এর অধীন কর কর্তনযোগ্য হয়, সেইক্ষেত্রে অর্থ পরিশোধের দায়িত্বপ্রাপ্ত ব্যক্তি অর্থ পরিশোধের সময় ভিত্তিমূল্যের উপর নিম্নবর্ণিত সারণীতে উল্লিখিত হারে উৎসে কর কর্তন করিবেন, যথা:—
            </p>

            <div className="table-container">
              <div className="table-controls">
                <div className="search-box">
                  <input
                    type="search"
                    className="search-text"
                    aria-label="ঠিকাদার ও সরবরাহকারী টেবিল কীওয়ার্ড অনুসন্ধান"
                    placeholder="🔍 কীওয়ার্ড দিয়ে খুঁজুন (যেমন: পেট্রোলিয়াম, তেল, কয়লা, চিনি, ই-কমার্স)..."
                  />
                </div>
                <div className="search-box search-box-rate">
                  <input
                    type="search"
                    className="search-rate"
                    aria-label="ঠিকাদার ও সরবরাহকারী টেবিল করহার অনুসন্ধান"
                    placeholder="⚡ করহার (যেমন: ৫% বা 5%)"
                  />
                </div>
                <div className="table-actions">
                  <span className="row-count-badge">২১ / ২১ টি সারি</span>
                  <button type="button" className="reset-filter-btn">
                    ✖ রিসেট
                  </button>
                  <button type="button" className="export-csv-btn">
                    📥 CSV ডাউনলোড
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ক্রমিক</th>
                      <th>বর্ণনা</th>
                      <th style={{ width: '160px', textAlign: 'center' }}>উৎসে কর হার</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>১.</td>
                      <td>ই-কমার্স প্ল্যাটফর্ম এর মাধ্যমে পণ্য সরবরাহের ক্ষেত্রে</td>
                      <td className="rate-col">০.৫%</td>
                    </tr>
                    <tr>
                      <td>২.</td>
                      <td>জিরো কুপন বন্ড ব্যতীত অন্যান্য বন্ডের প্রাথমিক ইস্যুকারী এবং গৌণ বাজারে (secondary market) ক্রেতা বা বিক্রেতা কর্তৃক বন্ডের লেনদেনের ক্ষেত্রে</td>
                      <td className="rate-col">১.৫%</td>
                    </tr>
                    <tr>
                      <td>৩.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ তেল বিপণন কোম্পানিসমূহ কর্তৃক পেট্রোলিয়াম অয়েল ও লুব্রিকেন্ট জাতীয় পদার্থ সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">০.৬%</td>
                    </tr>
                    <tr>
                      <td>৪.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ তেল শোধনাগার কারখানা ব্যতীত অন্য কোনো ডিলার বা এজেন্ট কর্তৃক পেট্রোলিয়াম অয়েল ও লুব্রিকেন্ট সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">১%</td>
                    </tr>
                    <tr>
                      <td>৫.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ তেল শোধনাগার কারখানায় যেকোনো চুক্তি বা কার্য সম্পাদনের সাথে জড়িত কোনো ঠিকাদারের অনুকূলে হয়</td>
                      <td className="rate-col">২%</td>
                    </tr>
                    <tr>
                      <td>৬.</td>
                      <td>গ্যাস ট্রান্সমিশন বা গ্যাস ডিস্ট্রিবিউশনে নিয়োজিত কোনো কোম্পানির অনুকূলে পরিশোধের ক্ষেত্রে</td>
                      <td className="rate-col">২%</td>
                    </tr>
                    <tr>
                      <td>৭.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ পোলট্রি বা গবাদি পশুর খাদ্য উৎপাদনে ব্যবহৃত ভুট্টা, সয়াবিন মিল, খৈল, কুঁড়া বা লবণ সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">০.৫%</td>
                    </tr>
                    <tr>
                      <td>৮.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ ধান, গম, আলু, পেঁয়াজ, রসুন, মটরশুঁটি, ছোলা, মসুর, আদা, হলুদ, শুকনা মরিচ, ডাল, ভুট্টা, আটা, ময়দা, লবণ, ভোজ্য তেল, চিনি, গোলমরিচ, দারুচিনি, এলাচ, লবঙ্গ, খেজুর, তেজপাতা, পাট, তুলা, সুতা এবং সকল ধরনের ফল সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">০.৫%</td>
                    </tr>
                    <tr>
                      <td>৯.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ ট্রেডিং কর্পোরেশন অব বাংলাদেশ (টিসিবি) এর অনুকূলে স্থানীয়ভাবে সংগৃহীত যেকোনো পণ্য সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">০.৫%</td>
                    </tr>
                    <tr>
                      <td>১০.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ স্থানীয়ভাবে সংগৃহীত এমএস স্ক্র্যাপ (MS Scrap) সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">০.৫%</td>
                    </tr>
                    <tr>
                      <td>১১.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ অপরিশোধিত চিনি (Raw sugar) ও পরিশোধিত চিনি (Refined Sugar) প্রস্তুতকারী কোনো শিল্প প্রতিষ্ঠানের অনুকূলে উক্ত চিনি সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">১.৫%</td>
                    </tr>
                    <tr>
                      <td>১২.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ সরাসরি কৃষকের নিকট হইতে সংগৃহীত কৃষি পণ্য সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">০.৫%</td>
                    </tr>
                    <tr>
                      <td>১৩.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ চামড়া ও চামড়াজাত পণ্য রপ্তানিকারক কোনো প্রতিষ্ঠানের অনুকূলে কাঁচা চামড়া (Raw hide) ও ওয়েট ব্লু চামড়া (Wet blue leather) সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">০.৫%</td>
                    </tr>
                    <tr>
                      <td>১৪.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ লোহা বা লোহাজাত পণ্য উৎপাদন ও প্রস্তুতকরণে নিয়োজিত কোনো কোম্পানির অনুকূলে উহার উৎপাদিত বা প্রস্তুতকৃত পণ্য সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">২%</td>
                    </tr>
                    <tr>
                      <td>১৫.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ টেক্সটাইল, পোলট্রি, ডেইরি, মৎস্য, চামড়া, সিরামিক, সিমেন্ট বা পাট শিল্পে ব্যবহৃত কাঁচামাল সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">৩%</td>
                    </tr>
                    <tr>
                      <td>১৬.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ কয়লা সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">৩%</td>
                    </tr>
                    <tr>
                      <td>১৭.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ পাঠ্যপুস্তক ব্যতীত অন্য কোনো পুস্তক সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">৩%</td>
                    </tr>
                    <tr>
                      <td>১৮.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ রিসাইকেলড পেপার বা ওয়েস্ট পেপার (Recycled or waste paper) এবং রিসাইকেলড প্লাস্টিক বা ওয়েস্ট প্লাস্টিক (Recycled or waste plastic) সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">১.৫%</td>
                    </tr>
                    <tr>
                      <td>১৯.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ মুদ্রণ (printing), বাইন্ডিং ও স্টেশনারি সামগ্রী সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">৩%</td>
                    </tr>
                    <tr>
                      <td>২০.</td>
                      <td>যেইক্ষেত্রে পরিশোধিত অর্থ স্থানীয়ভাবে উৎপাদিত এলপি গ্যাস (LP Gas) এর ডিস্ট্রিবিউটর বা ডিলারের অনুকূলে উক্ত গ্যাস সরবরাহের বিপরীতে হয়</td>
                      <td className="rate-col">১%</td>
                    </tr>
                    <tr>
                      <td>২১.</td>
                      <td>ক্রমিক ১ হইতে ২০ এ বর্ণিত ক্ষেত্র ব্যতীত অন্য যেকোনো পণ্য সরবরাহ, চুক্তি সম্পাদন বা সাব-কন্ট্রাক্টের ক্ষেত্রে</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                  </tbody>
                </table>
                <div className="no-results">❌ কোনো ফলাফল পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।</div>
              </div>
            </div>

            <div className="proviso">
              <strong>শর্তাবলি:</strong>
              <ul>
                <li>
                  <strong>প্রথম শর্ত:</strong> তেল বিপণন কোম্পানি কর্তৃক আমদানিকৃত পেট্রোলিয়াম অয়েল ও লুব্রিকেন্ট সরবরাহের ক্ষেত্রে ধারা ১২০ এর অধীন সংগৃহীত কর বাদ দিয়া অবশিষ্ট অংকের উপর কর কর্তন করিতে হইবে।
                </li>
                <li>
                  <strong>দ্বিতীয় শর্ত:</strong> ধারা ১২০ এর অধীন আমদানিকৃত পণ্যের ক্ষেত্রে যদি আমদানিকারক নিজেই সরবরাহকারী হন, এবং উক্ত পণ্যের উপর এই বিধির অধীন কর্তনযোগ্য করের হার আমদানিকালে পরিশোধিত করের সমান বা কম হয়, তবে পুনরায় কর কর্তন করিতে হইবে না (যদি কাস্টমস ও ভ্যাট চালান দাখিল করা হয়)। তবে এই বিধির করহার বেশি হইলে শুধুমাত্র পার্থক্যটুকু কর্তন করিতে হইবে।
                </li>
                <li>
                  <strong>তৃতীয় শর্ত:</strong> জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) এর অনুকূলে প্রাথমিক বা মাধ্যমিক স্তরের পাঠ্যপুস্তক সরবরাহের ক্ষেত্রে উৎসে কর কর্তন প্রযোজ্য হইবে না।
                </li>
              </ul>
            </div>

            <h3>কমিশন, ডিসকাউন্ট বা ফি এর ক্ষেত্রে বিশেষ সূত্র (ধারা ৯৪ ও ৯৫):</h3>
            <div className="formula-box">
              <p>যেইক্ষেত্রে কোনো পণ্য সরবরাহের পরিশোধিত অর্থের মধ্যে কমিশন বা ফি অন্তর্ভুক্ত থাকে, সেইক্ষেত্রে উৎসে করের পরিমাণ হইবে ‘ক’ এবং ‘খ’ এর মধ্যে যাহা অধিক:</p>
              <p>
                <strong>ক =</strong> উপ-বিধি (১) এর সারণীতে প্রযোজ্য হারে হিসাবকৃত করের পরিমাণ;
              </p>
              <p>
                <strong>খ =</strong> (ধারা ৯৪ এর অধীন কোনো ডিস্ট্রিবিউটর বা অন্য কোনো ব্যক্তির নিকট কোম্পানির পণ্যের বিক্রয়মূল্য) × ৫% × ১০%।
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="sec4">
            <h2>
              <span className="num">০৪</span> সেবার ক্ষেত্রে পরিশোধিত অর্থ হইতে কর কর্তন
            </h2>
            <p>
              <strong>(১)</strong> যেইক্ষেত্রে কোনো নিবাসীকে কোনো নির্দিষ্ট ব্যক্তি কর্তৃক ধারা ৯০ এর অধীন নির্দিষ্ট কোনো সেবা প্রদানের জন্য কোনো অর্থ পরিশোধ করা হয়, সেইক্ষেত্রে অর্থ পরিশোধের দায়িত্বপ্রাপ্ত ব্যক্তি অর্থ পরিশোধের সময় নিম্নবর্ণিত সারণীতে উল্লিখিত হারে উৎসে কর কর্তন করিবেন, যথা:—
            </p>

            <div className="table-container">
              <div className="table-controls">
                <div className="search-box">
                  <input
                    type="search"
                    className="search-text"
                    aria-label="সেবার ক্ষেত্রে কর টেবিল কীওয়ার্ড অনুসন্ধান"
                    placeholder="🔍 সেবার কীওয়ার্ড খুঁজুন (যেমন: পরামর্শক, সফটওয়্যার, অডিট, বিজ্ঞাপন, ভাড়া)..."
                  />
                </div>
                <div className="search-box search-box-rate">
                  <input
                    type="search"
                    className="search-rate"
                    aria-label="সেবার ক্ষেত্রে কর টেবিল করহার অনুসন্ধান"
                    placeholder="⚡ করহার (যেমন: ১০% বা 10%)"
                  />
                </div>
                <div className="table-actions">
                  <span className="row-count-badge">৪৩ / ৪৩ টি সারি</span>
                  <button type="button" className="reset-filter-btn">
                    ✖ রিসেট
                  </button>
                  <button type="button" className="export-csv-btn">
                    📥 CSV ডাউনলোড
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ক্রমিক</th>
                      <th>সেবার বর্ণনা এবং পরিশোধ</th>
                      <th style={{ width: '200px', textAlign: 'center' }}>উৎসে কর কর্তনের হার</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>১.</td>
                      <td>উপদেষ্টা বা পরামর্শক সেবা (Advisory or consultancy service)</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>২.</td>
                      <td>পেশাগত সেবা (Professional service), কারিগরি সেবা ফি (Technical services fee), বা কারিগরি সহায়তা ফি (Technical assistance fee)</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৩.</td>
                      <td>
                        (ক) ক্যাটারিং সার্ভিস; (খ) ক্লিনিং সার্ভিস; (গ) কালেকশন অ্যান্ড রিকভারি সার্ভিস/এজেন্সি; (ঘ) প্রাইভেট সিকিউরিটি সার্ভিস; (ঙ) জনবল সরবরাহ সেবা; (চ) ক্রিয়েটিভ মিডিয়া এজেন্সি; (ছ) পাবলিক রিলেশনস এজেন্সি; (জ) ইভেন্ট ম্যানেজমেন্ট এজেন্সি; (ঝ) ট্রেনিং, ওয়ার্কশপ ইত্যাদি ব্যবস্থাপনা সেবা; (ঞ) কুরিয়ার সার্ভিস; (ট) প্যাকিং ও শিফটিং সার্ভিস; (ঠ) যেকোনো প্রকৃতির অন্য কোনো সেবা এজেন্সি<br />
                        <em>(অ) কমিশন বা ফি এর উপর / (আ) মোট প্রাপ্ত অর্থের উপর</em>
                      </td>
                      <td className="rate-col">
                        (অ) ১০%
                        <br />
                        (আ) ২%
                      </td>
                    </tr>
                    <tr>
                      <td>৪.</td>
                      <td>মিডিয়া বায়িং এজেন্সি সেবা (কমিশন বা ফি এর উপর ১০% / মোট প্রাপ্ত অর্থের উপর ০.৬৫%)</td>
                      <td className="rate-col">
                        (অ) ১০%
                        <br />
                        (আ) ০.৬৫%
                      </td>
                    </tr>
                    <tr>
                      <td>৫.</td>
                      <td>ইন্ডেন্টিং কমিশন (Indenting commission)</td>
                      <td className="rate-col">৮%</td>
                    </tr>
                    <tr>
                      <td>৬.</td>
                      <td>মিটিং ফি, ট্রেনিং ফি বা সম্মানী (Honorarium)</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৭.</td>
                      <td>মোবাইল নেটওয়ার্ক অপারেটর, টেকনিক্যাল সাপোর্ট সার্ভিস প্রোভাইডার</td>
                      <td className="rate-col">১২%</td>
                    </tr>
                    <tr>
                      <td>৮.</td>
                      <td>ক্রেডিট রেটিং এজেন্সি</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৯.</td>
                      <td>মোটর গ্যারেজ বা ওয়ার্কশপ</td>
                      <td className="rate-col">৮%</td>
                    </tr>
                    <tr>
                      <td>১০.</td>
                      <td>প্রাইভেট কন্টেইনার পোর্ট বা ডকইয়ার্ড</td>
                      <td className="rate-col">৮%</td>
                    </tr>
                    <tr>
                      <td>১১.</td>
                      <td>শিপিং এজেন্সি কমিশন</td>
                      <td className="rate-col">৮%</td>
                    </tr>
                    <tr>
                      <td>১২.</td>
                      <td>স্টিভেডরিং/বার্থ অপারেটর/টার্মিনাল অপারেটর/শিপ হ্যান্ডলিং অপারেটর (কমিশন বা ফি এর উপর ১০% / মোট প্রাপ্ত অর্থের উপর ২%)</td>
                      <td className="rate-col">
                        (অ) ১০%
                        <br />
                        (আ) ২%
                      </td>
                    </tr>
                    <tr>
                      <td>১৩.</td>
                      <td>(ক) পরিবহন সেবা, গাড়ি ভাড়া, ক্যারিং অ্যান্ড হ্যান্ডলিং সার্ভিস; (খ) মেরামত ও রক্ষণাবেক্ষণ সেবা</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>১৪.</td>
                      <td>রাইড শেয়ারিং সার্ভিস, ওয়েব বা অ্যাপ ভিত্তিক যেকোনো সেবা প্রদানকারী প্ল্যাটফর্ম</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>১৫.</td>
                      <td>ফ্রেইট ফরোয়ার্ডিং এজেন্সি কমিশন (শুধুমাত্র কমিশন অংশের উপর ১০% / মোট প্রাপ্ত অর্থের উপর ১.৫%)</td>
                      <td className="rate-col">
                        (অ) ১০%
                        <br />
                        (আ) ১.৫%
                      </td>
                    </tr>
                    <tr>
                      <td>১৬.</td>
                      <td>বিদ্যুৎ বিতরণ কোম্পানির অনুকূলে হুইলিং চার্জ (Wheeling charge)</td>
                      <td className="rate-col">৩%</td>
                    </tr>
                    <tr>
                      <td>১৭.</td>
                      <td>ইন্টারনেট সেবা (Internet service)</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>১৮.</td>
                      <td>ব্যাংক, আর্থিক প্রতিষ্ঠান, মোবাইল ফিন্যান্সিয়াল সার্ভিস (MFS) বা পেমেন্ট সার্ভিস প্রোভাইডার (PSP) এর এজেন্ট, ডিস্ট্রিবিউটর বা এজেন্সির অনুকূলে কমিশন, ফি, ডিসকাউন্ট বা সার্ভিস চার্জ</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>১৯.</td>
                      <td>পোর্ট, ল্যান্ড পোর্ট বা কন্টেইনার টার্মিনাল অপারেটরের অনুকূলে পরিশোধ</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>২০.</td>
                      <td>আইটি এনাবল্ড সার্ভিস (IT Enabled Services - ITES), সফটওয়্যার ডেভেলপমেন্ট, কাস্টমাইজেশন, ক্লাউড সার্ভিস, ওয়েব হোস্টিং ইত্যাদি (১ জুলাই ২০২৬ হইতে ৩০ জুন ২০৩১ পর্যন্ত কর অব্যাহতিপ্রাপ্ত ক্ষেত্র ব্যতীত)</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>২১.</td>
                      <td>যাত্রীবাহী বা মালবাহী লঞ্চ, কার্গো, কোস্টার, বার্জ, টাগবোট বা ড্রেজার ভাড়া বা চার্টার</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>২২.</td>
                      <td>স্থাপত্য, প্রকৌশল বা ইন্টেরিয়র ডিজাইন সেবা</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>২৩.</td>
                      <td>বিজ্ঞাপন এজেন্সি বা ডিজিটাল মার্কেটিং সেবা (কমিশনের উপর ১০% / মোট বিলের উপর ২.৫%)</td>
                      <td className="rate-col">
                        (অ) ১০%
                        <br />
                        (আ) ২.৫%
                      </td>
                    </tr>
                    <tr>
                      <td>২৪.</td>
                      <td>সংবাদপত্র, সাময়িকী, বেসরকারি টেলিভিশন চ্যানেল, রেডিও বা অনলাইন পোর্টালে বিজ্ঞাপন বাবদ পরিশোধ</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>২৫.</td>
                      <td>হোটেল, রিসোর্ট, মোটেল, রেস্তোরাঁ বা কনভেনশন হল ভাড়া বা সেবা</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>২৬.</td>
                      <td>যন্ত্রপাতি, প্ল্যান্ট বা ইকুইপমেন্ট ভাড়া (Rent of plant, machinery or equipment)</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>২৭.</td>
                      <td>অভিনয় শিল্পী, কণ্ঠশিল্পী, মডেল, নৃত্যশিল্পী, ক্রীড়াবিদ বা অনুষ্ঠান সঞ্চালকের সম্মানী</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>২৮.</td>
                      <td>জরিপ সেবা (Survey service), ভ্যালুয়েশন বা পরিদর্শন সেবা</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>২৯.</td>
                      <td>ক্লিয়ারিং অ্যান্ড ফরোয়ার্ডিং (C&F) এজেন্সি সেবা</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৩০.</td>
                      <td>অডিট এবং অ্যাকাউন্টিং ফার্মের সেবা ফি</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৩১.</td>
                      <td>আইনজীবী বা লিগ্যাল ফার্মের সেবা ফি</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৩২.</td>
                      <td>চিকিৎসক বা বিশেষজ্ঞের পরামর্শ ফি (হাসপাতাল বা ক্লিনিকের মাধ্যমে পরিশোধিত)</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৩৩.</td>
                      <td>ডায়াগনস্টিক বা প্যাথলজিক্যাল টেস্ট সেবা (করপোরেট চুক্তির অধীন)</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>৩৪.</td>
                      <td>গুদামঘর বা কোল্ড স্টোরেজ ভাড়া</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>৩৫.</td>
                      <td>কল সেন্টার সেবা (Call center service)</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>৩৬.</td>
                      <td>সিকিউরিটিজ ব্রোকারেজ বা মার্চেন্ট ব্যাংকিং সেবা ফি</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৩৭.</td>
                      <td>বীমা জরিপকারী (Insurance Surveyor) এর ফি</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৩৮.</td>
                      <td>টেলিযোগাযোগ টাওয়ার শেয়ারিং সেবা</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৩৯.</td>
                      <td>বর্জ্য ব্যবস্থাপনা বা ইটিপি (ETP) রক্ষণাবেক্ষণ সেবা</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>৪০.</td>
                      <td>পেস্ট কন্ট্রোল (Pest control) ও ফিউমিগেশন সেবা</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>৪১.</td>
                      <td>লন্ড্রি ও ড্রাই ক্লিনিং সেবা (বাণিজ্যিক চুক্তির অধীন)</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>৪২.</td>
                      <td>টেস্টিং বা ল্যাবরেটরি সার্টিফিকেশন সেবা</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৪৩.</td>
                      <td>উপরে সুনির্দিষ্টভাবে উল্লিখিত হয় নাই এইরূপ অন্য যেকোনো সেবা</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                  </tbody>
                </table>
                <div className="no-results">❌ কোনো ফলাফল পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।</div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="sec5">
            <h2>
              <span className="num">০৫</span> অনিবাসীদের আয় হইতে কর কর্তন
            </h2>
            <p>
              <strong>(১)</strong> ধারা ১১৯ এর অধীন কোনো অনিবাসীকে অর্থ পরিশোধ বা প্রেরণের সময় নিম্নবর্ণিত সারণীতে উল্লিখিত হারে কর কর্তন করিতে হইবে:—
            </p>

            <div className="table-container">
              <div className="table-controls">
                <div className="search-box">
                  <input
                    type="search"
                    className="search-text"
                    aria-label="অনিবাসীদের আয় টেবিল কীওয়ার্ড অনুসন্ধান"
                    placeholder="🔍 অনিবাসী সেবার কীওয়ার্ড খুঁজুন (যেমন: পরামর্শক, লভ্যাংশ, সফটওয়্যার, বীমা)..."
                  />
                </div>
                <div className="search-box search-box-rate">
                  <input
                    type="search"
                    className="search-rate"
                    aria-label="অনিবাসীদের আয় টেবিল করহার অনুসন্ধান"
                    placeholder="⚡ করহার (যেমন: ২০% বা 20%)"
                  />
                </div>
                <div className="table-actions">
                  <span className="row-count-badge">১৮ / ১৮ টি সারি</span>
                  <button type="button" className="reset-filter-btn">
                    ✖ রিসেট
                  </button>
                  <button type="button" className="export-csv-btn">
                    📥 CSV ডাউনলোড
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ক্রমিক</th>
                      <th>পরিশোধের বিবরণ</th>
                      <th style={{ width: '160px', textAlign: 'center' }}>উৎসে কর হার</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>১.</td>
                      <td>উপদেষ্টা বা পরামর্শক সেবা (Advisory or consultancy service)</td>
                      <td className="rate-col">২০%</td>
                    </tr>
                    <tr>
                      <td>২.</td>
                      <td>পেশাগত সেবা (Professional service), কারিগরি সেবা, কারিগরি সহায়তা বা রয়্যালটি ফি</td>
                      <td className="rate-col">২০%</td>
                    </tr>
                    <tr>
                      <td>৩.</td>
                      <td>চুক্তি বা সাব-কন্ট্রাক্ট বাস্তবায়ন, প্ল্যান্ট ও মেশিনারি সরবরাহ ও স্থাপন</td>
                      <td className="rate-col">৭.৫%</td>
                    </tr>
                    <tr>
                      <td>৪.</td>
                      <td>বিজ্ঞাপন, ডিজিটাল মার্কেটিং বা মিডিয়া স্ট্রিমিং বাবদ পরিশোধ</td>
                      <td className="rate-col">১৫%</td>
                    </tr>
                    <tr>
                      <td>৫.</td>
                      <td>পেইড সাবস্ক্রিপশনের মাধ্যমে সফটওয়্যার, অ্যাপ বা ক্লাউড স্টোরেজ ব্যবহারের ফি</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৬.</td>
                      <td>পেট্রোলিয়াম, তেল, গ্যাস বা কয়লা অনুসন্ধান ও উত্তোলন সংক্রান্ত জরিপ বা ড্রিলিং সেবা</td>
                      <td className="rate-col">৫.২৫%</td>
                    </tr>
                    <tr>
                      <td>৭.</td>
                      <td>বীমা বা পুনঃবীমা (Re-insurance) প্রিমিয়াম</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৮.</td>
                      <td>আন্তর্জাতিক ব্যান্ডউইথ বা স্যাটেলাইট চ্যানেল ডাউনলিংক চার্জ</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>৯.</td>
                      <td>বিদেশি শিল্পী, খেলোয়াড় বা বিনোদনকর্মীর সম্মানী</td>
                      <td className="rate-col">৩০%</td>
                    </tr>
                    <tr>
                      <td>১০.</td>
                      <td>আকাশপথ বা জলপথে পণ্য পরিবহন ভাড়া (Freight)</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                    <tr>
                      <td>১১.</td>
                      <td>বিদেশি ঋণের উপর সুদ (সরকার অনুমোদিত শিল্প ঋণের ক্ষেত্র ব্যতীত)</td>
                      <td className="rate-col">২০%</td>
                    </tr>
                    <tr>
                      <td>১২.</td>
                      <td>লভ্যাংশ (Dividend) পরিশোধ — কোম্পানির ক্ষেত্রে</td>
                      <td className="rate-col">২০%</td>
                    </tr>
                    <tr>
                      <td>১৩.</td>
                      <td>লভ্যাংশ (Dividend) পরিশোধ — কোম্পানি ব্যতীত অন্য কোনো অনিবাসী ব্যক্তির ক্ষেত্রে</td>
                      <td className="rate-col">৩০%</td>
                    </tr>
                    <tr>
                      <td>১৪.</td>
                      <td>মূলধনি মুনাফা (Capital Gain) — তালিকাভুক্ত নয় এমন কোম্পানির শেয়ার হস্তান্তর</td>
                      <td className="rate-col">১৫%</td>
                    </tr>
                    <tr>
                      <td>১৫.</td>
                      <td>নির্মাণ, মেরামত বা স্থাপত্য নকশা প্রণয়ন সেবা</td>
                      <td className="rate-col">১৫%</td>
                    </tr>
                    <tr>
                      <td>১৬.</td>
                      <td>পরীক্ষা, সার্টিফিকেশন বা ল্যাবরেটরি বিশ্লেষণ ফি</td>
                      <td className="rate-col">১০%</td>
                    </tr>
                    <tr>
                      <td>১৭.</td>
                      <td>ক্রেডিট রেটিং বা মার্কেট রিসার্চ ফি</td>
                      <td className="rate-col">১৫%</td>
                    </tr>
                    <tr>
                      <td>১৮.</td>
                      <td>ক্রমিক ১ হইতে ১৭ তে উল্লিখিত হয় নাই এইরূপ অন্য যেকোনো পরিশোধ</td>
                      <td className="rate-col">২০%</td>
                    </tr>
                  </tbody>
                </table>
                <div className="no-results">❌ কোনো ফলাফল পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।</div>
              </div>
            </div>

            <div className="proviso">
              তবে শর্ত থাকে যে, যখন কোনো কোম্পানি শেয়ার হস্তান্তর হইতে কোনো মূলধন আয় উদ্ভূত হয়, তবে, ক্ষেত্রমত, উক্ত হস্তান্তর বাস্তবায়নের জন্য দায়ী ব্যক্তি বা কর্তৃপক্ষ উক্ত হস্তান্তর কার্যকর করিবেন না যদি না উক্ত হস্তান্তরের ফলে উক্ত মূলধন আয়ের উপর কর পরিশোধ করা হয়।
            </div>

            <p>
              <strong>(২)</strong> যেইক্ষেত্রে বোর্ড, এতদুপলক্ষ্যে প্রয়োজনীয় কাগজপত্রসহ প্রাপ্ত আবেদনের ভিত্তিতে সন্তুষ্ট হইয়া আবেদন প্রাপ্তির ৩০ দিনের মধ্যে এই মর্মে সনদ প্রদান করে যে, কোনো অনিবাসীকে কর চুক্তি (DTAA) বা অন্য কোনো কারণে বাংলাদেশে কোনো কর প্রদান করিতে হইবে না বা হ্রাসকৃত হারে কর প্রদান করিতে হইবে, সেইক্ষেত্রে উপ-বিধি (১) এ উল্লিখিত পরিশোধ কর কর্তন ব্যতিরেকে বা হ্রাসকৃত হারে কর কর্তনপূর্বক অর্থ পরিশোধ করা যাইবে।
            </p>
            <p>
              <strong>(৩)</strong> নিম্নবর্ণিত ব্যয় বা পরিশোধের ক্ষেত্রে বিধি ৫ এর অধীন কর কর্তন প্রয়োজন হইবে না, যথা:—
            </p>
            <ul>
              <li>(ক) বৈদেশিক কোনো রাষ্ট্রের কোনো সরকারি কর্তৃপক্ষ বাবদ কোনো পরিশোধ;</li>
              <li>(খ) আন্তর্জাতিকভাবে স্বীকৃত কোনো প্রফেশনাল বডির সাবস্ক্রিপশন ফি;</li>
              <li>(গ) লিয়াজোঁ অফিস বা শাখা অফিস ব্যয়;</li>
              <li>(ঘ) বাংলাদেশ ব্যাংকের নির্দেশনা অনুযায়ী টিউশন ফি;</li>
              <li>(ঙ) আন্তর্জাতিক বিপণন ব্যয় ও পণ্য উন্নয়ন ব্যয়;</li>
              <li>(চ) যেকোনো প্রকারের নিরাপত্তা জামানত;</li>
              <li>(ছ) অ্যারবিট্রেশন ফি;</li>
              <li>(জ) হজ বাবদ প্রেরিত অর্থ;</li>
              <li>(ঝ) প্রায়োরিটি পাস বাবদ অর্থ।</li>
            </ul>
          </section>

          {/* Section 6 & 7 */}
          <section id="sec6">
            <h2>
              <span className="num">০৬</span> সম্পত্তি হস্তান্তর ও রিয়েল এস্টেট হইতে কর সংগ্রহ
            </h2>
            <p>ধারা ১২৫ এবং ১২৬ এর অধীন সম্পত্তি রেজিস্ট্রেশনের সময় উৎসে কর পরিশোধের প্রমাণ দাখিল করতে হবে।</p>

            <h3>সম্পত্তি হস্তান্তরে করহার (সারণী-২)</h3>
            <div className="table-container">
              <div className="table-controls">
                <div className="search-box">
                  <input
                    type="search"
                    className="search-text"
                    aria-label="সম্পত্তি হস্তান্তর সারণী-২ কীওয়ার্ড অনুসন্ধান"
                    placeholder="🔍 মৌজা বা কীওয়ার্ড দিয়ে খুঁজুন (যেমন: পৌরসভা, উপজেলা, শতকপ্রতি)..."
                  />
                </div>
                <div className="search-box search-box-rate">
                  <input
                    type="search"
                    className="search-rate"
                    aria-label="সম্পত্তি হস্তান্তর সারণী-২ করহার অনুসন্ধান"
                    placeholder="⚡ করহার (যেমন: ২%)"
                  />
                </div>
                <div className="table-actions">
                  <span className="row-count-badge">২ / ২ টি সারি</span>
                  <button type="button" className="reset-filter-btn">
                    ✖ রিসেট
                  </button>
                  <button type="button" className="export-csv-btn">
                    📥 CSV ডাউনলোড
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ক্রমিক</th>
                      <th>মৌজা</th>
                      <th className="rate-col">হার</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>১</td>
                      <td>সারণী-১ এর অন্তর্গত নহে এইরূপ অন্য যেকোনো পৌরসভার অন্তর্গত সকল মৌজা</td>
                      <td className="rate-col">ভূমির মূল্যের ২% বা শতকপ্রতি ১০,০০০ টাকা (যাহা অধিক)</td>
                    </tr>
                    <tr>
                      <td>২</td>
                      <td>সারণী-২ এর ক্রমিক ১ এবং সারণী-১ এর অন্তর্গত নহে এইরূপ সকল উপজেলার (পৌরসভা ব্যতীত) মৌজা</td>
                      <td className="rate-col">ভূমির মূল্যের ২% বা শতকপ্রতি ৫০০ টাকা (যাহা অধিক)</td>
                    </tr>
                  </tbody>
                </table>
                <div className="no-results">❌ কোনো ফলাফল পাওয়া যায়নি।</div>
              </div>
            </div>

            <h3>স্থাপনা/ফ্ল্যাট থাকলে অতিরিক্ত কর</h3>
            <div className="table-container">
              <div className="table-controls">
                <div className="search-box">
                  <input
                    type="search"
                    className="search-text"
                    aria-label="স্থাপনা ও ফ্ল্যাট অতিরিক্ত কর কীওয়ার্ড অনুসন্ধান"
                    placeholder="🔍 শ্রেণি বা বর্ণনা দিয়ে খুঁজুন (যেমন: বর্গমিটার, দলিল, স্থাপনা)..."
                  />
                </div>
                <div className="search-box search-box-rate">
                  <input
                    type="search"
                    className="search-rate"
                    aria-label="স্থাপনা ও ফ্ল্যাট করহার অনুসন্ধান"
                    placeholder="⚡ করহার (যেমন: ৬%, ৮%)"
                  />
                </div>
                <div className="table-actions">
                  <span className="row-count-badge">৩ / ৩ টি সারি</span>
                  <button type="button" className="reset-filter-btn">
                    ✖ রিসেট
                  </button>
                  <button type="button" className="export-csv-btn">
                    📥 CSV ডাউনলোড
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>শ্রেণি</th>
                      <th>বর্ণনা</th>
                      <th className="rate-col">হার</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>শ্রেণি-ক হইতে ঘ</td>
                      <td>উল্লিখিত ভূমিতে অবস্থিত স্থাপনা</td>
                      <td className="rate-col">প্রতি বর্গমিটারে ৮০০ টাকা অথবা দলিল মূল্যের ৮% (যাহা অধিক)</td>
                    </tr>
                    <tr>
                      <td>শ্রেণি-খ</td>
                      <td>সারণী-২ এর ১ এ উল্লিখিত মৌজার স্থাপনা</td>
                      <td className="rate-col">প্রতি বর্গমিটারে ৫০০ টাকা অথবা দলিল মূল্যের ৬% (যাহা অধিক)</td>
                    </tr>
                    <tr>
                      <td>অন্যান্য</td>
                      <td>অন্যান্য ক্ষেত্রে</td>
                      <td className="rate-col">প্রতি বর্গমিটারে ৩০০ টাকা অথবা দলিল মূল্যের ৬% (যাহা অধিক)</td>
                    </tr>
                  </tbody>
                </table>
                <div className="no-results">❌ কোনো ফলাফল পাওয়া যায়নি।</div>
              </div>
            </div>

            <h3>ডেভেলপার কর্তৃক ভূমি/ফ্ল্যাট হস্তান্তরে (ধারা ১২৬)</h3>
            <div className="table-container">
              <div className="table-controls">
                <div className="search-box">
                  <input
                    type="search"
                    className="search-text"
                    aria-label="ডেভেলপার ভূমি ও ফ্ল্যাট হস্তান্তর কীওয়ার্ড অনুসন্ধান"
                    placeholder="🔍 জেলা বা কীওয়ার্ড দিয়ে খুঁজুন (যেমন: ঢাকা, চট্টগ্রাম, গাজীপুর)..."
                  />
                </div>
                <div className="search-box search-box-rate">
                  <input
                    type="search"
                    className="search-rate"
                    aria-label="ডেভেলপার ভূমি ও ফ্ল্যাট করহার অনুসন্ধান"
                    placeholder="⚡ করহার (যেমন: ৩%, ৫%)"
                  />
                </div>
                <div className="table-actions">
                  <span className="row-count-badge">২ / ২ টি সারি</span>
                  <button type="button" className="reset-filter-btn">
                    ✖ রিসেট
                  </button>
                  <button type="button" className="export-csv-btn">
                    📥 CSV ডাউনলোড
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>এলাকা</th>
                      <th className="rate-col">করহার</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>ঢাকা, গাজীপুর, নারায়ণগঞ্জ, মুন্সিগঞ্জ, মানিকগঞ্জ, নরসিংদী এবং চট্টগ্রাম জেলা</td>
                      <td className="rate-col">ভূমির মূল্যের ৫%</td>
                    </tr>
                    <tr>
                      <td>অন্য যেকোনো জেলা</td>
                      <td className="rate-col">ভূমির মূল্যের ৩%</td>
                    </tr>
                  </tbody>
                </table>
                <div className="no-results">❌ কোনো ফলাফল পাওয়া যায়নি।</div>
              </div>
            </div>
            <div className="proviso">
              <strong>বিশেষ দ্রষ্টব্য:</strong> সিটি কর্পোরেশন, পৌরসভা ও ক্যান্টনমেন্ট বোর্ড এলাকায় সম্পত্তি রেজিস্ট্রেশনকালে দাতা ও গ্রহীতার রিটার্ন দাখিলের প্রমাণ (PSR) উপস্থাপন করতে হবে।
            </div>
          </section>

          {/* Section 8 */}
          <section id="sec8">
            <h2>
              <span className="num">০৮</span> আমদানিকারকদের নিকট হইতে কর সংগ্রহ
            </h2>
            <p>কাস্টমস কমিশনার পণ্য আমদানির সময় নিম্নলিখিত হারে উৎসে কর সংগ্রহ করবেন।</p>

            <div className="table-container">
              <div className="table-controls">
                <div className="search-box">
                  <input
                    type="search"
                    className="search-text"
                    aria-label="আমদানি পণ্য টেবিল কীওয়ার্ড অনুসন্ধান"
                    placeholder="🔍 আমদানি পণ্যের কীওয়ার্ড খুঁজুন (যেমন: খাদ্যশস্য, সার, ওষুধ, কাঁচামাল, স্ক্র্যাপ)..."
                  />
                </div>
                <div className="search-box search-box-rate">
                  <input
                    type="search"
                    className="search-rate"
                    aria-label="আমদানি পণ্য টেবিল করহার অনুসন্ধান"
                    placeholder="⚡ করহার (যেমন: ০%, ১%, ৫%)"
                  />
                </div>
                <div className="table-actions">
                  <span className="row-count-badge">৯ / ৯ টি সারি</span>
                  <button type="button" className="reset-filter-btn">
                    ✖ রিসেট
                  </button>
                  <button type="button" className="export-csv-btn">
                    📥 CSV ডাউনলোড
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>বিভাগ</th>
                      <th className="rate-col">হার</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>সারণী-১ (খাদ্যশস্য, সার, ওষুধ, মূলধনি যন্ত্রপাতি ইত্যাদি)</td>
                      <td className="rate-col">০%</td>
                    </tr>
                    <tr>
                      <td>সারণী-২ (ভুটান হইতে আমদানি - সবজি, ফল, মসলা ইত্যাদি)</td>
                      <td className="rate-col">০%</td>
                    </tr>
                    <tr>
                      <td>সারণী-৩ (মোবাইল পার্টস, ইলেকট্রনিক্স, যন্ত্রাংশ)</td>
                      <td className="rate-col">১%</td>
                    </tr>
                    <tr>
                      <td>সারণী-৪ (রসুন, মটর, গম, চাল, সয়াবিন বীজ ইত্যাদি)</td>
                      <td className="rate-col">২%</td>
                    </tr>
                    <tr>
                      <td>সারণী-৫ (শিল্পের কাঁচামাল - ইন্ডাস্ট্রিয়াল IRC ধারীদের জন্য)</td>
                      <td className="rate-col">৩%</td>
                    </tr>
                    <tr>
                      <td>সারণী-৫ এর বাইরে অন্যান্য পণ্য (ইন্ডাস্ট্রিয়াল IRC ধারীদের জন্য)</td>
                      <td className="rate-col">৪%</td>
                    </tr>
                    <tr>
                      <td>সারণী-৬ (মদ, স্পিরিট, পারফিউম ইত্যাদি)</td>
                      <td className="rate-col">২০%</td>
                    </tr>
                    <tr>
                      <td>সারণী-৭ (লোহার স্ক্র্যাপ, জাহাজ ভাঙা ইত্যাদি)</td>
                      <td className="rate-col">৬০০ টাকা/টন</td>
                    </tr>
                    <tr>
                      <td>সাধারণ অন্যান্য পণ্য</td>
                      <td className="rate-col">৫%</td>
                    </tr>
                  </tbody>
                </table>
                <div className="no-results">❌ কোনো ফলাফল পাওয়া যায়নি।</div>
              </div>
            </div>

            <details>
              <summary>👉 সারণী-১: HS Code তালিকা (০% হার)</summary>
              <div className="details-content">
                <p>
                  07.03 (Onions), 07.01 (Garlic), 08.04 (Dates), 08.07 (Melons), 09.04 (Pepper), 10.05 (Maize), 10.06 (Rice), 12.07 (Oil seeds), 15.07 (Soybean oil), 17.01 (Sugar), 31.01-31.05 (Fertilisers), 52.01-52.02 (Cotton), 84.07 (Aircraft Engine), 85.04 (Charger), 87.06 (EV Chassis), 88.02 (Aircraft), 89.01 (Vessels), 90.18 (Dialysis machine) ইত্যাদি।
                </p>
              </div>
            </details>

            <details>
              <summary>👉 সারণী-৫: HS Code তালিকা (৩% হার)</summary>
              <div className="details-content">
                <p>
                  85.17 (Telecom equipment), 85.23 (Data media), 85.25 (Transmission apparatus), 85.28 (Monitors), 04.02 (Milk powder), 25.06-25.29 (Minerals), 28.18 (Aluminium oxide), 32.07 (Pigments), 48.11 (Paper), 72.08 (Steel coil), 76.01-76.07 (Aluminium), 85.07 (Lithium battery) ইত্যাদি।
                </p>
              </div>
            </details>
          </section>

          {/* Section 9 */}
          <section id="sec9">
            <h2>
              <span className="num">০৯</span> কর জমাদানের সময়সীমা
            </h2>
            <div className="table-container">
              <div className="table-controls">
                <div className="search-box">
                  <input
                    type="search"
                    className="search-text"
                    aria-label="কর জমাদানের সময়সীমা কীওয়ার্ড অনুসন্ধান"
                    placeholder="🔍 মাস বা সময়সীমা কীওয়ার্ড দিয়ে খুঁজুন (যেমন: জুলাই, জুন, সপ্তাহ)..."
                  />
                </div>
                <div className="table-actions">
                  <span className="row-count-badge">৪ / ৪ টি সারি</span>
                  <button type="button" className="reset-filter-btn">
                    ✖ রিসেট
                  </button>
                  <button type="button" className="export-csv-btn">
                    📥 CSV ডাউনলোড
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>কর্তন/সংগ্রহের সময়</th>
                      <th>জমাদানের শেষ সময়</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>জুলাই থেকে মে মাসের যেকোনো সময়</td>
                      <td>সংগ্রহের মাসের শেষে পরবর্তী ০২ সপ্তাহের মধ্যে</td>
                    </tr>
                    <tr>
                      <td>জুন মাসের ১ম থেকে ২০তম দিন</td>
                      <td>সংগ্রহের দিনের পরবর্তী ০৭ দিনের মধ্যে</td>
                    </tr>
                    <tr>
                      <td>জুন মাসের অন্যান্য দিন</td>
                      <td>সংগ্রহের পরবর্তী দিন</td>
                    </tr>
                    <tr>
                      <td>জুন মাসের শেষ কর্মদিবস</td>
                      <td>সংগ্রহের দিন (একই দিনে)</td>
                    </tr>
                  </tbody>
                </table>
                <div className="no-results">❌ কোনো ফলাফল পাওয়া যায়নি।</div>
              </div>
            </div>
          </section>

          {/* Sections 10-14 */}
          <section id="sec10">
            <h2>
              <span className="num">১০-১৪</span> অন্যান্য বিধানাবলি
            </h2>
            <p>
              <strong>১০। সার্টিফিকেট:</strong> চাকরি হইতে আয় (তফসিল-১), অন্যান্য কর্তন (তফসিল-২), এবং সংগ্রহ (তফসিল-৩) এর সনদপত্র প্রদান করতে হবে।
            </p>
            <p>
              <strong>১১। অব্যাহতি সনদের অকার্যকারিতা:</strong> দরপত্রে বা চুক্তিতে উৎসে করের অংক অন্তর্ভুক্ত না থাকলে অব্যাহতি সনদ কার্যকর হবে না।
            </p>
            <p>
              <strong>১২। কর ব্যতীত পরিশোধ (Gross-up):</strong> যদি কর ব্যতীত বিল পরিশোধ করা হয়, তবে কর্তনের অংক নির্ণয়ের সূত্র: <code>গ = (১০০ × ক) / (১০০ − খ)</code>।
            </p>
            <p>
              <strong>১৩। রিটার্ন দাখিল:</strong> তফসিল-৪ এ বর্ণিত ফরমে উৎসে করের রিটার্ন দাখিল করতে হবে।
            </p>
            <p>
              <strong>১৪। রহিতকরণ:</strong> পূর্ববর্তী এস.আর.ও. নং ২১০ (তারিখ: ০৮ জুন ২০২৬) রহিত করা হলো।
            </p>
          </section>

          {/* Schedules */}
          <section id="schedules">
            <h2 style={{ borderBottomColor: 'var(--accent)' }}>
              <span className="num" style={{ background: 'var(--accent)' }}>
                তফসিল
              </span>{' '}
              ফরম ও সনদের নমুনা
            </h2>

            <details>
              <summary>তফসিল-১: চাকরি হইতে আয়ের সনদ</summary>
              <div className="details-content">
                <p>কর্মচারীর নাম, পদবী, TIN, মূল বেতন, ভাতা, প্রদত্ত সুবিধা, কর্তিত কর এবং চালানের বিবরণ সংবলিত ফরম।</p>
              </div>
            </details>

            <details>
              <summary>তফসিল-২: বেতনাদি ব্যতীত উৎসে কর কর্তনের সনদ</summary>
              <div className="details-content">
                <p>পরিশোধকারীর নাম, ঠিকানা, TIN, সময়কাল, অর্থ পরিশোধ ও কর কর্তনের বিবরণ সংবলিত ফরম।</p>
              </div>
            </details>

            <details>
              <summary>তফসিল-৪: উৎসে কর রিটার্ন</summary>
              <div className="details-content">
                <p>
                  অংশ ১: মৌলিক তথ্য (TIN, সার্কেল, ঠিকানা ইত্যাদি)।
                  <br />
                  অংশ ২: উৎস ও পরিমাণ (ধারা ৮৬ থেকে ১৩৬ পর্যন্ত)।
                  <br />
                  অংশ ৩: সরকারি কোষাগারে জমার বিবরণ।
                  <br />
                  অংশ ৪: সংযুক্তি এবং যাচাইকরণ।
                </p>
              </div>
            </details>
          </section>
        </main>

        {/* SIDEBAR (STICKY TOC + INSTANT TDS & GROSS-UP CALCULATOR) */}
        <aside className="sidebar">
          <div className="sticky-toc">
            <h3>এই আর্টিকেলে যা আছে</h3>
            <ul className="toc-list">
              <li>
                <a href="#sec1">০১। শিরোনাম ও প্রবর্তন</a>
              </li>
              <li>
                <a href="#sec2">০২। সংজ্ঞা</a>
              </li>
              <li>
                <a href="#sec3">০৩। ঠিকাদার ও পণ্য সরবরাহ</a>
              </li>
              <li>
                <a href="#sec4">০৪। সেবার ক্ষেত্রে কর</a>
              </li>
              <li>
                <a href="#sec5">০৫। অনিবাসীদের আয়</a>
              </li>
              <li>
                <a href="#sec6">০৬। সম্পত্তি ও রিয়েল এস্টেট</a>
              </li>
              <li>
                <a href="#sec8">০৮। আমদানি পণ্য</a>
              </li>
              <li>
                <a href="#sec9">০৯। জমাদানের সময়সীমা</a>
              </li>
              <li>
                <a href="#sec10">১০-১৪। অন্যান্য বিধান</a>
              </li>
              <li>
                <a href="#schedules">তফসিল ও ফরম</a>
              </li>
            </ul>

            {/* Interactive TDS & Rule 12 Gross-Up Calculator */}
            <div
              style={{
                marginTop: '22px',
                paddingTop: '18px',
                borderTop: '2px solid var(--primary-light)',
              }}
            >
              <h3 style={{ marginBottom: '8px', fontSize: '1.08rem' }}>
                🧮 তাৎক্ষণিক উৎসে কর ক্যালকুলেটর
              </h3>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  textAlign: 'left',
                  lineHeight: 1.45,
                }}
              >
                টেবিলের যেকোনো <strong>করহার</strong> সেলে ক্লিক করলে তা স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে।
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '5px 8px',
                    borderRadius: '5px',
                  }}
                >
                  খাত: {selectedRuleLabel}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    বিল / ভিত্তিমূল্য (টাকা):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      background: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    উৎসে করহার (%):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="99"
                    value={tdsRate}
                    onChange={(e) => setTdsRate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      background: '#fff',
                    }}
                  />
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isGrossUp}
                    onChange={(e) => setIsGrossUp(e.target.checked)}
                  />
                  <span>বিধি ১২ গ্রস-আপ (কর ব্যতীত পরিশোধ)</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={noPsrPenalty}
                    onChange={(e) => setNoPsrPenalty(e.target.checked)}
                  />
                  <span>PSR না থাকলে ৫০% অতিরিক্ত হার</span>
                </label>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '0.84rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span>কার্যকর করহার:</span>
                    <strong style={{ color: 'var(--accent)' }}>{effectiveRate.toFixed(2)}%</strong>
                  </div>
                  {isGrossUp && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span>গ্রস-আপ বিল (গ):</span>
                      <strong>
                        ৳ {grossedUpBase.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      color: 'var(--accent)',
                    }}
                  >
                    <span>কর্তনযোগ্য কর (TDS):</span>
                    <strong>
                      ৳ {calculatedTds.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '5px',
                      borderTop: '1px dashed #cbd5e1',
                      color: 'var(--primary)',
                    }}
                  >
                    <span>নীট প্রদেয় অর্থ:</span>
                    <strong>
                      ৳ {netPayableToVendor.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
export default SRO_TDS_2026;