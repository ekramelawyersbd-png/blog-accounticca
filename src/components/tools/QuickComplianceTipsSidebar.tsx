import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Wheat, 
  Building2, 
  Scale, 
  Sparkles, 
  Coins, 
  Calendar, 
  FileCheck2, 
  Info, 
  ArrowDownRight, 
  Copy, 
  Check,
  Pin,
  PinOff,
  BookOpen
} from 'lucide-react';

export interface ComplianceTipItem {
  mistake: string;
  consequence: string;
  correctApproach: string;
  statutoryRef: string;
  severity: 'high' | 'medium' | 'info';
}

export interface ToolComplianceGuide {
  id: string;
  name: string;
  shortName: string;
  anchorId: string;
  statutoryBasis: string;
  icon: React.ReactNode;
  themeColor: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    gradient: string;
  };
  keyThresholds: Array<{ label: string; value: string }>;
  commonMistakes: ComplianceTipItem[];
  verificationChecklist: string[];
}

export const COMPLIANCE_GUIDES: Record<string, ToolComplianceGuide> = {
  'agri-tax-tool': {
    id: 'agri-tax-tool',
    name: 'Agricultural Income Tax Calculator',
    shortName: 'Agri Tax',
    anchorId: 'agri-tax-tool',
    statutoryBasis: 'Income Tax Act, 2023 (Sections 40–44) & Sixth Schedule Part 1 (Clause 20)',
    icon: <Wheat className="w-5 h-5 text-emerald-400" />,
    themeColor: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      gradient: 'from-emerald-900 via-emerald-800 to-teal-900'
    },
    keyThresholds: [
      { label: 'Deemed Expense Rate', value: '60% under Section 43' },
      { label: 'Clause 20 Exemption', value: 'BDT 2,00,000 (qualifying farmers)' },
      { label: 'General Tax-Free Slab', value: 'BDT 4,00,000 (AY 2026-27)' },
      { label: 'Disabled Dependent', value: '+BDT 50,000 per dependent' }
    ],
    commonMistakes: [
      {
        mistake: 'Reporting only bank cash receipts instead of gross crop produce value',
        consequence: 'Audit assessment under Section 40(1) with estimated fair market value markup and penalty.',
        correctApproach: 'Value all harvested produce (sold, stored, or consumed) at prevailing local market price during harvest season.',
        statutoryRef: 'Section 40(1)',
        severity: 'high'
      },
      {
        mistake: 'Claiming Clause 20 (Tk. 2 Lakh exemption) while earning salary or trade profits',
        consequence: 'Immediate disallowance during return processing, resulting in unexpected tax demand notices.',
        correctApproach: 'Clause 20 strictly requires the taxpayer to be a farmer by occupation with NO non-agricultural income (except interest/profit on bank deposits up to Tk. 20,000).',
        statutoryRef: 'Sixth Schedule, Part 1, Clause 20',
        severity: 'high'
      },
      {
        mistake: 'Claiming actual expenses higher than 60% without audited books of account',
        consequence: 'NBR Deputy Commissioner of Taxes (DCT) will reject claimed expenses and force the 60% deemed rate.',
        correctApproach: 'Maintain formal books of accounts with verifiable vouchers for seeds, fertilizers, irrigation, labor, and transport under Section 42.',
        statutoryRef: 'Section 42 & Section 43',
        severity: 'medium'
      },
      {
        mistake: 'Treating 100% of tea or rubber plantation sales as agricultural income',
        consequence: 'Underreporting commercial corporate income subject to 20%–27.5% corporate tax.',
        correctApproach: 'Split produce under Section 40(2): 60% is deemed agricultural income, while 40% is classified as commercial business income.',
        statutoryRef: 'Section 40(2) & Rule 29',
        severity: 'high'
      }
    ],
    verificationChecklist: [
      'Document harvest yields with local Krishi/Agriculture Extension officer records if available.',
      'Ensure personal bank profit does not exceed Tk. 20,000 if claiming Clause 20 exemption.',
      'Keep copies of land ownership records (Khatian / Dakhila / Porcha) for cultivated land.'
    ]
  },

  'minimum-turnover-tax-tool': {
    id: 'minimum-turnover-tax-tool',
    name: 'Minimum Turnover Tax Calculator',
    shortName: 'Turnover Tax',
    anchorId: 'minimum-turnover-tax-tool',
    statutoryBasis: 'Income Tax Act, 2023 (Section 163) & NBR Restructured Slabs',
    icon: <Building2 className="w-5 h-5 text-indigo-400" />,
    themeColor: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      gradient: 'from-slate-900 via-indigo-950 to-slate-900'
    },
    keyThresholds: [
      { label: 'Slab 1 (Up to Tk 2 Cr)', value: '0% (Tax-Free Exemption)' },
      { label: 'Slab 2 (Tk 2 Cr - 4 Cr)', value: '0.5% Minimum Tax' },
      { label: 'Slab 3 (Above Tk 4 Cr)', value: '1.0% Minimum Tax' },
      { label: 'Section 163 Floor', value: 'Higher of Profit Tax or Turnover Tax' }
    ],
    commonMistakes: [
      {
        mistake: 'Assuming operational losses exempt a business from paying any tax',
        consequence: 'Tax evasion notice under Section 163; turnover tax functions as an irreducible statutory floor regardless of financial loss.',
        correctApproach: 'Even if the net profit is negative (e.g. Tk. 20 Lakh loss on Tk. 3 Crore sales), the business must pay 0.5% on Tk. 3 Crore = Tk. 1.5 Lakh minimum tax.',
        statutoryRef: 'Section 163(1) & (2)',
        severity: 'high'
      },
      {
        mistake: 'Applying the legacy 1% flat rate to small businesses below Tk. 2 Crore turnover',
        consequence: 'Unnecessary tax overpayment and cash flow drain for startups and micro-enterprises.',
        correctApproach: 'Under NBR restructured slabs, businesses with turnover up to Tk. 2 Crore enjoy 0% minimum turnover tax.',
        statutoryRef: 'NBR AY 2026-27 Slabs',
        severity: 'medium'
      },
      {
        mistake: 'Calculating turnover tax on net profit margin instead of gross sales receipts',
        consequence: 'Major underpayment assessment with late penalty interest (2% per month) under Section 193.',
        correctApproach: 'Turnover tax must be calculated on gross invoiced business sales/turnover before any expense or depreciation deductions.',
        statutoryRef: 'Section 163',
        severity: 'high'
      },
      {
        mistake: 'Thinking Advance Income Tax (AIT) or TDS cannot be adjusted against turnover tax',
        consequence: 'Double payment of taxes already deducted at source under Sections 89, 90, or 120.',
        correctApproach: 'TDS and AIT collected by banks, customs, or clients adjust directly against minimum turnover tax liability.',
        statutoryRef: 'Sections 89, 90 & 163(3)',
        severity: 'medium'
      }
    ],
    verificationChecklist: [
      'Reconcile annual sales declared in VAT returns (Mushak 9.1) with income tax turnover.',
      'Gather source tax certificates (Challans / Form 80) for all AIT deducted at source.',
      'Check whether corporate or trade entity qualifies for special statutory rates (e.g., manufacturers vs. distributors).'
    ]
  },

  'investment-rebate-calculator-tool': {
    id: 'investment-rebate-calculator-tool',
    name: 'Investment-Based Tax Rebate Calculator',
    shortName: 'Tax Rebate',
    anchorId: 'investment-rebate-calculator-tool',
    statutoryBasis: 'Bangladesh Finance Act 2026, Section 78 & Sixth Schedule Part 3',
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    themeColor: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      gradient: 'from-slate-900 via-emerald-950 to-slate-900'
    },
    keyThresholds: [
      { label: 'Income Limit', value: '3% of Total Taxable Income' },
      { label: 'Investment Limit', value: '10% of Eligible Investment' },
      { label: 'Government Ceiling', value: 'Tk. 7,50,000 (Maximum Cap)' },
      { label: 'DPS Annual Limit', value: 'Tk. 1,20,000 statutory cap' }
    ],
    commonMistakes: [
      {
        mistake: 'Assuming the old 15% investment rebate rate and Tk. 10 Lakh ceiling still apply',
        consequence: 'Claiming excess tax credit resulting in automated re-assessment by e-Return system.',
        correctApproach: 'Finance Act 2026 lowered the rebate rate to 10% (from 15%) and the government ceiling to Tk. 7.5 Lakh (from Tk. 10 Lakh).',
        statutoryRef: 'Finance Act 2026 & Section 78',
        severity: 'high'
      },
      {
        mistake: 'Over-investing in instruments while total taxable income is modest',
        consequence: 'Unused investment credit; investments beyond what 3% of taxable income permits generate Tk. 0 extra rebate.',
        correctApproach: 'Evaluate the 3% income limit first: if your taxable income is Tk. 20 Lakh, your maximum possible rebate is Tk. 60,000, requiring only Tk. 6 Lakh in investment.',
        statutoryRef: 'Section 78(2)',
        severity: 'medium'
      },
      {
        mistake: 'Claiming full amount of high-deposit DPS (e.g. Tk. 2,40,000 in DPS)',
        consequence: 'Partial disallowance and re-calculation by NBR e-Return algorithm.',
        correctApproach: 'The statutory allowable investment for Deposit Pension Scheme (DPS) is strictly capped at Tk. 1,20,000 per tax year.',
        statutoryRef: 'Sixth Schedule Part 3, Clause 4',
        severity: 'medium'
      },
      {
        mistake: 'Investing in unapproved mutual funds or unlisted private equity',
        consequence: 'Total rejection of investment claim with audit scrutiny.',
        correctApproach: 'Only listed shares, approved mutual funds, government treasury bonds, life insurance, and Universal Pension Scheme (UPS) qualify.',
        statutoryRef: 'Sixth Schedule Part 3',
        severity: 'high'
      }
    ],
    verificationChecklist: [
      'Collect annual interest/balance certificate for DPS and life insurance premium receipts.',
      'Ensure life insurance premium claimed does not exceed 10% of actual sum assured.',
      'Verify that mutual fund investments are listed on DSE or CSE.'
    ]
  },

  'wealth-surcharge-tool': {
    id: 'wealth-surcharge-tool',
    name: 'Wealth Surcharge Visualizer',
    shortName: 'Wealth Surcharge',
    anchorId: 'wealth-surcharge-tool',
    statutoryBasis: 'Income Tax Act, 2023 Section 2(86B) & Finance Act 2026',
    icon: <Coins className="w-5 h-5 text-teal-400" />,
    themeColor: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-900',
      badge: 'bg-teal-100 text-teal-800 border-teal-300',
      gradient: 'from-slate-900 via-teal-950 to-slate-900'
    },
    keyThresholds: [
      { label: 'Exemption Threshold', value: 'Net Wealth up to Tk 4 Crore (0%)' },
      { label: 'First Bracket', value: '10% Surcharge (Tk 4 Cr - 10 Cr)' },
      { label: 'Maximum Bracket', value: '35% Surcharge (Above Tk 50 Cr)' },
      { label: 'Minimum Floor', value: 'Tk. 5,000 - Tk. 10,000 in City Corp' }
    ],
    commonMistakes: [
      {
        mistake: 'Ignoring the special luxury triggers when net wealth is under Tk 4 Crore',
        consequence: 'Omission penalty; owning more than 1 motor car or house property of 8,000+ sq ft triggers 10% surcharge automatically.',
        correctApproach: 'Even if total wealth is below Tk 4 Crore, the 10% surcharge applies if you own 2+ private cars or 8,000+ sqft residential space.',
        statutoryRef: 'Section 2(86B) Special Luxury Clause',
        severity: 'high'
      },
      {
        mistake: 'Calculating surcharge on total gross assets without subtracting verifiable institutional liabilities',
        consequence: 'Artificial inflation of net wealth resulting in higher surcharge slab bracket.',
        correctApproach: 'Deduct genuine bank loans, mortgages, and documented liabilities from gross assets to reach true net wealth.',
        statutoryRef: 'Section 167 (Asset Statement IT-10B)',
        severity: 'medium'
      },
      {
        mistake: 'Failing to pay the minimum surcharge floor once wealth exceeds Tk 4 Crore',
        consequence: 'Return deemed defective; Section 166 non-compliance.',
        correctApproach: 'In Dhaka or Chattogram City Corporation, minimum surcharge is Tk 10,000; in other City Corporations it is Tk 7,000; elsewhere Tk 5,000.',
        statutoryRef: 'Finance Act Statutory Minimum Surcharge Rule',
        severity: 'high'
      }
    ],
    verificationChecklist: [
      'Complete Form IT-10B Statement of Assets, Liabilities and Expenses thoroughly.',
      'Attach motor vehicle BRTA registration copies and bank liability statements.',
      'Reconcile net wealth increase with declared net income and personal drawings.'
    ]
  },

  'early-filing-tool': {
    id: 'early-filing-tool',
    name: 'Early Filing Incentive Calculator',
    shortName: 'Early Filing',
    anchorId: 'early-filing-tool',
    statutoryBasis: 'Income Tax Act, 2023 & NBR e-Return Incentives',
    icon: <Calendar className="w-5 h-5 text-amber-400" />,
    themeColor: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      gradient: 'from-slate-900 via-amber-950 to-slate-900'
    },
    keyThresholds: [
      { label: 'Rebate Percentage', value: '5% of payable income tax' },
      { label: 'Filing Window', value: 'July 1 to September 30' },
      { label: 'Statutory Cap', value: 'Maximum BDT 25,000' },
      { label: 'Submission Mode', value: 'NBR Online e-Return Portal' }
    ],
    commonMistakes: [
      {
        mistake: 'Submitting return on October 1st and attempting to claim the 5% incentive',
        consequence: 'Automated rejection of the 5% rebate on the NBR portal, creating a tax shortfall.',
        correctApproach: 'Complete return filing and tax payment before midnight on September 30.',
        statutoryRef: 'NBR Early Filing Gazette',
        severity: 'high'
      },
      {
        mistake: 'Calculating 5% on gross tax without respecting the Tk 25,000 ceiling',
        consequence: 'High net-worth taxpayers claiming Tk 50,000+ will face tax demand notices.',
        correctApproach: 'The incentive is strictly capped at Tk 25,000 regardless of whether 5% of your tax is higher.',
        statutoryRef: 'Finance Act Statutory Cap',
        severity: 'medium'
      },
      {
        mistake: 'Assuming early filing gives permanent immunity from universal audit selection',
        consequence: 'Lack of proper supporting documentation if randomly selected for audit.',
        correctApproach: 'Early filing offers monetary rebate and peace of mind, but all supporting documents must be preserved for 6 years.',
        statutoryRef: 'Section 180 (Audit Provisions)',
        severity: 'info'
      }
    ],
    verificationChecklist: [
      'Ensure e-Return OTP mobile number is active and registered with your NID.',
      'Pay tax dues via online banking / card / MFS before final submission.',
      'Download and securely archive the NBR e-Return Acknowledgement Receipt.'
    ]
  },

  'rjsc-fee-estimator-tool': {
    id: 'rjsc-fee-estimator-tool',
    name: 'RJSC Fee & Registration Estimator',
    shortName: 'RJSC Fees',
    anchorId: 'rjsc-fee-estimator-tool',
    statutoryBasis: 'Companies Act, 1994 & Stamp Act, 1899 (Schedule 1)',
    icon: <FileCheck2 className="w-5 h-5 text-blue-400" />,
    themeColor: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      gradient: 'from-slate-900 via-blue-950 to-slate-900'
    },
    keyThresholds: [
      { label: 'Authorized Capital Base', value: 'Determines statutory stamp duty' },
      { label: 'Certified Copies', value: 'Required for bank account & trade license' },
      { label: 'Stamp Duty Ceiling', value: 'Progressive non-judicial stamp tiers' }
    ],
    commonMistakes: [
      {
        mistake: 'Setting excessive Authorized Capital during initial incorporation',
        consequence: 'Inflated non-refundable government stamp duty and filing fees.',
        correctApproach: 'Begin with an optimal Authorized Capital (e.g. Tk 10 Lakh to Tk 50 Lakh) and increase it later as business needs expand.',
        statutoryRef: 'Companies Act 1994, Section 12',
        severity: 'medium'
      },
      {
        mistake: 'Omitting certified copies of Form XII and MoA/AoA during incorporation',
        consequence: 'Commercial bank refuses corporate account opening, delaying operations.',
        correctApproach: 'Always include certified copy requests for MoA, AoA, and Form XII during online RJSC incorporation payment.',
        statutoryRef: 'Bangladesh Bank AML/KYC Circulars',
        severity: 'high'
      }
    ],
    verificationChecklist: [
      'Verify name clearance validity window (30 days from approval).',
      'Ensure all directors possess active e-TINs verified by NBR.',
      'Prepare digitized MoA and AoA signed by all initial subscribers.'
    ]
  },

  'corporate-tax-tool': {
    id: 'corporate-tax-tool',
    name: 'Corporate Tax Rates & Comparison (FY 2026-27)',
    shortName: 'Corporate Tax',
    anchorId: 'corporate-tax-tool',
    statutoryBasis: 'Income Tax Act, 2023 & Finance Act 2026 5-Year Roadmap',
    icon: <Building2 className="w-5 h-5 text-indigo-400" />,
    themeColor: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      gradient: 'from-slate-900 via-indigo-950 to-slate-900'
    },
    keyThresholds: [
      { label: 'Non-Listed Standard Rate', value: '27.5% (Formal banking compliant)' },
      { label: 'Unbanked Penalty Rate', value: '30.0% (+2.5% surcharge penalty)' },
      { label: 'Listed Company (>10% IPO)', value: '20.0% (Compliant) / 22.5% (Penalized)' },
      { label: 'Other Listed (≤10% IPO)', value: '25.0% (Compliant) / 27.5% (Penalized)' }
    ],
    commonMistakes: [
      {
        mistake: 'Failing to channel all receipts and eligible payments through formal banking',
        consequence: 'Triggering an automatic 2.5% penalty tax rate across the company total taxable profit (e.g. +Tk. 25 Lakh on Tk. 10 Crore).',
        correctApproach: 'Conduct all business transactions, supplier payments, and customer receipts via crossed cheque, bank transfer, BEFTN, RTGS, or approved digital merchant gateways.',
        statutoryRef: 'Finance Act 2026 Banking Channel Condition',
        severity: 'high'
      },
      {
        mistake: 'Assuming a company listed on an OTC or alternative platform qualifies for 20% rate without >10% IPO',
        consequence: 'Underpaying corporate taxes and facing re-assessment notices with Section 193 interest.',
        correctApproach: 'Verify that the company has issued more than 10% of total paid-up capital through IPO. If 10% or less, the applicable tax rate is 25.0%.',
        statutoryRef: 'Income Tax Act 2023, Second Schedule',
        severity: 'high'
      },
      {
        mistake: 'Paying staff salaries or supplier bills in cash exceeding Section 55 statutory limits',
        consequence: 'Cash expenditure is disallowed and added back to taxable profit, while also triggering the 2.5% unbanked penalty.',
        correctApproach: 'Disburse employee salaries above Tk. 20,000 and supplier bills strictly via bank transfers to preserve deductible expense status.',
        statutoryRef: 'Section 55(h) Disallowed Expenses',
        severity: 'high'
      },
      {
        mistake: 'Not taking advantage of Advance Income Tax (AIT) and TDS credit reconciliation',
        consequence: 'Overpaying final corporate tax liability without adjusting source deductions.',
        correctApproach: 'Reconcile all AIT certificates, bank withholding statements, and client TDS Challans against gross tax payable.',
        statutoryRef: 'Section 163 & Section 173',
        severity: 'medium'
      }
    ],
    verificationChecklist: [
      'Obtain bank transaction certificates verifying all gross receipts passed through official banking channels.',
      'Check BSEC and stock exchange shareholding documentation to confirm IPO capital dilution percentage (>10% vs ≤10%).',
      'Reconcile VAT returns (Mushak 9.1) with corporate income tax financial statements.',
      'Ensure all salaries above statutory threshold were deposited directly to employee bank accounts.'
    ]
  }
};

