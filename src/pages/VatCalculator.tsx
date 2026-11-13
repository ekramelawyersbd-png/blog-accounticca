import React, { useState, useMemo } from 'react';
import { ToolAccessGuard } from '../components/auth/ToolAccessGuard';
import { Receipt, Coins, RefreshCw, FileText } from 'lucide-react';
import { CalculationEmailActionBarButton } from '../components/tools/CalculationEmailActionBarButton';
import { ToolSEO } from '../components/SEO';

export const VatCalculator: React.FC = () => {
  const [basePrice, setBasePrice] = useState<number>(100000);
  const [vatRate, setVatRate] = useState<number>(15);
  const [isPriceInclusive, setIsPriceInclusive] = useState<boolean>(false);
  const [advanceTaxRate, setAdvanceTaxRate] = useState<number>(0); // e.g. 5% AT on import
  const [vdsApplicable, setVdsApplicable] = useState<boolean>(true); // VAT Deduction at Source

  // Calculation
  let netPrice = basePrice;
  let vatAmount = 0;
  let totalPayable = 0;

  if (isPriceInclusive) {
    netPrice = basePrice / (1 + vatRate / 100);
    vatAmount = basePrice - netPrice;
    totalPayable = basePrice;
  } else {
    netPrice = basePrice;
    vatAmount = basePrice * (vatRate / 100);
    totalPayable = basePrice + vatAmount;
  }

  const advanceTaxAmount = netPrice * (advanceTaxRate / 100);
  const vdsAmount = vdsApplicable ? vatAmount : 0;
  const netSupplierReceivable = totalPayable - (vdsApplicable ? vdsAmount : 0);

  const calculationSnapshot = useMemo(() => ({
    referenceId: `VAT-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }),
    toolId: 'vat-calculator',
    toolName: 'Bangladesh VAT & Mushak 6.3 Tax Engine',
    toolCategory: 'VAT & Customs',
    toolPath: '/tools/vat',
    statutoryBasis: 'Value Added Tax & Supplementary Duty Act 2012',
    summaryMetrics: [
      { label: 'Assessable Net Value', value: `৳${Math.round(netPrice).toLocaleString()}` },
      { label: `VAT Amount (${vatRate}%)`, value: `৳${Math.round(vatAmount).toLocaleString()}` },
      { label: 'Gross Invoice Total', value: `৳${Math.round(totalPayable).toLocaleString()}` },
      { label: 'Net Supplier Receivable', value: `৳${Math.round(netSupplierReceivable).toLocaleString()}` },
    ],
    inputs: [
      { label: 'Transaction Value', value: `৳${basePrice.toLocaleString()}` },
      { label: 'Assessment Mode', value: isPriceInclusive ? 'Inclusive of VAT' : 'Exclusive of VAT' },
      { label: 'Applicable VAT Rate', value: `${vatRate}%` },
      { label: 'VAT Deducted at Source (VDS)', value: vdsApplicable ? 'Yes (Buyer Withholding)' : 'No' },
    ],
    tables: [
      {
        title: 'Mushak 6.3 Invoice Statement Breakdown',
        headers: ['Item / Particular', 'Statutory Rate / Rule', 'Amount (BDT)'],
        rows: [
          { cells: ['Assessable Net Base Value', isPriceInclusive ? 'Back-calculated' : 'Base Input', `৳${Math.round(netPrice).toLocaleString()}`] },
          { cells: ['Value Added Tax (VAT)', `${vatRate}% under VAT Act 2012`, `৳${Math.round(vatAmount).toLocaleString()}`] },
          { cells: ['Total Invoice Price (Buyer Gross)', 'Net Base + VAT', `৳${Math.round(totalPayable).toLocaleString()}`] },
          { cells: ['VDS Deducted by Buyer', vdsApplicable ? 'Withheld at Source' : 'N/A', `৳${Math.round(vdsAmount).toLocaleString()}`] },
          { cells: ['Net Payment to Supplier Account', 'Gross Payable - VDS', `৳${Math.round(netSupplierReceivable).toLocaleString()}`] },
        ],
      },
    ],
    legalNotes: [
      'Value Added Tax and Supplementary Duty Act 2012 (Act No. 47 of 2012).',
      'Value Added Tax and Supplementary Duty Rules 2016.',
      'SRO 186-AIN/2019/43-Mushak regarding VAT Deduction at Source (VDS) withholding entity obligations.',
      'Mushak 6.3 tax invoice must be issued at or before the time of supply pursuant to Rule 40.',
    ],
  }), [basePrice, vatRate, isPriceInclusive, vdsApplicable, netPrice, vatAmount, totalPayable, vdsAmount, netSupplierReceivable]);

  return (
    <>
      <ToolSEO
        toolId="vat-calculator"
        title="Bangladesh VAT & Mushak 6.3 Calculator"
        canonicalUrl="/tools/vat"
        category="FinanceApplication"
        statutoryBasis="Value Added Tax & Supplementary Duty Act 2012"
      />
      <ToolAccessGuard
        toolId="vat-calculator"
        toolName="VAT &amp; Mushak 6.3 Calculator"
        toolCategory="VAT &amp; Customs"
        toolPath="/tools/vat"
      >
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
              Value Added Tax &amp; SD Act 2012
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Bangladesh VAT &amp; Mushak 6.3 Tax Engine
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Supports standard (15%), reduced (10%, 7.5%, 5%), and specific tariff rates with VDS withholding schedules.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setBasePrice(100000)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
            <CalculationEmailActionBarButton
              options={{
                toolId: 'vat-calculator',
                toolName: 'Bangladesh VAT & Mushak 6.3 Tax Engine',
                toolCategory: 'VAT & Customs',
                toolPath: '/tools/vat',
                statutoryBasis: 'Value Added Tax & Supplementary Duty Act 2012',
                customSnapshot: calculationSnapshot,
              }}
              label="Send Calculation Report"
              variant="primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Transaction Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction Value (BDT)
              </label>
              <input
                type="number"
                value={basePrice || ''}
                onChange={e => setBasePrice(Number(e.target.value) || 0)}
                aria-label="Transaction Value BDT"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-black font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Value Assessment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPriceInclusive(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    !isPriceInclusive ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Exclusive of VAT
                </button>
                <button
                  type="button"
                  onClick={() => setIsPriceInclusive(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    isPriceInclusive ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Inclusive of VAT
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Applicable VAT Rate
              </label>
              <select
                value={vatRate}
                onChange={e => setVatRate(Number(e.target.value))}
                aria-label="Applicable VAT Rate"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                <option value={15}>15% - Standard Rate (With input tax credit)</option>
                <option value={10}>10% - Reduced Rate (Specified services)</option>
                <option value={7.5}>7.5% - Construction / Procurement Providers</option>
                <option value={5}>5% - Wholesale / Retail / Essential Commodities</option>
                <option value={0}>0% - Exempt / Export</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={vdsApplicable}
                  onChange={e => setVdsApplicable(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                Deduct VAT at Source (VDS - Withholding by Buyer)
              </label>
            </div>
          </div>

          {/* At-a-glance Table with Black Text */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200">
              <h3 className="text-sm font-black text-black">Mushak 6.3 Statutory Invoice Statement</h3>
              <p className="text-xs text-slate-600">All amounts in Bangladeshi Taka (BDT).</p>
            </div>

            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-300 text-xs font-black uppercase text-black">
                  <th className="py-3 px-4 text-black font-black">Invoice Line Item</th>
                  <th className="py-3 px-4 text-black font-black text-right">Calculation Basis</th>
                  <th className="py-3 px-4 text-black font-black text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-black">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Net Assessable Value</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">100%</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(netPrice).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Output VAT Payable</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">{vatRate}%</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(vatAmount).toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-2.5 px-4 font-black text-black">Total Invoice Price</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">Net + VAT</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(totalPayable).toLocaleString()}
                  </td>
                </tr>
                {vdsApplicable && (
                  <tr className="bg-rose-50 font-bold">
                    <td className="py-2.5 px-4 font-black text-black">Less: VDS Withheld by Withholding Entity</td>
                    <td className="py-2.5 px-4 text-right text-black font-mono">Mushak 6.6 Form</td>
                    <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                      - ৳ {Math.round(vdsAmount).toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr className="bg-emerald-100 font-extrabold border-t-2 border-emerald-300">
                  <td className="py-3 px-4 font-black text-sm text-black">Net Cash Disbursed to Supplier:</td>
                  <td className="py-3 px-4 text-right text-black font-mono">Invoice - VDS</td>
                  <td className="py-3 px-4 text-right text-black font-black text-base font-mono">
                    ৳ {Math.round(netSupplierReceivable).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-black font-bold">
              • VDS certificates must be issued on Form Mushak 6.6 within 3 working days of payment deduction.
            </div>
          </div>
        </div>
      </div>
    </ToolAccessGuard>
    </>
  );
};
