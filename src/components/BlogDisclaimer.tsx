import React from 'react';

export function BlogDisclaimer({ topic = 'the subject matter discussed' }: { topic?: string }) {
  return (
    <section className="bg-slate-50 p-6 sm:p-10 border-l-4 border-amber-600 rounded-r-2xl my-12 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Disclaimer</h2>
        <div className="space-y-4 text-[#04296f] text-[12px] leading-[16px]">
          <p>
            The information provided in this article is intended for general informational
            and educational purposes only. It should not be considered as legal, accounting,
            financial, or professional corporate compliance advice.
          </p>
          <p>
            This article provides a general overview of {topic},
            based on publicly available information. Regulatory requirements, filing procedures,
            fees, forms, and deadlines may change from time to time.
          </p>
          <p>
            Readers and businesses should verify the latest requirements directly from the
            relevant official platforms or consult qualified legal, corporate secretarial,
            or accounting professionals before making compliance decisions.
          </p>
          <p>
            E-Lawyers and associated parties shall not be responsible for any loss,
            penalties, delays, or legal consequences resulting from reliance on the
            information provided in this article.
          </p>
          <p>
            This content does not create any professional-client relationship between
            the reader and E-Lawyers or any legal professional mentioned.
          </p>
        </div>
      </div>
    </section>
  );
}
