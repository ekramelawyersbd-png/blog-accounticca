import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { TaxSlabsExplorer } from '../../components/tax/TaxSlabsExplorer';

export function TaxSlabsExplorerPage() {
  return (
    <ToolPageLayout
      toolId="tax-slabs-explorer"
      title="Bangladesh Income Tax Slabs & Rates Hub"
      category="Tax & VAT Toolkits"
      description="Interactive multi-year statutory slab explorer for individual taxpayers (General, Women, Senior Citizens, July Warriors 2024, Disabled) and corporate entities under the Income Tax Act, 2023 & Finance Act 2026."
    >
      <TaxSlabsExplorer />
    </ToolPageLayout>
  );
}

export default TaxSlabsExplorerPage;
