import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { CapitalGainsTaxCalculator } from '../../components/tax/CapitalGainsTaxCalculator';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function CapitalGainsTaxPage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'capital-gains-tax-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="capital-gains-tax-tool"
      title="Capital Gains Tax Calculator Pro"
      category="Tax & VAT Toolkits"
      description="Calculate capital gains tax on land, real estate, personal valuables, and shares under Finance Act 2026."
    >
      <RequirePurchase product={shopProduct} toolTitle="Capital Gains Tax Calculator Pro">
        <CapitalGainsTaxCalculator />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default CapitalGainsTaxPage;
