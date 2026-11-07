import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { RJscFeeCalculator } from '../../components/tools/RJscFeeCalculator';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function RJscFeeCalculatorPage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'rjsc-fee-calculator-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="rjsc-fee-calculator-tool"
      title="RJSC Business Registration Fee Calculator"
      category="Corporate & RJSC"
      description="Compute company incorporation charges, non-judicial stamp duties, and capital fees under the Companies Act 1994."
    >
      <RequirePurchase product={shopProduct} toolTitle="RJSC Business Registration Fee Calculator">
        <RJscFeeCalculator />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default RJscFeeCalculatorPage;
