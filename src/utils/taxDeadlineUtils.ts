import { TaxScenario } from '../types/taxScenario';

export interface TaxDeadline {
  id: string;
  title: string;
  banglaTitle?: string;
  date: Date;
  dateString: string; // e.g., '15 September 2026'
  category: 'advance_tax' | 'annual_return' | 'first_time_filer' | 'rebate_investment';
  statutorySection: string;
  description: string;
  applicableTo: string;
  isUrgent: boolean; // < 7 days
  isApproaching: boolean; // < 30 days
  daysRemaining: number;
  calculatedAmount?: number;
  penaltyWarning?: string;
}

export interface ScenarioDeadlineReport {
  scenarioId: string;
  scenarioName: string;
  isFirstTimeFiler: boolean;
  totalIncome: number;
  netPayable: number;
  isAdvanceTaxApplicable: boolean;
  advanceTaxInstallmentAmount: number;
  deadlines: TaxDeadline[];
  primaryUpcomingDeadline: TaxDeadline | null;
  monthlyDelayPenaltyEstimate: number;
}

export function getReferenceNow(): Date {
  // Use current system time (which is Sep 11, 2026 in metadata)
  return new Date();
}

export function computeScenarioDeadlines(scenario: TaxScenario, now: Date = getReferenceNow()): ScenarioDeadlineReport {
  const income = parseInt(scenario.inputs.income || '0', 10);
  const netPayable = scenario.results.netPayable || 0;
  const isFirstTime = scenario.inputs.isFirstTimeFiler || false;
  
  // Section 154 of Income Tax Act 2023: Advance tax mandatory if estimated total income > 6,00,000 BDT
  const isAdvanceTaxApplicable = income > 600000 && netPayable > 0;
  const advanceTaxInstallmentAmount = isAdvanceTaxApplicable ? Math.round(netPayable / 4) : 0;

  // Potential Section 174 delay penalty: 2% per month on unpaid net tax
  const monthlyDelayPenaltyEstimate = netPayable > 0 ? Math.round(netPayable * 0.02) : 0;

  // Master statutory dates for Assessment Year 2026-2027 (Income Year 2025-2026)
  // Set explicit time to 23:59:59 Bangladesh Standard Time (UTC+6)
  const currentYear = 2026;
  
  const rawDeadlines = [
    {
      id: 'advance-tax-q1',
      title: '1st Advance Tax Installment',
      banglaTitle: '১ম কিস্তি অগ্রিম কর',
      date: new Date(Date.UTC(2026, 8, 15, 17, 59, 59)), // 15 Sep 2026
      dateString: '15 September 2026',
      category: 'advance_tax' as const,
      statutorySection: 'Section 154 & 155, Income Tax Act 2023',
      description: 'Mandatory quarterly 25% advance tax installment for assessees with annual income exceeding BDT 6,00,000.',
      applicableTo: isAdvanceTaxApplicable ? 'Mandatory for this profile' : 'Exempt (Income below BDT 6L threshold)',
      calculatedAmount: advanceTaxInstallmentAmount,
      penaltyWarning: '10% simple annual interest under Section 158 for non-payment or under-payment.'
    },
    {
      id: 'annual-tax-day',
      title: 'National Tax Day (Annual Return Deadline)',
      banglaTitle: 'জাতীয় কর দিবস (রিটার্ন দাখিল শেষ দিন)',
      date: new Date(Date.UTC(2026, 10, 30, 17, 59, 59)), // 30 Nov 2026
      dateString: '30 November 2026',
      category: 'annual_return' as const,
      statutorySection: 'Section 166 & 171, Income Tax Act 2023',
      description: 'Statutory deadline for submission of annual individual income tax returns across all NBR tax zones.',
      applicableTo: isFirstTime ? 'First-time filer option (can utilize extended window up to 30 June)' : 'Mandatory statutory deadline for all individuals',
      calculatedAmount: netPayable > 0 ? netPayable : 0,
      penaltyWarning: '2% monthly delay penalty under Section 174, loss of Section 78 investment tax rebate, and forfeiture of tax compliance certificates.'
    },
    {
      id: 'advance-tax-q2',
      title: '2nd Advance Tax Installment',
      banglaTitle: '২য় কিস্তি অগ্রিম কর',
      date: new Date(Date.UTC(2026, 11, 15, 17, 59, 59)), // 15 Dec 2026
      dateString: '15 December 2026',
      category: 'advance_tax' as const,
      statutorySection: 'Section 154 & 155, Income Tax Act 2023',
      description: 'Second quarterly 25% installment of estimated annual tax liability.',
      applicableTo: isAdvanceTaxApplicable ? 'Mandatory for this profile' : 'Exempt',
      calculatedAmount: advanceTaxInstallmentAmount,
      penaltyWarning: '10% annual interest on defaulted advance tax installment under Section 158.'
    },
    {
      id: 'advance-tax-q3',
      title: '3rd Advance Tax Installment',
      banglaTitle: '৩য় কিস্তি অগ্রিম কর',
      date: new Date(Date.UTC(2027, 2, 15, 17, 59, 59)), // 15 Mar 2027
      dateString: '15 March 2027',
      category: 'advance_tax' as const,
      statutorySection: 'Section 154 & 155, Income Tax Act 2023',
      description: 'Third quarterly 25% installment of estimated annual tax liability.',
      applicableTo: isAdvanceTaxApplicable ? 'Mandatory for this profile' : 'Exempt',
      calculatedAmount: advanceTaxInstallmentAmount,
      penaltyWarning: '10% annual interest on default.'
    },
    {
      id: 'advance-tax-q4',
      title: '4th Advance Tax Installment',
      banglaTitle: '৪র্থ কিস্তি অগ্রিম কর',
      date: new Date(Date.UTC(2027, 5, 15, 17, 59, 59)), // 15 Jun 2027
      dateString: '15 June 2027',
      category: 'advance_tax' as const,
      statutorySection: 'Section 154 & 155, Income Tax Act 2023',
      description: 'Final balancing installment of advance tax before the close of assessment year.',
      applicableTo: isAdvanceTaxApplicable ? 'Mandatory for this profile' : 'Exempt',
      calculatedAmount: advanceTaxInstallmentAmount,
      penaltyWarning: '10% annual interest on default.'
    },
    {
      id: 'first-time-filer-deadline',
      title: 'First-Time Assessee Special Extension',
      banglaTitle: 'প্রথমবার করদাতাদের বিশেষ সময়সীমা',
      date: new Date(Date.UTC(2027, 5, 30, 17, 59, 59)), // 30 Jun 2027
      dateString: '30 June 2027',
      category: 'first_time_filer' as const,
      statutorySection: 'Section 166(2)(a), Income Tax Act 2023',
      description: 'An individual who has never filed an income tax return before is legally permitted to submit until the end of the Assessment Year without penalty.',
      applicableTo: isFirstTime ? 'Fully applicable (Special relief granted)' : 'Not applicable (Assessee is an existing filer)',
      calculatedAmount: netPayable > 0 ? netPayable : 0,
      penaltyWarning: 'Standard delay interest applies if filed beyond 30 June 2027.'
    }
  ];

  const nowMs = now.getTime();

  // Map and calculate remaining days
  const deadlines: TaxDeadline[] = rawDeadlines
    .filter(d => {
      // If advance tax is not applicable and this is advance tax, skip unless user has high income
      if (d.category === 'advance_tax' && !isAdvanceTaxApplicable) return false;
      // If not a first-time filer, don't show the first-time filer specific deadline
      if (d.id === 'first-time-filer-deadline' && !isFirstTime) return false;
      return true;
    })
    .map(d => {
      const diffMs = d.date.getTime() - nowMs;
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        ...d,
        daysRemaining,
        isUrgent: daysRemaining >= 0 && daysRemaining <= 7,
        isApproaching: daysRemaining > 7 && daysRemaining <= 30
      };
    })
    .filter(d => d.daysRemaining >= 0) // Only future or current deadlines
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const primaryUpcomingDeadline = deadlines.length > 0 ? deadlines[0] : null;

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    isFirstTimeFiler: isFirstTime,
    totalIncome: income,
    netPayable,
    isAdvanceTaxApplicable,
    advanceTaxInstallmentAmount,
    deadlines,
    primaryUpcomingDeadline,
    monthlyDelayPenaltyEstimate
  };
}

