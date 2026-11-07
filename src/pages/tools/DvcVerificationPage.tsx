import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { DvcVerificationWidget } from '../../components/DvcVerificationWidget';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function DvcVerificationPage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'dvc-verification-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="dvc-verification-tool"
      title="ICAB DVC Verification Portal Simulation"
      category="Tax & VAT Toolkits"
      description="Verify audited financial statements and income computation certificates under Section 73 & ICAB standards."
    >
      <RequirePurchase product={shopProduct} toolTitle="ICAB DVC Verification Portal Simulation">
        <DvcVerificationWidget />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default DvcVerificationPage;
