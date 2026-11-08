import React, { useState, useEffect, useRef } from 'react';

/* ================= TYPES ================= */
interface TableItem {
  id: string;
  desc: string;
  rate: string;
}

interface TableData {
  title: string;
  data: TableItem[];
  placeholderRate?: string;
  placeholderText?: string;
}

/* ================= DATA (Extracted from SRO 273) ================= */
const contractorData: TableItem[] = [
  { id: '১', desc: 'এমএস বিবেচি উৎপাদনে নিয়োজিত শিল্প প্রতিষ্ঠান এবং স্থানীয়ভাবে ক্রয়কৃত', rate: '০.৫%' },
  { id: '২', desc: 'পেট্রোলিয়াম তেল এবং লুব্রিকেন্ট বিপণন কোম্পানি কর্তৃক তেল সরবরাহ', rate: '০.৬%' },
  { id: '৩', desc: 'পেট্রোলিয়াম তেল বিপণন কোম্পানির ডিলার বা এজেন্ট কর্তৃক তেল সরবরাহ', rate: '১%' },
  { id: '৪', desc: 'ধান, চাল, গম, আলু, গবাদি পশু, মাছ, মাংস, পিয়াজ, রসুন, ডাল, ময়দা, লবণ, চিনি, কাঁচা চা-পাতা, ডিম, শাকসবজি, কাঁচা চামড়া, জৈব সার সরবরাহ', rate: '০.৫%' },
  { id: '৫', desc: 'স্বর্ণ, রৌপ্য, স্বর্ণালংকার, রত্ন-হীরক সরবরাহ', rate: '০.৫%' },
  { id: '৬', desc: 'সূতা সরবরাহের ক্ষেত্রে', rate: '১%' },
  { id: '৭', desc: 'সব ধরনের ফল সরবরাহ', rate: '২%' },
  { id: '৮', desc: 'শতভাগ রপ্তানিমুখী গার্মেন্টস শিল্প কর্তৃক প্রদত্ত সাব-কন্ট্রাক্ট', rate: '১%' },
  { id: '৯', desc: 'এমএস বিবেচি ব্যতীত সিমেন্ট, লৌহ বা লৌহ পণ্য, ফেরা অ্যালয় পণ্য সরবরাহ', rate: '২%' },
  { id: '১০', desc: 'তেলশোধন (oil refinery) কার্যক্রমে নিয়ুক্ত কোনো কোম্পানি কর্তৃক তেল সরবরাহ', rate: '১%' },
  { id: '১১', desc: 'গ্যাস ট্রান্সমিশনে নিয়োজিত কোম্পানি', rate: '৩%' },
  { id: '১২', desc: 'গ্যাস বিতরণে নিয়োজিত কোম্পানি', rate: '০.৬%' },
  { id: '১৩', desc: 'উৎপাদিত ৩৩ কেভি হইতে ৫০০ কেভি Extra High Voltage Power Cable সরবরাহ', rate: '৩%' },
  { id: '১৪', desc: 'সরকার, কর্পোরেশন বা সরকারের সংস্থা কর্তৃক বিল সরবরাহ', rate: '৩%' },
  { id: '১৫', desc: 'রিসাইকেল্ড- প্লাস্টিক, পলিথিন, ব্যাটারি, সিসা, ইলেকট্রিক্যাল, কাগজ, কাঁচ সরবরাহ', rate: '১%' },
  { id: '১৬', desc: 'রিসাইক্লিং শিল্পে ব্যবহৃত কাঁচামাল সরবরাহ', rate: '১%' },
  { id: '১৭', desc: 'শিল্পোৎপাদনে ব্যবহৃত কাঁচামাল এবং প্যাকিং ম্যাটেরিয়াল সরবরাহ', rate: '৩%' },
  { id: '১৮', desc: 'ম্যানুফ্যাকচারিং, প্রসেস বা কনভারশন, পূর্ত কাজ, নির্মাণ, প্রকৌশল কাজ', rate: '৫%' },
  { id: '১৯', desc: 'সিগারেট, বিড়ি, জর্দা ও গুল শিল্পে তামাকজাত কাঁচামাল সরবরাহ', rate: '১০%' },
  { id: '২০', desc: 'অন্যান্য সকল পণ্য সরবরাহ বা অন্যান্য সকল ক্ষেত্রে', rate: '৫%' },
];

