import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { YearScheduleResult } from './LossCarryForwardCalculator';
import { BarChart3, Info } from 'lucide-react';

interface LossAbsorptionD3ChartProps {
  data: YearScheduleResult[];
  entityType: string;
}

export function LossAbsorptionD3Chart({ data, entityType }: LossAbsorptionD3ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    yearLabel: string;
    profitOrLoss: number;
    lossUsed: number;
    depUsed: number;
    taxableIncome: number;
    remainingLossPool: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    yearLabel: '',
    profitOrLoss: 0,
    lossUsed: 0,
    depUsed: 0,
    taxableIncome: 0,
    remainingLossPool: 0,
  });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    // Clear previous D3 elements
    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 60, left: 70 };
    const width = containerWidth - margin.left - margin.right;

    const svg = d3
      .select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale for Assessment Years
    const x0Scale = d3
      .scaleBand()
      .domain(data.map((d) => d.yearLabel))
      .rangeRound([0, width])
      .paddingInner(0.25);

    // Sub-series keys per year
    const keys = ['profitOrLoss', 'lossUsed', 'depUsed', 'taxableIncome', 'remainingLossPool'];

    const x1Scale = d3
      .scaleBand()
      .domain(keys)
      .rangeRound([0, x0Scale.bandwidth()])
      .padding(0.08);

    // Color scale for series
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(keys)
      .range(['#10b981', '#047857', '#3b82f6', '#f59e0b', '#ef4444']);

    // Determine Y domain bounds
    let maxVal = d3.max(data, (d) =>
      Math.max(
        Math.abs(d.profitBeforeDep),
        d.broughtForwardLossUsed,
        d.broughtForwardDepUsed,
        d.netTaxableIncome,
        d.activeLossPoolEnd
      )
    ) || 1000000;

    // Convert values to BDT Lakhs for scale display if numbers are large
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.1])
      .nice()
      .range([height - margin.top - margin.bottom, 0]);

    // Add horizontal grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-width)
      .tickFormat(() => '')
      .ticks(6);

    svg
      .append('g')
      .attr('class', 'grid-lines')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    // Group elements per Assessment Year
    const yearGroups = svg
      .selectAll('.year-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'year-group')
      .attr('transform', (d) => `translate(${x0Scale(d.yearLabel)},0)`);

    // Render D3 Bars with smooth entrance transition
    yearGroups
      .selectAll('rect')
      .data((d) =>
        keys.map((key) => {
          let val = 0;
          if (key === 'profitOrLoss') val = Math.max(0, d.profitBeforeDep);
          else if (key === 'lossUsed') val = d.broughtForwardLossUsed;
          else if (key === 'depUsed') val = d.broughtForwardDepUsed;
          else if (key === 'taxableIncome') val = d.netTaxableIncome;
          else if (key === 'remainingLossPool') val = d.activeLossPoolEnd;
          return { key, val, parentData: d };
        })
      )
      .enter()
      .append('rect')
      .attr('x', (d) => x1Scale(d.key) || 0)
      .attr('width', x1Scale.bandwidth())
      .attr('y', height - margin.top - margin.bottom)
      .attr('height', 0)
      .attr('fill', (d) => colorScale(d.key))
      .attr('rx', 4)
      .on('mouseover', (event, d) => {
        const parent = d.parentData;
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY - 100,
          yearLabel: parent.yearLabel,
          profitOrLoss: parent.profitBeforeDep,
          lossUsed: parent.broughtForwardLossUsed,
          depUsed: parent.broughtForwardDepUsed,
          taxableIncome: parent.netTaxableIncome,
          remainingLossPool: parent.activeLossPoolEnd,
        });
      })
      .on('mousemove', (event) => {
        setTooltip((prev) => ({ ...prev, x: event.clientX, y: event.clientY - 100 }));
      })
      .on('mouseout', () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .transition()
      .duration(750)
      .delay((_, i) => i * 40)
      .attr('y', (d) => yScale(d.val))
      .attr('height', (d) => height - margin.top - margin.bottom - yScale(d.val));

    // X Axis
    const xAxis = d3.axisBottom(x0Scale);
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-weight', 'bold')
      .attr('font-size', '11px')
      .attr('fill', '#334155');

    // Y Axis (Formatted in BDT Lakhs or Thousands)
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat((d) => {
      const num = Number(d);
      if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return `${num}`;
    });

    svg
      .append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-weight', 'bold')
      .attr('font-size', '10px')
      .attr('fill', '#475569');

    // Y Axis Label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -(height - margin.top - margin.bottom) / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Amount (BDT Lakhs)');

  }, [data, entityType]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm my-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
            <span>D3.js Visualization Engine</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Multi-Year Loss Set-Off & Absorption Bar Chart
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            D3 rendered schedule comparing annual gross results, loss set-off absorption, depreciation, and remaining pool balances.
          </p>
        </div>

        {/* D3 Series Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#10b981]" />
            <span className="text-slate-700">Gross Result</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#047857]" />
            <span className="text-slate-700">Loss Set-Off</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#3b82f6]" />
            <span className="text-slate-700">Dep. Used</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#f59e0b]" />
            <span className="text-slate-700">Taxable Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#ef4444]" />
            <span className="text-slate-700">Remaining Pool</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div ref={containerRef} className="w-full relative overflow-x-auto">
        <svg ref={svgRef} className="w-full h-auto min-w-[650px]" />
      </div>

      {/* D3 Tooltip Popover */}
      {tooltip.visible && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl text-xs border border-slate-700 min-w-[200px]"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="font-extrabold text-emerald-400 pb-1.5 mb-2 border-b border-slate-800 text-xs">
            {tooltip.yearLabel} Overview
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Gross Result:</span>
              <span className="font-bold text-white">
                {tooltip.profitOrLoss >= 0 ? `Tk. ${tooltip.profitOrLoss.toLocaleString()}` : `(Tk. ${Math.abs(tooltip.profitOrLoss).toLocaleString()})`}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-emerald-400">Loss Set-Off Applied:</span>
              <span className="font-bold text-emerald-300">Tk. {tooltip.lossUsed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-blue-400">Depreciation Absorbed:</span>
              <span className="font-bold text-blue-300">Tk. {tooltip.depUsed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-amber-400">Net Taxable Income:</span>
              <span className="font-bold text-amber-300">Tk. {tooltip.taxableIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3 pt-1 border-t border-slate-800">
              <span className="text-red-400">Remaining Active Pool:</span>
              <span className="font-bold text-red-300">Tk. {tooltip.remainingLossPool.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
