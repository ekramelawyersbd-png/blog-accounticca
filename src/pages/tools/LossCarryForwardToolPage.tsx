import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { LossCarryForwardCalculator } from '../../components/tax/LossCarryForwardCalculator';

export function LossCarryForwardToolPage() {
  return (
    <ToolPageLayout
      toolId="loss-carry-forward-calculator"
      title="Loss Set-Off and Carry-Forward Calculator"
      category="Tax & VAT Toolkits"
      description="Calculate multi-year business loss set-off, Section 71(3) unabsorbed depreciation priority rules, and carry-forward expiry timelines (6-year general rule vs. 9-year startup sandbox rule) under the Income Tax Act, 2023."
    >
      <LossCarryForwardCalculator />
    </ToolPageLayout>
  );
}

export default LossCarryForwardToolPage;
