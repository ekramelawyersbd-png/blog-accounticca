import { TaxCategory, TaxLocation, TaxScenarioInputs, TaxScenarioResults } from '../types/taxScenario';

export interface ScenarioShareData {
  name?: string;
  notes?: string;
  inputs: TaxScenarioInputs;
  results?: TaxScenarioResults;
}

const CATEGORY_DISPLAY_NAMES: Record<TaxCategory, string> = {
  general: 'General Individual (Male under 65)',
  female_senior: 'Female or Senior Citizen (65+)',
  disabled: 'Person with Disability / Third Gender',
  freedom_fighter: 'Gazetted War-Wounded Freedom Fighter'
};

const LOCATION_DISPLAY_NAMES: Record<TaxLocation, string> = {
  dhaka_ctg: 'Dhaka & Chattogram City Corporation (Min Tax: 5,000 BDT)',
  other_cc: 'Other City Corporations (Min Tax: 4,000 BDT)',
  non_cc: 'Non-City Corporation / Rural (Min Tax: 3,000 BDT)'
};

/**
 * Builds a canonical deep link for a specific Tax Planner scenario.
 */
export function buildTaxScenarioDeepLink(
  scenario: ScenarioShareData,
  customOrigin?: string
): string {
  const origin = customOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = new URL(`${origin}/tax-planner`);

  if (scenario.name && scenario.name.trim()) {
    url.searchParams.set('name', scenario.name.trim());
  }

  const { inputs } = scenario;
  if (inputs.income && inputs.income !== '0') {
    url.searchParams.set('income', inputs.income);
  }
  if (inputs.investment && inputs.investment !== '0') {
    url.searchParams.set('investment', inputs.investment);
  }
  if (inputs.tds && inputs.tds !== '0') {
    url.searchParams.set('tds', inputs.tds);
  }
  if (inputs.category && inputs.category !== 'general') {
    url.searchParams.set('category', inputs.category);
  }
  if (inputs.location && inputs.location !== 'dhaka_ctg') {
    url.searchParams.set('location', inputs.location);
  }
  if (inputs.disabledDependents > 0) {
    url.searchParams.set('dependents', inputs.disabledDependents.toString());
  }
  if (inputs.isFirstTimeFiler) {
    url.searchParams.set('firstTime', '1');
  }
  if (scenario.notes && scenario.notes.trim()) {
    url.searchParams.set('notes', scenario.notes.trim());
  }

  return url.toString();
}

/**
 * Parses query parameters into TaxScenarioInputs and metadata if present.
 */
export function parseTaxScenarioFromUrl(
  searchParams: URLSearchParams | string
): { inputs: TaxScenarioInputs; name?: string; notes?: string } | null {
  const params = typeof searchParams === 'string' ? new URLSearchParams(searchParams) : searchParams;

  const hasRelevantParams = 
    params.has('income') || 
    params.has('investment') || 
    params.has('tds') || 
    params.has('category') || 
    params.has('location') ||
    params.has('name');

  if (!hasRelevantParams) {
    return null;
  }

  const income = params.get('income') || '';
  const investment = params.get('investment') || '';
  const tds = params.get('tds') || '';

  const rawCat = params.get('category');
  const validCategories: TaxCategory[] = ['general', 'female_senior', 'disabled', 'freedom_fighter'];
  const category: TaxCategory = rawCat && validCategories.includes(rawCat as TaxCategory)
    ? (rawCat as TaxCategory)
    : 'general';

  const rawLoc = params.get('location');
  const validLocations: TaxLocation[] = ['dhaka_ctg', 'other_cc', 'non_cc'];
  const location: TaxLocation = rawLoc && validLocations.includes(rawLoc as TaxLocation)
    ? (rawLoc as TaxLocation)
    : 'dhaka_ctg';

  const rawDep = params.get('dependents');
  const disabledDependents = rawDep ? Math.max(0, parseInt(rawDep, 10) || 0) : 0;

  const firstTime = params.get('firstTime');
  const isFirstTimeFiler = firstTime === '1' || firstTime === 'true';

  const name = params.get('name') ? decodeURIComponent(params.get('name')!) : undefined;
  const notes = params.get('notes') ? decodeURIComponent(params.get('notes')!) : undefined;

  return {
    inputs: {
      income,
      investment,
      tds,
      category,
      disabledDependents,
      location,
      isFirstTimeFiler
    },
    name,
    notes
  };
}

/**
 * Generates email content with pre-filled subject, itemized tax summary, and direct deep link.
 */
