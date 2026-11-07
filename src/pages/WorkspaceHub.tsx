import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Layers, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Wrench, 
  ExternalLink,
  Plus,
  Calculator,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles,
  LogOut,
  GitBranch,
  Mail
} from 'lucide-react';
import { ToolSigningsWorkspaceView } from '../components/workspace/ToolSigningsWorkspaceView';
import { GoogleWorkspaceIntegrationsPanel } from '../components/workspace/GoogleWorkspaceIntegrationsPanel';
import { GitHubSyncPanel } from '../components/workspace/GitHubSyncPanel';
import { CalculationEmailHistoryTab } from '../components/admin/CalculationEmailHistoryTab';
import { useShopAuth } from '../contexts/ShopAuthContext';

interface WorkspaceDraft {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  templateContent: string;
}

const INITIAL_DRAFTS: WorkspaceDraft[] = [
  {
    id: 'salary-tds-certificate-sec-86',
    title: 'Salary TDS Certificate & Payroll Worksheet (Sec 86)',
    subtitle: 'Income Tax Act 2023 · ধারা ৮৬ (AY 2026–2027)',
    category: 'Payroll & Tax',
    description: 'Employer monthly & annual Salary Tax Deducted at Source (TDS) computation worksheet with 1/3 or Tk. 5,00,000 exemption and Section 78 rebate verification.',
    templateContent: `SALARY TAX DEDUCTION AT SOURCE (TDS) CERTIFICATE (SECTION 86, INCOME TAX ACT 2023)
Assessment Year: 2026–2027 | Income Year: 2025–2026

1. Employee Name & Designation: [Employee Name], [Designation]
2. Taxpayer Identification Number (TIN): [12-Digit e-TIN]
3. Annual Gross Salary Receipts (12 Months + Festival Bonuses): BDT [12,00,000]
4. Less: Allowable 6th Schedule Exemption — min(1/3 of Gross Salary, BDT 5,00,000): BDT [4,00,000]
5. Annual Taxable Salary Income: BDT [8,00,000]
6. Gross Tax on AY 2026–27 Slabs (First 4L @ 0%, Next 3L @ 10%, Next 4L @ 15%): BDT [45,000]
7. Less: Allowable Investment Tax Rebate u/s 78 — min(3% Income, 10% Allowable Inv., Tk. 7,50,000): BDT [20,000]
8. Net Annual Tax Payable (Subject to Minimum Tax Floor): BDT [25,000]
9. Monthly Average Salary TDS Withheld (Annual Net Tax ÷ 12): BDT [2,083.33]
10. Treasury / A-Challan Deposit Reference: [Challan No. & Date]`
  },
  {
    id: 'employee-investment-declaration-sec-78',
    title: 'Employee Investment & Donation Rebate Declaration (Sec 78 & SRO 213)',
    subtitle: 'Part 3, 6th Schedule · Income Tax Act 2023',
    category: 'Payroll & Tax',
    description: 'Standard HR/Payroll declaration form for employees claiming monthly TDS reduction against DPS (cap Tk. 1.2L), Sanchayapatra (cap Tk. 5L), RPF, and SRO 213/2026 approved charities.',
    templateContent: `EMPLOYEE INVESTMENT & TAX REBATE DECLARATION (SECTION 78 & PART 3, 6TH SCHEDULE)
To: Head of HR, Payroll & Accounts
Assessment Year: 2026–2027

I hereby declare the following qualifying investments and approved donations for monthly Salary TDS adjustment under Section 86:
1. Deposit Pension Scheme (DPS) [Actual / Max Allowable Tk. 1,20,000]: BDT [1,20,000]
2. Sanchayapatra / Govt. Securities [Actual / Max Allowable Tk. 5,00,000]: BDT [5,00,000]
3. Recognized Provident Fund (RPF — Employee + Employer Contribution): BDT [1,68,000]
4. Approved Mutual Funds / ETFs / Unit Certificates: BDT [3,00,000]
5. Donations to 11 Approved Charities under SRO No. 213-Ain/Aykor-4/2026: BDT [0]
Total Allowable Investment (অনুমোদনযোগ্য বিনিয়োগ): BDT [10,88,000]
Estimated Limit B (10% of Allowable Investment): BDT [1,08,800]`
  },
  {
    id: 'moa-aoa-rjsc',
    title: 'Memorandum & Articles (MoA/AoA)',
    subtitle: 'RJSC Private Ltd · Companies Act 1994',
    category: 'Corporate',
    description: 'Standard object clauses, authorized capital schedule, and board governance articles compliant with Companies Act 1994.',
    templateContent: `THE COMPANIES ACT, 1994 (ACT XVIII OF 1994)
COMPANY LIMITED BY SHARES
MEMORANDUM OF ASSOCIATION OF [COMPANY NAME] LIMITED

I. The name of the Company is "[COMPANY NAME] LIMITED".
II. The Registered Office of the Company shall be situated in Bangladesh.
III. The objects for which the Company is established are all or any of the following...
IV. The liability of the members is limited.
V. The Authorized Share Capital of the Company is Tk. [1,00,00,000] divided into [1,00,000] Ordinary Shares of Tk. [100] each.`
  },
  {
    id: 'commercial-lease-agreement',
    title: 'Commercial Lease Agreement & TDS Clause',
    subtitle: 'Transfer of Property Act & Sec 109 ITA 2023',
    category: 'Real Estate & Tax',
    description: 'Standard commercial tenancy terms, security deposit, banking channel rent payment, and statutory source tax (TDS) & VAT clauses.',
    templateContent: `COMMERCIAL LEASE AGREEMENT
This Deed of Commercial Lease is made on this [Date] between [Landlord Name] (Lessor) and [Company Name] (Lessee).

1. Demised Premises: [Full Address & Floor Area in Sq. Ft.]
2. Monthly Rent & Banking Settlement: Monthly rent of BDT [Amount] shall be paid strictly via crossed cheque / banking transfer to ensure admissibility under Section 55 of the Income Tax Act 2023.
3. Tax Deducted at Source (TDS) & VAT: The Lessee shall deduct applicable Commercial Rent TDS under Section 109 of the Income Tax Act 2023 and deposit the same via A-Challan.`
  },
  {
    id: 'employment-contract-labour-act',
    title: 'Executive Employment Contract',
    subtitle: 'Bangladesh Labour Act 2006 & Payroll TDS',
    category: 'Employment',
    description: 'Probation, gross salary breakdown (Basic, House Rent, Medical, Conveyance), Festival Bonus, RPF, Gratuity, and Section 86 Salary TDS provisions.',
    templateContent: `EXECUTIVE EMPLOYMENT AGREEMENT
Between [Employer Company Name] and [Employee Name].

1. Remuneration Package (Monthly Gross Salary: BDT [1,00,000]):
   - Basic Salary: BDT [60,000]
   - House Rent Allowance: BDT [30,000]
   - Medical Allowance: BDT [7,000]
   - Conveyance Allowance: BDT [3,000]
2. Festival Bonus: Two (2) festival bonuses per year, each equivalent to [50% / 100%] of Basic Salary.
3. Tax Deducted at Source (TDS): Income tax shall be deducted monthly at the average applicable rate under Section 86 of the Income Tax Act, 2023.`
  }
];

