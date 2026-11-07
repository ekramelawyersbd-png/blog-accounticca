import { Appointment } from './appointmentService';

export type EntityType = 'private_ltd' | 'public_ltd' | 'individual' | 'foreign_branch';
export type FiscalYearEnd = 'june' | 'december';

export interface ClientCalendarProfile {
  clientName: string;
  email: string;
  phone?: string;
  organization: string;
  designation?: string;
  tinNumber: string;
  binNumber: string;
  entityType: EntityType;
  fiscalYearEnd: FiscalYearEnd;
  taxCircle: string;
  isVatRegistered: boolean;
  hasWithholdingObligation: boolean;
  notes?: string;
}

export type CalendarEventType = 'tax_deadline' | 'vat_deadline' | 'meeting' | 'compliance_milestone';

export interface SharedCalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: CalendarEventType;
  category: 'statutory' | 'meeting' | 'filing';
  urgency: 'critical' | 'approaching' | 'upcoming' | 'completed';
  daysRemaining: number;
  description: string;
  statutorySection?: string;
  formRequired?: string;
  penaltyWarning?: string;
  assignedCounsel?: string;
  mode?: 'virtual' | 'in_person';
  meetingLink?: string;
  location?: string;
  referenceId?: string;
  actionLabel?: string;
  actionUrl?: string;
  profileTags: string[];
}

const PROFILE_STORAGE_KEY = 'accounticca_client_calendar_profile';
const PROFILE_UPDATED_EVENT = 'accounticca_client_calendar_profile_updated';

export const DEFAULT_CLIENT_PROFILE: ClientCalendarProfile = {
  clientName: 'Mahfuzur Rahman',
  email: 'client.executive@apex-global.com',
  phone: '+880 1711-234567',
  organization: 'Apex Global Industries Ltd',
  designation: 'Chief Financial Officer (CFO)',
  tinNumber: '4821-9923-1102',
  binNumber: '002341990-0101',
  entityType: 'private_ltd',
  fiscalYearEnd: 'june',
  taxCircle: 'Companies Circle 14, Taxes Zone 02 (Corporate LTU)',
  isVatRegistered: true,
  hasWithholdingObligation: true,
  notes: 'Registered corporate taxpayer subject to Section 166 and Section 75B monthly withholding tax compliance.'
};

/**
 * Fetch active client profile from local storage or initialize with default
 */
export function getActiveClientCalendarProfile(fallbackUser?: { displayName?: string | null; email?: string | null }): ClientCalendarProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading client calendar profile:', err);
  }

  const base = { ...DEFAULT_CLIENT_PROFILE };
  if (fallbackUser?.displayName) {
    base.clientName = fallbackUser.displayName;
  }
  if (fallbackUser?.email) {
    base.email = fallbackUser.email;
  }

  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(base));
  } catch {}

  return base;
}

/**
 * Save client profile and dispatch update event
 */
export function saveActiveClientCalendarProfile(profile: ClientCalendarProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: profile }));
  } catch (err) {
    console.warn('Error saving client calendar profile:', err);
  }
}

/**
 * Calculate difference in days relative to reference date (2026-10-17)
 */
export function calculateDaysRemaining(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date(2026, 9, 17); // October 17, 2026
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine urgency state
 */
export function getUrgencyLevel(daysRemaining: number): 'critical' | 'approaching' | 'upcoming' | 'completed' {
  if (daysRemaining < 0) return 'completed';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 15) return 'approaching';
  return 'upcoming';
}

/**
 * Generate profile-specific statutory tax & VAT filing deadlines
 */
