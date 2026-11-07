export type TaxCategory = 'general' | 'female_senior' | 'disabled' | 'freedom_fighter';
export type TaxLocation = 'dhaka_ctg' | 'other_cc' | 'non_cc';

export interface TaxScenarioInputs {
  income: string;
  investment: string;
  tds: string;
  category: TaxCategory;
  disabledDependents: number;
  location: TaxLocation;
  isFirstTimeFiler: boolean;
}

export interface TaxScenarioResults {
  totalLimit: number;
  taxableIncome: number;
  grossTax: number;
  rebate: number;
  netTaxBeforeMin: number;
  minimumTax: number;
  finalLiability: number;
  netPayable: number;
}

export interface TaxScenario {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  inputs: TaxScenarioInputs;
  results: TaxScenarioResults;
}
