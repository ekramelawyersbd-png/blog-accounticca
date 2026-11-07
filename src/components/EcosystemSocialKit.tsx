import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Linkedin, 
  Facebook, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Hash, 
  CheckCircle2, 
  Globe
} from 'lucide-react';
import { FacebookPostEngageBar } from './FacebookPostEngageBar';
import { FacebookPostComments } from './FacebookPostComments';

interface EcosystemSocialKitProps {
  articleId: string;
}

export function EcosystemSocialKit({ articleId }: EcosystemSocialKitProps) {
  const [activeTab, setActiveTab] = useState<'facebook' | 'linkedin' | 'seo'>('facebook');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  if (articleId !== 'accounticca-e-lawyers-strategic-ecosystem-partnership') {
    return null;
  }

  const fbCaption = `Accounticca × E-Lawyers: Building Stronger Businesses Through One Unified Ecosystem

Modern businesses need more than separate professional services. They need a connected ecosystem where strategy, finance, compliance, and legal expertise work together.

Through the strategic partnership between Accounticca and E-Lawyers, businesses now gain access to:

✓ Business Strategy & Growth Advisory
✓ Financial Planning & CFO-Level Support
✓ Corporate Incorporation & RJSC Compliance
✓ NBR, Tax & VAT Advisory
✓ BIDA Approval & Foreign Investment Support
✓ Contract & Corporate Legal Solutions
✓ Intellectual Property Protection

From startup formation to business expansion, our integrated approach helps organizations make confident decisions with professional guidance.

Build. Comply. Grow. Together.

🔹 Accounticca — Business & Financial Advisory Practice
🔹 E-Lawyers — Legal & Compliance Practice

#Accounticca #ELawyers #BusinessAdvisory #LegalConsultancy #CorporateLaw #BangladeshBusiness #BusinessGrowth #StartupBangladesh #SMEGrowth #CorporateCompliance #RJSC #NBR #BIDA #FinancialAdvisory #BusinessConsulting #EntrepreneurshipBangladesh #LegalTechnology #BusinessStrategy #CorporateServices #BuildComplyGrow`;

  const linkedinCaption = `A Strategic Partnership for the Future of Business in Bangladesh

Accounticca and E-Lawyers have joined forces to create a unified advisory ecosystem combining:

Business Strategy | Financial Intelligence | Legal Expertise | Regulatory Compliance

This collaboration enables businesses to access integrated solutions across:
• Corporate structuring & RJSC filings
• Financial modeling & fractional CFO oversight
• Full-scope NBR tax & VAT advisory
• BIDA foreign direct investment approvals
• Enterprise contract engineering & IP protection
• Scaling & commercial expansion strategy

By connecting financial and legal expertise under one platform, we empower organizations to make informed decisions and build sustainable, compliant growth.

Accounticca × E-Lawyers
Complete Business Support. One Ecosystem.
Where Business Strategy Meets Legal Excellence.

#BusinessAdvisory #CorporateStrategy #LegalCompliance #FinancialManagement #BangladeshBusiness #Entrepreneurship #CorporateConsulting #RJSC #NBR #BIDA #BuildComplyGrow`;

  const seoTags = [
    'Business Advisory Bangladesh',
    'Corporate Legal Services',
    'Financial Consulting Bangladesh',
    'RJSC Compliance',
    'NBR Tax Advisory',
    'BIDA Consultancy',
    'Startup Support Bangladesh',
    'SME Growth Strategy',
    'Corporate Structuring',
    'Business Expansion Solutions',
    'Legal Technology Bangladesh',
    'Integrated Advisory Ecosystem',
    'Fractional CFO Bangladesh'
  ];

  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  return (
    <div className="my-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl overflow-hidden relative">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <span>Partnership Media Kit</span>
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-white">
              SEO & Social Publishing Package
            </h4>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={isOpen ? "Collapse kit" : "Expand kit"}
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="pt-6 space-y-6">
          <p className="text-sm text-slate-300">
            Official marketing copy, optimized captions, and verified hashtag taxonomy ready for cross-platform distribution by executive teams and media partners.
          </p>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 max-w-md">
            <button
              onClick={() => setActiveTab('facebook')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'facebook'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => setActiveTab('linkedin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'linkedin'
                  ? 'bg-[#0A66C2] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'seo'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>SEO Tags</span>
            </button>
          </div>

          {/* Tab Content 1: Facebook */}
          {activeTab === 'facebook' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Facebook Post Caption & Verified Hashtags
                </span>
                <button
                  onClick={() => handleCopy(fbCaption, 'fb')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedKey === 'fb' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {fbCaption}
              </div>

              {/* Live Facebook Post Embed */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Live Facebook Announcement Post
                </span>
                <div className="flex justify-center p-3 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                  <iframe 
                    src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fphoto%2F%3Ffbid%3D1718531953613967%26set%3Da.706589084808264&show_text=true&width=500" 
                    width="500" 
                    height="429" 
                    style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }} 
                    scrolling="no" 
                    frameBorder="0" 
                    allowFullScreen={true} 
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title="Facebook Announcement"
                    className="w-full max-w-[500px] h-[430px]"
                  />
                </div>

                {/* Social Interaction Buttons directly below iframe */}
                <FacebookPostEngageBar 
                  postUrl="https://www.facebook.com/photo/?fbid=1718531953613967&set=a.706589084808264"
                  postTitle="Official Strategic Partnership Announcement"
                  initialLikes={184}
                  variant="dark"
                />

                {/* Comments Component below Social Interaction Buttons */}
                <FacebookPostComments 
                  contentId="facebook-post-1718531953613967"
                  postUrl="https://www.facebook.com/photo/?fbid=1718531953613967&set=a.706589084808264"
                />
              </div>
            </div>
          )}

          {/* Tab Content 2: LinkedIn */}
          {activeTab === 'linkedin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  LinkedIn Executive Announcement
                </span>
                <button
                  onClick={() => handleCopy(linkedinCaption, 'linkedin')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedKey === 'linkedin' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy LinkedIn Post</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {linkedinCaption}
              </div>
            </div>
          )}

          {/* Tab Content 3: SEO Tags */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Target Search Keywords & Metadata Slugs
                </span>
                <button
                  onClick={() => handleCopy(seoTags.join(', '), 'seo')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {copiedKey === 'seo' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Keywords</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    URL Slug & Primary Target
                  </div>
                  <p className="text-xs text-slate-400">Slug:</p>
                  <code className="text-xs text-emerald-300 font-mono block bg-slate-900 p-2 rounded-lg border border-slate-800">
                    /article/accounticca-e-lawyers-strategic-ecosystem-partnership
                  </code>
                  <p className="text-xs text-slate-400 pt-1">Focus Keyword:</p>
                  <span className="inline-block px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-md text-xs font-semibold border border-emerald-500/30">
                    Business and Legal Advisory Services in Bangladesh
                  </span>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Keyword Tags ({seoTags.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {seoTags.map(tag => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-md text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