export function generateProfileTaxDeadlines(profile: ClientCalendarProfile): SharedCalendarEvent[] {
  const events: SharedCalendarEvent[] = [];
  const isCorporate = profile.entityType !== 'individual';
  const isJuneClosing = profile.fiscalYearEnd === 'june';

  // 1. Monthly VAT Return (Mushak 9.1) - 15th of each month (Oct 2026, Nov 2026, Dec 2026, Jan 2027)
  if (profile.isVatRegistered) {
    const vatDates = [
      { date: '2026-10-15', label: 'September 2026 VAT Return' },
      { date: '2026-11-15', label: 'October 2026 VAT Return' },
      { date: '2026-12-15', label: 'November 2026 VAT Return' },
      { date: '2027-01-15', label: 'December 2026 VAT Return' }
    ];

    vatDates.forEach((vd, idx) => {
      const days = calculateDaysRemaining(vd.date);
      events.push({
        id: `vat-deadline-${idx}-${vd.date}`,
        title: `Monthly VAT Return Filing (Mushak 9.1) · ${vd.label}`,
        date: vd.date,
        time: '17:00 BST Statutory Filing',
        type: 'vat_deadline',
        category: 'statutory',
        urgency: getUrgencyLevel(days),
        daysRemaining: days,
        description: `Mandatory monthly value-added tax return under Section 64 of the VAT and SD Act, 2012. Includes reconciliation of purchase tax credits and treasury challan deposits for ${profile.organization}.`,
        statutorySection: 'Section 64, VAT & SD Act 2012',
        formRequired: 'Mushak 9.1 Form',
        penaltyWarning: 'BDT 10,000 statutory fine plus 2% monthly interest on unpaid VAT liabilities.',
        profileTags: ['VAT Registered', profile.binNumber ? `BIN: ${profile.binNumber}` : 'BIN Active', 'Monthly Compliance']
      });
    });
  }

  // 2. Monthly Withholding Tax (TDS) Return - 15th of each month (Section 75B)
  if (profile.hasWithholdingObligation) {
    const tdsDates = [
      { date: '2026-10-15', label: 'September 2026 TDS Deductions' },
      { date: '2026-11-15', label: 'October 2026 TDS Deductions' },
      { date: '2026-12-15', label: 'November 2026 TDS Deductions' },
      { date: '2027-01-15', label: 'December 2026 TDS Deductions' }
    ];

    tdsDates.forEach((td, idx) => {
      const days = calculateDaysRemaining(td.date);
      events.push({
        id: `tds-deadline-${idx}-${td.date}`,
        title: `Monthly TDS Withholding Statement · ${td.label}`,
        date: td.date,
        time: '18:00 BST Circle Submission',
        type: 'tax_deadline',
        category: 'statutory',
        urgency: getUrgencyLevel(days),
        daysRemaining: days,
        description: `Statutory statement of tax deducted at source under Section 75B of Income Tax Act 2023. Covers supplier payments, executive payroll deductions, and professional fee withholdings for ${profile.organization}.`,
        statutorySection: 'Section 75B & Section 89, Income Tax Act 2023',
        formRequired: 'Monthly TDS Return Form',
        penaltyWarning: 'Section 269 penalty: BDT 5,000 plus BDT 1,000 for each month of default.',
        profileTags: ['Withholding Agent', profile.taxCircle, 'Section 75B']
      });
    });
  }

  // 3. Quarterly Advance Tax Installments (Section 154)
  const advanceTaxDates = [
    { date: '2026-09-15', installment: '1st Installment (25%)', label: 'Q1 Advance Tax' },
    { date: '2026-12-15', installment: '2nd Installment (50% Cumulative)', label: 'Q2 Advance Tax' },
    { date: '2027-03-15', installment: '3rd Installment (75% Cumulative)', label: 'Q3 Advance Tax' },
    { date: '2027-06-15', installment: '4th Final Installment (100%)', label: 'Q4 Advance Tax' }
  ];

  advanceTaxDates.forEach((at, idx) => {
    const days = calculateDaysRemaining(at.date);
    events.push({
      id: `advance-tax-${idx}-${at.date}`,
      title: `Quarterly Advance Income Tax · ${at.installment}`,
      date: at.date,
      time: 'Bank Hours Closing (16:00 BST)',
      type: 'tax_deadline',
      category: 'filing',
      urgency: getUrgencyLevel(days),
      daysRemaining: days,
      description: `Mandatory quarterly tax installment under Section 154 for corporate entities and assessees with estimated income exceeding BDT 6,00,000. Payment must be made through e-payment or Sonali Bank treasury challan.`,
      statutorySection: 'Section 154 & 155, Income Tax Act 2023',
      formRequired: 'Treasury Challan (Code: 1-1141-0000-0101)',
      penaltyWarning: '10% simple annual interest under Section 158 on installment shortfall.',
      profileTags: [profile.entityType.toUpperCase().replace('_', ' '), 'Advance Tax', 'Treasury Settlement']
    });
  });

  // 4. Annual Income Tax Return Filing
  if (isCorporate) {
    const returnDueDate = isJuneClosing ? '2027-01-15' : '2027-07-15';
    const auditPrepDate = isJuneClosing ? '2026-12-31' : '2027-06-30';

    const returnDays = calculateDaysRemaining(returnDueDate);
    events.push({
      id: 'corporate-return-deadline',
      title: `Annual Corporate Tax Return Filing (AY 2026-27)`,
      date: returnDueDate,
      time: '23:59 BST Tax Day Window',
      type: 'tax_deadline',
      category: 'statutory',
      urgency: getUrgencyLevel(returnDays),
      daysRemaining: returnDays,
      description: `Statutory corporate tax return submission under Section 166(2) for ${profile.organization}. Required attachments include audited financial statements certified by ICAB Chartered Accountant, Document Verification Code (DVC), depreciation schedules, and withholding certificates.`,
      statutorySection: 'Section 166(2)(a), Income Tax Act 2023',
      formRequired: 'Company Return Form (Form 11A / e-Return)',
      penaltyWarning: 'Section 266 penalty of BDT 50,000 plus 2% monthly interest under Section 174.',
      profileTags: [profile.entityType === 'private_ltd' ? 'Private Limited Company' : 'Public Limited Company', `Year End: ${profile.fiscalYearEnd.toUpperCase()}`, profile.taxCircle]
    });

    const auditDays = calculateDaysRemaining(auditPrepDate);
    events.push({
      id: 'statutory-audit-readiness',
      title: 'Audited Financial Statements & DVC Sign-off',
      date: auditPrepDate,
      time: '18:00 BST Audit Completion',
      type: 'compliance_milestone',
      category: 'filing',
      urgency: getUrgencyLevel(auditDays),
      daysRemaining: auditDays,
      description: `Final audit sign-off with external statutory auditors for ${profile.organization}. Ensuring balance sheet, income statement, and ICAB Document Verification Code (DVC) are verified prior to tax submission.`,
      statutorySection: 'Companies Act 1994 & Financial Reporting Act 2015',
      formRequired: 'ICAB DVC Certified Audit Report',
      profileTags: ['Statutory Audit', 'ICAB DVC', 'Board Review']
    });

    // RJSC Annual Return (Form XII / Schedule X)
    const rjscDate = '2026-12-30';
    const rjscDays = calculateDaysRemaining(rjscDate);
    events.push({
      id: 'rjsc-annual-return',
      title: 'RJSC Statutory Annual Return Filing (Schedule X & Form XII)',
      date: rjscDate,
      time: '17:00 BST Portal Submission',
      type: 'compliance_milestone',
      category: 'filing',
      urgency: getUrgencyLevel(rjscDays),
      daysRemaining: rjscDays,
      description: `Submission of annual summary of share capital, director list (Form XII), and audited balance sheet to Registrar of Joint Stock Companies and Firms (RJSC) following corporate Annual General Meeting (AGM).`,
      statutorySection: 'Section 36 & 183, Companies Act 1994',
      formRequired: 'RJSC Schedule X, Form XII, Form 23B',
      penaltyWarning: 'Daily compounding late penalty under Section 397 of Companies Act.',
      profileTags: ['RJSC Corporate Registry', 'Form XII', 'Corporate Secretarial']
    });

  } else {
    // Individual Assessee - National Tax Day: 30 November
    const taxDayDate = '2026-11-30';
    const taxDayDays = calculateDaysRemaining(taxDayDate);
    events.push({
      id: 'individual-tax-day',
      title: 'National Tax Day (Annual Individual Return Deadline)',
      date: taxDayDate,
      time: '23:59 BST Portal Cutoff',
      type: 'tax_deadline',
      category: 'statutory',
      urgency: getUrgencyLevel(taxDayDays),
      daysRemaining: taxDayDays,
      description: `Final statutory deadline for individual assessees to file annual income tax return for Assessment Year 2026-2027 under Section 166. Required for Proof of Submission (PSR) validation.`,
      statutorySection: 'Section 166(2)(c), Income Tax Act 2023',
      formRequired: 'Individual e-Return Form IT-11GA',
      penaltyWarning: 'Delay penalty under Section 174: 2% monthly interest on net tax payable.',
      profileTags: ['Individual Assessee', 'National Tax Day', 'PSR Mandate']
    });
  }

  // 5. Half-Yearly Withholding Tax Statement (Section 75)
  const halfYearlyDate = '2027-01-31';
  const halfYearlyDays = calculateDaysRemaining(halfYearlyDate);
  events.push({
    id: 'half-yearly-tds-statement',
    title: 'Half-Yearly Withholding Tax Statement (July - Dec 2026)',
    date: halfYearlyDate,
    time: '18:00 BST Circle Filing',
    type: 'tax_deadline',
    category: 'statutory',
    urgency: getUrgencyLevel(halfYearlyDays),
    daysRemaining: halfYearlyDays,
    description: `Statutory half-yearly statement of deductions and collections under Section 75 of Income Tax Act 2023 for ${profile.organization}.`,
    statutorySection: 'Section 75, Income Tax Act 2023',
    formRequired: 'Statement of Tax Deductions at Source',
    penaltyWarning: 'Late penalty of BDT 5,000 under Section 269.',
    profileTags: ['Withholding Statement', 'Half-Yearly', profile.taxCircle]
  });

  return events;
}