const serviceData: TableItem[] = [
  { id: '১', desc: 'উপদেষ্টা বা পরামর্শক ফি (স্বাভাবিক ব্যক্তি: ১৫%, অন্যান্য: ৭.৫%)', rate: '১৫% / ৭.৫%' },
  { id: '২', desc: 'পেশাদার সেবা (Professional Service) ফি', rate: '১৫% / ৭.৫%' },
  { id: '৩', desc: 'কারিগরি সেবা ফি বা কারিগরি সহায়তা ফি', rate: '১৫% / ১০%' },
  { id: '৪', desc: 'ক্লিনিং, ব্যক্তিগত নিরাপত্তা, জনবল সরবরাহ, ক্রিয়েটিভ মিডিয়া', rate: '১০% (কমিশন) / ১% (বিল)' },
  { id: '৫', desc: 'ক্যাটারিং, জনসংযোগ, ইভেন্ট পরিচালনা, প্রশিক্ষণ, কুরিয়ার সার্ভিস', rate: '২% (বিল)' },
  { id: '৬', desc: 'ইভেন্টিং কমিশন', rate: '৭.৫%' },
  { id: '৭', desc: 'মিটিং ফি, প্রিন্টিং ফি বা সম্মানী', rate: '২০%' },
  { id: '৮', desc: 'মোবাইল নেটওয়ার্ক অপারেটর কর্তৃক প্রদত্ত সেবা', rate: '১০%' },
  { id: '৯', desc: 'ক্রেডিট রেটিং এজেন্সি', rate: '১০%' },
  { id: '১০', desc: 'মোটর গ্যারেজ বা ওয়ার্কশপ', rate: '৫%' },
  { id: '১১', desc: 'ব্যক্তিগত কন্টেইনার পোর্ট বা ডকইয়ার্ড', rate: '৫%' },
  { id: '১২', desc: 'শিপিং এজেন্সি', rate: '১০% / ১%' },
  { id: '১৩', desc: 'স্টিভেডোরিং/বার্থ অপারেটর/টার্মিনাল অপারেটর/শিপ হ্যান্ডলিং', rate: '১০% / ৫%' },
  { id: '১৪', desc: 'পরিবহন সেবা, গাড়ি ভাড়া, রাইড শেয়ারিং, ওয়ার্কিং স্পেস সরবরাহ', rate: '২% / ৩%' },
  { id: '১৫', desc: 'বিদ্যুৎ সঞ্চালনায় নিমিত্ত হুইলিং চার্জ', rate: '৫%' },
  { id: '১৬', desc: 'ইন্টারনেট সেবা', rate: '৫%' },
  { id: '১৭', desc: 'মোবাইল ফাইন্যান্সিয়াল সেবা প্রদানকারী এজেন্ট/ডিস্ট্রিবিউটর', rate: '১০%' },
  { id: '১৮', desc: 'ফ্রেইট ফরওয়ার্ডিং বাবদ পরিশোধিত কমিশন বা বিল', rate: '১০% / ১%' },
  { id: '১৯', desc: 'অন্যান্য কোনো সেবা (যা অন্য ধারায় করযোগ্য নয়)', rate: '১০%' },
];