export function generateGoogleCalendarUrl(deadline: TaxDeadline, scenarioName: string): string {
  const title = encodeURIComponent(`NBR Tax Deadline: ${deadline.title} (${scenarioName})`);
  const details = encodeURIComponent(
    `${deadline.description}\n\nStatutory Provision: ${deadline.statutorySection}\nApplicability: ${deadline.applicableTo}\nEstimated Amount: BDT ${(deadline.calculatedAmount || 0).toLocaleString()}\n\nTracked via E-Lawyers Tax Planning Platform.`
  );
  
  // Format date YYYYMMDD
  const year = deadline.date.getUTCFullYear();
  const month = String(deadline.date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(deadline.date.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dateStr}/${dateStr}`;
}

export function generateIcsFile(deadline: TaxDeadline, scenarioName: string): string {
  const year = deadline.date.getUTCFullYear();
  const month = String(deadline.date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(deadline.date.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//E-Lawyers Bangladesh//Tax Deadline Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:tax-deadline-${deadline.id}-${Date.now()}@elawyersbd.com`,
    `DTSTAMP:${dateStr}T090000Z`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`,
    `SUMMARY:NBR Tax Deadline: ${deadline.title} (${scenarioName})`,
    `DESCRIPTION:${deadline.description} - ${deadline.statutorySection}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcsFile(deadline: TaxDeadline, scenarioName: string) {
  const icsData = generateIcsFile(deadline, scenarioName);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Tax-Deadline-${deadline.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
