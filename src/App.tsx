/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

function AppointmentPracticeRedirect() {
  const { practiceArea } = useParams<{ practiceArea: string }>();
  return <Navigate to={`/contact?tab=appointment&area=${encodeURIComponent(practiceArea || '')}`} replace />;
}
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Category } from './pages/Category';
import { Article } from './pages/Article';
import { Community } from './pages/Community';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Glossary } from './pages/Glossary';
import { TaxCalculator } from './pages/TaxCalculator';
import { CorporateTaxPlanner } from './pages/CorporateTaxPlanner';
import { TaxPolicyAnalysis } from './pages/TaxPolicyAnalysis';
import { ToolsHub } from './pages/ToolsHub';
import { RJscFeeCalculatorPage } from './pages/tools/RJscFeeCalculatorPage';
import { PostRegistrationChecklistPage } from './pages/tools/PostRegistrationChecklistPage';
import { RjscFunctionsExplorerPage } from './pages/tools/RjscFunctionsExplorerPage';
import { RjscReturnsFilingGuidePage } from './pages/tools/RjscReturnsFilingGuidePage';
import { CapitalGainsTaxPage } from './pages/tools/CapitalGainsTaxPage';
import { CorporateTaxRatePage } from './pages/tools/CorporateTaxRatePage';
import { WealthSurchargePage } from './pages/tools/WealthSurchargePage';
import { InvestmentRebatePage } from './pages/tools/InvestmentRebatePage';
import { AgriculturalTaxPage } from './pages/tools/AgriculturalTaxPage';
import { MinimumTurnoverTaxPage } from './pages/tools/MinimumTurnoverTaxPage';
import { DvcVerificationPage } from './pages/tools/DvcVerificationPage';
import { ResourceLibraryPage as StandaloneResourceLibraryPage } from './pages/tools/ResourceLibraryPage';
import { EarlyFilingIncentivePage } from './pages/tools/EarlyFilingIncentivePage';
import { LossCarryForwardToolPage } from './pages/tools/LossCarryForwardToolPage';
import { TaxSlabsExplorerPage } from './pages/tools/TaxSlabsExplorerPage';
import { RateFinderPage } from './pages/tools/RateFinderPage';
import { VatApportionmentCalculatorPage } from './pages/VatApportionmentCalculatorPage';
import { SeoPerformanceAuditPage } from './pages/tools/SeoPerformanceAuditPage';
import { VatCalculator } from './pages/VatCalculator';
import { CompanyRegistrationFee } from './pages/CompanyRegistrationFee';
import { StampDutyCalculator } from './pages/StampDutyCalculator';
import { GratuityCalculator } from './pages/GratuityCalculator';
import { WhtFinder } from './pages/WhtFinder';
import { TrainingHub } from './pages/TrainingHub';
import { Team } from './pages/Team';
import { VatGuide } from './pages/VatGuide';
import { Contact } from './pages/Contact';
import { Auth } from './pages/Auth';
import { ProfilePage } from './pages/ProfilePage';
import { WorkspaceHub } from './pages/WorkspaceHub';
import { FaqPage } from './pages/FaqPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsConditions } from './pages/TermsConditions';
import { TdsReference } from './pages/TdsReference';
import { TaxPlanner } from './pages/TaxPlanner';
import { TaxRefundGuide } from './pages/TaxRefundGuide';
import { ProductDetail } from './pages/ProductDetail';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentlyGatewayPage } from './pages/PaymentlyGatewayPage';
import { EnrollmentPage } from './pages/EnrollmentPage';
import { PaymentVerifyPage } from './pages/PaymentVerifyPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';
import { AdminShop } from './pages/AdminShop';
import { ShopAdminLogin } from './pages/ShopAdminLogin';
import { ShopAdminRouteGuard } from './components/auth/ShopAdminRouteGuard';
import { LmsRouteGuard } from './components/auth/LmsRouteGuard';
import { ResourceLibraryPage } from './pages/ResourceLibraryPage';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { AuthProvider } from './contexts/AuthContext';
import { AuthProvider as LegacyAuthProvider } from './context/AuthContext';
import { ShopAuthProvider } from './contexts/ShopAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BookmarkProvider } from './contexts/BookmarkContext';
import { CartProvider } from './contexts/CartContext';
import { PurchaseProvider } from './contexts/PurchaseContext';
import { LmsProvider } from './contexts/LmsContext';
import { FocusModeProvider } from './contexts/FocusModeContext';
import { EmailPreviewProvider } from './contexts/EmailPreviewContext';
import { BookmarkNotificationToast } from './components/BookmarkNotificationToast';
import { FormSubmissionToast } from './components/ui/FormSubmissionToast';
import { ScrollManager } from './components/layout/ScrollManager';
import { NotFound } from './pages/NotFound';
import { PersonalIncomeTaxCourse } from './pages/PersonalIncomeTaxCourse';
import { StudentLearningPortalPage } from './pages/StudentLearningPortalPage';
import { ClassLearningPage } from './pages/ClassLearningPage';
import { PublicCertificateVerifyPage } from './pages/PublicCertificateVerifyPage';
import { AdminLmsDashboardPage } from './pages/AdminLmsDashboardPage';
import { CareerAccountantPage } from './pages/CareerAccountantPage';
import { CareerCustomerCarePage } from './pages/CareerCustomerCarePage';
import { CareerMtoPage } from './pages/CareerMtoPage';
import { CareerSalesMarketingPage } from './pages/CareerSalesMarketingPage';
import { CareersHubPage } from './pages/CareersHubPage';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <LegacyAuthProvider>
          <ShopAuthProvider>
          <BookmarkProvider>
            <CartProvider>
              <PurchaseProvider>
                <LmsProvider>
                  <FocusModeProvider>
                    <EmailPreviewProvider>
                      <BrowserRouter>
                <ScrollManager />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    
                    {/* Online Learning Management System (LMS) — Student Learning Portal (Protected by LmsRouteGuard) */}
                    <Route
                      path="student"
                      element={
                        <LmsRouteGuard>
                          <StudentLearningPortalPage />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/dashboard"
                      element={
                        <LmsRouteGuard>
                          <StudentLearningPortalPage />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/dashboard/:courseId"
                      element={
                        <LmsRouteGuard>
                          <StudentLearningPortalPage />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/dashboard/:courseId/exam"
                      element={
                        <LmsRouteGuard>
                          <StudentLearningPortalPage autoOpenExam />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/dashboard/:courseId/lesson/:lessonId"
                      element={
                        <LmsRouteGuard>
                          <StudentLearningPortalPage />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId"
                      element={
                        <LmsRouteGuard>
                          <StudentLearningPortalPage />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId/lesson/:lessonId"
                      element={
                        <LmsRouteGuard>
                          <ClassLearningPage />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId/lesson/:lessonId/video"
                      element={
                        <LmsRouteGuard>
                          <ClassLearningPage initialModeOverride="video" />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId/lesson/:lessonId/notes"
                      element={
                        <LmsRouteGuard>
                          <ClassLearningPage initialModeOverride="notes" />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId/lesson/:lessonId/ppt"
                      element={
                        <LmsRouteGuard>
                          <ClassLearningPage initialModeOverride="ppt" />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId/lesson/:lessonId/quiz"
                      element={
                        <LmsRouteGuard>
                          <ClassLearningPage initialModeOverride="quiz" />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId/lesson/:lessonId/:mode"
                      element={
                        <LmsRouteGuard>
                          <ClassLearningPage />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId/quiz/:quizId"
                      element={
                        <LmsRouteGuard>
                          <ClassLearningPage initialModeOverride="quiz" />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/course/:courseId/exam"
                      element={
                        <LmsRouteGuard>
                          <StudentLearningPortalPage autoOpenExam />
                        </LmsRouteGuard>
                      }
                    />
                    <Route
                      path="student/certificates/:certificateId"
                      element={
                        <LmsRouteGuard>
                          <StudentLearningPortalPage />
                        </LmsRouteGuard>
                      }
                    />
                    <Route path="lms" element={<Navigate to="/student/dashboard" replace />} />

                    {/* Public Certificate Verification Registry (No Login Required) */}
                    <Route path="verify-certificate" element={<PublicCertificateVerifyPage />} />

                    {/* Admin LMS Console & Course Editor (Protected by Authorized Admin: hmekram@gmail.com) */}
                    <Route path="admin/dashboard" element={<ShopAdminRouteGuard><AdminLmsDashboardPage initialTab="editor" /></ShopAdminRouteGuard>} />
                    <Route path="admin/courses/:courseId/edit" element={<ShopAdminRouteGuard><AdminLmsDashboardPage initialTab="editor" /></ShopAdminRouteGuard>} />
                    <Route path="admin/assessments" element={<ShopAdminRouteGuard><AdminLmsDashboardPage initialTab="assessments" /></ShopAdminRouteGuard>} />
                    <Route path="admin/certificates" element={<ShopAdminRouteGuard><AdminLmsDashboardPage initialTab="certificates" /></ShopAdminRouteGuard>} />

                    {/* Admin Authentication Login Pages */}
                    <Route path="admin/login" element={<ShopAdminLogin />} />
                    <Route path="shop/login" element={<Navigate to="/admin/login" replace />} />

                    {/* Public Digital Product & Checkout Pages */}
                    <Route path="shop/checkout" element={<CheckoutPage />} />
                    <Route path="shop/:slug" element={<ProductDetail />} />
                    <Route path="shop/product/:slug" element={<ProductDetail />} />
                    <Route path="checkout" element={<CheckoutPage />} />
                    <Route path="paymently" element={<PaymentlyGatewayPage />} />
                    <Route path="Paymently" element={<PaymentlyGatewayPage />} />
                    <Route path="enrollment" element={<EnrollmentPage />} />
                    
                    {/* UddoktaPay Hosted Payment Gateway Callbacks & Verification */}
                    <Route path="payment/verify" element={<PaymentVerifyPage />} />
                    <Route path="payment/cancel" element={<PaymentCancelPage />} />
                    <Route path="gateway/payment/success" element={<PaymentVerifyPage />} />
                    <Route path="gateway/payment/cancel" element={<PaymentCancelPage />} />
                    <Route path="gateway/uddoktapay/success" element={<PaymentVerifyPage />} />
                    <Route path="gateway/uddoktapay/cancel" element={<PaymentCancelPage />} />
                    
                    {/* Admin Shop Catalog Desk, Transactional Emails & SEO Manager (Protected by Authorized Credentials: hmekram@gmail.com) */}
                    <Route path="admin/shop" element={<ShopAdminRouteGuard><AdminShop /></ShopAdminRouteGuard>} />
                    <Route path="admin/email-templates" element={<ShopAdminRouteGuard><AdminShop initialTab="email-templates" /></ShopAdminRouteGuard>} />
                    <Route path="admin/email-history" element={<ShopAdminRouteGuard><AdminShop initialTab="email-history" /></ShopAdminRouteGuard>} />
                    <Route path="admin/seo" element={<ShopAdminRouteGuard><AdminShop initialTab="seo" /></ShopAdminRouteGuard>} />
                    <Route path="admin/products" element={<Navigate to="/admin/shop" replace />} />
                    <Route path="admin" element={<ShopAdminRouteGuard><AdminShop /></ShopAdminRouteGuard>} />
                    
                    <Route path="store" element={<Navigate to="/tools" replace />} />
                    <Route path="products" element={<Navigate to="/tools" replace />} />
                    <Route path="resource-library" element={<ResourceLibraryPage />} />
                    <Route path="resources" element={<Navigate to="/resource-library" replace />} />
                    <Route path="Careers/accountant" element={<CareerAccountantPage />} />
                    <Route path="Careers/accountant=" element={<CareerAccountantPage />} />
                    <Route path="careers/accountant" element={<CareerAccountantPage />} />
                    <Route path="careers/accountant=" element={<CareerAccountantPage />} />
                    <Route path="Careers/customer-care" element={<CareerCustomerCarePage />} />
                    <Route path="Careers/customer-care=" element={<CareerCustomerCarePage />} />
                    <Route path="careers/customer-care" element={<CareerCustomerCarePage />} />
                    <Route path="careers/customer-care=" element={<CareerCustomerCarePage />} />
                    <Route path="Careers/customer-care-executive" element={<CareerCustomerCarePage />} />
                    <Route path="careers/customer-care-executive" element={<CareerCustomerCarePage />} />
                    <Route path="e_lawyers_customer_care_application.html" element={<CareerCustomerCarePage />} />
                    <Route path="Careers/mto" element={<CareerMtoPage />} />
                    <Route path="Careers/mto=" element={<CareerMtoPage />} />
                    <Route path="careers/mto" element={<CareerMtoPage />} />
                    <Route path="careers/mto=" element={<CareerMtoPage />} />
                    <Route path="Careers/management-trainee" element={<CareerMtoPage />} />
                    <Route path="careers/management-trainee" element={<CareerMtoPage />} />
                    <Route path="Careers/management-trainee-officer" element={<CareerMtoPage />} />
                    <Route path="careers/management-trainee-officer" element={<CareerMtoPage />} />
                    <Route path="Careers/sales-marketing" element={<CareerSalesMarketingPage />} />
                    <Route path="Careers/sales-marketing=" element={<CareerSalesMarketingPage />} />
                    <Route path="careers/sales-marketing" element={<CareerSalesMarketingPage />} />
                    <Route path="careers/sales-marketing=" element={<CareerSalesMarketingPage />} />
                    <Route path="Careers/sales" element={<CareerSalesMarketingPage />} />
                    <Route path="careers/sales" element={<CareerSalesMarketingPage />} />
                    <Route path="Careers/marketing" element={<CareerSalesMarketingPage />} />
                    <Route path="careers/marketing" element={<CareerSalesMarketingPage />} />
                    <Route path="Careers/sales-marketing-executive" element={<CareerSalesMarketingPage />} />
                    <Route path="careers/sales-marketing-executive" element={<CareerSalesMarketingPage />} />
                    <Route path="Careers" element={<CareersHubPage />} />
                    <Route path="Careers=" element={<CareersHubPage />} />
                    <Route path="careers" element={<CareersHubPage />} />
                    <Route path="careers=" element={<CareersHubPage />} />
                    <Route path="jobs" element={<CareersHubPage />} />
                  <Route path="category/:id" element={<Category />} />
                <Route path="article/:id" element={<Article />} />
                <Route path="tax-refund-guide" element={<TaxRefundGuide />} />
                <Route path="community" element={<Community />} />
                <Route path="experts" element={<Community initialTab="experts" />} />
                <Route path="discussions" element={<Community initialTab="discussions" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tools" element={<ToolsHub />} />
                <Route path="tools/vat" element={<VatCalculator />} />
                <Route path="tools/company-registration" element={<CompanyRegistrationFee />} />
                <Route path="tools/stamp-duty" element={<StampDutyCalculator />} />
                <Route path="tools/gratuity" element={<GratuityCalculator />} />
                <Route path="tools/wht" element={<WhtFinder />} />
                <Route path="tools/rjsc-fee-calculator" element={<RJscFeeCalculatorPage />} />
                <Route path="tools/post-registration-checklist" element={<PostRegistrationChecklistPage />} />
                <Route path="tools/rjsc-functions-explorer" element={<RjscFunctionsExplorerPage />} />
                <Route path="tools/rjsc-returns-filing-guide" element={<RjscReturnsFilingGuidePage />} />
                <Route path="tools/capital-gains-tax" element={<CapitalGainsTaxPage />} />
                <Route path="tools/corporate-tax" element={<CorporateTaxRatePage />} />
                <Route path="tools/wealth-surcharge" element={<WealthSurchargePage />} />
                <Route path="tools/investment-rebate" element={<InvestmentRebatePage />} />
                <Route path="tools/agricultural-tax" element={<AgriculturalTaxPage />} />
                <Route path="tools/minimum-turnover-tax" element={<MinimumTurnoverTaxPage />} />
                <Route path="tools/dvc-verification" element={<DvcVerificationPage />} />
                <Route path="tools/resource-library" element={<StandaloneResourceLibraryPage />} />
                <Route path="tools/early-filing-incentive" element={<EarlyFilingIncentivePage />} />
                <Route path="tools/loss-carry-forward-calculator" element={<LossCarryForwardToolPage />} />
                <Route path="tools/tax-slabs-explorer" element={<TaxSlabsExplorerPage />} />
                <Route path="tools/rate-finder" element={<RateFinderPage />} />
                <Route path="tools/vat-apportionment-calculator" element={<VatApportionmentCalculatorPage />} />
                <Route path="vat-apportionment-calculator" element={<VatApportionmentCalculatorPage />} />
                <Route path="tools/seo-performance-audit" element={<SeoPerformanceAuditPage />} />
                <Route path="tools/seo-audit" element={<Navigate to="/tools/seo-performance-audit" replace />} />
                <Route path="seo-audit" element={<Navigate to="/tools/seo-performance-audit" replace />} />
                <Route path="rate-finder" element={<Navigate to="/tools/rate-finder" replace />} />
                <Route path="training" element={<TrainingHub />} />
                <Route path="course/personal-income-tax" element={<PersonalIncomeTaxCourse />} />
                <Route path="income-tax-training" element={<Navigate to="/course/personal-income-tax" replace />} />
                <Route path="search" element={<Search />} />
                <Route path="glossary" element={<Glossary />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="tax-calculator" element={<TaxCalculator />} />
                <Route path="tax-planner" element={<TaxPlanner />} />
                <Route path="corporate-planner" element={<CorporateTaxPlanner />} />
                <Route path="corporate-tax-planner" element={<Navigate to="/corporate-planner" replace />} />
                <Route path="policy-analysis" element={<TaxPolicyAnalysis />} />
                <Route path="team" element={<Team />} />
                <Route path="vat-guide" element={<VatGuide />} />
                <Route path="tds-guide" element={<TdsReference />} />
                <Route path="tds-reference" element={<Navigate to="/tds-guide" replace />} />
                <Route path="contact" element={<Contact />} />
                <Route path="appointment" element={<Navigate to="/contact?tab=appointment" replace />} />
                <Route path="appointment/:practiceArea" element={<AppointmentPracticeRedirect />} />
                <Route path="schedule" element={<Navigate to="/contact?tab=appointment" replace />} />
                <Route path="schedule/:practiceArea" element={<AppointmentPracticeRedirect />} />
                <Route path="book-consultation" element={<Navigate to="/contact?tab=appointment" replace />} />
                <Route path="book-consultation/:practiceArea" element={<AppointmentPracticeRedirect />} />
                <Route path="consultation" element={<Navigate to="/contact?tab=appointment" replace />} />
                <Route path="consultation/:practiceArea" element={<AppointmentPracticeRedirect />} />
                <Route path="workspace" element={<ShopAdminRouteGuard><WorkspaceHub /></ShopAdminRouteGuard>} />
                <Route path="Workspace" element={<ShopAdminRouteGuard><WorkspaceHub /></ShopAdminRouteGuard>} />
                <Route path="auth" element={<Auth />} />
                <Route path="login" element={<Auth />} />
                <Route path="signin" element={<Auth />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="portal" element={<ClientPortalPage />} />
                <Route path="client-portal" element={<ClientPortalPage />} />
                <Route path="settings" element={<Navigate to="/profile" replace />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsConditions />} />
                <Route path="company-reg" element={<Navigate to="/article/company-registration-rjsc-moa-aoa-guide-bangladesh" replace />} />
                <Route path="moa-aoa-guide" element={<Navigate to="/article/company-registration-rjsc-moa-aoa-guide-bangladesh" replace />} />
                <Route path="moa-aoa-bangladesh" element={<Navigate to="/article/company-registration-rjsc-moa-aoa-guide-bangladesh" replace />} />
                <Route path="tax-return-guide" element={<Navigate to="/article/tax-return-guide" replace />} />
                <Route path="rjsc-guide" element={<Navigate to="/article/business-registration-compliance-bangladesh-rjsc-guide" replace />} />
                <Route path="business-registration-compliance-bangladesh" element={<Navigate to="/article/business-registration-compliance-bangladesh-rjsc-guide" replace />} />
                <Route path="rjsc-business-registration" element={<Navigate to="/article/business-registration-compliance-bangladesh-rjsc-guide" replace />} />
                <Route path="startup-legal-checklist" element={<Navigate to="/article/startup-legal-checklist" replace />} />
                <Route path="outsourced-business-support-accounticca" element={<Navigate to="/article/outsourced-business-support-accounticca" replace />} />
                <Route path="sales-marketing-consultancy-accounticca" element={<Navigate to="/article/sales-marketing-consultancy-accounticca" replace />} />
                <Route path="hr-organizational-consultancy-accounticca" element={<Navigate to="/article/hr-organizational-consultancy-accounticca" replace />} />
                <Route path="business-automation-consultancy-accounticca" element={<Navigate to="/article/business-automation-consultancy-accounticca" replace />} />
                <Route path="business-process-optimization-accounticca" element={<Navigate to="/article/business-process-optimization-accounticca" replace />} />
                <Route path="bookkeeping-services-accounticca" element={<Navigate to="/article/bookkeeping-services-accounticca" replace />} />
                <Route path="accounting-financial-consultancy" element={<Navigate to="/article/accounting-financial-consultancy" replace />} />
                <Route path="business-planning-strategy-consultancy" element={<Navigate to="/article/business-planning-strategy-consultancy" replace />} />
                <Route path="business-startup-consultancy" element={<Navigate to="/article/business-startup-consultancy" replace />} />
                <Route path="corporate-law-services-bangladesh" element={<Navigate to="/article/corporate-law-services-bangladesh" replace />} />
                <Route path="tax-vat-services-bangladesh" element={<Navigate to="/article/tax-vat-services-bangladesh" replace />} />
                <Route path="rjsc-compliance-services-bangladesh" element={<Navigate to="/article/rjsc-compliance-services-bangladesh" replace />} />
                <Route path="blog/accounting-finance-solutions" element={<Navigate to="/article/accounting-finance-solutions" replace />} />
                <Route path="investment-tax-rebate-bangladesh-2026-2027" element={<Navigate to="/article/investment-tax-rebate-bangladesh-2026-2027" replace />} />
                <Route path="total-income-calculation-bangladesh-2026-2027" element={<Navigate to="/article/total-income-calculation-bangladesh-2026-2027" replace />} />
                <Route path="how-to-calculate-gross-income-and-total-taxable-income-bangladesh" element={<Navigate to="/article/total-income-calculation-bangladesh-2026-2027" replace />} />
                <Route path="gross-income-and-total-taxable-income-bangladesh-ita-2023" element={<Navigate to="/article/total-income-calculation-bangladesh-2026-2027" replace />} />
                <Route path="calculate-gross-income-bangladesh" element={<Navigate to="/article/total-income-calculation-bangladesh-2026-2027" replace />} />
                <Route path="calculate-total-income-bangladesh" element={<Navigate to="/article/total-income-calculation-bangladesh-2026-2027" replace />} />
                <Route path="agricultural-tax-calculator" element={<Navigate to="/tools#agri-tax-tool" replace />} />
                <Route path="agricultural-income-tax-calculator" element={<Navigate to="/tools#agri-tax-tool" replace />} />
                <Route path="turnover-tax-calculator" element={<Navigate to="/tools#minimum-turnover-tax-tool" replace />} />
                <Route path="minimum-turnover-tax-calculator" element={<Navigate to="/tools#minimum-turnover-tax-tool" replace />} />
                <Route path="minimum-turnover-tax-bangladesh-2026-2027" element={<Navigate to="/article/minimum-turnover-tax-slabs-bangladesh-2026-2027" replace />} />
                <Route path="tax-rebate-ceiling-bangladesh-finance-act-2026" element={<Navigate to="/article/tax-rebate-ceiling-bangladesh-finance-act-2026" replace />} />
                <Route path="tax-rebate-ceiling-2026" element={<Navigate to="/article/tax-rebate-ceiling-bangladesh-finance-act-2026" replace />} />
                <Route path="investment-rebate-calculator" element={<Navigate to="/tools#investment-rebate-calculator-tool" replace />} />
                <Route path="investment-based-tax-rebate-calculator" element={<Navigate to="/tools#investment-rebate-calculator-tool" replace />} />
                <Route path="capital-gains-tax-calculator" element={<Navigate to="/tools#capital-gains-tax-tool" replace />} />
                <Route path="capital-gains-calculator" element={<Navigate to="/tools#capital-gains-tax-tool" replace />} />
                <Route path="financial-assets-tax" element={<Navigate to="/article/financial-assets-income-tax-bangladesh-ita-2023" replace />} />
                <Route path="financial-assets-income-tax" element={<Navigate to="/article/financial-assets-income-tax-bangladesh-ita-2023" replace />} />
                <Route path="bin-registration-in-bangladesh" element={<Navigate to="/article/bin-registration-in-bangladesh" replace />} />
                <Route path="vat-registration-bangladesh" element={<Navigate to="/article/bin-registration-in-bangladesh" replace />} />
                <Route path="corporate-vat-compliance-monthly-return-protocol-bangladesh" element={<Navigate to="/article/corporate-vat-compliance-monthly-return-protocol-bangladesh" replace />} />
                <Route path="corporate-vat-compliance-bangladesh" element={<Navigate to="/article/corporate-vat-compliance-monthly-return-protocol-bangladesh" replace />} />
                <Route path="mushak-9-1-return-guide-bangladesh" element={<Navigate to="/article/corporate-vat-compliance-monthly-return-protocol-bangladesh" replace />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <BookmarkNotificationToast />
            <FormSubmissionToast />
          </BrowserRouter>
          </EmailPreviewProvider>
          </FocusModeProvider>
          </LmsProvider>
          </PurchaseProvider>
          </CartProvider>
        </BookmarkProvider>
          </ShopAuthProvider>
        </LegacyAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