/**
 * Generate meeting calendar events from appointments
 */
export function generateMeetingCalendarEvents(
  appointments: Appointment[],
  fallbackProfile: ClientCalendarProfile
): SharedCalendarEvent[] {
  // If there are real appointments, map them
  if (appointments.length > 0) {
    return appointments.map(apt => {
      const days = calculateDaysRemaining(apt.date);
      return {
        id: `meeting-${apt.id}`,
        title: `Chamber Consultation: ${apt.practiceArea}`,
        date: apt.date,
        time: apt.timeSlot,
        type: 'meeting',
        category: 'meeting',
        urgency: getUrgencyLevel(days),
        daysRemaining: days,
        description: apt.notes || `Scheduled legal and tax advisory conference with assigned chambers partner.`,
        assignedCounsel: apt.assignedPartner?.name || 'Barrister Aminul Islam (Senior Partner)',
        mode: apt.mode,
        meetingLink: apt.meetingLink,
        location: apt.mode === 'in_person' ? 'Chamber Suite 704, Concord Tower, Dhaka' : 'Google Meet Video',
        referenceId: apt.referenceId,
        actionLabel: apt.mode === 'virtual' ? 'Join Video Conference' : 'View Chamber Map',
        actionUrl: apt.meetingLink || '/portal?tab=chambers',
        profileTags: ['Client Consultation', apt.referenceId, apt.mode === 'virtual' ? 'Google Meet' : 'Chamber Suite']
      };
    });
  }

  // Realistic seeded meetings for client profile demo
  const sampleMeetings: SharedCalendarEvent[] = [
    {
      id: 'meeting-seed-1',
      title: `Corporate Tax Assessment & Audit Strategy Review`,
      date: '2026-10-25',
      time: '11:00 AM - 11:45 AM BST',
      type: 'meeting',
      category: 'meeting',
      urgency: getUrgencyLevel(calculateDaysRemaining('2026-10-25')),
      daysRemaining: calculateDaysRemaining('2026-10-25'),
      description: `Formal chamber scoping session with lead tax partner to review AY 2026-27 balance sheet disallowances, Section 46 banking settlement proofs, and tax rebate planning for ${fallbackProfile.organization}.`,
      assignedCounsel: 'Barrister Aminul Islam (Senior Tax Partner)',
      mode: 'virtual',
      meetingLink: 'https://meet.google.com/ela-tax-2026',
      referenceId: 'APT-2026-9041',
      actionLabel: 'Join Google Meet',
      actionUrl: 'https://meet.google.com/ela-tax-2026',
      profileTags: ['Tax Assessment', 'Virtual Meeting', 'Senior Partner']
    },
    {
      id: 'meeting-seed-2',
      title: `High Court VAT Show-Cause Writ Preparation Conference`,
      date: '2026-11-05',
      time: '03:30 PM - 04:30 PM BST',
      type: 'meeting',
      category: 'meeting',
      urgency: getUrgencyLevel(calculateDaysRemaining('2026-11-05')),
      daysRemaining: calculateDaysRemaining('2026-11-05'),
      description: `In-person briefing with chamber litigation counsel to review writ petition draft challenging NBR Commissionerate's VAT assessment order under Section 121 of VAT & SD Act 2012.`,
      assignedCounsel: 'Advocate Nazmul Hassan (High Court Division)',
      mode: 'in_person',
      location: 'Chamber Suite 704, Concord Tower, 113 Kazi Nazrul Islam Ave, Dhaka',
      referenceId: 'APT-2026-8812',
      actionLabel: 'Chamber Location Details',
      actionUrl: '/contact?tab=location',
      profileTags: ['High Court Litigation', 'In-Person Chamber', 'VAT Defense']
    }
  ];

  return sampleMeetings;
}

/**
 * Get all combined events chronologically
 */
export function getCombinedSharedCalendarEvents(
  profile: ClientCalendarProfile,
  appointments: Appointment[]
): SharedCalendarEvent[] {
  const taxDeadlines = generateProfileTaxDeadlines(profile);
  const meetings = generateMeetingCalendarEvents(appointments, profile);

  const combined = [...taxDeadlines, ...meetings];
  combined.sort((a, b) => a.date.localeCompare(b.date));
  return combined;
}
