import React from 'react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import { AuditEligibilityCalculator } from '../../components/tools/AuditEligibilityCalculator';

export function AuditEligibilityCalculatorPage() {
  return (
    <ToolPageLayout
      toolId="audit-eligibility-calculator"
      title="Audit Eligibility Calculator (Section 73 · Tax Year 2026–2027)"
      category="Audit, Workspace & Docs"
      description="Check whether a Bangladesh partnership firm requires CA-audited financial statements with ICAB DVS/DVC or only a certified Income Computation Sheet (ICS) under the BDT 10 crore turnover and BDT 5 crore capital thresholds."
    >
      <AuditEligibilityCalculator />
    </ToolPageLayout>
  );
}

export default AuditEligibilityCalculatorPage;
