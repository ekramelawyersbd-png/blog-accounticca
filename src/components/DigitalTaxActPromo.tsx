import React from 'react';

export const DigitalTaxActPromo: React.FC = () => {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        /* ---------- Scoped tokens ---------- */
        .itp-promo {
          --itp-navy:        #0f2e52;
          --itp-navy-deep:   #081c33;
          --itp-navy-soft:   #163e6b;
          --itp-gold:        #b8860b;
          --itp-gold-light:  #d9a520;
          --itp-gold-glow:   rgba(184, 134, 11, 0.35);
          --itp-ink:         #0b2038;
          --itp-paper:       #ffffff;
          --itp-muted:       #a9c0d8;
          --itp-radius:      22px;

          position: relative;
          isolation: isolate;
          overflow: hidden;
          padding: clamp(2.5rem, 6vw, 5rem) clamp(1rem, 4vw, 2.5rem);
          background:
            radial-gradient(1100px 500px at 85% -10%, rgba(184,134,11,.20), transparent 60%),
            radial-gradient(900px 600px at 0% 110%, rgba(22,62,107,.85), transparent 65%),
            linear-gradient(150deg, #0f2e52 0%, #0a2444 45%, #081c33 100%);
          color: #eaf1f9;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .itp-promo::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background-image:
            repeating-linear-gradient(135deg, rgba(255,255,255,.022) 0 1px, transparent 1px 14px);
          pointer-events: none;
        }

        .itp-promo::after {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--itp-gold) 18%, var(--itp-gold-light) 50%, var(--itp-gold) 82%, transparent);
          opacity: .9;
        }

        .itp-promo__inner {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
          gap: clamp(2rem, 4.5vw, 4rem);
          align-items: center;
        }

        .itp-promo__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          padding: .42rem .9rem .42rem .55rem;
          border-radius: 999px;
          background: rgba(184, 134, 11, .13);
          border: 1px solid rgba(184, 134, 11, .45);
          color: #f0cf7a;
          font-size: .74rem;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
          margin-bottom: 1.15rem;
        }
        .itp-promo__eyebrow .itp-pulse {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--itp-gold-light);
          box-shadow: 0 0 0 0 var(--itp-gold-glow);
          animation: itp-pulse 2.2s infinite;
        }
        @keyframes itp-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(217,165,32,.55); }
          70%  { box-shadow: 0 0 0 10px rgba(217,165,32,0); }
          100% { box-shadow: 0 0 0 0 rgba(217,165,32,0); }
        }

        .itp-promo__title {
          margin: 0 0 1rem;
          font-size: clamp(1.7rem, 3.4vw, 2.65rem);
          line-height: 1.16;
          font-weight: 800;
          letter-spacing: -.02em;
          color: #ffffff;
          text-wrap: balance;
        }
        .itp-promo__title .itp-accent {
          background: linear-gradient(100deg, #f6d98a, #d9a520 45%, #b8860b);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .itp-promo__lede {
          margin: 0 0 2rem;
          max-width: 54ch;
          font-size: clamp(.98rem, 1.15vw, 1.075rem);
          line-height: 1.65;
          color: #c6d8ea;
        }
        .itp-promo__lede .bn {
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          color: #e4eefa;
        }

        .itp-features {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: .85rem;
          margin-bottom: 2.1rem;
          list-style: none;
          padding: 0;
        }

        .itp-feature {
          display: flex;
          align-items: flex-start;
          gap: .8rem;
          padding: .95rem 1rem;
          border-radius: 14px;
          background: linear-gradient(160deg, rgba(255,255,255,.075), rgba(255,255,255,.028));
          border: 1px solid rgba(255,255,255,.10);
          backdrop-filter: blur(6px);
          transition: transform .25s ease, border-color .25s ease, background .25s ease, box-shadow .25s ease;
        }
        .itp-feature:hover {
          transform: translateY(-3px);
          border-color: rgba(184,134,11,.55);
          background: linear-gradient(160deg, rgba(184,134,11,.16), rgba(255,255,255,.04));
          box-shadow: 0 12px 26px -14px rgba(0,0,0,.75);
        }

        .itp-feature__icon {
          flex: 0 0 auto;
          width: 36px; height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: linear-gradient(150deg, rgba(184,134,11,.30), rgba(184,134,11,.10));
          border: 1px solid rgba(184,134,11,.45);
          color: #f0cf7a;
        }
        .itp-feature__icon svg { width: 18px; height: 18px; display: block; }

        .itp-feature__text { min-width: 0; }
        .itp-feature__title {
          display: block;
          font-size: .875rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
          margin-bottom: .12rem;
        }
        .itp-feature__title .bn { font-family: 'Hind Siliguri', sans-serif; font-weight: 600; }
        .itp-feature__desc {
          display: block;
          font-size: .775rem;
          line-height: 1.45;
          color: #9db6d0;
        }

        .itp-cta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem 1.4rem;
        }

        .itp-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: .6rem;
          padding: 1rem 1.9rem;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, #e2b53a 0%, #d9a520 40%, #b8860b 100%);
          color: #0b2038;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: .005em;
          text-decoration: none;
          cursor: pointer;
          box-shadow: 0 12px 28px -12px rgba(184,134,11,.95), inset 0 1px 0 rgba(255,255,255,.45);
          transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
        }
        .itp-cta:hover {
          transform: translateY(-2px);
          filter: brightness(1.06);
          box-shadow: 0 18px 38px -14px rgba(184,134,11,1), inset 0 1px 0 rgba(255,255,255,.5);
        }
        .itp-cta:active { transform: translateY(0); }
        .itp-cta:focus-visible {
          outline: 3px solid #ffffff;
          outline-offset: 3px;
        }
        .itp-cta__arrow {
          font-size: 1.05em;
          line-height: 1;
          transition: transform .22s ease;
        }
        .itp-cta:hover .itp-cta__arrow { transform: translate(2px, -2px); }

        .itp-cta-note {
          display: flex;
          flex-direction: column;
          gap: .18rem;
          font-size: .78rem;
          color: #9db6d0;
          line-height: 1.45;
        }
        .itp-cta-note strong { color: #e4eefa; font-weight: 700; }
        .itp-cta-note .bn { font-family: 'Hind Siliguri', sans-serif; }

        .itp-preview-wrap {
          position: relative;
          perspective: 1400px;
        }

        .itp-preview {
          position: relative;
          border-radius: 18px;
          background: #f7f9fc;
          border: 1px solid rgba(255,255,255,.22);
          box-shadow:
            0 40px 70px -30px rgba(0,0,0,.85),
            0 0 0 1px rgba(184,134,11,.22),
            0 0 60px -18px rgba(184,134,11,.35);
          overflow: hidden;
          transform: rotateY(-6deg) rotateX(2deg);
          transition: transform .5s cubic-bezier(.22,.68,.36,1);
          animation: itp-float 7s ease-in-out infinite;
        }
        .itp-preview-wrap:hover .itp-preview {
          transform: rotateY(0deg) rotateX(0deg) translateY(-4px);
        }
        @keyframes itp-float {
          0%, 100% { translate: 0 0; }
          50%      { translate: 0 -9px; }
        }

        .itp-preview__bar {
          display: flex;
          align-items: center;
          gap: .45rem;
          padding: .7rem .95rem;
          background: linear-gradient(180deg, #0f2e52, #0b2340);
          border-bottom: 1px solid rgba(184,134,11,.35);
        }
        .itp-preview__dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: rgba(255,255,255,.22);
        }
        .itp-preview__dot:first-child { background: #b8860b; }
        .itp-preview__url {
          margin-left: .5rem;
          padding: .22rem .7rem;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          color: #b9cde2;
          font-size: .66rem;
          font-weight: 600;
          letter-spacing: .02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .itp-preview__body { padding: 1.05rem 1.05rem 1.25rem; }

        .itp-preview__chips {
          display: flex;
          flex-wrap: wrap;
          gap: .4rem;
          margin-bottom: .85rem;
        }
        .itp-chip {
          padding: .22rem .6rem;
          border-radius: 6px;
          font-size: .64rem;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
          background: #e8eef6;
          color: #2b4a6f;
          border: 1px solid #d5e0ec;
        }
        .itp-chip--gold {
          background: rgba(184,134,11,.12);
          color: #8a6408;
          border-color: rgba(184,134,11,.35);
        }

        .itp-preview__cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .7rem;
        }
        .itp-col {
          padding: .75rem .8rem;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #e2eaf3;
          box-shadow: 0 2px 6px -3px rgba(15,46,82,.16);
        }
        .itp-col--bn { border-left: 3px solid #b8860b; }
        .itp-col--en { border-left: 3px solid #0f2e52; }

        .itp-col__label {
          display: block;
          font-size: .6rem;
          font-weight: 800;
          letter-spacing: .11em;
          text-transform: uppercase;
          margin-bottom: .4rem;
          color: #7e93aa;
        }
        .itp-col--bn .itp-col__label { color: #a4760a; }

        .itp-col__text {
          margin: 0;
          font-size: .76rem;
          line-height: 1.6;
          color: #33475e;
        }
        .itp-col--bn .itp-col__text {
          font-family: 'Hind Siliguri', 'Inter', sans-serif;
          font-size: .8rem;
          line-height: 1.75;
        }

        .itp-hl {
          background: linear-gradient(180deg, transparent 52%, rgba(217,165,32,.55) 52%);
          padding: 0 .08em;
          border-radius: 2px;
          font-weight: 600;
          color: #1d2f45;
        }

        .itp-preview__footer {
          display: flex;
          align-items: center;
          gap: .45rem;
          margin-top: .85rem;
          padding-top: .8rem;
          border-top: 1px dashed #d5e0ec;
          font-size: .65rem;
          font-weight: 600;
          color: #7e93aa;
        }
        .itp-preview__footer svg { width: 13px; height: 13px; color: #b8860b; }

        .itp-float-badge {
          position: absolute;
          right: -6px;
          bottom: 26px;
          display: flex;
          align-items: center;
          gap: .5rem;
          padding: .6rem .9rem;
          border-radius: 12px;
          background: linear-gradient(150deg, #163e6b, #0b2340);
          border: 1px solid rgba(184,134,11,.55);
          box-shadow: 0 16px 34px -14px rgba(0,0,0,.9), 0 0 26px -8px rgba(184,134,11,.5);
          color: #eaf1f9;
          font-size: .72rem;
          font-weight: 700;
          white-space: nowrap;
          animation: itp-float 7s ease-in-out infinite .9s;
        }
        .itp-float-badge svg { width: 15px; height: 15px; color: #d9a520; flex: 0 0 auto; }
        .itp-float-badge span { color: #9db6d0; font-weight: 600; }

        .itp-stats {
          max-width: 1200px;
          margin: clamp(2rem, 4vw, 3rem) auto 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: .5rem;
          padding-top: 1.6rem;
          border-top: 1px solid rgba(255,255,255,.10);
          text-align: center;
        }
        .itp-stat__num {
          display: block;
          font-size: clamp(1.15rem, 2vw, 1.55rem);
          font-weight: 800;
          letter-spacing: -.02em;
          color: #f0cf7a;
          line-height: 1.2;
        }
        .itp-stat__label {
          display: block;
          margin-top: .2rem;
          font-size: .72rem;
          font-weight: 600;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: #8ba6c2;
        }

        @media (max-width: 980px) {
          .itp-promo__inner {
            grid-template-columns: minmax(0, 1fr);
            gap: 2.5rem;
          }
          .itp-preview-wrap { order: -1; max-width: 540px; width: 100%; margin: 0 auto; }
          .itp-preview { transform: none; }
          .itp-features { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 620px) {
          .itp-features { grid-template-columns: minmax(0, 1fr); }
          .itp-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.2rem .5rem; }
          .itp-cta { width: 100%; justify-content: center; }
          .itp-cta-note { width: 100%; text-align: center; align-items: center; }
          .itp-preview__cols { grid-template-columns: 1fr; }
          .itp-float-badge { right: 8px; bottom: -14px; font-size: .66rem; padding: .5rem .7rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .itp-promo *, .itp-promo *::before, .itp-promo *::after {
            animation: none !important;
            transition: none !important;
          }
          .itp-preview { transform: none; }
        }
      `}</style>

      <section className="itp-promo" aria-labelledby="itp-promo-title">
        <div className="itp-promo__inner">

          {/* ================= LEFT ================= */}
          <div className="itp-promo__content">

            <p className="itp-promo__eyebrow">
              <span className="itp-pulse" aria-hidden="true"></span>
              New · eLawyers BD Release
            </p>

            <h2 className="itp-promo__title" id="itp-promo-title">
              Digital Income Tax Act 2023 Portal
              <span className="itp-accent">বাংলা &amp; English</span>
            </h2>

            <p className="itp-promo__lede">
              Read the complete <strong>Income Tax Act, 2023</strong> in Bangla and English — side by side,
              fully searchable, and available offline.
              <span className="bn">পুরো আইন এখন আপনার হাতের মুঠোয় — দুই ভাষায়, পাশাপাশি।</span>
            </p>

            <ul className="itp-features">
              <li className="itp-feature">
                <span className="itp-feature__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z"/>
                  </svg>
                </span>
                <span className="itp-feature__text">
                  <span className="itp-feature__title">Bilingual Section Reading</span>
                  <span className="itp-feature__desc">Every section in authentic <span className="bn">বাংলা</span> and official English.</span>
                </span>
              </li>

              <li className="itp-feature">
                <span className="itp-feature__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="7.5" height="16" rx="1.6"/>
                    <rect x="13.5" y="4" width="7.5" height="16" rx="1.6"/>
                  </svg>
                </span>
                <span className="itp-feature__text">
                  <span className="itp-feature__title">Parallel Legal Comparison</span>
                  <span className="itp-feature__desc">Bangla &amp; English clause-by-clause, side by side.</span>
                </span>
              </li>

              <li className="itp-feature">
                <span className="itp-feature__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="6.5"/>
                    <path d="m16 16 4.5 4.5"/>
                  </svg>
                </span>
                <span className="itp-feature__text">
                  <span className="itp-feature__title">Instant Search</span>
                  <span className="itp-feature__desc">Blazing-fast lookup across all 25 Parts &amp; 345+ sections.</span>
                </span>
              </li>

              <li className="itp-feature">
                <span className="itp-feature__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z"/>
                  </svg>
                </span>
                <span className="itp-feature__text">
                  <span className="itp-feature__title">Offline Highlight &amp; Bookmarks</span>
                  <span className="itp-feature__desc">Mark clauses, save sections — works without internet.</span>
                </span>
              </li>
            </ul>

            <div className="itp-cta-row">
              <a
                className="itp-cta"
                href="https://incometaxact.elawyersbd.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Explore Income Tax Act 2023 — opens in a new tab"
              >
                Explore Income Tax Act 2023
                <span className="itp-cta__arrow" aria-hidden="true">↗</span>
              </a>

              <p className="itp-cta-note">
                <span><strong>Free to use</strong> · No sign-up required</span>
                <span className="bn">সম্পূর্ণ বিনামূল্যে · রেজিস্ট্রেশন লাগবে না</span>
              </p>
            </div>

          </div>

          {/* ================= RIGHT: preview ================= */}
          <div className="itp-preview-wrap" aria-hidden="true">
            <div className="itp-preview">

              <div className="itp-preview__bar">
                <span className="itp-preview__dot"></span>
                <span className="itp-preview__dot"></span>
                <span className="itp-preview__dot"></span>
                <span className="itp-preview__url">incometaxact.elawyersbd.com</span>
              </div>

              <div className="itp-preview__body">

                <div className="itp-preview__chips">
                  <span className="itp-chip">Part I</span>
                  <span className="itp-chip">Chapter 1</span>
                  <span className="itp-chip itp-chip--gold">Section 2</span>
                </div>

                <div className="itp-preview__cols">
                  <div className="itp-col itp-col--bn">
                    <span className="itp-col__label">বাংলা</span>
                    <p className="itp-col__text">
                      এই আইনে, বিষয় বা প্রসঙ্গের বিপরীতে অন্যরূপ না থাকলে,—
                      <span className="itp-hl">“আয়” অর্থ</span> অর্থবছরে অর্জিত যেকোনো লাভ বা মুনাফা।
                    </p>
                  </div>

                  <div className="itp-col itp-col--en">
                    <span className="itp-col__label">English</span>
                    <p className="itp-col__text">
                      In this Act, unless there is anything repugnant in the subject or context,—
                      <span className="itp-hl">“income” means</span> any profit or gain arising in an income year.
                    </p>
                  </div>
                </div>

                <div className="itp-preview__footer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z"/>
                  </svg>
                  Bookmarked · Highlighted · Saved offline
                </div>

              </div>
            </div>

            <div className="itp-float-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="6.5"/>
                <path d="m16 16 4.5 4.5"/>
              </svg>
              345+ sections <span>indexed</span>
            </div>
          </div>

        </div>

        {/* ================= STAT STRIP ================= */}
        <div className="itp-stats">
          <div className="itp-stat">
            <span className="itp-stat__num">25</span>
            <span className="itp-stat__label">Parts</span>
          </div>
          <div className="itp-stat">
            <span className="itp-stat__num">345+</span>
            <span className="itp-stat__label">Sections</span>
          </div>
          <div className="itp-stat">
            <span className="itp-stat__num">2</span>
            <span className="itp-stat__label">Languages</span>
          </div>
          <div className="itp-stat">
            <span className="itp-stat__num">100%</span>
            <span className="itp-stat__label">Offline Ready</span>
          </div>
        </div>

      </section>
    </>
  );
};