interface QuickComplianceTipsSidebarProps {
  activeToolId?: string;
  onToolSelect?: (toolId: string) => void;
  className?: string;
}

export function QuickComplianceTipsSidebar({
  activeToolId,
  onToolSelect,
  className = ''
}: QuickComplianceTipsSidebarProps) {
  // Sidebar open/collapse state (saved in localStorage)
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('compliance_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('compliance_sidebar_pinned');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Track currently active tool: either prop or detected on scroll
  const [currentToolId, setCurrentToolId] = useState<string>(activeToolId || 'agri-tax-tool');
  const [copiedTipIndex, setCopiedTipIndex] = useState<number | null>(null);

  // Sync if prop changes
  useEffect(() => {
    if (activeToolId && COMPLIANCE_GUIDES[activeToolId]) {
      setCurrentToolId(activeToolId);
    }
  }, [activeToolId]);

  // Listen for global custom events to open/toggle sidebar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };
    const handleOpen = (e: Event) => {
      setIsOpen(true);
      const customEvent = e as CustomEvent<{ toolId?: string }>;
      if (customEvent.detail?.toolId && COMPLIANCE_GUIDES[customEvent.detail.toolId]) {
        setCurrentToolId(customEvent.detail.toolId);
      }
    };

    window.addEventListener('toggle-compliance-tips', handleToggle);
    window.addEventListener('open-compliance-tips', handleOpen);
    return () => {
      window.removeEventListener('toggle-compliance-tips', handleToggle);
      window.removeEventListener('open-compliance-tips', handleOpen);
    };
  }, []);

  // Save open state to localStorage
  const handleToggleOpen = () => {
    const nextVal = !isOpen;
    setIsOpen(nextVal);
    try {
      localStorage.setItem('compliance_sidebar_open', JSON.stringify(nextVal));
    } catch {
      // ignore
    }
  };

  const handleTogglePin = () => {
    const nextVal = !isPinned;
    setIsPinned(nextVal);
    try {
      localStorage.setItem('compliance_sidebar_pinned', JSON.stringify(nextVal));
    } catch {
      // ignore
    }
  };

  // Scroll detection via IntersectionObserver to update active tool as user scrolls
  useEffect(() => {
    const toolIds = Object.keys(COMPLIANCE_GUIDES);
    const observerCallback: IntersectionObserverCallback = (entries) => {
      // Find the entry with the highest intersection ratio
      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort by how much is visible
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topElement = visibleEntries[0].target;
        if (topElement.id && COMPLIANCE_GUIDES[topElement.id]) {
          setCurrentToolId(topElement.id);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-10% 0px -40% 0px',
      threshold: [0.1, 0.3, 0.6]
    });

    toolIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const activeGuide = useMemo(() => {
    return COMPLIANCE_GUIDES[currentToolId] || COMPLIANCE_GUIDES['agri-tax-tool'];
  }, [currentToolId]);

  const scrollToActiveTool = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onToolSelect?.(anchorId);
  };

  const handleCopyTipsSummary = () => {
    const mistakesText = activeGuide.commonMistakes.map((m, i) => 
      `${i + 1}. Common Mistake: ${m.mistake}\n   Correct Approach: ${m.correctApproach} (Ref: ${m.statutoryRef})`
    ).join('\n\n');

    const fullText = `
=== Quick Compliance Tips: ${activeGuide.name} ===
Statutory Basis: ${activeGuide.statutoryBasis}

Key Thresholds:
${activeGuide.keyThresholds.map(t => `- ${t.label}: ${t.value}`).join('\n')}

Common Calculation Mistakes to Avoid:
${mistakesText}

Pre-Filing Verification Checklist:
${activeGuide.verificationChecklist.map(c => `[ ] ${c}`).join('\n')}

Issued by Accounticca × E-Lawyers Tax & Regulatory Compliance Division.
`.trim();

    navigator.clipboard.writeText(fullText);
    setCopiedTipIndex(999);
    setTimeout(() => setCopiedTipIndex(null), 2000);
  };

  return (
    <>
      {/* 1. Floating Collapsed Capsule Button (When Sidebar is Closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            type="button"
            onClick={handleToggleOpen}
            className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-2xl border border-indigo-500/40 hover:border-indigo-400 hover:scale-105 transition-all duration-200 cursor-pointer"
            title="Open Quick Compliance Tips"
          >
            <div className="relative p-2 bg-amber-400/20 rounded-xl text-amber-300 border border-amber-400/30 group-hover:rotate-12 transition-transform">
              <Lightbulb className="w-5 h-5 text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Compliance Advice
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span className="text-[10px] text-slate-300">Active</span>
              </div>
              <div className="text-xs font-black text-white flex items-center gap-1">
                <span>{activeGuide.shortName} Tips</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 2. Expanded Sidebar / Flyout Panel */}
      {isOpen && (
        <aside
          role="complementary"
          aria-label="Quick Compliance Tips"
          className={`fixed top-20 right-4 bottom-6 z-40 w-full sm:w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-right-8 ${className}`}
        >
          {/* Header Bar */}
          <div className={`p-5 bg-gradient-to-r ${activeGuide.themeColor.gradient} text-white shrink-0 relative overflow-hidden`}>
            {/* Subtle glow background */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-xs text-white">
                  <Lightbulb className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                      Context-Aware
                    </span>
                    <span className="text-[10px] font-semibold text-slate-300">
                      Live Advisor
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                    Quick Compliance Tips
                  </h3>
                </div>
              </div>

              {/* Action Controls: Pin & Close */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className={`p-1.5 rounded-xl text-xs transition-colors ${
                    isPinned 
                      ? 'bg-amber-400 text-slate-900 font-bold' 
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={isPinned ? 'Sidebar pinned to view' : 'Pin sidebar'}
                >
                  {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleOpen}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Collapse sidebar"
                  aria-label="Close compliance sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Calculator Selector Pill Strip */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Select Calculator:</span>
                <span className="text-[10px] text-amber-300 font-bold">Auto-syncs on scroll</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/20">
                {Object.values(COMPLIANCE_GUIDES).map((guide) => {
                  const isActive = guide.id === currentToolId;
                  return (
                    <button
                      key={guide.id}
                      type="button"
                      onClick={() => {
                        setCurrentToolId(guide.id);
                        scrollToActiveTool(guide.anchorId);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                        isActive 
                          ? 'bg-white text-slate-900 shadow-md ring-2 ring-amber-400' 
                          : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                      }`}
                    >
                      <span>{guide.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Calculator Banner & Jump Action */}
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="p-1 rounded-lg bg-white border border-slate-200 shrink-0">
                {activeGuide.icon}
              </div>
              <div className="truncate">
                <div className="text-xs font-black text-slate-900 truncate">
                  {activeGuide.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {activeGuide.statutoryBasis}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollToActiveTool(activeGuide.anchorId)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold border border-slate-200 transition-colors shadow-2xs shrink-0"
              title="Scroll directly to this tool"
            >
              <span>Jump</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-800">
            
            {/* Key Statutory Thresholds Quick Reference */}
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Statutory Benchmarks (AY 2026–27)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeGuide.keyThresholds.map((k, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-500 font-semibold leading-tight">
                      {k.label}
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">
                      {k.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Mistakes to Avoid (Core Feature) */}
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-rose-700 mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Common Calculation Mistakes to Avoid</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                  {activeGuide.commonMistakes.length} High-Risk Pitfalls
                </span>
              </div>

              <div className="space-y-3">
                {activeGuide.commonMistakes.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs space-y-2 transition-all"
                  >
                    {/* Mistake Header */}
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          {item.mistake}
                        </div>
                        <div className="text-[11px] text-rose-700/90 font-medium mt-0.5">
                          ⚠️ {item.consequence}
                        </div>
                      </div>
                    </div>

                    {/* Correct Statutory Approach */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Correct Compliance Method
                        </span>
                        <span className="text-[10px] font-normal text-emerald-700">
                          {item.statutoryRef}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                        {item.correctApproach}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-Filing Verification Checklist */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Pre-Submission Checklist</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Prior to e-Return</span>
              </div>

              <ul className="space-y-1.5">
                {activeGuide.verificationChecklist.map((checkItem, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{checkItem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Statutory Advisory Disclaimer */}
            <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-500 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Based on Bangladesh Income Tax Act 2023 & NBR Finance Act 2026 statutory circulars. For complex cross-border or restructuring cases, consult our legal team.
              </span>
            </div>

          </div>

          {/* Footer Bar: Copy Tips Summary & Jump */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyTipsSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
            >
              {copiedTipIndex === 999 ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Tips</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => scrollToActiveTool(activeGuide.anchorId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Go to {activeGuide.shortName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

export default QuickComplianceTipsSidebar;
