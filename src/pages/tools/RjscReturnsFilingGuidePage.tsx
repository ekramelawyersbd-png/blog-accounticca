import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { RjscReturnsFilingGuide } from '../../components/tools/RjscReturnsFilingGuide';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function RjscReturnsFilingGuidePage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'rjsc-returns-filing-guide-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="rjsc-returns-filing-guide-tool"
      title="RJSC Statutory Returns Filing Guide & Deadline Calculator"
      category="Corporate & RJSC"
      description="Practical guide to annual returns (Schedule X/Balance Sheet) vs event-based forms (Form XII/XV/XVIII/117) with interactive deadline calculator."
    >
      <RequirePurchase product={shopProduct} toolTitle="RJSC Statutory Returns Filing Guide & Deadline Calculator">
        <RjscReturnsFilingGuide />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default RjscReturnsFilingGuidePage;
