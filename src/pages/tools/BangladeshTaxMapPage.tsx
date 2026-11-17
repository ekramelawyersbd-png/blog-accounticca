import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { BangladeshTaxMapExplorer } from '../../components/tools/BangladeshTaxMapExplorer';

export const BangladeshTaxMapPage: React.FC = () => {
  return (
    <ToolPageLayout
      toolId="bangladesh-tax-map"
      title="Bangladesh Regional Tax Office (DCT) & Jurisdiction Map"
      category="Compliance Reference"
      description="Interactive clickable map of all 8 Bangladesh divisions displaying NBR Tax Zone Commissionerates, DCT Circle contact directories, Section 163 minimum tax slabs, and jurisdiction-specific filing rules."
    >
      <BangladeshTaxMapExplorer />
    </ToolPageLayout>
  );
};

export default BangladeshTaxMapPage;
