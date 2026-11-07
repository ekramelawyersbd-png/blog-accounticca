import { useState, useMemo, useRef } from 'react';
import { Calendar as CalendarIcon, Filter, AlertCircle, CheckCircle2, Clock, Download, Loader2 } from 'lucide-react';
import { format, addMonths, setDate, isBefore, isAfter, isSameMonth } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type EntityType = 'public' | 'private' | 'foreign_branch' | 'individual';
type YearEnd = 'june' | 'december';

export function ComplianceCalendar() {
  const [entityType, setEntityType] = useState<EntityType>('private');
  const [yearEnd, setYearEnd] = useState<YearEnd>('june');
  const [currentDate] = useState(new Date('2026-08-07')); // using the current local time context
  const [isExporting, setIsExporting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!calendarRef.current) return;
    
    try {
      setIsExporting(true);
      // Wait for a brief moment to ensure any UI state is settled
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2, // Higher quality
        backgroundColor: '#ffffff',
        windowWidth: calendarRef.current.scrollWidth,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add padding
      const margin = 20;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save(`Corporate_Compliance_Calendar_${format(currentDate, 'yyyy')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  const deadlines = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const events = [];

    // Monthly Deadlines
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(currentYear, month, 15);
      
      events.push({
        id: `vat-${month}`,
        title: 'Monthly VAT Return (Mushak 9.1)',
        date: monthDate,
        type: 'monthly',
        status: isBefore(monthDate, currentDate) ? 'past' : isSameMonth(monthDate, currentDate) ? 'upcoming' : 'future',
        description: 'Submission of monthly VAT return and payment'
      });

      events.push({
        id: `tds-${month}`,
        title: 'Monthly TDS Return',
        date: monthDate,
        type: 'monthly',
        status: isBefore(monthDate, currentDate) ? 'past' : isSameMonth(monthDate, currentDate) ? 'upcoming' : 'future',
        description: 'Submission of tax deducted at source'
      });
    }

    // Advance Income Tax (AIT) Installments
    const aitDates = [
      new Date(currentYear, 8, 15), // 15 Sep
      new Date(currentYear, 11, 15), // 15 Dec
      new Date(currentYear + 1, 2, 15), // 15 Mar
      new Date(currentYear + 1, 5, 15), // 15 Jun
    ];

    aitDates.forEach((date, index) => {
      events.push({
        id: `ait-${index}`,
        title: `AIT Installment (Q${index + 1})`,
        date: date,
        type: 'quarterly',
        status: isBefore(date, currentDate) ? 'past' : 'future',
        description: 'Quarterly Advance Income Tax payment'
      });
    });

    // Corporate Tax Return Deadline (Tax Day)
    // Rule: 15th day of the ninth month after the end of the income year
    let incomeYearEnd = yearEnd === 'june' 
      ? new Date(currentYear - 1, 5, 30) // 30 June of previous year or current year? Let's say we are filing for previous income year
      : new Date(currentYear - 1, 11, 31); // 31 Dec

    // For assessment year 2026-27, income year ended June 2026 or Dec 2025.
    // If it's Aug 2026 now:
    // If yearEnd = June, income year ended 30 June 2026. 
    // 9th month after June is March (of next year, 2027). 15th day = 15 March 2027.
    // If yearEnd = Dec, income year ended 31 Dec 2025. 
    // 9th month after Dec is Sept (2026). 15th day = 15 Sept 2026.
    
    let taxReturnDate;
    if (yearEnd === 'june') {
       taxReturnDate = new Date(currentYear + 1, 2, 15); // 15 March next year
    } else {
       taxReturnDate = new Date(currentYear, 8, 15); // 15 Sept current year
    }

    // "if this date falls before 15 September, the official filing deadline becomes 15 September"
    // (This applies if 9 months after income year ends before 15 Sept. For example if year ends 31 Oct, 9 months is 15 July. Then deadline is 15 Sept.)
    const sept15 = new Date(taxReturnDate.getFullYear(), 8, 15);
    if (isBefore(taxReturnDate, sept15)) {
      taxReturnDate = sept15;
    }

    events.push({
      id: 'tax-return',
      title: 'Corporate Income Tax Return (Tax Day)',
      date: taxReturnDate,
      type: 'annual',
      status: isBefore(taxReturnDate, currentDate) ? 'past' : 'upcoming',
      description: 'Annual corporate tax return filing with audited financials',
      important: true
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).filter(e => e.date.getFullYear() === currentYear || e.date.getFullYear() === currentYear + 1);
  }, [yearEnd, currentDate]);

  const timelineData = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    let incomeYearEnd;
    
    if (entityType === 'individual' || yearEnd === 'june') {
      incomeYearEnd = new Date(currentYear, 5, 30);
      if (currentDate < incomeYearEnd) { 
        incomeYearEnd = new Date(currentYear - 1, 5, 30);
      }
    } else {
      incomeYearEnd = new Date(currentYear - 1, 11, 31);
    }
    
    let earlyEnd, regularEnd, late1End, lateEnd;
    let currentPeriod = '';
    let progress = 0;
    let isIndividual = entityType === 'individual';

    if (isIndividual) {
      earlyEnd = new Date(incomeYearEnd);
      earlyEnd.setMonth(earlyEnd.getMonth() + 3);
      
      regularEnd = new Date(earlyEnd);
      regularEnd.setMonth(regularEnd.getMonth() + 3);
      
      late1End = new Date(regularEnd);
      late1End.setMonth(late1End.getMonth() + 3);
      
      lateEnd = new Date(late1End);
      lateEnd.setMonth(lateEnd.getMonth() + 3);
      
      const totalDuration = lateEnd.getTime() - incomeYearEnd.getTime();
      const currentElapsed = currentDate.getTime() - incomeYearEnd.getTime();
      progress = Math.max(0, Math.min(100, (currentElapsed / totalDuration) * 100));
      
      if (currentDate <= earlyEnd) currentPeriod = 'Early Filing';
      else if (currentDate <= regularEnd) currentPeriod = 'Regular Filing';
      else if (currentDate <= late1End) currentPeriod = 'Late Filing (Q3)';
      else if (currentDate <= lateEnd) currentPeriod = 'Late Filing (Q4)';
      else currentPeriod = 'Closed';
    } else {
      earlyEnd = new Date(incomeYearEnd);
      earlyEnd.setMonth(earlyEnd.getMonth() + 6);
          
      regularEnd = new Date(earlyEnd);
      regularEnd.setMonth(regularEnd.getMonth() + 3);
      regularEnd.setDate(regularEnd.getDate() + 15);
          
      lateEnd = new Date(regularEnd);
      lateEnd.setMonth(lateEnd.getMonth() + 2);
      lateEnd.setDate(lateEnd.getDate() + 15);
      
      const totalDuration = lateEnd.getTime() - incomeYearEnd.getTime();
      const currentElapsed = currentDate.getTime() - incomeYearEnd.getTime();
      progress = Math.max(0, Math.min(100, (currentElapsed / totalDuration) * 100));

      if (currentDate <= earlyEnd) currentPeriod = 'Early Filing';
      else if (currentDate <= regularEnd) currentPeriod = 'Regular Filing';
      else if (currentDate <= lateEnd) currentPeriod = 'Late Filing';
      else currentPeriod = 'Closed';
    }

    return {
      incomeYearEnd,
      earlyEnd,
      regularEnd,
      late1End,
      lateEnd,
      currentPeriod,
      progress,
      isIndividual
    };
  }, [entityType, yearEnd, currentDate]);

  const upcomingEvents = deadlines.filter(e => !isBefore(e.date, currentDate)).slice(0, 5);

  return (
    <div ref={calendarRef} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600" /> Compliance Calendar
          </h2>
          <p className="text-slate-600 text-sm mt-1">Track your upcoming tax and VAT deadlines</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <select 
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="private">Private Limited</option>
              <option value="public">Public Limited</option>
              <option value="foreign_branch">Foreign Branch</option>
              <option value="individual">Individual / HUF</option>
            </select>
            {entityType !== 'individual' && (
              <>
                <div className="w-px h-4 bg-slate-300"></div>
                <select 
                  value={yearEnd}
                  onChange={(e) => setYearEnd(e.target.value as YearEnd)}
                  className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none mr-2"
                >
                  <option value="june">Jun 30 Year End</option>
                  <option value="december">Dec 31 Year End</option>
                </select>
              </>
            )}
          </div>
          
          <button 
            data-html2canvas-ignore="true"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Tax Filing Timeline */}
      <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {timelineData.isIndividual ? 'Individual Tax Return Timeline' : 'Corporate Tax Return Timeline'}
            </h3>
            <p className="text-sm text-slate-600">Assessment Year based on Income Year ending {format(timelineData.incomeYearEnd, 'MMM dd, yyyy')}</p>
          </div>
          <div className="sm:text-right">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Status</div>
            <div className={`font-bold px-3 py-1 rounded-lg text-sm inline-block ${
              timelineData.currentPeriod === 'Early Filing' ? 'bg-emerald-100 text-emerald-700' :
              timelineData.currentPeriod === 'Regular Filing' ? 'bg-amber-100 text-amber-700' :
              timelineData.currentPeriod.includes('Late Filing') ? 'bg-rose-100 text-rose-700' :
              'bg-slate-200 text-slate-700'
            }`}>
              {timelineData.currentPeriod}
            </div>
          </div>
        </div>

        <div className="relative pt-6 pb-2">
          {/* Progress Indicator */}
          {timelineData.progress > 0 && timelineData.progress <= 100 && (
            <div 
              className="absolute top-0 bottom-2 flex flex-col items-center z-10"
              style={{ left: `${timelineData.progress}%`, transform: 'translateX(-50%)' }}
            >
              <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md mb-1 whitespace-nowrap shadow-sm">
                Today
              </div>
              <div className="w-0.5 h-full bg-slate-800/20"></div>
            </div>
          )}

          {timelineData.isIndividual ? (
            <>
              {/* Individual Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 mb-3 flex overflow-hidden relative">
                <div className="bg-emerald-400 h-full relative" style={{ width: '25%' }} title="Early Filing"></div>
                <div className="bg-amber-400 h-full relative" style={{ width: '25%' }} title="Regular Filing"></div>
                <div className="bg-orange-400 h-full relative" style={{ width: '25%' }} title="Late Filing (Q3)"></div>
                <div className="bg-rose-500 h-full relative" style={{ width: '25%' }} title="Late Filing (Q4)"></div>
              </div>
              
              <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500 px-1 relative">
                <div className="flex flex-col items-start w-[25%]">
                  <span className="text-emerald-700 mb-0.5">Early (-5% or 25k)</span>
                  <span className="font-medium text-slate-400">By {format(timelineData.earlyEnd, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex flex-col items-start w-[25%]">
                  <span className="text-amber-700 mb-0.5">Regular (No Penalty)</span>
                  <span className="font-medium text-slate-400">By {format(timelineData.regularEnd, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex flex-col items-start w-[25%]">
                  <span className="text-orange-700 mb-0.5">Late (+2% or 3k)</span>
                  <span className="font-medium text-slate-400">By {format(timelineData.late1End!, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex flex-col items-end w-[25%] text-right">
                  <span className="text-rose-700 mb-0.5">Late (+5% or 5k)</span>
                  <span className="font-medium text-slate-400">By {format(timelineData.lateEnd, 'MMM dd, yyyy')}</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-emerald-900">
                    <span className="font-bold">New Taxpayers:</span> First-time filers can submit by June 30 of the following year without late penalties.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-emerald-900">
                    <span className="font-bold">Holiday Rule:</span> If a deadline falls on a government holiday, the immediate next working day is treated as the final submission date.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Corporate Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 mb-3 flex overflow-hidden relative">
                <div className="bg-emerald-400 h-full relative" style={{ width: '50%' }} title="Early Filing"></div>
                <div className="bg-amber-400 h-full relative" style={{ width: '29%' }} title="Regular Filing"></div>
                <div className="bg-rose-400 h-full relative" style={{ width: '21%' }} title="Late Filing"></div>
              </div>
              
              <div className="flex justify-between text-xs font-bold text-slate-500 px-1 relative">
                <div className="flex flex-col items-start w-[50%]">
                  <span className="text-emerald-700 mb-0.5">Early (5% Rebate)</span>
                  <span className="font-medium text-slate-400">By {format(timelineData.earlyEnd, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex flex-col items-start w-[29%]">
                  <span className="text-amber-700 mb-0.5">Regular</span>
                  <span className="font-medium text-slate-400">By {format(timelineData.regularEnd, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex flex-col items-end w-[21%] text-right">
                  <span className="text-rose-700 mb-0.5">Late (+Penalty)</span>
                  <span className="font-medium text-slate-400">By {format(timelineData.lateEnd, 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 px-1">
        <Clock className="w-4 h-4 text-slate-400" />
        <h3 className="font-bold text-slate-900 text-sm">Upcoming Deadlines</h3>
      </div>

      <div className="space-y-4">
        {upcomingEvents.map(event => (
          <div 
            key={event.id} 
            className={`p-4 rounded-2xl border transition-colors flex items-start gap-4 ${
              event.important 
                ? 'bg-rose-50 border-rose-200' 
                : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'
            }`}
          >
            <div className={`flex flex-col items-center justify-center min-w-[64px] h-16 rounded-xl border ${
              event.important ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <span className="text-xs font-bold uppercase">{format(event.date, 'MMM')}</span>
              <span className="text-xl font-bold">{format(event.date, 'dd')}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-bold ${event.important ? 'text-rose-900' : 'text-slate-900'}`}>
                  {event.title}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                  event.important 
                    ? 'bg-rose-200 text-rose-800' 
                    : event.type === 'monthly' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {event.type}
                </span>
              </div>
              <p className={`text-sm ${event.important ? 'text-rose-700' : 'text-slate-600'}`}>
                {event.description}
              </p>
              {event.important && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100/50 w-fit px-2 py-1 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" /> Major Deadline
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button data-html2canvas-ignore="true" className="w-full mt-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition-colors border border-slate-200">
        View Full Year Calendar
      </button>
    </div>
  );
}
