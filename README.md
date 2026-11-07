# Accounticca × E-Lawyers BD — Legal, Tax & Corporate Compliance Suite

A full-stack Bangladeshi Legal, Tax, VAT, RJSC, and Corporate Compliance platform built with **React 19**, **TypeScript**, **Tailwind CSS 4**, **Express**, and **Firebase (Firestore & Auth)**.

---

## Core Modules & Capabilities

### 1. Bangladesh Individual Income Tax & Rebate Calculator (AY 2026–2027)
- **Category-Specific 0% Tax-Free Thresholds** (*Income Tax Act 2023 & Finance Ordinance*):
  - **General Taxpayers**: Tk. 4,00,000
  - **Female & Senior Citizens (65+)**: Tk. 4,50,000
  - **Third Gender & Persons with Disabilities**: Tk. 5,25,000
  - **Gazetted War-Wounded Freedom Fighters & July 2024 Injured Fighters**: Tk. 5,50,000
  - **Parent / Legal Guardian of Disabled Person**: +Tk. 50,000 per disabled child/dependant
- **Progressive Slabs**: Next Tk. 3,00,000 @ 10%, Next Tk. 4,00,000 @ 15%, Next Tk. 5,00,000 @ 20%, Next Tk. 20,00,000 @ 25%, Balance @ 30% (with interactive hoverable slab tooltips and step-by-step mathematical explanation).
- **Section 78 Investment Tax Rebate (3-Limit Comparison)**:
  - **Limit (a)**: `0.03 × Eligible Taxable Income`
  - **Limit (b)**: `0.10 × Total Allowable Investment (Part 3, 6th Schedule)`
  - **Limit (c)**: `Tk. 7,50,000` statutory cap
- **Monthly Salary TDS Calculator (Section 86)**: Calculates employer monthly withholding tax after 1/3 or Tk. 5,00,000 salary exemption and estimated investment rebate.

### 2. 32 Interactive Compliance, Tax, VAT, RJSC & Labour Tools (`/tools`)
- Income Tax, Rebate & Wealth Surcharge Calculators
- VAT Apportionment, VDS & Source Tax (TDS) Calculators
- RJSC Name Clearance, Share Capital & Annual Return Fee Calculators
- Bangladesh Labour Act Gratuity, Final Settlement & Overtime Calculators
- Property Registration, Stamp Duty & Capital Gains Calculators
- AI Tax Assistant & Statutory Notice Response Generator

### 3. Google Workspace & GitHub Sync Hub (`/workspace`)
- **8 Connected Google Workspace Integrations**: Google Drive, Sheets, Gmail, Calendar, Docs, Slides, Tasks, and Chat.
- **GitHub Repository Sync & Version Control Console**: Live Git status, secret-scan verification, commit history, and direct repository synchronization.
- **Tool Signings Ledger & Precedent Vault**: Real-time audit log of compliance tool usage and downloadable statutory templates.

### 4. Public Member Portal (`/auth`) & Client Portal (`/client-portal`)
- Multi-provider SSO (Google, GitHub, Microsoft, Facebook) with loading states and real-time password strength validation.
- Saved tax scenarios, appointment bookings, digital shop orders, and LMS course access.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS 4, Lucide Icons, Recharts, jsPDF
- **Backend**: Node.js, Express (`server.ts`), Nodemailer (Brevo SMTP Relay), AWS S3 SDK (Cloudflare R2)
- **Database & Auth**: Firebase Firestore (`firestore.rules`) & Firebase Authentication

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and populate your credentials:
```bash
cp .env.example .env
```

### 3. Run Development Server
Starts the Express backend and Vite middleware on `http://0.0.0.0:3000`:
```bash
npm run dev
```

### 4. Type-Check & Build for Production
```bash
npm run lint
npm run build
```

---

## GitHub Sync & Security Hygiene

- **Secret Protection**: All `.env*` files and runtime session/invoice JSON files in `data/*.json` are excluded via `.gitignore`.
- **Automated Verification**: Run `npm run lint` and `npm run build` before committing or syncing to GitHub.
