import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Phone,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Scale,
  Clock3,
  ExternalLink,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import {
  BreadcrumbItem,
  useResolvedBreadcrumbs,
  useSuppressGlobalBreadcrumb,
} from '../Breadcrumbs';

export interface ContactTrustItem {
  icon?: React.ReactNode;
  label: string;
}

export interface ContactSummaryCardAction {
  label: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  icon?: React.ReactNode;
  variant?: 'emerald' | 'neutral';
}

export interface ContactSummaryCardConfig {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: ContactSummaryCardAction[];
  footerIcon?: React.ReactNode;
  footerText?: string;
}

export interface ContactPageShellProps {
  /** Override breadcrumbs; when omitted, automatically derived from route hierarchy */
  breadcrumbs?: BreadcrumbItem[];
  /** Eyebrow above hero headline */
  eyebrow?: string;
  /** Primary H1 headline text */
  headline: React.ReactNode;
  /** Optional second-line emerald accent headline inside H1 */
  accentHeadline?: React.ReactNode;
  /** Supporting subtitle copy */
  description?: React.ReactNode;
  /** Dot-separated metadata items displayed under hero description */
  metaItems?: string[];
  /** Primary / secondary CTA row inside hero left column */
  actions?: React.ReactNode;
  /** Custom JSX for the right-hand hero summary card (replaces default card content inside card shell) */
  rightCard?: React.ReactNode;
  /** Declarative config for the right-hand hero summary card */
  summaryCard?: ContactSummaryCardConfig;
  /** 3 bottom trust-bar pillars; falls back to chamber pillars */
  trustItems?: ContactTrustItem[];
  /** Main page sections below the hero (omit for single-section pages) */
  children?: React.ReactNode;
  /** Set true when children manage their own <section className="mx-auto max-w-7xl px-4 ..."> blocks */
  fullBleedSections?: boolean;
  /** Center hero vertically as the sole section on the page when children are omitted */
  singleSection?: boolean;
  /** Override the default 2-column hero split grid classes */
  heroSplitClassName?: string;
  /** Override the default rightCard wrapper classes */
  rightCardClassName?: string;
  /** Additional classes for the default content container */
  contentClassName?: string;
  /** Additional classes for the outer page canvas */
  className?: string;
  /** Keep the top DynamicBreadcrumbBar visible instead of suppressing it (default false) */
  keepGlobalBreadcrumb?: boolean;
}

const DEFAULT_TRUST_ITEMS: ContactTrustItem[] = [
  {
    icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
    label: 'Strict attorney-client & financial confidentiality',
  },
  {
    icon: <Scale className="h-4 w-4" aria-hidden="true" />,
    label: 'Integrated High Court Advocates & ACCA Advisors',
  },
  {
    icon: <Clock3 className="h-4 w-4" aria-hidden="true" />,
    label: 'Direct docket reference & partner assignment',
  },
];

export const ContactSectionHeader: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ eyebrow, title, description, action, className = '' }) => (
  <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div className="max-w-2xl">
      <p className="text-xs font-semibold text-emerald-800">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const ContactSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = '', id }) => (
  <section id={id} className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </section>
);

