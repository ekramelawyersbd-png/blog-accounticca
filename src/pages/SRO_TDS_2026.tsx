import React, { useEffect, useState } from 'react';
import { ServiceSEO } from '../components/SEO';

export default function SRO_TDS_2026_Content() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // 1. Reading Progress Bar
    const handleScroll = () => {
      let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      let scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll);

    // 2. Table Search & Filter Logic
    const tableContainers = document.querySelectorAll('.table-container');

    function toBengaliNumber(str: string) {
      const map: Record<string, string> = {'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
      return str.replace(/[0-9]/g, match => map[match]);
    }

    tableContainers.forEach(container => {
      const rateInput = container.querySelector('.search-rate') as HTMLInputElement;
      const textInput = container.querySelector('.search-text') as HTMLInputElement;
      const rows = container.querySelectorAll('tbody tr');
      const noResultsMsg = container.querySelector('.no-results') as HTMLElement;

      if (!rows.length || (!rateInput && !textInput)) return;

      const filterTable = () => {
        const rateQuery = rateInput ? rateInput.value.trim().toLowerCase() : '';
        const textQuery = textInput ? textInput.value.trim().toLowerCase() : '';
        
        const rateQueryBn = toBengaliNumber(rateQuery);
        const textQueryBn = toBengaliNumber(textQuery);

        let visibleCount = 0;

        rows.forEach(row => {
          const rowEl = row as HTMLElement;
          const rowText = rowEl.innerText.toLowerCase();
          const rateCell = (row as HTMLTableRowElement).cells.length >= 3 ? (row as HTMLTableRowElement).cells[2].innerText.toLowerCase() : rowText;

          const matchesRate = rateQuery === '' || rateCell.includes(rateQuery) || rateCell.includes(rateQueryBn);
          const matchesText = textQuery === '' || rowText.includes(textQuery) || rowText.includes(textQueryBn);

          if (matchesRate && matchesText) {
            rowEl.style.display = ''; 
            visibleCount++;
          } else {
            rowEl.style.display = 'none';
          }
        });

        if (noResultsMsg) {
          noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }
      };

      if (rateInput) rateInput.addEventListener('input', filterTable);
      if (textInput) textInput.addEventListener('input', filterTable);
    });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="font-serif bg-[#f8f9fa] text-[#2c2c2c] leading-[1.9] text-[16px]">
      <ServiceSEO
        title="উৎসে কর বিধিমালা ২০২৬: সম্পূর্ণ গাইড (SRO 273)"
        description="উৎসে কর বিধিমালা, ২০২৬ (এস.আর.ও. নং-২৭৩) এর পূর্ণাঙ্গ বিশ্লেষণ, কর হার, তফসিল এবং নিয়মাবলি।"
        serviceType="Legal & Tax Resource"
        canonicalUrl="/SRO/TDS2026"
      />

      <style>{`
        .blog-hero { background: linear-gradient(135deg, #1a3a5c 0%, #0f243b 100%); color: #fff; padding: 80px 20px 100px; text-align: center; position: relative; overflow: hidden; }
        .hero-content { max-width: 800px; margin: 0 auto; position: relative; z-index: 2; }
        .category-badge { background-color: #b8860b; color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .blog-hero h1 { font-size: 2.5rem; font-weight: 700; margin: 20px 0; line-height: 1.4; }
        .blog-meta { font-size: 0.9rem; color: #cbd5e1; display: flex; justify-content: center; gap: 20px; }
        .blog-container { max-width: 1200px; margin: -40px auto 60px; padding: 0 20px; display: grid; grid-template-columns: 1fr 320px; gap: 40px; }
        .post-content { background: #ffffff; padding: 45px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .post-content h2 { font-size: 1.5rem; color: #1a3a5c; margin: 45px 0 20px; padding-bottom: 10px; border-bottom: 2px solid #b8860b; display: flex; align-items: center; gap: 12px; }
        .num { background: #1a3a5c; color: #fff; font-size: 0.85rem; padding: 4px 12px; border-radius: 6px; font-weight: 600; }
        .table-container { margin: 30px 0; border: 1px solid #e1e4e8; border-radius: 10px; overflow: hidden; }
        .table-controls { display: flex; gap: 15px; padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e1e4e8; flex-wrap: wrap; }
        .table-controls input { padding: 10px 15px; border: 1px solid #e1e4e8; border-radius: 8px; font-size: 0.9rem; width: 220px; }
        .rate-col { text-align: center; font-weight: 700; color: #2c5f8a; }
        .no-results { text-align: center; padding: 20px; color: #555; display: none; }
        .proviso { background: #fff8e6; border-left: 4px solid #e6c36a; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; font-size: 0.95rem; }
        details { background: #f8fafc; border: 1px solid #e1e4e8; border-radius: 8px; margin: 20px 0; }
        summary { padding: 15px 20px; font-weight: 600; color: #1a3a5c; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .sticky-toc { position: sticky; top: 30px; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); }
      `}</style>

      {/* Progress Bar */}
      <div id="progress-bar" style={{ width: `${scrollProgress}%` }} className="fixed top-0 left-0 h-1 bg-[#b8860b] z-50"></div>

      {/* Hero */}
      <header className="blog-hero">
        <div className="hero-content">
          <span className="category-badge">ট্যাক্স আপডেট</span>
          <h1>উৎসে কর বিধিমালা ২০২৬: নতুন SRO ২৭৩ এর সম্পূর্ণ বিশ্লেষণ</h1>
          <div className="blog-meta">
            <span>📅 কার্যকর: ১ জুলাই, ২০২৬</span>
            <span>🏛️ জারিকৃত: জাতীয় রাজস্ব বোর্ড (NBR)</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="blog-container">
        <main className="post-content">
          <p>জাতীয় রাজস্ব বোর্ড (NBR) আয়কর আইন, ২০২৩ এর ধারা ৩৪৩ এর প্রদত্ত ক্ষমতাবলে একটি নতুন প্রজ্ঞাপন জারি করেছে। <strong>এস.আর.ও. নং-২৭৩-আইন/আয়কর-৫/২০২৬</strong> নামক এই প্রজ্ঞাপনের মাধ্যমে <strong>উৎসে কর বিধিমালা, ২০২৬</strong> প্রণয়ন করা হয়েছে। এই নতুন বিধিমালা ১ জুলাই, ২০২৬ তারিখ থেকে কার্যকর হয়েছে।</p>

          <section id="sec3">
            <h2><span className="num">০৩</span> ঠিকাদার, ইত্যাদির পরিশোধের বিপরীতে উৎসে কর কর্তন</h2>
            <div className="table-container">
              <div className="table-controls">
                <input type="text" className="search-rate" placeholder="🔍 করহার সার্চ করুন..." />
                <input type="text" className="search-text" placeholder="🔍 বিবরণ ফিল্টার করুন..." />
              </div>
              <div className="table-wrap">
                <table>
                  <thead className="bg-[#1a3a5c] text-white">
                    <tr><th className="p-4">ক্রমিক</th><th className="p-4">বর্ণনা</th><th className="p-4 text-center">হার</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['১', 'এমএস বিবেচি উৎপাদনে নিয়োজিত শিল্প প্রতিষ্ঠানের ক্ষেত্রে', '০.৫%'],
                      ['২', 'পেট্রোলিয়াম তেল এবং লুব্রিকেন্ট বিপণনে নিয়ুক্ত কোম্পানি', '০.৬%'],
                      ['১৮', 'পূর্ত কাজ, নির্মাণ, প্রকৌশল বা সমজাতীয় কাজের বিল', '৫%'],
                      ['১৯', 'সিগারেট, বিড়ি, জর্দা শিল্পে তামাকজাত কাঁচামাল', '১০%'],
                      ['২০', 'অন্যান্য সকল ক্ষেত্র', '৫%'],
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="p-4">{row[0]}</td>
                        <td className="p-4">{row[1]}</td>
                        <td className="p-4 rate-col">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="no-results">কোনো ফলাফল পাওয়া যায়নি।</div>
              </div>
            </div>
          </section>
        </main>

        <aside className="sidebar">
          <div className="sticky-toc">
            <h3 className="font-bold text-[#1a3a5c] mb-4 border-b-2 border-[#b8860b] pb-2">সূচিপত্র</h3>
            <ul className="space-y-2 text-sm text-[#555]">
              <li><a href="#sec3" className="block hover:text-[#1a3a5c] hover:font-bold">৩। ঠিকাদার ও পণ্য সরবরাহ</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}