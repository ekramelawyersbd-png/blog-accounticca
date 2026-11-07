import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { CorporateTaxRateCalculator } from '../../components/tax/CorporateTaxRateCalculator';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function CorporateTaxRatePage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'corporate-tax-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="corporate-tax-tool"
      title="Corporate Tax Rate & IPO Savings Calculator"
      category="Tax & VAT Toolkits"
      description="Simulate corporate tax rates for listed vs non-listed entities, evaluate 2.5% banking penalties, and project IPO savings."
    >
      <RequirePurchase product={shopProduct} toolTitle="Corporate Tax Rate & IPO Savings Calculator">
        <CorporateTaxRateCalculator />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default CorporateTaxRatePage;
