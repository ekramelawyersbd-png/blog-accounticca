import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { MinimumTurnoverTaxCalculator } from '../../components/tax/MinimumTurnoverTaxCalculator';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function MinimumTurnoverTaxPage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'minimum-turnover-tax-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="minimum-turnover-tax-tool"
      title="Minimum Turnover Tax Calculator (Section 163)"
      category="Tax & VAT Toolkits"
      description="Calculate minimum turnover tax liability (0.6%, 0.1%, 0.25%, 2.0%) based on gross receipts under Section 163."
    >
      <RequirePurchase product={shopProduct} toolTitle="Minimum Turnover Tax Calculator (Section 163)">
        <MinimumTurnoverTaxCalculator />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default MinimumTurnoverTaxPage;
