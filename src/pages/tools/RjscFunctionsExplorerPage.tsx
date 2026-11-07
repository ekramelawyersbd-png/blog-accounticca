import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { RjscFunctionsExplorer } from '../../components/tools/RjscFunctionsExplorer';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function RjscFunctionsExplorerPage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'rjsc-functions-explorer-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="rjsc-functions-explorer-tool"
      title="RJSC Statutory Functions & Lifecycle Guide"
      category="Corporate & RJSC"
      description="Interactive workflows for name clearance, statutory returns, certified copies, and company winding-up in Bangladesh."
    >
      <RequirePurchase product={shopProduct} toolTitle="RJSC Statutory Functions & Lifecycle Guide">
        <RjscFunctionsExplorer />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default RjscFunctionsExplorerPage;
