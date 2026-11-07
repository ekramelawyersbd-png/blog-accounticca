import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { PostRegistrationChecklist } from '../../components/tools/PostRegistrationChecklist';
import { RequirePurchase } from '../../components/shop/RequirePurchase';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

export function PostRegistrationChecklistPage() {
  const shopProduct = SHOP_PRODUCTS.find(p => p.id === 'post-registration-checklist-tool') || SHOP_PRODUCTS[0];

  return (
    <ToolPageLayout
      toolId="post-registration-checklist-tool"
      title="Mandatory Post-Incorporation Compliance Checklist"
      category="Corporate & RJSC"
      description="Step-by-step statutory roadmap covering entity portal account, certified copies, e-TIN, BIN, trade license, and compliance calendar."
    >
      <RequirePurchase product={shopProduct} toolTitle="Mandatory Post-Incorporation Compliance Checklist">
        <PostRegistrationChecklist />
      </RequirePurchase>
    </ToolPageLayout>
  );
}

export default PostRegistrationChecklistPage;
