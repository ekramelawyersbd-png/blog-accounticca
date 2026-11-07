import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { WealthSurchargeVisualizer } from '../../components/tax/WealthSurchargeVisualizer';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function WealthSurchargePage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'wealth-surcharge-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="wealth-surcharge-tool"
      title="Net Wealth Surcharge Visualizer Pro"
      category="Tax & VAT Toolkits"
      description="Explore progressive net wealth surcharge tiers (10% to 35%) and luxury asset triggers under Section 2(86B)."
    >
      <RequirePurchase product={shopProduct} toolTitle="Net Wealth Surcharge Visualizer Pro">
        <WealthSurchargeVisualizer />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default WealthSurchargePage;
