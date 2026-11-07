import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { InvestmentBasedTaxRebateCalculator } from '../../components/tax/InvestmentBasedTaxRebateCalculator';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function InvestmentRebatePage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'investment-rebate-calculator-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="investment-rebate-calculator-tool"
      title="Investment-Based Tax Rebate Calculator Pro"
      category="Tax & VAT Toolkits"
      description="Calculate maximum allowable investment tax rebate under Section 78 of the Income Tax Act 2023."
    >
      <RequirePurchase product={shopProduct} toolTitle="Investment-Based Tax Rebate Calculator Pro">
        <InvestmentBasedTaxRebateCalculator />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default InvestmentRebatePage;