const nonResidentData: TableItem[] = [
  { id: '১', desc: 'উপদেষ্টা বা পরামর্শক ফি (স্বাভাবিক ব্যক্তি: ২০%, অন্যান্য: ১০%)', rate: '২০% / ১০%' },
  { id: '২', desc: 'প্রি-শিপমেন্ট পরিদর্শন', rate: '২০%' },
  { id: '৩', desc: 'পেশাদার সেবা ফি', rate: '২০% / ১০%' },
  { id: '৪', desc: 'কারিগরি সেবা ফি বা সহায়তা ফি', rate: '২০% / ১০%' },
  { id: '৫', desc: 'আর্কিটেকচার, ইন্টেরিয়র ডিজাইন বা ল্যান্ডস্কেপ ডিজাইন', rate: '১৫%' },
  { id: '৬', desc: 'সার্টিফিকেশন, রেটিং ইত্যাদি ফি', rate: '১৫%' },
  { id: '৭', desc: 'স্যাটেলাইট, এয়ারটাইম বা চ্যানেল সম্প্রচার বাবদ ভাড়া', rate: '২০%' },
  { id: '৮', desc: 'আইনি সেবা ফি', rate: '২০%' },
  { id: '৯', desc: 'ইভেন্ট ম্যানেজমেন্টসহ ব্যবস্থাপনা সেবা', rate: '২০%' },
  { id: '১০', desc: 'কমিশন', rate: '১৫%' },
  { id: '১১', desc: 'রয়্যালটি, লাইসেন্স ফি বা স্পর্শাতীত সম্পত্তি', rate: '২০%' },
  { id: '১২', desc: 'সুদ পরিশোধ', rate: '১০%' },
  { id: '১৩', desc: 'বিজ্ঞাপন সম্প্রচার', rate: '১৫%' },
  { id: '১৪', desc: 'বিজ্ঞাপন নির্মাণ ও ডিজিটাল মার্কেটিং', rate: '১০%' },
  { id: '১৫', desc: 'সৌ পরিবহন বা বিমান পরিবহন (ধারা ২৫৯/২৬০ ব্যতীত)', rate: '৬%' },
  { id: '১৬', desc: 'কন্ট্রাক্টর/সাব-কন্ট্রাক্টর কর্তৃক ম্যানুফ্যাকচারিং, নির্মাণ কাজ', rate: '৬%' },
  { id: '১৭', desc: 'পণ্য সরবরাহ', rate: '৬%' },
  { id: '১৮', desc: 'মূলধন মুনাফা', rate: '১৫%' },
  { id: '১৯', desc: 'বীমা প্রিমিয়াম ফি', rate: '৫%' },
  { id: '২০', desc: 'যন্ত্রপাতি, সরঞ্জাম ইত্যাদি ভাড়া', rate: '৭.৫%' },
  { id: '২১', desc: 'লভ্যাংশ (কোম্পানি: ২০%, অন্যান্য: ২৫%)', rate: '২০% / ২৫%' },
  { id: '২২', desc: 'শিল্পী, গায়ক বা খেলোয়াড় কর্তৃক গৃহীত অর্থ', rate: '৩০%' },
  { id: '২৩', desc: 'বেতন বা পারিশ্রমিক', rate: '৩০%' },
  { id: '২৪', desc: 'পেট্রোলিয়াম অপারেশনের অনুসন্ধান বা ড্রিলিং', rate: '৫.২৫%' },
  { id: '২৫', desc: 'কয়লা, তেল বা গ্যাস অনুসন্ধানের জন্য সমীক্ষা', rate: '১৫%' },
  { id: '২৬', desc: 'জেনারেল ইন্স্যুরেন্স কোম্পানির সার্ভের ফি', rate: '৫.২৫%' },
  { id: '২৭', desc: 'তেল/গ্যাসক্ষেত্র এবং রপ্তানি পয়েন্টের মধ্যে সংযোগ সেবা', rate: '৫.২৫%' },
  { id: '২৮', desc: 'ব্যবস্থাপনা ফি বাবদ বিল', rate: '১০%' },
  { id: '২৯', desc: 'কুরিয়ার সার্ভিস', rate: '১০%' },
  { id: '৩০', desc: 'অন্য কোনো পরিশোধ', rate: '২০%' },
];