export function generateTaxScenarioEmailContent(data: {
  name?: string;
  notes?: string;
  inputs: TaxScenarioInputs;
  results: TaxScenarioResults;
  deepLink: string;
}): { subject: string; body: string; mailtoUrl: string } {
  const scenarioTitle = data.name || 'Individual Income Tax Calculation';
  const subject = `Tax Calculation Scenario: ${scenarioTitle} (Assessment Year 2026-27)`;

  const numIncome = parseInt(data.inputs.income || '0', 10);
  const numInvestment = parseInt(data.inputs.investment || '0', 10);
  const numTds = parseInt(data.inputs.tds || '0', 10);
  const catLabel = CATEGORY_DISPLAY_NAMES[data.inputs.category] || data.inputs.category;
  const locLabel = LOCATION_DISPLAY_NAMES[data.inputs.location] || data.inputs.location;

  const bodyLines = [
    `BANGLADESH INCOME TAX CALCULATION SCENARIO`,
    `Assessment Year: 2026-27 (Finance Act 2026)`,
    `Scenario Title: ${scenarioTitle}`,
    data.notes ? `Notes: ${data.notes}\n` : '',
    `========================================`,
    `1. TAXPAYER PROFILE & INPUTS`,
    `========================================`,
    `• Total Annual Income: ${numIncome.toLocaleString()} BDT`,
    `• Approved Investments: ${numInvestment.toLocaleString()} BDT`,
    `• TDS Already Paid / Deducted: ${numTds.toLocaleString()} BDT`,
    `• Taxpayer Category: ${catLabel}`,
    `• Location Zone: ${locLabel}`,
    `• Disabled Dependents: ${data.inputs.disabledDependents}`,
    `• First-Time Tax Filer: ${data.inputs.isFirstTimeFiler ? 'Yes (Min tax: 1,000 BDT)' : 'No'}`,
    ``,
    `========================================`,
    `2. TAX CALCULATION RESULTS`,
    `========================================`,
    `• Tax-Free Exemption Threshold: ${data.results.totalLimit.toLocaleString()} BDT`,
    `• Net Taxable Income: ${data.results.taxableIncome.toLocaleString()} BDT`,
    `• Gross Tax Liability (Progressive Slabs): ${data.results.grossTax.toLocaleString()} BDT`,
    `• Eligible Investment Rebate: - ${data.results.rebate.toLocaleString()} BDT`,
    `• Net Tax Before Minimum Rule: ${data.results.netTaxBeforeMin.toLocaleString()} BDT`,
    `• Mandatory Minimum Tax: ${data.results.minimumTax.toLocaleString()} BDT`,
    `• Final Assessed Tax Liability: ${data.results.finalLiability.toLocaleString()} BDT`,
    `• Less: Advance Tax / TDS Paid: - ${numTds.toLocaleString()} BDT`,
    `----------------------------------------`,
    `FINAL NET TAX PAYABLE: ${data.results.netPayable < 0 ? 'REFUND ' + Math.abs(data.results.netPayable).toLocaleString() : data.results.netPayable.toLocaleString()} BDT`,
    `----------------------------------------`,
    ``,
    `========================================`,
    `3. INTERACTIVE DEEP LINK`,
    `========================================`,
    `Open, modify, or verify this calculation scenario in the interactive Tax Planner:`,
    `${data.deepLink}`,
    ``,
    `Shared via E-Lawyers BD Tax Planning Suite (https://elawyersbd.com)`
  ];

  const body = bodyLines.filter(line => line !== '').join('\n');
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}

/**
 * Generates a clean text summary suitable for WhatsApp, Slack, or Word memo clipboard paste.
 */
export function generateTaxScenarioTextSummary(data: {
  name?: string;
  notes?: string;
  inputs: TaxScenarioInputs;
  results: TaxScenarioResults;
  deepLink: string;
}): string {
  const scenarioTitle = data.name || 'Individual Income Tax Calculation';
  const numIncome = parseInt(data.inputs.income || '0', 10);
  const numInvestment = parseInt(data.inputs.investment || '0', 10);
  const numTds = parseInt(data.inputs.tds || '0', 10);
  const catLabel = CATEGORY_DISPLAY_NAMES[data.inputs.category] || data.inputs.category;

  return [
    `📊 Tax Scenario: ${scenarioTitle} (AY 2026-27)`,
    `• Income: ${numIncome.toLocaleString()} BDT | Investment: ${numInvestment.toLocaleString()} BDT | Category: ${catLabel}`,
    `• Taxable Income: ${data.results.taxableIncome.toLocaleString()} BDT`,
    `• Gross Tax: ${data.results.grossTax.toLocaleString()} BDT | Rebate: -${data.results.rebate.toLocaleString()} BDT`,
    `• Minimum Tax: ${data.results.minimumTax.toLocaleString()} BDT`,
    `• Final Tax Liability: ${data.results.finalLiability.toLocaleString()} BDT`,
    `• Net Tax Payable (after TDS): ${data.results.netPayable < 0 ? 'Refund of ' + Math.abs(data.results.netPayable).toLocaleString() : data.results.netPayable.toLocaleString()} BDT`,
    ``,
    `🔗 Interactive Deep Link: ${data.deepLink}`
  ].join('\n');
}

/**
 * Builds a deep link for the Income Tax Calculator page (/tax-calculator)
 */
export function buildTaxCalculatorDeepLink(params: {
  income?: string;
  investments?: string;
  category?: string;
  location?: string;
  disabledDependents?: string;
}, customOrigin?: string): string {
  const origin = customOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = new URL(`${origin}/tax-calculator`);

  if (params.income && params.income !== '0') url.searchParams.set('income', params.income);
  if (params.investments && params.investments !== '0') url.searchParams.set('investments', params.investments);
  if (params.category && params.category !== 'general') url.searchParams.set('category', params.category);
  if (params.location && params.location !== 'dhaka_ctg') url.searchParams.set('location', params.location);
  if (params.disabledDependents && params.disabledDependents !== '0') url.searchParams.set('dependents', params.disabledDependents);

  return url.toString();
}

/**
 * Parses query params for /tax-calculator
 */
export function parseTaxCalculatorFromUrl(searchParams: URLSearchParams | string): {
  income?: string;
  investments?: string;
  category?: string;
  location?: string;
  disabledDependents?: string;
} | null {
  const params = typeof searchParams === 'string' ? new URLSearchParams(searchParams) : searchParams;

  if (!params.has('income') && !params.has('investments') && !params.has('category')) {
    return null;
  }

  return {
    income: params.get('income') || undefined,
    investments: params.get('investments') || undefined,
    category: params.get('category') || undefined,
    location: params.get('location') || undefined,
    disabledDependents: params.get('dependents') || undefined
  };
}
