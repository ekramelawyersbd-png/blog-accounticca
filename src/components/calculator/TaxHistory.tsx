import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Download, History } from 'lucide-react';
import Papa from 'papaparse';

export interface SavedCalculation {
  id: string;
  date: string;
  year: string;
  income: number;
  tax: number;
}

interface TaxHistoryProps {
  history: SavedCalculation[];
}

export function TaxHistory({ history }: TaxHistoryProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Only take the last 5 entries for the chart if we want to show last 5 years
  // But we might have multiple per year, let's just group by year or take the latest 5.
  const chartData = [...history].sort((a, b) => a.year.localeCompare(b.year)).slice(-5);

  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) return;

    // Clear previous SVG
    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 60 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(chartData.map(d => d.year))
      .range([0, width])
      .padding(0.5);

    const maxTax = d3.max(chartData, d => d.tax) || 0;
    const y = d3.scaleLinear()
      .domain([0, maxTax * 1.2]) // Add 20% padding top
      .range([height, 0]);

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Y Axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `Tk ${Number(d) / 1000}k`));

    // Line
    const line = d3.line<SavedCalculation>()
      .x(d => x(d.year)!)
      .y(d => y(d.tax))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#059669')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Dots
    svg.selectAll('.dot')
      .data(chartData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.year)!)
      .attr('cy', d => y(d.tax))
      .attr('r', 5)
      .attr('fill', '#ffffff')
      .attr('stroke', '#059669')
      .attr('stroke-width', 2);

  }, [chartData]);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    const csv = Papa.unparse(history.map(h => ({
      'Assessment Year': h.year,
      'Date Saved': new Date(h.date).toLocaleDateString(),
      'Total Income (Tk)': h.income,
      'Tax Liability (Tk)': h.tax
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tax_calculation_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600" />
          Tax Liability Trend (5 Years)
        </h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
      
      <div className="w-full h-[300px]" ref={chartRef}></div>
      
      <p className="text-sm text-slate-500 mt-4 text-center">
        Historical trend based on your saved calculations for different assessment years.
      </p>
    </div>
  );
}
