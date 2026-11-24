import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { Section163ComparativeDashboard } from '../../components/tax/Section163ComparativeDashboard';

export function Section163ComparativeDashboardPage() {
  return (
    <ToolPageLayout
      toolId="section-163-comparative-dashboard"
      title="Regular Income Tax vs. Section 163 Minimum Tax Dashboard"
      category="Tax & VAT Toolkits"
      description="Interactive comparative bar chart dashboard analyzing regular income tax against gross receipts minimum tax under Section 163 of the Income Tax Act, 2023 (AY 2026–2027 to AY 2030–2031)."
    >
      <Section163ComparativeDashboard />
    </ToolPageLayout>
  );
}

export default Section163ComparativeDashboardPage;