/* ================= REUSABLE COMPONENTS ================= */
const SearchableTable: React.FC<{ data: TableItem[], placeholderRate?: string, placeholderText?: string }> = ({ 
  data, 
  placeholderRate = "🔍 করহার সার্চ করুন...", 
  placeholderText = "🔍 বিবরণ ফিল্টার করুন..." 
}) => {
  const [rateQuery, setRateQuery] = useState('');
  const [textQuery, setTextQuery] = useState('');

  // Convert English numbers to Bengali for better searching
  const toBengaliNumber = (str: string) => {
    const map: { [key: string]: string } = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    return str.replace(/[0-9]/g, match => map[match]);
  };

  const filteredData = data.filter(item => {
    const rQuery = rateQuery.toLowerCase();
    const rQueryBn = toBengaliNumber(rQuery);
    const tQuery = textQuery.toLowerCase();
    const tQueryBn = toBengaliNumber(tQuery);

    const rateText = item.rate.toLowerCase();
    const descText = item.desc.toLowerCase();

    const matchesRate = rQuery === '' || rateText.includes(rQuery) || rateText.includes(rQueryBn);
    const matchesText = tQuery === '' || descText.includes(tQuery) || descText.includes(tQueryBn);

    return matchesRate && matchesText;
  });

  return (
    <div className="table-container">
      <div className="table-controls">
        <input 
          type="text" 
          placeholder={placeholderRate} 
          value={rateQuery}
          onChange={(e) => setRateQuery(e.target.value)}
        />
        <input 
          type="text" 
          placeholder={placeholderText} 
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ক্রমিক</th>
              <th>বর্ণনা</th>
              <th style={{ width: '120px' }} className="rate-col">হার</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={index}>
                <td>{item.id}</td>
                <td>{item.desc}</td>
                <td className="rate-col">{item.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="no-results">কোনো ফলাফল পাওয়া যায়নি।</div>
        )}
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function SRO273BlogPost() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('sec3');

  // Handle Scroll (Progress Bar and TOC Highlight)
  useEffect(() => {
    const handleScroll = () => {
      // Progress Bar
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      // Active TOC Link
      const sections = document.querySelectorAll('section');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 150) {
          current = section.getAttribute('id') || '';
        }
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 20,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="blog-app">
      {/* CSS STYLES */}
      <style>{`
        :root {
          --primary: #1a3a5c;
          --primary-light: #2c5f8a;
          --accent: #b8860b;
          --bg-color: #f8f9fa;
          --card-bg: #ffffff;
          --text-main: #2c2c2c;
          --text-muted: #555;
          --border-color: #e1e4e8;
          --table-head: #1a3a5c;
          --table-stripe: #f4f7f9;
          --proviso-bg: #fff8e6;
          --proviso-border: #e6c36a;
        }

        .blog-app {
          font-family: 'Noto Serif Bengali', serif;
          background-color: var(--bg-color);
          color: var(--text-main);
          line-height: 1.9;
          font-size: 16px;
          margin: 0;
          padding: 0;
        }

        #progress-bar {
          position: fixed;
          top: 0; left: 0; height: 4px;
          background: var(--accent);
          width: ${scrollProgress}%;
          z-index: 9999;
          transition: width 0.1s ease;
        }

        .blog-hero {
          background: linear-gradient(135deg, var(--primary) 0%, #0f243b 100%);
          color: #fff;
          padding: 80px 20px 100px;
          text-align: center;
          position: relative;
        }
        .hero-content { max-width: 800px; margin: 0 auto; position: relative; z-index: 2; }
        .category-badge {
          background-color: var(--accent); color: #fff;
          padding: 6px 16px; border-radius: 20px;
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 0.85rem; font-weight: 600;
        }
        .blog-hero h1 {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 2.5rem; font-weight: 700;
          margin: 20px 0; line-height: 1.4;
        }
        .blog-meta {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 0.9rem; color: #cbd5e1;
          display: flex; justify-content: center; gap: 20px;
        }

        .blog-container {
          max-width: 1200px; margin: -40px auto 60px; padding: 0 20px;
          display: grid; grid-template-columns: 1fr 320px; gap: 40px;
          position: relative; z-index: 10;
        }

        .post-content {
          background: var(--card-bg); padding: 45px;
          border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .post-content h2 {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.5rem; color: var(--primary);
          margin: 45px 0 20px; padding-bottom: 10px;
          border-bottom: 2px solid var(--accent);
          display: flex; align-items: center; gap: 12px;
        }
        .post-content h2:first-of-type { margin-top: 0; }
        .post-content h2 .num {
          background: var(--primary); color: #fff;
          font-size: 0.85rem; padding: 4px 12px;
          border-radius: 6px; font-weight: 600;
        }
        .post-content h3 {
          font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 1.15rem; color: var(--primary-light);
          margin: 30px 0 15px;
        }
        .post-content p { margin-bottom: 16px; text-align: justify; }
        .post-content ul { margin-bottom: 20px; padding-left: 20px; }
        .post-content li { margin-bottom: 10px; }

        .table-container {
          margin: 30px 0; border: 1px solid var(--border-color);
          border-radius: 10px; overflow: hidden; background: #fff;
        }
        .table-controls {
          display: flex; gap: 15px; padding: 15px 20px;
          background: #f8fafc; border-bottom: 1px solid var(--border-color); flex-wrap: wrap;
        }
        .table-controls input {
          padding: 10px 15px; border: 1px solid var(--border-color);
          border-radius: 8px; font-family: 'Noto Sans Bengali', sans-serif;
          font-size: 0.9rem; outline: none; width: 220px; transition: all 0.2s;
        }
        .table-controls input:focus {
          border-color: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(44, 95, 138, 0.1);
        }
        
        .table-wrap { overflow-x: auto; }
        table {
          width: 100%; border-collapse: collapse;
          font-family: 'Noto Sans Bengali', sans-serif; font-size: 0.9rem; min-width: 600px;
        }
        th {
          background: var(--table-head); color: #fff;
          padding: 14px 16px; text-align: left; font-weight: 600;
        }
        td {
          padding: 12px 16px; border-bottom: 1px solid var(--border-color); vertical-align: top;
        }
        tr:nth-child(even) { background: var(--table-stripe); }
        tr:hover { background: #eef4fa; }
        .rate-col { text-align: center; font-weight: 700; color: var(--primary-light); white-space: nowrap; }
        .no-results { text-align: center; padding: 20px; color: var(--text-muted); font-family: 'Noto Sans Bengali', sans-serif; }

        .proviso {
          background: var(--proviso-bg); border-left: 4px solid var(--proviso-border);
          padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; font-size: 0.95rem;
        }
        
        details {
          background: #f8fafc; border: 1px solid var(--border-color);
          border-radius: 8px; margin: 20px 0; overflow: hidden;
        }
        summary {
          padding: 15px 20px; font-family: 'Noto Sans Bengali', sans-serif;
          font-weight: 600; color: var(--primary); cursor: pointer;
          list-style: none; display: flex; justify-content: space-between; align-items: center;
          background: #eef4fa;
        }
        summary::-webkit-details-marker { display: none; }
        summary::after { content: '▼'; font-size: 0.8rem; transition: transform 0.3s; }
        details[open] summary::after { transform: rotate(180deg); }
        .details-content { padding: 20px; border-top: 1px solid var(--border-color); font-size: 0.95rem; }

        .sidebar { position: relative; }
        .sticky-toc {
          position: sticky; top: 30px; background: var(--card-bg);
          padding: 25px; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          max-height: calc(100vh - 60px); overflow-y: auto;
        }
        .sticky-toc h3 {
          font-family: 'Noto Sans Bengali', sans-serif; font-size: 1.1rem;
          color: var(--primary); margin-bottom: 15px;
          padding-bottom: 10px; border-bottom: 2px solid var(--accent);
        }
        .toc-list { list-style: none; display: flex; flex-direction: column; gap: 5px; padding: 0; }
        .toc-btn {
          width: 100%; text-align: left; background: none; border: none;
          color: var(--text-muted); text-decoration: none;
          font-family: 'Noto Sans Bengali', sans-serif; font-size: 0.9rem;
          padding: 8px 10px; border-radius: 6px; transition: all 0.2s; cursor: pointer;
        }
        .toc-btn:hover, .toc-btn.active {
          background: #eef4fa; color: var(--primary); font-weight: 600; padding-left: 15px;
        }

        @media (max-width: 992px) {
          .blog-container { grid-template-columns: 1fr; margin-top: -20px; }
          .sidebar { display: none; }
          .blog-hero h1 { font-size: 2rem; }
          .post-content { padding: 25px; }
        }
        @media (max-width: 600px) {
          .table-controls { flex-direction: column; }
          .table-controls input { width: 100%; }
          .blog-meta { flex-direction: column; gap: 5px; }
        }
      `}</style>

      {/* Reading Progress */}
      <div id="progress-bar"></div>

      {/* Hero Section */}
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

      {/* Main Layout */}
      <div className="blog-container">
        <main className="post-content">
          <p><strong>জাতীয় রাজস্ব বোর্ড (NBR)</strong> আয়কর আইন, ২০২৩ এর ধারা ৩৪৩ এর প্রদত্ত ক্ষমতাবলে একটি নতুন প্রজ্ঞাপন জারি করেছে। <strong>এস.আর.ও. নং-২৭৩-আইন/আয়কর-৫/২০২৬</strong> নামক এই প্রজ্ঞাপনের মাধ্যমে <strong>উৎসে কর বিধিমালা, ২০২৬</strong> প্রণয়ন করা হয়েছে। এই নতুন বিধিমালা ১ জুলাই, ২০২৬ তারিখ থেকে কার্যকর হবে এবং এর মাধ্যমে ০৮ জুন ২০২৬ তারিখে জারিকৃত পূর্ববর্তী এস.আর.ও. নং ২১০ রহিত করা হয়েছে।</p>
          
          <p>এই ব্লগ পোস্টে নতুন বিধিমালার সম্পূর্ণ বিস্তারিত, করহার, শর্তাবলি এবং তফসিলসমূহ তুলে ধরা হয়েছে। নিচের ইন্টারঅ্যাকটিভ টেবিলগুলো ব্যবহার করে আপনি সহজেই আপনার প্রযোজ্য করহার খুঁজে নিতে পারবেন।</p>

          <section id="sec1">
            <h2><span className="num">০১</span> শিরোনাম ও প্রবর্তন</h2>
            <p><strong>(১)</strong> এই বিধিমালা <strong>উৎসে কর বিধিমালা, ২০২৬</strong> নামে অভিহিত হইবে।</p>
            <p><strong>(২)</strong> এই বিধিমালা ১ জুলাই, ২০২৬ খ্রিষ্টাব্দ হইতে কার্যকর হইয়া বিলুপ্ত গণ্য হইবে।</p>
          </section>

          <section id="sec2">
            <h2><span className="num">০২</span> সংজ্ঞা</h2>
            <p>বিষয় বা প্রসঙ্গের পরিপ্রেক্ষিতে কিছু না থাকিলে, এই বিধিমালায়—</p>
            <ul>
              <li><strong>(ক) “আইন”</strong> অর্থ আয়কর আইন, ২০২৩ (২০২৩ সনের ১২ নং আইন);</li>
              <li><strong>(খ) “অর্ধ-পরিশোধনের জন্য দায়িত্বপ্রাপ্ত ব্যক্তি”</strong> অর্থ আইন, ২০২৩ এর ধারা ১৪০ এর দফা (১) এ সংজ্ঞায়িত ব্যক্তি;</li>
              <li><strong>(গ) “কাঁচামাল”</strong> অর্থ আয়কর আইন, ২০২৩ এর ধারা ২ এর দফা (৩০ক) এ সংজ্ঞায়িত কাঁচামাল;</li>
              <li><strong>(ঘ) “ডেভেলপার”</strong> অর্থ আয়কর আইন, ২০২৩ এর ধারা ১৪০ এর দফা (৫) এ সংজ্ঞায়িত ডেভেলপার;</li>
              <li><strong>(ঙ) “ডেভেলপার বা রিয়েল এস্টেট ডেভেলপার”</strong> বলিতে রিয়েল এস্টেট উন্নয়ন ও ব্যবস্থাপনা আইন, ২০১০ এ বিধৃত ডেভেলপার বা রিয়েল এস্টেট ডেভেলপারকে বুঝাইবে...</li>
              <li><strong>(চ) “ডেভেলপার বা রিয়েল এস্টেট ডেভেলপারের অনুরূপ কার্যাবলি”</strong> বলিতে নিম্নবর্ণিত বিষয়াদি অন্তর্ভুক্ত হইবে: (অ) Irrevocable Power of Attorney মূলে ভূমি বিক্রয়; (আ) রাস্তা নির্মাণপূর্বক ভূমি বিক্রয়; (ই) বাণিজ্যিক উদ্দেশ্যে ভবন নির্মাণ ও বিক্রয়; (ঈ) under any arrangement বাণিজ্যিক উদ্দেশ্যে বিক্রয়।</li>
            </ul>
          </section>

          <section id="sec3">
            <h2><span className="num">০৩</span> ঠিকাদার, ইত্যাদির পরিশোধের বিপরীতে উৎসে কর কর্তন</h2>
            <p><strong>(১)</strong> ধারা ৮৯ এর অধীন নিম্নবর্ণিত সারণীতে উল্লিখিত হার অনুযায়ী যে-কোনো পরিমাণ ভিত্তিমূল্যের উপর উৎসে কর কর্তন করিতে হইবে, যথা:—</p>
            <SearchableTable data={contractorData} />
            
            <div className="proviso">
              তবে শর্ত থাকে যে, <strong>পেট্রোল পাম্প বা সিএনজি স্টেশন</strong> কর্তৃক তেল বা গ্যাস সরবরাহের ক্ষেত্রে উৎসে কর কর্তন প্রয়োজন হইবে না।
            </div>
            
            <p><strong>(২)</strong> যেইক্ষেত্রে কোনো আমদানিকৃত পণ্যের বিপরীতে ধারা ১২০ এর অধীন কর পরিশোধিত হইয়াছে এবং উক্ত আমদানিকৃত পণ্য সরবরাহ করা হয়, সেইক্ষেত্রে উৎসে করের পরিমাণ <strong>(খ−ক)</strong> নিয়মে নির্ধারিত হইবে।</p>
            <p><strong>(৩)</strong> যেইক্ষেত্রে ধারা ৯৪ এর অধীন উৎসে কর পরিশোধিত কোনো পণ্য সরবরাহ করা হয়, সেইক্ষেত্রে উৎসে করের পরিমাণ <strong>(খ−ক)</strong> নিয়মে নির্ধারিত হইবে।</p>
            <div className="proviso">
              তবে শর্ত থাকে যে, ডিস্ট্রিবিউটর বা অন্য কোনো ব্যক্তি কর্তৃক পণ্য সরবরাহের ক্ষেত্রে <strong>খ = (বিক্রয়মূল্য × ৫% × ১০%)।</strong>
            </div>
          </section>

          <section id="sec4">
            <h2><span className="num">০৪</span> সেবার ক্ষেত্রে পরিশোধ হইতে কর্তন</h2>
            <p><strong>(১)</strong> ধারা ৯০ এর অধীন কোনো সেবার জন্য কোনো নিদিষ্ট ব্যক্তি কর্তৃক কোনো নিবাসীক কোনো নিদিষ্ট পরিমাণ অর্থ প্রদান করা হইলে অর্থ পরিশোধের জন্য দায়িত্বপ্রাপ্ত ব্যক্তি অর্থ পরিশোধের সময়, নিম্নবর্ণিত সারণী মোতাবেক উৎসে কর কর্তন করিবেন:—</p>
            <SearchableTable data={serviceData} placeholderRate="🔍 করহার সার্চ (যেমন: ১০%)" />
            
            <div className="proviso">
              তবে শর্ত থাকে যে, সারণীর ক্রমিক নং ১ হইতে ১৮ এ বর্ণিত ক্ষেত্র ব্যতীত অন্য কোনো সেবা যদি কোনো ব্যাংক, ইন্স্যুরেন্স, আর্থিক প্রতিষ্ঠান বা মোবাইল ফাইন্যান্সিয়াল সেবা প্রদানকারী কোনো প্রতিষ্ঠান কর্তৃক প্রদত্ত হয় তাহা হইলে উহার উপর এই বিধি অধীন কর কর্তন প্রযোজ্য হইবে না;
            </div>
          </section>

          <section id="sec5">
            <h2><span className="num">০৫</span> অনিবাসীর আয় হইতে কর কর্তন বা সংগ্রহ</h2>
            <p><strong>(১)</strong> ধারা ১১৯ এর অধীন যেইক্ষেত্রে কোনো নিদিষ্ট ব্যক্তি বা দায়িত্বপ্রাপ্ত অন্য যেকোনো ব্যক্তি কোনো অনিবাসীকে এইরূপ কোনো অর্থ পরিশোধ করেন যাহা এই আইনের অধীন উক্ত অনিবাসীর জন্য করযোগ্য, সেইক্ষেত্রে উক্ত অর্থ পরিশোধের সময় নিম্নবর্ণিত সারণীতে উল্লেখিত হারে কর কর্তন বা সংগ্রহ করিবেন, যথা:</p>
            <SearchableTable data={nonResidentData} placeholderRate="🔍 করহার সার্চ (যেমন: ২০%)" />
          </section>

          <section id="sec6">
            <h2><span className="num">০৬</span> সম্পত্তি হস্তান্তর ও রিয়েল এস্টেট হইতে কর সংগ্রহ</h2>
            <p>ধারা ১২৫ এবং ১২৬ এর অধীন সম্পত্তি রেজিস্ট্রেশনের সময় উৎসে কর পরিশোধের প্রমাণ দাখিল করতে হবে।</p>
            <div className="table-container">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>এলাকা</th><th className="rate-col">করহার</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>ঢাকা, গাজীপুর, নারায়ণগঞ্জ, মুন্সিগঞ্জ, মানিকগঞ্জ, নরসিংদী এবং চট্টগ্রাম জেলা</td><td className="rate-col">ভূমির মূল্যের ৫%</td></tr>
                    <tr><td>অন্য যেকোনো জেলা</td><td className="rate-col">ভূমির মূল্যের ৩%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="proviso">
              <strong>বিশেষ দ্রষ্টব্য:</strong> সিটি কর্পোরেশন, পৌরসভা ও ক্যান্টনমেন্ট বোর্ড এলাকায় সম্পত্তি রেজিস্ট্রেশনকালে দাতা ও গ্রহীতার রিটার্ন দাখিলের প্রমাণ (PSR) উপস্থাপন করতে হবে।
            </div>
          </section>

          <section id="sec8">
            <h2><span className="num">০৮</span> আমদানিকারকদের নিকট হইতে কর সংগ্রহ</h2>
            <p>কাস্টমস কমিশনার পণ্য আমদানির সময় নিম্নলিখিত হারে উৎসে কর সংগ্রহ করবেন।</p>
            <div className="table-container">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>বিভাগ</th><th className="rate-col">হার</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>সারণী-১ (খাদ্যশস্য, সার, ওষুধ, মূলধনি যন্ত্রপাতি ইত্যাদি)</td><td className="rate-col">০%</td></tr>
                    <tr><td>সারণী-২ (ভুটান হইতে আমদানি - সবজি, ফল, মসলা ইত্যাদি)</td><td className="rate-col">০%</td></tr>
                    <tr><td>সারণী-৩ (মোবাইল পার্টস, ইলেকট্রনিক্স, যন্ত্রাংশ)</td><td className="rate-col">১%</td></tr>
                    <tr><td>সারণী-৪ (রসুন, মটর, গম, চাল, সয়াবিন বীজ ইত্যাদি)</td><td className="rate-col">২%</td></tr>
                    <tr><td>সারণী-৫ (শিল্পের কাঁচামাল - ইন্ডাস্ট্রিয়াল IRC ধারীদের জন্য)</td><td className="rate-col">৩%</td></tr>
                    <tr><td>সারণী-৫ এর বাইরে অন্যান্য পণ্য (ইন্ডাস্ট্রিয়াল IRC ধারীদের জন্য)</td><td className="rate-col">৪%</td></tr>
                    <tr><td>সারণী-৬ (মদ, স্পিরিট, পারফিউম ইত্যাদি)</td><td className="rate-col">২০%</td></tr>
                    <tr><td>সারণী-৭ (লোহার স্ক্র্যাপ, জাহাজ ভাঙা ইত্যাদি)</td><td className="rate-col">৬০০ টাকা/টন</td></tr>
                    <tr><td>সাধারণ অন্যান্য পণ্য</td><td className="rate-col">৫%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="sec9">
            <h2><span className="num">০৯</span> কর জমাদানের সময়সীমা</h2>
            <div className="table-container">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>কর্তন/সংগ্রহের সময়</th><th>জমাদানের শেষ সময়</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>জুলাই থেকে মে মাসের যেকোনো সময়</td><td>সংগ্রহের মাসের শেষে পরবর্তী ০২ সপ্তাহের মধ্যে</td></tr>
                    <tr><td>জুন মাসের ১ম থেকে ২০তম দিন</td><td>সংগ্রহের দিনের পরবর্তী ০৭ দিনের মধ্যে</td></tr>
                    <tr><td>জুন মাসের অন্যান্য দিন</td><td>সংগ্রহের পরবর্তী দিন</td></tr>
                    <tr><td>জুন মাসের শেষ কর্মদিবস</td><td>সংগ্রহের দিন (একই দিনে)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sticky-toc">
            <h3>এই আর্টিকেলে যা আছে</h3>
            <div className="toc-list">
              <button className={`toc-btn ${activeSection === 'sec1' ? 'active' : ''}`} onClick={() => scrollToSection('sec1')}>০১। শিরোনাম ও প্রবর্তন</button>
              <button className={`toc-btn ${activeSection === 'sec2' ? 'active' : ''}`} onClick={() => scrollToSection('sec2')}>০২। সংজ্ঞা</button>
              <button className={`toc-btn ${activeSection === 'sec3' ? 'active' : ''}`} onClick={() => scrollToSection('sec3')}>০৩। ঠিকাদার ও পণ্য সরবরাহ</button>
              <button className={`toc-btn ${activeSection === 'sec4' ? 'active' : ''}`} onClick={() => scrollToSection('sec4')}>০৪। সেবার ক্ষেত্রে কর</button>
              <button className={`toc-btn ${activeSection === 'sec5' ? 'active' : ''}`} onClick={() => scrollToSection('sec5')}>০৫। অনিবাসীদের আয়</button>
              <button className={`toc-btn ${activeSection === 'sec6' ? 'active' : ''}`} onClick={() => scrollToSection('sec6')}>০৬। সম্পত্তি ও রিয়েল এস্টেট</button>
              <button className={`toc-btn ${activeSection === 'sec8' ? 'active' : ''}`} onClick={() => scrollToSection('sec8')}>০৮। আমদানি পণ্য</button>
              <button className={`toc-btn ${activeSection === 'sec9' ? 'active' : ''}`} onClick={() => scrollToSection('sec9')}>০৯। জমাদানের সময়সীমা</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}