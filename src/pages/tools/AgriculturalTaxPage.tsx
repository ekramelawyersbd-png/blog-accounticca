import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { AgriculturalTaxCalculator } from '../../components/tax/AgriculturalTaxCalculator';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function AgriculturalTaxPage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'agricultural-tax-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="agricultural-tax-tool"
      title="Agricultural Income Tax & Exemption Calculator"
      category="Tax & VAT Toolkits"
      description="Compute agricultural income exemptions, production cost deductions (60%), and commercial farming tax SROs."
    >
      <RequirePurchase product={shopProduct} toolTitle="Agricultural Income Tax & Exemption Calculator">
        <AgriculturalTaxCalculator />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default AgriculturalTaxPage;