export const WorkspaceHub: React.FC = () => {
  const { adminUser, logout } = useShopAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'integrations';
  const [drafts, setDrafts] = useState<WorkspaceDraft[]>(INITIAL_DRAFTS);
  const [selectedDraft, setSelectedDraft] = useState<WorkspaceDraft | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewDraftForm, setShowNewDraftForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const handleCopyDraft = (draft: WorkspaceDraft) => {
    navigator.clipboard?.writeText(draft.templateContent);
    setCopiedId(draft.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: WorkspaceDraft = {
      id: 'draft-' + Date.now(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Custom Workspace Precedent',
      category: 'Custom',
      description: newDescription.trim() || 'Custom compliance draft saved in workspace session.',
      templateContent: newContent.trim() || newTitle.trim()
    };
    setDrafts(prev => [created, ...prev]);
    setNewTitle('');
    setNewSubtitle('');
    setNewDescription('');
    setNewContent('');
    setShowNewDraftForm(false);
    setSelectedDraft(created);
  };

  const handleLockWorkspace = async () => {
    await logout();
    navigate('/admin/login?redirect=%2Fworkspace', { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Workspace Header */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Accounticca × E-Lawyers Workspace Hub · Admin: {adminUser?.email || 'hmekram@gmail.com'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Google Workspace Integrations &amp; Compliance Hub
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Connected Google Workspace apps (Drive, Sheets, Gmail, Calendar, Docs, Slides, Tasks &amp; Chat), live tool signings ledger, AY 2026–27 Salary TDS (Section 86) matrix, and legal precedent vault.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/tax-calculator"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all"
            >
              <Calculator className="w-4 h-4" />
              Tax &amp; Salary TDS Calculator
            </Link>
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-xs transition-all"
            >
              <Wrench className="w-4 h-4" />
              All Compliance Tools
            </Link>
            <button
              type="button"
              onClick={handleLockWorkspace}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold text-xs transition-all cursor-pointer"
              title="Sign out of /workspace admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto pb-1" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('integrations')}
            className={`py-3 px-3 sm:px-1 inline-flex items-center gap-2 border-b-2 font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'integrations'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Google Workspace Integrations
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              8 Enabled
            </span>
          </button>

          <button
            onClick={() => handleTabChange('tool-signings')}
            className={`py-3 px-3 sm:px-1 inline-flex items-center gap-2 border-b-2 font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'tool-signings'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            Tool Signings Log
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Live
            </span>
          </button>

          <button
            onClick={() => handleTabChange('tax-tds-hub')}
            className={`py-3 px-3 sm:px-1 inline-flex items-center gap-2 border-b-2 font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'tax-tds-hub'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            AY 2026–27 Tax &amp; Salary TDS Hub
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              Updated
            </span>
          </button>

          <button
            onClick={() => handleTabChange('compliance-calendar')}
            className={`py-3 px-3 sm:px-1 inline-flex items-center gap-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'compliance-calendar'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Statutory Due Dates (2026–27)
          </button>

          <button
            onClick={() => handleTabChange('documents')}
            className={`py-3 px-3 sm:px-1 inline-flex items-center gap-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'documents'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Legal &amp; Payroll Draft Vault
          </button>

          <button
            onClick={() => handleTabChange('github-sync')}
            className={`py-3 px-3 sm:px-1 inline-flex items-center gap-2 border-b-2 font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'github-sync'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <GitBranch className="w-4 h-4 text-slate-900" />
            GitHub Sync Console
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              Synced
            </span>
          </button>

          <button
            onClick={() => handleTabChange('email-history')}
            className={`py-3 px-3 sm:px-1 inline-flex items-center gap-2 border-b-2 font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'email-history'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-600" />
            Calculation Reports &amp; Google Sheet
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              Firestore
            </span>
          </button>
        </nav>
      </div>

      {/* Tab 0: Google Workspace Integrations (8 Enabled) */}
      {currentTab === 'integrations' && (
        <GoogleWorkspaceIntegrationsPanel />
      )}

      {/* Tab: Calculation Email Reports & Google Sheets Sync */}
      {currentTab === 'email-history' && (
        <div className="space-y-6 pt-2">
          <CalculationEmailHistoryTab />
        </div>
      )}

      {/* Tab: GitHub Sync Console */}
      {currentTab === 'github-sync' && (
        <GitHubSyncPanel />
      )}

      {/* Tab 1: Tool Signings Log */}
      {currentTab === 'tool-signings' && (
        <ToolSigningsWorkspaceView />
      )}

      {/* Tab 2: AY 2026–27 Tax, Rebate & Salary TDS Reference Hub */}
      {currentTab === 'tax-tds-hub' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Link
              to="/article/salary-tds-bangladesh-complete-guide-2026-2027"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  ধারা ৮৬ · Income Tax Act 2023
                </span>
                <h3 className="text-base font-black text-slate-900">
                  বেতন থেকে উৎসে কর কর্তন ২০২৬–২৭ (Salary TDS Guide)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  মাসিক TDS হিসাবের ৬টি ধাপ, করমুক্ত বেতন (১/৩ বা সর্বোচ্চ ৫,০০,০০০ টাকা), বিনিয়োগ রেয়াত (৩% আয় / ১০% বিনিয়োগ / ৭.৫ লক্ষ টাকা) ও বাস্তব উদাহরণ।
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-700">
                Read Complete Guide <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/article/bangladesh-income-tax-slabs-thresholds-2026-2027"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-xs transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Assessment Year 2026–2027
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Bangladesh Income Tax 2026–27: Thresholds &amp; Slabs (আয়কর ২০২৬–২৭)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Updated 0% tax-free thresholds (Tk. 4,00,000 general; Tk. 4,50,000 women/65+; Tk. 5,25,000 disabled/third-gender; Tk. 5,50,000 freedom fighters) and progressive rates (0%–30%).
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">
                Read Complete Guide <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/article/sro-213-2026-approved-11-institutions-donation-tax-rebate"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-400 shadow-xs transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  SRO No. 213-Ain/Aykor-4/2026
                </span>
                <h3 className="text-base font-black text-slate-900">
                  ১১ প্রতিষ্ঠানে দানে আয়কর রেয়াত | Donation Tax Rebate (2026–2030)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  11 approved public-welfare &amp; healthcare institutions recognized under Section 76(1) &amp; Paragraph 2(13), Part 3 of the 6th Schedule (Effective 1 July 2026–30 June 2030).
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-purple-700">
                Read Complete Guide <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  AY 2026–2027 Statutory Quick Reference Matrix (Income Tax, Salary TDS &amp; Rebate)
                </h3>
                <p className="text-xs text-slate-600">
                  Consolidated desktop reference for HR, Payroll, Accounts, and Tax Practitioners.
                </p>
              </div>
              <Link
                to="/tax-calculator"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
              >
                <Calculator className="w-3.5 h-3.5" />
                Open Interactive Calculator
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase tracking-wider">
                  1. Initial Tax-Free Thresholds (0% Rate) &amp; Progressive Slabs
                </h4>
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-black font-black">
                      <th className="py-2 px-3 border-r border-slate-200">Category / Slab</th>
                      <th className="py-2 px-3 text-right">Threshold / Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">General Individual Taxpayers</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-black">First Tk. 4,00,000 (0%)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">Female &amp; Senior Citizens (65+)</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-black">First Tk. 4,50,000 (0%)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">Third Gender &amp; Disabled Taxpayers</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-black">First Tk. 5,25,000 (0%)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">Freedom Fighters &amp; July 2024 Injured</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-black">First Tk. 5,50,000 (0%)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">Next Tk. 3L / 4L / 5L / 20L / Balance</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-blue-900">10% / 15% / 20% / 25% / 30%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 uppercase tracking-wider">
                  2. Salary TDS (ধারা ৮৬) &amp; 3-Limit Rebate Formula
                </h4>
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-black font-black">
                      <th className="py-2 px-3 border-r border-slate-200">Statutory Parameter</th>
                      <th className="py-2 px-3 text-right">Formula / Ceiling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">Private Sector Salary Exemption</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-black">min(1/3 of Gross Salary, Tk. 5,00,000)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">Rebate Limit A / Limit B / Limit C</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-900">min(3% Income, 10% Inv., Tk. 7,50,000)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">DPS / Sanchayapatra Sector Caps</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-black">Tk. 1,20,000 / Tk. 5,00,000</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">Monthly Salary TDS (Section 86)</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-blue-900">Estimated Annual Net Tax ÷ 12</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 border-r border-slate-200">Worked Ex: Tk. 1,00,000/mo Salary</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-black">Tk. 3,750/mo (Tk. 2,083.33 w/ 2L Inv.)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Statutory Due Dates (2026–2027) */}
      {currentTab === 'compliance-calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Bangladesh Statutory Filing Deadlines (AY 2026–2027)</h3>
            <p className="text-sm text-slate-600 mt-1">National Board of Revenue (NBR), Payroll TDS (Section 86), VAT (Mushak 9.1), and RJSC compliance schedule.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-black">
                  <th className="py-3 px-4 text-black font-extrabold">Statutory Form / Filing</th>
                  <th className="py-3 px-4 text-black font-extrabold">Governing Law</th>
                  <th className="py-3 px-4 text-black font-extrabold">Standard Due Date</th>
                  <th className="py-3 px-4 text-black font-extrabold">Relevant Tool / Guide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-black">Monthly Salary TDS Withholding &amp; Treasury Deposit</td>
                  <td className="py-3 px-4 text-black">Income Tax Act 2023, Section 86 &amp; WHT Rules</td>
                  <td className="py-3 px-4 text-black font-mono font-bold">Monthly upon salary disbursement</td>
                  <td className="py-3 px-4 text-black">
                    <Link to="/article/salary-tds-bangladesh-complete-guide-2026-2027" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                      Salary TDS Guide <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-black">Individual Income Tax Return (IT-11GA)</td>
                  <td className="py-3 px-4 text-black">Income Tax Act 2023, Section 166</td>
                  <td className="py-3 px-4 text-black font-mono font-bold">30th November (Tax Day)</td>
                  <td className="py-3 px-4 text-black">
                    <Link to="/tax-calculator" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                      Tax Calculator <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-black">SRO 213/2026 Approved Charity Donation Rebate Window</td>
                  <td className="py-3 px-4 text-black">Sec 76(1), 78 &amp; Para 2(13) Part 3, 6th Schedule</td>
                  <td className="py-3 px-4 text-black font-mono font-bold">1 July 2026 – 30 June 2030</td>
                  <td className="py-3 px-4 text-black">
                    <Link to="/article/sro-213-2026-approved-11-institutions-donation-tax-rebate" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                      SRO 213 Rebate Guide <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-black">Monthly VAT Return (Mushak 9.1)</td>
                  <td className="py-3 px-4 text-black">Value Added Tax &amp; Supplementary Duty Act 2012</td>
                  <td className="py-3 px-4 text-black font-mono font-bold">15th of each succeeding month</td>
                  <td className="py-3 px-4 text-black">
                    <Link to="/tools/vat-apportionment-calculator" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                      VAT Calculator <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-black">Company Annual Return (Schedule X)</td>
                  <td className="py-3 px-4 text-black">Companies Act 1994, Section 36</td>
                  <td className="py-3 px-4 text-black font-mono font-bold">Within 21 days of AGM</td>
                  <td className="py-3 px-4 text-black">
                    <Link to="/tools/rjsc-fee-calculator" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                      RJSC Fee Calculator <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-black">Withholding Tax Return (WHT Statement)</td>
                  <td className="py-3 px-4 text-black">Income Tax Act 2023, Section 177</td>
                  <td className="py-3 px-4 text-black font-mono font-bold">Monthly (15th / 25th as prescribed)</td>
                  <td className="py-3 px-4 text-black">
                    <Link to="/tds-guide" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                      Withholding Tax Matrix <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Legal & Payroll Draft Vault */}
      {currentTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Legal, Payroll &amp; Corporate Precedent Vault</h3>
              <p className="text-sm text-slate-600 mt-1">Ready-to-use Bangladeshi Salary TDS certificates (Sec 86), Section 78 investment declarations, MoA/AoA, and contracts.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewDraftForm(prev => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showNewDraftForm ? 'Cancel New Draft' : 'New Workspace Draft'}
            </button>
          </div>

          {showNewDraftForm && (
            <form onSubmit={handleCreateDraft} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Create Custom Workspace Draft</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Draft Title (e.g., Board Resolution for Tax Audit)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Statutory Reference (e.g., Companies Act 1994 / ITA 2023)"
                  value={newSubtitle}
                  onChange={e => setNewSubtitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
                />
              </div>
              <input
                type="text"
                placeholder="Brief summary description..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
              />
              <textarea
                rows={4}
                placeholder="Paste or write template clauses here..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save to Workspace Vault
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drafts.map(draft => (
              <div
                key={draft.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{draft.title}</h4>
                      <span className="text-xs text-slate-500">{draft.subtitle}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{draft.description}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setSelectedDraft(draft)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    Preview Template
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyDraft(draft)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-[11px] font-bold cursor-pointer"
                  >
                    {copiedId === draft.id ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === draft.id ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedDraft && (
            <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-700 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-3">
                <div>
                  <span className="text-[11px] font-mono text-cyan-300">{selectedDraft.subtitle}</span>
                  <h4 className="text-base font-black text-white">{selectedDraft.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyDraft(selectedDraft)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {copiedId === selectedDraft.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === selectedDraft.id ? 'Copied to Clipboard' : 'Copy Template'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDraft(null)}
                    aria-label="Close template preview"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
                {selectedDraft.templateContent}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