export const ContactCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 ${className}`}>
    {children}
  </div>
);

function DefaultRightChamberCard() {
  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <p className="text-xs font-semibold text-emerald-800">Direct Chamber Hotline</p>
      <a
        href="tel:+8801335230170"
        className="mt-2.5 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-950 transition hover:text-emerald-700 sm:text-3xl tabular-nums"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Phone className="h-5 w-5" aria-hidden="true" />
        </span>
        +880 1335-230170
      </a>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Immediate routing for corporate retainers, NBR tax assessments, and RJSC filings.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="https://wa.me/8801335230170"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>WhatsApp Desk</span>
          <ExternalLink className="h-3 w-3 opacity-75" aria-hidden="true" />
        </a>
        <Link
          to="/contact?tab=appointment"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-800"
        >
          <CalendarDays className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
          <span>Book Advisory</span>
        </Link>
      </div>
      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="flex items-start gap-2 text-sm leading-6 text-slate-700">
          <MapPin className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
          <span>
            Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205
          </span>
        </p>
      </div>
    </div>
  );
}

function ConfiguredSummaryCard({ config }: { config: ContactSummaryCardConfig }) {
  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <p className="text-xs font-semibold text-emerald-800">{config.eyebrow}</p>
      <div className="mt-2.5 flex items-center gap-3">
        {config.icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            {config.icon}
          </span>
        )}
        <div className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {config.title}
        </div>
      </div>
      {config.description && (
        <p className="mt-3 text-sm leading-6 text-slate-600">{config.description}</p>
      )}
      {config.actions && config.actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {config.actions.map((act, idx) => {
            const cls =
              act.variant === 'neutral'
                ? 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-800 cursor-pointer'
                : 'inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 cursor-pointer';
            if (act.to) {
              return (
                <Link key={idx} to={act.to} className={cls}>
                  {act.icon}
                  <span>{act.label}</span>
                  <ArrowRight className="h-3 w-3 opacity-75" aria-hidden="true" />
                </Link>
              );
            }
            if (act.href) {
              return (
                <a
                  key={idx}
                  href={act.href}
                  target={act.external ? '_blank' : undefined}
                  rel={act.external ? 'noopener noreferrer' : undefined}
                  className={cls}
                >
                  {act.icon}
                  <span>{act.label}</span>
                  {act.external && <ExternalLink className="h-3 w-3 opacity-75" aria-hidden="true" />}
                </a>
              );
            }
            return (
              <button key={idx} type="button" onClick={act.onClick} className={cls}>
                {act.icon}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      )}
      {config.footerText && (
        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="flex items-start gap-2 text-sm leading-6 text-slate-700">
            {config.footerIcon ? (
              <span className="mt-1 shrink-0 text-emerald-700">{config.footerIcon}</span>
            ) : (
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            )}
            <span>{config.footerText}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export const ContactPageShell: React.FC<ContactPageShellProps> = ({
  breadcrumbs,
  eyebrow = 'Accounticca × E-Lawyers · Joint Advisory Chambers · Dhaka, Bangladesh',
  headline,
  accentHeadline,
  description,
  metaItems,
  actions,
  rightCard,
  summaryCard,
  trustItems = DEFAULT_TRUST_ITEMS,
  children,
  fullBleedSections = false,
  singleSection = false,
  heroSplitClassName = 'grid gap-10 lg:grid-cols-[1.28fr_0.72fr] lg:items-end',
  rightCardClassName = 'rounded-2xl border border-emerald-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:p-6',
  contentClassName = '',
  className = '',
  keepGlobalBreadcrumb = false,
}) => {
  const location = useLocation();
  useSuppressGlobalBreadcrumb(!keepGlobalBreadcrumb);
  const resolvedBreadcrumbs = useResolvedBreadcrumbs(breadcrumbs);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://accounticca.com';
  const breadcrumbJsonLd = React.useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          ...resolvedBreadcrumbs.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 2,
            name: item.label,
            item: item.path
              ? item.path.startsWith('http')
                ? item.path
                : `${origin}${item.path}`
              : `${origin}${location.pathname}`,
          })),
        ],
      }),
    [resolvedBreadcrumbs, origin, location.pathname]
  );

  return (
    <div
      className={`flex-1 bg-[#f5f7f4] text-slate-900 ${
        singleSection ? 'min-h-dvh flex flex-col justify-center py-2 sm:py-3' : 'min-h-screen pb-16'
      } ${className}`}
    >
      {/* Contact-Matched Unified Hero Shell */}
      <section className={`px-3 sm:px-6 lg:px-8 print:hidden ${singleSection ? 'py-0' : 'pb-10 pt-5'}`}>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 text-slate-900 shadow-lg shadow-emerald-950/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(16,185,129,0.10),transparent_42%),radial-gradient(ellipse_at_0%_100%,rgba(20,184,166,0.08),transparent_38%)]" />

          <div
            className={`relative z-10 ${
              singleSection
                ? 'px-5 py-4 sm:px-8 sm:py-5 lg:px-10 lg:py-6'
                : 'px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12'
            }`}
          >
            {/* Integrated Hero Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className={`flex flex-wrap items-center gap-2 text-slate-600 ${
                singleSection ? 'mb-3 sm:mb-4 text-xs sm:text-sm' : 'mb-8 text-sm'
              }`}
            >
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
              />
              <Link to="/" className="transition hover:text-emerald-800">
                Home
              </Link>
              {resolvedBreadcrumbs.map((item, idx) => {
                const isLast = idx === resolvedBreadcrumbs.length - 1;
                return (
                  <React.Fragment key={`${item.label}-${idx}`}>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                    {!isLast && item.path ? (
                      <Link
                        to={item.path}
                        className="transition hover:text-emerald-800 max-w-[200px] sm:max-w-[280px] truncate"
                        title={item.label}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className="font-semibold text-slate-900 max-w-[260px] sm:max-w-[440px] truncate"
                        title={item.label}
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {item.label}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            {/* 2-Column Hero Split */}
            <div className={heroSplitClassName}>
              <div>
                <p
                  className={`font-semibold text-emerald-800 ${
                    singleSection ? 'mb-1.5 text-xs' : 'mb-3 text-xs sm:text-sm'
                  }`}
                >
                  {eyebrow}
                </p>
                <h1
                  className={`max-w-3xl font-bold leading-tight tracking-tight text-slate-950 ${
                    singleSection ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-3xl sm:text-5xl'
                  }`}
                >
                  {headline}
                  {accentHeadline && (
                    <span className="mt-0.5 block text-emerald-700">{accentHeadline}</span>
                  )}
                </h1>
                {description && (
                  <p
                    className={`max-w-2xl text-slate-600 ${
                      singleSection ? 'mt-2.5 text-sm leading-6' : 'mt-5 text-base leading-7 sm:text-lg'
                    }`}
                  >
                    {description}
                  </p>
                )}

                {metaItems && metaItems.length > 0 && (
                  <div
                    className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 ${
                      singleSection ? 'mt-3' : 'mt-6 sm:text-sm'
                    }`}
                  >
                    {metaItems.map((meta, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span aria-hidden="true">·</span>}
                        <span className={idx === 0 ? 'font-semibold text-slate-800' : ''}>{meta}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {actions && (
                  <div
                    className={`flex flex-col sm:flex-row sm:flex-wrap ${
                      singleSection ? 'mt-4 gap-2.5' : 'mt-7 gap-3'
                    }`}
                  >
                    {actions}
                  </div>
                )}
              </div>

              {rightCard ? (
                <div className={rightCardClassName}>
                  {rightCard}
                </div>
              ) : summaryCard ? (
                <ConfiguredSummaryCard config={summaryCard} />
              ) : (
                <DefaultRightChamberCard />
              )}
            </div>

            {/* Bottom 3-Column Trust Bar */}
            {trustItems && trustItems.length > 0 && (
              <div
                className={`grid gap-2.5 border-t border-emerald-200/70 sm:grid-cols-3 ${
                  singleSection ? 'mt-4 lg:mt-5 pt-3.5' : 'mt-10 gap-3 pt-6'
                }`}
              >
                {trustItems.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 font-medium text-slate-700 ${
                      singleSection ? 'text-xs sm:text-[13px]' : 'gap-3 text-sm'
                    }`}
                  >
                    <span
                      className={`flex shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800 ${
                        singleSection ? 'h-7 w-7' : 'h-9 w-9'
                      }`}
                    >
                      {item.icon || <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Page Content */}
      {children ? (
        fullBleedSections ? (
          children
        ) : (
          <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 ${contentClassName}`}>
            {children}
          </div>
        )
      ) : null}
    </div>
  );
};

export default ContactPageShell;
