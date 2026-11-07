const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function renderBanner() {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Hind+Siliguri:wght@500;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 675px;
      background: linear-gradient(135deg, #0b1a2d 0%, #10243a 45%, #134e5e 100%);
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 50px 60px;
      position: relative;
      overflow: hidden;
    }
    
    /* Decorative subtle background accents */
    .glow-1 {
      position: absolute;
      top: -100px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(22, 125, 131, 0.4) 0%, rgba(0,0,0,0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    .glow-2 {
      position: absolute;
      bottom: -120px;
      left: 15%;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(199, 167, 107, 0.25) 0%, rgba(0,0,0,0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    /* Top Brand Bar */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.12);
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
      color: #ddc38f;
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    }
    .brand-text h2 {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #ddc38f;
    }
    .brand-text p {
      font-size: 12px;
      color: #c5d5df;
      letter-spacing: 0.05em;
    }
    
    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1.5px solid rgba(52, 211, 153, 0.4);
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      color: #6ee7b7;
      letter-spacing: 0.03em;
    }
    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 10px #34d399;
    }

    /* Main Center Grid */
    .hero-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 40px;
      align-items: center;
      z-index: 10;
      margin: 15px 0;
    }

    .left-col .sub-pill {
      display: inline-block;
      background: rgba(199, 167, 107, 0.2);
      border: 1px solid rgba(221, 195, 143, 0.45);
      color: #f7e3ba;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .title-en {
      font-size: 42px;
      font-weight: 900;
      line-height: 1.12;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .title-bn {
      font-family: 'Hind Siliguri', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: #ddc38f;
      margin-bottom: 20px;
    }
    
    .feature-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 13px;
      color: #e2e8f0;
    }
    .feature-icon {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: rgba(22, 125, 131, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #5eead4;
      font-size: 14px;
      flex-shrink: 0;
    }

    /* Right Card (Info Specs) */
    .right-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      border: 1.5px solid rgba(255, 255, 255, 0.18);
      border-radius: 20px;
      padding: 24px 26px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      position: relative;
    }
    .card-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header h3 {
      font-size: 14px;
      font-weight: 800;
      color: #ddc38f;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .spec-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13px;
    }
    .spec-label {
      color: #94a3b8;
      font-weight: 600;
    }
    .spec-val {
      color: #ffffff;
      font-weight: 800;
      text-align: right;
    }
    .highlight-gold {
      color: #f6d289;
    }
    .highlight-green {
      color: #6ee7b7;
    }

    /* Bottom Contact Bar */
    .bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 16px;
      z-index: 10;
      font-size: 13px;
      color: #cbd5e1;
    }
    .office-address {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .contacts-group {
      display: flex;
      align-items: center;
      gap: 24px;
      font-weight: 700;
      color: #ffffff;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .gold-accent {
      color: #ddc38f;
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>

  <!-- Top Brand Row -->
  <div class="top-bar">
    <div class="brand-group">
      <div class="brand-logo">ELA</div>
      <div class="brand-text">
        <h2>E-Lawyers Legal &amp; Business Consultancy Firm</h2>
        <p>Customer Care &amp; Call Center Division · Panthapath, Dhaka</p>
      </div>
    </div>
    <div class="status-badge">
      <div class="status-dot"></div>
      <span>NOW RECRUITING · 2 VACANCIES</span>
    </div>
  </div>

  <!-- Main Hero Grid -->
  <div class="hero-grid">
    <div class="left-col">
      <div class="sub-pill">Official Job Circular 2026</div>
      <h1 class="title-en">Customer Care Executive</h1>
      <div class="title-bn">Call Center &amp; Client Communication Desk · Female</div>
      
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-icon">📞</div>
          <span>Inbound &amp; Courtesy Calls</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💬</div>
          <span>WhatsApp &amp; Live Chat Desk</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📅</div>
          <span>Consultation Scheduling</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🛡️</div>
          <span>Safe Corporate Environment</span>
        </div>
      </div>
    </div>

    <!-- Right Specifications Card -->
    <div class="right-card">
      <div class="card-header">
        <h3>Role Overview</h3>
        <span style="font-size: 11px; color: #94a3b8; font-weight: 700;">PANTHAPATH, DHAKA</span>
      </div>
      <div class="spec-row">
        <span class="spec-label">Position</span>
        <span class="spec-val">Customer Care Executive</span>
      </div>
      <div class="spec-row">
        <span class="spec-label">Target Applicants</span>
        <span class="spec-val highlight-gold">Female Candidates (2 Vacancies)</span>
      </div>
      <div class="spec-row">
        <span class="spec-label">Minimum Education</span>
        <span class="spec-val">HSC / Graduate (Any Subject)</span>
      </div>
      <div class="spec-row">
        <span class="spec-label">Experience</span>
        <span class="spec-val highlight-green">Freshers Highly Encouraged</span>
      </div>
      <div class="spec-row">
        <span class="spec-label">Remuneration</span>
        <span class="spec-val">Negotiable + 2 Festival Bonuses</span>
      </div>
      <div class="spec-row" style="border-bottom: none;">
        <span class="spec-label">Application Deadline</span>
        <span class="spec-val highlight-gold">31 October 2026</span>
      </div>
    </div>
  </div>

  <!-- Bottom Location & Contacts Bar -->
  <div class="bottom-bar">
    <div class="office-address">
      <span class="gold-accent">📍 Workplace:</span>
      <span>G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka-1205</span>
    </div>
    <div class="contacts-group">
      <div class="contact-item">
        <span class="gold-accent">✉️</span>
        <span>career@elawyersbd.com</span>
      </div>
      <div class="contact-item">
        <span class="gold-accent">📞</span>
        <span>+880 1313-583838</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const outputPath = path.resolve(__dirname, '../public/customer-care-executive-recruitment.png');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 675, deviceScaleFactor: 2 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();

  console.log('Saved banner to:', outputPath);
}

renderBanner().catch(err => {
  console.error('Banner generation error:', err);
  process.exit(1);
});
