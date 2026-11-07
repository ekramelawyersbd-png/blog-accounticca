import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { EarlyFilingIncentive } from '../../components/tax/EarlyFilingIncentive';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function EarlyFilingIncentivePage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'early-filing-incentive-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="early-filing-incentive-tool"
      title="Early Tax Filing 5% Rebate Calculator"
      category="Tax & VAT Toolkits"
      description="Calculate your potential 5% tax rebate for filing returns between July 1 and September 30."
    >
      <RequirePurchase product={shopProduct} toolTitle="Early Tax Filing 5% Rebate Calculator">
        <EarlyFilingIncentive />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default EarlyFilingIncentivePage;
