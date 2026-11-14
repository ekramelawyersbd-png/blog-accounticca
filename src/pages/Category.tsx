import { useState, useMemo } from 'react';
import { BookmarkButton } from '../components/BookmarkButton';
import { useParams, Link } from 'react-router-dom';
import { calculateReadingTime } from '../utils/readingTime';
import { mockArticles, categories } from '../data/mockData';
import { format } from 'date-fns';
import {
  Search,
  Clock,
  Calendar,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Layers,
  ShieldCheck,
  Scale,
  Clock3,
} from 'lucide-react';
import { buildAppointmentUrl } from '../utils/appointmentRedirect';
import { SEO } from '../components/SEO';
import {
  ContactPageShell,
  ContactSectionHeader,
} from '../components/layout/ContactPageShell';

export function Category() {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');

  const category = categories.find((c) => c.id === id);
  const categoryArticles = useMemo(
    () => mockArticles.filter((a) => a.categoryId === id),
    [id]
  );

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categoryArticles;
    return categoryArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [categoryArticles, searchQuery]);

  if (!category) {
    return (
      <ContactPageShell
        breadcrumbs={[
          { label: 'Knowledge Hub', path: '/search' },
          { label: 'Category Not Found' },
        ]}
        eyebrow="Knowledge Repository · Accounticca × E-Lawyers"
        headline="Category not found."
        accentHeadline="Browse our active legal & tax guides."
        description="The requested practice area category could not be located. Return to the Knowledge Hub or search across all articles and calculators."
        actions={
          <Link
            to="/search"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Explore Knowledge Hub
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      >
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <p className="text-base font-semibold text-slate-700">
            No category matches "{id}". Please select a legal or tax domain from the search directory.
          </p>
        </div>
      </ContactPageShell>
    );
  }

  return (
    <ContactPageShell
      breadcrumbs={[
        { label: 'Knowledge Hub', path: '/search' },
        { label: category.name },
      ]}
      eyebrow="Legal & Regulatory Knowledge Desk · Bangladesh"
      headline={category.name}
      accentHeadline="Statutory analysis & compliance briefs."
      description={category.description}
      metaItems={[
        `${categoryArticles.length} Published Guide${categoryArticles.length === 1 ? '' : 's'}`,
        'Bangladesh Statutory Framework',
        'Reviewed by Chambers Counsel',
      ]}
      actions={
        <>
          <a
            href={buildAppointmentUrl({
              service: category.name,
              source: `Category Page - ${category.name}`,
            })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Consult on {category.name}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link
            to="/tools"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-950"
          >
            <Layers className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            Interactive Calculators
          </Link>
        </>
      }
      summaryCard={{
        eyebrow: 'Practice Area Desk',
        title: `${categoryArticles.length} Guide${categoryArticles.length === 1 ? '' : 's'} Available`,
        icon: <BookOpen className="h-5 w-5" aria-hidden="true" />,
        description:
          'Authoritative briefs prepared by High Court advocates and ACCA tax advisors covering statutory obligations, filing timelines, and precedents.',
        actions: [
          {
            label: 'Search All Guides',
            to: '/search',
            icon: <Search className="h-3.5 w-3.5" aria-hidden="true" />,
          },
          {
            label: 'Statutory Glossary',
            to: '/glossary',
            icon: <BookOpen className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />,
            variant: 'neutral',
          },
        ],
        footerIcon: <Scale className="h-4 w-4" aria-hidden="true" />,
        footerText: `Dedicated advisory desk for ${category.name} matters across Bangladesh.`,
      }}
      trustItems={[
        {
          icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
          label: 'Verified against current Bangladesh Gazette & SROs',
        },
        {
          icon: <Scale className="h-4 w-4" aria-hidden="true" />,
          label: 'Authored by Supreme Court Advocates & ACCA Fellows',
        },
        {
          icon: <Clock3 className="h-4 w-4" aria-hidden="true" />,
          label: 'Bookmarkable briefs with structured checklists',
        },
      ]}
    >
      <SEO
        title={`${category.name} — Regulatory, Legal & Compliance Guides | Compliance Hub`}
        description={category.description}
        canonicalUrl={`/category/${category.id}`}
        keywords={[
          category.name,
          'Regulatory Guides Bangladesh',
          'Legal Compliance',
          'Accounticca',
          'E-Lawyers',
        ]}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: category.name, url: `/category/${category.id}` },
        ]}
      />

      {/* Filter & Search Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800">Category Directory</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              {filteredArticles.length} matching article{filteredArticles.length === 1 ? '' : 's'}
            </h2>
          </div>

          <div className="relative w-full sm:w-96">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${category.name}...`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
            />
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition duration-200 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-emerald-800">{article.category}</span>
                  <span>{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold leading-snug text-slate-950 transition-colors group-hover:text-emerald-800">
                    {article.title}
                  </h3>
                  <BookmarkButton
                    id={article.id}
                    title={article.title}
                    url={`/article/${article.id}`}
                    className="-mr-1.5 -mt-1.5 shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-700"
                  />
                </div>
                <p className="mb-6 flex-1 text-sm leading-6 text-slate-600 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-4">
                  <img
                    src={
                      article.author.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        article.author.name
                      )}&background=047857&color=fff`
                    }
                    alt={article.author.name}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        article.author.name
                      )}&background=047857&color=fff`;
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      {article.author.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />{' '}
                      {calculateReadingTime(article.content)} min read
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/80 bg-white py-16 text-center shadow-xs">
          <p className="text-base font-bold text-slate-800">
            No matching articles found in {category.name}.
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      )}

      {/* Chamber Consultation Banner aligned with Contact grammar */}
      <section className="pt-2">
        <ContactSectionHeader
          eyebrow="Direct Chamber Representation"
          title={`Need tailored legal or tax advice in ${category.name}?`}
          description="Schedule a confidential 1-on-1 session with our High Court advocates and senior ACCA tax partners."
        />
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 p-6 shadow-xs sm:p-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-emerald-800">
              Accounticca × E-Lawyers · Advisory Desk
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
              Connect directly with a practice partner
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              In-chamber consultations at Panthapath, Dhaka or virtual briefs with dedicated docket reference and document review.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href={buildAppointmentUrl({
                service: category.name,
                source: `Category Page - ${category.name}`,
              })}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Book Consultation</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              to="/contact"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              Contact Chambers
            </Link>
          </div>
        </div>
      </section>
    </ContactPageShell>
  );
}
