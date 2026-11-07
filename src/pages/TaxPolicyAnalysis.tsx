import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { saveItem, removeItem, isItemSaved } from '../utils/readingList';
import { Search, BookOpen, AlertCircle, FileText, Loader2, Bookmark, Calendar, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolSEO } from '../components/SEO';

export function TaxPolicyAnalysis() {
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    if (initialQuery) {
      handleAnalyzeQuery(initialQuery);
    }
  }, []);

  useEffect(() => {
    if (lastQuery) {
      setIsSaved(isItemSaved(`policy-${lastQuery}`));
    }
  }, [lastQuery]);

  const toggleSave = () => {
    if (!lastQuery) return;
    const id = `policy-${lastQuery}`;
    if (isSaved) {
      removeItem(id);
      setIsSaved(false);
    } else {
      saveItem({
        id,
        title: `Policy Analysis: ${lastQuery}`,
        type: 'policy',
        url: `/policy-analysis?q=${encodeURIComponent(lastQuery)}`,
        dateSaved: new Date().toISOString()
      });
      setIsSaved(true);
    }
  };

  const handleAnalyzeQuery = async (q: string) => {
    if (!q.trim()) return;
    try {
      setIsAnalyzing(true);
      setError('');
      setAnalysisResult('');
      setLastQuery(q);
      setSearchParams({ q });

      const response = await fetch('/api/tax-policy-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: q }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze tax policy');
      }

      setAnalysisResult(data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching the analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => handleAnalyzeQuery(query);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ToolSEO
        title={
          lastQuery
            ? `${lastQuery} – Bangladesh Tax Policy Analysis | Accounticca`
            : 'Bangladesh Tax Policy & Finance Act Analysis Tool | Accounticca & E-Lawyers'
        }
        description="Analyze Bangladesh Finance Act updates, Income Tax Act 2023 statutory provisions, NBR SROs, and historical fiscal policy trends."
        canonicalUrl="/policy-analysis"
      />
      <Breadcrumbs items={[{ label: 'Tools' }, { label: 'Tax Policy Analysis' }]} />
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Tax Policy Analysis</h1>
        </div>
        <p className="text-slate-600 text-lg max-w-3xl">
          Get real-time insights, expert commentary, and historical trends on Bangladesh Finance Act updates using AI-powered search.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="search"
              inputMode="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="e.g., Corporate tax rate changes in Finance Act 2026 vs 2025"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !query.trim()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 md:w-auto"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </div>
        
        {/* Suggested Queries */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="text-sm text-slate-500 font-medium py-1">Try asking:</span>
          {[
            "Latest VAT exemptions in IT sector",
            "Individual tax rebate changes history",
            "Capital gains tax updates 2026",
          ].map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(suggestion)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium border border-slate-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {analysisResult && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Analysis Report</h3>
                <p className="text-sm text-slate-600">Based on recent search results and expert commentary</p>
              </div>
            </div>
            <button 
              onClick={toggleSave}
              title={isSaved ? "Remove Bookmark" : "Bookmark"}
              className={`p-3 rounded-full border transition-colors flex items-center justify-center ${isSaved ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
            >
              <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
          
          <div className="p-6 md:p-8 prose prose-slate max-w-none">
            <div className="markdown-body">
              <Markdown remarkPlugins={[remarkGfm]}>{analysisResult}</Markdown>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-medium">Need formal statutory legal opinion or tailored corporate tax advice?</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-100" />
              <span>Book Legal Consultation</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-100" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
