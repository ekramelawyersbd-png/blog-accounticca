import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, Briefcase } from 'lucide-react';

const workloadData = [
  { name: 'Corporate Tax Advisory', value: 8, color: '#059669', lead: 'Adv. Rahim Uddin' },
  { name: 'VAT Returns & Compliance', value: 6, color: '#2563eb', lead: 'FCA Nazmul Hasan' },
  { name: 'Corporate Law & Secretarial', value: 5, color: '#4f46e5', lead: 'Barrister Tanvir Ahmed' },
  { name: 'Trademark & IP Registration', value: 4, color: '#d97706', lead: 'Adv. Nusrat Jahan' },
  { name: 'Legal Retainerships', value: 5, color: '#0d9488', lead: 'Senior Partner Ekram' },
];

export function ServiceWorkloadDonutChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalCases = workloadData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div id="service-workload-donut-widget" className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <PieChartIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Team Workload by Service Category</h3>
            <p className="text-xs text-slate-500">Distribution of active matters and compliance engagements currently in progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200 self-start sm:self-auto">
          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
          <span>{totalCases} Active Engagements</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Chart View */}
        <div className="lg:col-span-7 h-[300px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={workloadData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {workloadData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="transition-all duration-300 cursor-pointer hover:opacity-80"
                    style={{
                      filter: activeIndex === index ? 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.15))' : 'none',
                      transform: activeIndex === index ? 'scale(1.03)' : 'scale(1)',
                      transformOrigin: 'center center'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = Math.round((data.value / totalCases) * 100);
                    return (
                      <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1 z-50">
                        <p className="font-bold text-emerald-400">{data.name}</p>
                        <p className="text-slate-300">Active Matters: <span className="font-bold text-white">{data.value}</span> ({percentage}%)</p>
                        <p className="text-slate-400 text-[11px]">Lead: {data.lead}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-3xl font-extrabold text-slate-900">{totalCases}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matters</span>
          </div>
        </div>

        {/* Legend & Breakdown List */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Breakdown</p>
          {workloadData.map((item, index) => {
            const percentage = Math.round((item.value / totalCases) * 100);
            const isHovered = activeIndex === index;
            return (
              <div 
                key={item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isHovered ? 'bg-slate-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500">Lead: {item.lead}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="text-xs font-extrabold text-slate-900">{item.value} matters</span>
                  <p className="text-[10px] font-semibold text-emerald-600">{percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
