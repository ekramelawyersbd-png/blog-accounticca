import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { ResourceLibrary } from '../../components/tools/ResourceLibrary';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function ResourceLibraryPage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'resource-library-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="resource-library-tool"
      title="Legal & Tax Resource Library Pro"
      category="Books & Manuals"
      description="Download practitioner-drafted contracts, NDA agreements, AY 2026-27 tax return Excel workbooks, TDS calculators, and RJSC packs."
    >
      <RequirePurchase product={shopProduct} toolTitle="Legal & Tax Resource Library Pro">
        <ResourceLibrary />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default ResourceLibraryPage;
