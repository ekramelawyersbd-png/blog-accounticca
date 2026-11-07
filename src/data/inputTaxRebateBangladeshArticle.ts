import { Article } from '../types';

export const inputTaxRebateBangladeshArticle: Article = {
  id: 'input-tax-rebate-bangladesh-vat-guide',
  title: 'Comprehensive Guide to Input Tax Rebate (উপকরণ কর রেয়াত) in Bangladesh: Section 46 Conditions, Mushak 4.3, AT vs. Import VAT & Mushak 9.1 Calculation',
  metaTitle: 'Input Tax Rebate (উপকরণ কর রেয়াত) in Bangladesh: Complete VAT Act 2012 Section 46 & Mushak 9.1 Guide',
  metaDescription: 'Learn how to legally claim and optimize Input Tax Rebate (উপকরণ কর রেয়াত) under Section 46 & 47 of the Bangladesh VAT & SD Act 2012—covering Mushak 6.3, Mushak 4.3 coefficient, BDT 100,000 banking rule, 4-month window, AT vs. Import VAT, VDS interaction, and a step-by-step Mushak 9.1 calculation example.',
  excerpt: 'Understanding how to legally claim and optimize your Input Tax Rebate (উপকরণ কর রেয়াত) under Sections 46 and 47 of the Bangladesh Value Added Tax and Supplementary Duty Act, 2012. Includes the core Mushak 9.1 calculation formula, visual eligibility flowcharts, disallowed credits, partial apportionment, Advance Tax (AT) vs. Import VAT comparison, a complete Mushak 4.3 sample template, VDS interaction rules, a worked manufacturing return example, and a 6-point monthly compliance checklist.',
  content: `
**Understanding how to legally claim and optimize your Input Tax Rebate (উপকরণ কর রেয়াত) under the Bangladesh VAT and Supplementary Duty Act, 2012.**

In Bangladesh, under the **Value Added Tax and Supplementary Duty Act, 2012** (primarily **Section 46**), calculating an **Input Tax Rebate (উপকরণ কর রেয়াত)** allows a VAT-registered entity to deduct the VAT paid on its business inputs (raw materials, packing materials, imported goods, and taxable services) from the Output VAT collected on its sales.

*(Need to set up your e-BIN or review general monthly return filing? Explore our companion guides: [Business Identification Number (BIN) Registration in Bangladesh](/article/bin-registration-in-bangladesh) and [Corporate VAT Compliance & Monthly Return Protocol (Mushak 9.1)](/article/corporate-vat-compliance-monthly-return-protocol-bangladesh).)*

---

## 1. The Core Calculation Formula

The net monthly VAT payable to the **National Board of Revenue (NBR)** in your monthly return (**Form Mushak 9.1**) is calculated as:

> **Net Payable VAT = Total Output VAT (Sales) − Total Eligible Input Tax Rebate (Purchases) + Increasing Adjustments − Decreasing Adjustments**

### Visual Flow: How Net Payable VAT is Computed

\`\`\`text
+-------------------------------------------------------------------+
|                   TOTAL OUTPUT VAT (Part-3)                       |
|      15% VAT collected on Sales via Form Mushak 6.3 Invoices      |
+-------------------------------------------------------------------+
                                  |
                                  v  [ MINUS (-) ]
+-------------------------------------------------------------------+
|              ELIGIBLE INPUT TAX REBATE (Part-4)                   |
|   15% VAT paid on Local Purchases (Mushak 6.3) & Imports (BOE)    |
+-------------------------------------------------------------------+
                                  |
                                  v  [ PLUS (+) / MINUS (-) ]
+-------------------------------------------------------------------+
|              NET ADJUSTMENTS (Part-5 & Part-6)                    |
|   (+) Unpaid >6 Months / Credit Notes Received                    |
|   (-) Advance Tax (AT) at Import / VDS Certificates (Mushak 6.6)  |
+-------------------------------------------------------------------+
                                  |
                                  v  [ EQUALS (=) ]
+===================================================================+
|             NET PAYABLE VAT (Treasury Deposit / Challan)          |
+===================================================================+
\`\`\`

- **Output VAT**: VAT collected on taxable sales issued via **Form Mushak 6.3** tax invoices during the tax period (month).
- **Input Tax Rebate**: VAT paid on eligible business purchases supported by valid **Mushak 6.3** tax invoices or customs **Bills of Entry (BOE)**.
- **Increasing / Decreasing Adjustments**: Includes **Advance Tax (AT)** paid at import, **VAT Deducted at Source (VDS)**, debit/credit notes (**Mushak 6.7 / 6.8**), or carry-forward negative balances from previous tax periods.

---

## 2. Key Conditions for Rebate Eligibility (Section 46)

Every Input Tax Rebate claim in **Mushak 9.1** must be backed by strict statutory documentation and banking compliance. To legally claim an Input Tax Rebate in **Part-4** of your monthly **Mushak 9.1** return, your purchase must satisfy **Section 46 of the VAT & SD Act, 2012**:

1. **Valid Tax Documentation**:
   - **Local Purchases**: Must be supported by an original **Form Mushak 6.3 (Tax Invoice)** containing both the supplier's and buyer's **13-digit BIN** and address.
   - **Imported Goods**: Must be supported by a valid Customs **Bill of Entry (BOE)** for home consumption and corresponding **Treasury Challan** / payment proof.
   - **Imported Services**: Supported by a **Treasury Challan** showing reverse-charge VAT deposited by the recipient.
2. **Input-Output Coefficient Declaration (Mushak 4.3)**:
   - Any raw material, packing material, or input used in manufacturing or supply **must be declared beforehand** to the divisional VAT officer via **Form Mushak 4.3 (Input-Output Coefficient)**.
   - If the price of inputs changes by more than **7.5%**, a revised **Mushak 4.3** must be filed.
3. **Statutory Register Maintenance**:
   - All purchases must be recorded in your **Purchase Register (Form Mushak 6.1)** or **Purchase-Sales Register (Form Mushak 6.2.1)** for commercial importers/traders using the same item names and units declared in Mushak 4.3.
4. **Tax Rate Alignment (Standard Rate Rule)**:
   - Full input tax rebate is **only allowed** if your output (sales) is subject to the **Standard VAT Rate (15%)** or is **Zero-Rated (0% — e.g., Direct or Deemed Exports)**.
   - Businesses paying VAT at **reduced/truncated rates** (e.g., **5%, 7.5%, 10%**) or **fixed tariff rates** cannot claim input tax rebates unless they voluntarily opt to register and sell at the standard **15%** rate.
5. **Banking Channel Requirement (> BDT 100,000)**:
   - Any single supply/purchase exceeding **BDT 100,000 (1 Lakh Taka)** (excluding VAT) **must be paid through a formal banking channel** (Cheque, Pay Order, Bank Transfer, LC, or registered business MFS wallet) to qualify for a rebate.
6. **Filing Timeline (4-Month Window)**:
   - The rebate must be claimed in the tax period (month) in which the purchase/import occurred, or within the **subsequent 4 (four) tax periods (months)**.

### Quick Decision Flowchart: Is Your Purchase Eligible for Rebate?

\`\`\`text
[ Business Purchase / Import ]
       |
       +--> 1. Is your Output Sale taxed at 15% (Standard) or 0% (Export)?
              |-- NO (5%, 7.5%, 10%, Exempt) ---> [ NO REBATE ALLOWED ]
              |-- YES
                   |
                   +--> 2. Do you have a valid Mushak 6.3 (with 13-digit BIN) or Customs BOE?
                          |-- NO ---------------> [ NO REBATE ALLOWED ]
                          |-- YES
                               |
                               +--> 3. Is the item declared in your Mushak 4.3 & recorded in Mushak 6.1?
                                      |-- NO ---> [ NO REBATE ALLOWED ]
                                      |-- YES
                                           |
                                           +--> 4. If Invoice > BDT 100,000, was it paid via Banking Channel?
                                                  |-- NO (Paid in Cash) -> [ NO REBATE ALLOWED ]
                                                  |-- YES
                                                       |
                                                       +--> 5. Is the invoice within the current + 4 months window?
                                                              |-- NO ----> [ TIME-BARRED / NO REBATE ]
                                                              |-- YES ---> [ ELIGIBLE FOR REBATE IN PART-4 ]
\`\`\`

---

## 3. Ineligible & Disallowed Input Taxes (Section 46(1) & (2))

Even if you pay 15% VAT on an expense, NBR auditors will disallow the rebate (and impose penalties under **Section 85**) if the input falls into any of the following statutory exclusion categories:

- **Missing Documentation**: Purchases without a valid **Mushak 6.3** or **BOE**, or where the buyer's 13-digit BIN/address is omitted.
- **Unmapped Inputs**: Goods or services not declared in **Mushak 4.3** prior to supply.
- **Exempt or Reduced-Rate Outputs**: Inputs used to produce VAT-exempt goods/services (**First Schedule**) or reduced-rate supplies (**Third Schedule**).
- **Cash Payments**: Invoices above **BDT 100,000** paid in cash instead of banking channels.
- **Passenger Vehicles & Transportation**: Purchase, repair, renovation, or maintenance of passenger vehicles (cars, microbuses, SUVs) and fuel/transportation services, **unless** the taxpayer's primary business is dealing in, hiring out, or operating transportation services.
- **Entertainment & Welfare**: Expenses related to entertainment, hospitality, club/association memberships, employee welfare, gifts, or promotional giveaways.
- **Utility & Telecom Caps**: Certain administrative utility/telecom expenses may have partial disallowances or require strict proof of direct factory/business usage (e.g., WASA, electricity, gas, telephone).
- **Excessive Wastage**: Input VAT corresponding to raw material wastage that **exceeds** the wastage percentage declared in **Mushak 4.3**.
- **Bank Guarantees**: VAT covered by a bank guarantee at the import stage until the guarantee is finally settled in favor of the treasury.

---

## 4. Partial Input Tax Rebate (Apportionment — Section 47)

When a business supplies **both** Standard-Rated (15%) / Zero-Rated (0%) goods **and** VAT-Exempt / Reduced-Rate goods using common inputs (such as shared utilities, common raw materials, or head-office services), it cannot claim 100% of the common input VAT.

Instead, the eligible rebate must be **apportioned monthly** using the statutory formula under **Section 47 of the VAT & SD Act, 2012**:

> **Eligible Partial Rebate = I × (T ÷ T_total)**

Where:

- **I** = Total Input VAT paid on **common inputs** during the tax period.
- **T** = Value of **Standard-Rated (15%) + Zero-Rated (0%) supplies** during the tax period.
- **T_total** = Total value of **all supplies** (Standard + Zero-Rated + Exempt + Reduced-Rate) during the tax period.

*(Note: At the end of the financial year, an annual reconciliation adjustment must be performed in the June tax return if provisional monthly ratios differ from the annual turnover ratio.)*

<vat-apportionment-calculator></vat-apportionment-calculator>

---

## 5. Advance Tax (AT) vs. Input Tax Rebate at Import Stage

Importers often confuse **Import VAT (15%)** with **Advance Tax (AT — 3% for industrial manufacturers importing raw materials / 5% for commercial importers)** shown on a Customs Bill of Entry (BOE). They are treated differently in **Mushak 9.1**:

| Feature | Import VAT (15%) | Advance Tax (AT — 3% or 5%) |
| :--- | :--- | :--- |
| **Nature of Tax** | Value Added Tax on import value | Advance collection of output VAT at import stage |
| **Where to Claim in Mushak 9.1** | **Part-4 (Input Tax)** — Note 15 (Standard) | **Part-6 (Decreasing Adjustments)** — Note 29 |
| **15% Output Rate Restriction?** | **Yes** — Only eligible if output is 15% or 0% | **No** — Even reduced-rate or exempt traders can adjust/refund AT |
| **Mushak 4.3 Requirement?** | **Yes** — Must be declared in Mushak 4.3 | **No** — Adjustable based on valid BOE & Sub-form Ka (ক) |
| **Time Limit to Claim** | Current month + subsequent **4 months** | Current month + subsequent **4 months** |

---

## 6. Increasing & Decreasing Adjustments (Part-5 & Part-6)

Even after claiming an Input Tax Rebate in **Part-4**, certain subsequent events require you to adjust your VAT liability via **Part-5 (Increasing Adjustments)** or **Part-6 (Decreasing Adjustments)** of **Mushak 9.1**:

### Part-5: Increasing Adjustments (Reversing Rebates / Adding Liability)

1. **Reversal of Unpaid Bank Payments (> 6 Months)**: If you bought inputs on credit (> BDT 100,000), claimed the rebate, and failed to pay the supplier through banking channels within **6 months (180 days)** from the invoice date, you **must reverse (pay back)** the claimed rebate in the 6th month's return via **Part-5 (Note 26)**.
2. **Credit Notes Received (Mushak 6.7)**: If you return goods to your supplier and receive a **Credit Note (Form Mushak 6.7)**, the input VAT you previously claimed on those returned goods must be reversed via **Part-5**.
3. **Rebate on Damaged/Destroyed Goods**: If raw materials or finished goods are damaged, destroyed, or disposed of (via **Form Mushak 4.4**), any input tax rebate previously claimed on those inputs must be reversed.

### Part-6: Decreasing Adjustments (Reducing Net VAT Payable)

1. **Advance Tax (AT) Paid at Import**: Claimed via **Sub-form Ka (ক)** in **Part-6 (Note 29)**.
2. **VAT Deducted at Source (VDS) by Customers**: When your corporate customers withhold VAT from your sales payment and issue a **VDS Certificate (Form Mushak 6.6)**, you reduce your payable VAT in **Part-6 (Note 28)**.
3. **Credit Notes Issued (Mushak 6.7)**: When a buyer returns goods to you and you issue a **Credit Note (Mushak 6.7)**, you reduce your output VAT liability in **Part-6**.

---

## 7. Mushak 4.3 (Input-Output Coefficient) Breakdown & Sample Template

Because **Mushak 4.3** is the single most scrutinized document during an NBR VAT audit for disallowing rebates, understanding its structure is essential.

### Sample Calculation for Mushak 4.3: Manufacturing 1 Carton (100 Pcs) of Plastic Bottles

| Sl. | Input Item Name (Must match Mushak 6.1) | Unit | Gross Qty Required (Inc. Wastage) | Wastage Qty (%) | Purchase Price (Excl. VAT) (BDT) | Value Addition Head | Value Addition Amount (BDT) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | PET Resin (Import/Local) | Kg | 2.10 Kg | 0.10 Kg (4.76%) | 250.00 | Direct Factory Wages | 40.00 |
| 2 | Master Carton (Packing) | Pcs | 1.02 Pcs | 0.02 Pcs (1.96%) | 35.00 | Factory Electricity & Gas | 25.00 |
| 3 | Shrink Film & Labels | Kg | 0.25 Kg | 0.01 Kg (4.00%) | 30.00 | Admin & Selling Expense | 30.00 |
| 4 | Direct Machine Spare/Lubricant | Lump sum | — | 0% | 10.00 | Depreciation & Finance Cost | 25.00 |
| — | **Total Input Cost (A)** | — | — | — | **325.00** | Net Profit Margin | 55.00 |
| — | **Total Value Addition (B)** | — | — | — | — | — | **175.00** |
| — | **Total Sales Price (Excl. VAT)** | — | — | — | — | **A + B =** | **500.00** |

> **Audit Rule of Thumb**: In the example above, you can claim 15% Input Tax Rebate on the **BDT 325.00** of inputs (plus eligible VAT on Factory Electricity & Gas if billed at 15% with a valid Mushak 6.3). However, if your factory actually wastes **7%** of PET Resin instead of the declared **4.76%**, the input VAT on the excess **2.24%** wastage is **strictly disallowed** and must be reversed in **Part-5**.

---

## 8. Mapping Rebates to Mushak 9.1 (Part-4 Sub-Forms)

When filling out **Part-4 (Input Tax)** of the monthly **Mushak 9.1** return on the NBR portal ([vat.gov.bd](https://vat.gov.bd)), you do not enter figures directly into the main summary sheet. Instead, you must populate the **Sub-Forms (সাব-ফর্ম)**, which automatically calculate the main notes:

| Mushak 9.1 Note | Category of Purchase / Input | Applicable Sub-Form | Key Data Required |
| :--- | :--- | :--- | :--- |
| **Note 10 & 11** | Zero-Rated (0%) Purchases (Local / Import) | Sub-Form **Ka (ক)** | BOE No. / Invoice No., Date, Value |
| **Note 12 & 13** | Exempted Goods/Services (Local / Import) | Sub-Form **Ka (ক)** | Supplier BIN, Invoice/BOE No., Value |
| **Note 14** | **Standard Rated (15%) Goods/Services — Local Purchase** | Sub-Form **Ka (ক)** | Item Name, HS Code, Supplier BIN, Mushak 6.3 No. & Date, Value, 15% VAT |
| **Note 15** | **Standard Rated (15%) Goods — Import** | Sub-Form **Ka (ক)** | Customs House Code, BOE No. & Date, Assessable Value, 15% Import VAT |
| **Note 16 & 17** | Reduced Rate / Specific VAT Purchases (Non-Rebatable) | Sub-Form **Kha (খ)** / **Ga (গ)** | Recorded for disclosure only; **Rebate = 0** |
| **Note 19 & 20** | Non-Rebatable Purchases (Turnover tax / Unregistered / Exempt Output) | Sub-Form **Cha (চ)** | Recorded for disclosure only; **Rebate = 0** |

---

## 9. VDS (VAT Deducted at Source) vs. Input Tax Rebate Interaction

A common point of confusion for corporate accountants is how **VDS (ഉৎসে মূসক কর্তন)** interacts with Input Tax Rebates when purchasing services or goods as a Withholding Entity:

1. **If the Supplier Issues a 15% Mushak 6.3 Invoice**:
   - Even if VDS is applicable, if the supplier charges the standard **15% VAT** on a valid **Mushak 6.3**, you (the buyer) **can claim the 15% Input Tax Rebate** in **Part-4** (provided all Section 46 conditions and Mushak 4.3 declarations are met).
   - If you deduct VDS, you must deposit it via Treasury Challan, issue **Mushak 6.6**, and report the VDS payable in **Part-5 (Note 24)**.
2. **If the Supplier Issues a Reduced-Rate Mushak 6.3 Invoice (e.g., 5%, 7.5%, 10% — Procurement Provider, Construction, IT, Transport, etc.)**:
   - You **must deduct 100% of the VAT at source (VDS)** and deposit it to the government treasury (recording it in **Part-5, Note 24**).
   - However, because the supplier's rate is **below 15%**, you **cannot claim an Input Tax Rebate** on that VAT in Part-4. The VAT paid becomes part of your business cost/expense.

---

## 10. Practical Calculation Example (Monthly Return)

Let's walk through a realistic monthly scenario for **ABC Manufacturing Ltd.** (which sells finished goods at the standard **15% VAT rate**) for the month of **October**:

### Step A: Sales (Output VAT — Part-3)

- **Local Sales of Finished Goods**: BDT 2,000,000 → **Output VAT @ 15% = BDT 300,000** (Issued via Mushak 6.3).
- **Direct Export Sales**: BDT 500,000 → **Output VAT @ 0% = BDT 0** (Zero-rated, eligible for input rebate).
- **Total Output VAT (Part-3) = BDT 300,000**.

### Step B: Purchases & Expenses (Input Tax — Part-4)

1. **Imported Raw Materials (Declared in Mushak 4.3)**:
   - Assessable Value: BDT 800,000 | **Import VAT @ 15% = BDT 120,000** | **Advance Tax (AT) @ 3% = BDT 24,000**.
   - *Status*: **BDT 120,000 is Eligible** for Input Tax Rebate (**Note 15**). *(The BDT 24,000 AT goes to Step C).*
2. **Local Packing Materials (Declared in Mushak 4.3, paid via Cheque)**:
   - Purchase Value: BDT 200,000 | **VAT @ 15% = BDT 30,000** (Valid Mushak 6.3).
   - *Status*: **BDT 30,000 is Eligible** (**Note 14**).
3. **Factory Electricity Bill (Declared in Mushak 4.3)**:
   - Bill Value: BDT 300,000 | **VAT @ 5% / 15%** (Assume 15% industrial supply on valid Mushak 6.3 = **BDT 15,000**).
   - *Status*: **BDT 15,000 is Eligible** (**Note 14**).
4. **Local Chemical Purchase (Declared in Mushak 4.3, but paid in CASH)**:
   - Purchase Value: BDT 150,000 (> BDT 100,000 limit) | **VAT @ 15% = BDT 22,500**.
   - *Status*: **DISALLOWED (BDT 0)** because it exceeded BDT 100,000 and was paid in cash instead of a banking channel.
5. **Staff Catering / Entertainment Services**:
   - Invoice Value: BDT 50,000 | **VAT = BDT 5,000**.
   - *Status*: **DISALLOWED (BDT 0)** under Section 46(2) (Entertainment/Welfare).

- **Total Eligible Input Tax Rebate (Part-4) = 120,000 + 30,000 + 15,000 = BDT 165,000**.

### Step C: Adjustments (Part-5 & Part-6)

- **Decreasing Adjustment (Part-6)**:
  - VDS deducted by a corporate customer (supported by **Mushak 6.6**): **BDT 25,000**
  - Advance Tax (AT) paid at import (supported by **BOE**): **BDT 24,000**
- **Total Decreasing Adjustment = 25,000 + 24,000 = BDT 49,000**.

### Step D: Net Payable VAT (Part-7)

> **Net Payable VAT = 300,000 (Output) − 165,000 (Rebate) − 49,000 (Decreasing Adjustments) = BDT 86,000**

**ABC Manufacturing Ltd.** will deposit **BDT 86,000** via Treasury Challan (or e-Payment) and enter the Challan details in **Part-8** before submitting **Mushak 9.1** by **November 15th**.

---

## 11. Monthly VAT Rebate Compliance Checklist

Before submitting your **Mushak 9.1** by the **15th of every month**, verify the following 6 checkpoints:

| # | Checkpoint | Verification Standard |
| :--- | :--- | :--- |
| 1 | **e-BIN Verification** | Have you verified the supplier's 13-digit e-BIN on the NBR portal ([vat.gov.bd](https://vat.gov.bd)) and confirmed your own BIN & address are printed on every Mushak 6.3? |
| 2 | **4-Month Window** | Are all Mushak 6.3 invoices and Bills of Entry dated within the current month or the immediately preceding 4 months? |
| 3 | **Mushak 4.3 Alignment** | Is every single raw material, packing material, and service for which you are claiming a rebate listed in your active Mushak 4.3? |
| 4 | **Mushak 6.1 Entry** | Have all eligible purchases been entered into the Purchase Register (Mushak 6.1) before claiming the rebate? |
| 5 | **Banking Proof (> 1 Lakh)** | For all invoices exceeding BDT 100,000, do you have bank statements, cheque copies, or LC documents proving payment via banking channels? |
| 6 | **6-Month Aging Check** | Are there any credit purchases (> BDT 100,000) older than 6 months that remain unpaid? (If yes, reverse the rebate in Part-5). |

### Interactive Monthly Pre-Filing Verification

- [ ] **1. e-BIN Verification**: Verified supplier's 13-digit e-BIN on the NBR portal (vat.gov.bd) and confirmed buyer's 13-digit e-BIN and address are printed on every Form Mushak 6.3.
- [ ] **2. 4-Month Window**: Confirmed all Mushak 6.3 tax invoices and Customs Bills of Entry (BOE) are dated within the current tax period or the preceding 4 tax periods (months).
- [ ] **3. Mushak 4.3 Alignment**: Confirmed every raw material, packing material, and service claimed for Input Tax Rebate is declared in the active Form Mushak 4.3 (and revised if input prices shifted > 7.5%).
- [ ] **4. Mushak 6.1 / 6.2.1 Entry**: Recorded all eligible local purchases and imports sequentially in Form Mushak 6.1 (or Mushak 6.2.1) using identical item names and units as Mushak 4.3.
- [ ] **5. Banking Proof (> BDT 100,000)**: Retained cheque copies, pay orders, bank transfer advices, LC documents, or business MFS statements for all single supplies exceeding BDT 100,000 (excluding VAT).
- [ ] **6. 6-Month Aging Check**: Audited Accounts Payable aging for any credit purchases (> BDT 100,000) unpaid beyond 6 months (180 days) and reversed their previously claimed rebate in Part-5 (Note 26).
`,
  category: 'VAT & Customs',
  categoryId: 'vat',
  author: {
    id: 'mizanur-rahman',
    name: 'Mizanur Rahman, FCA',
    role: 'Principal Tax & Corporate Advisory',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    bio: 'Fellow Chartered Accountant (FCA) and VAT & Corporate Tax Consultant specializing in NBR statutory compliance, Section 46 Input Tax Rebate optimization, Mushak 4.3 costing, and Mushak 9.1 audit defense in Bangladesh.'
  },
  publishedAt: '2026-10-30T18:00:00.000Z',
  readTime: 14,
  imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200',
  tags: [
    'Input Tax Rebate Bangladesh',
    'উপকরণ কর রেয়াত',
    'Section 46 VAT Act 2012',
    'Mushak 4.3 Input Output Coefficient',
    'Mushak 9.1 Part 4 Sub Form',
    'Advance Tax vs Import VAT',
    'Mushak 6.3 Tax Invoice',
    'VDS vs Input Tax Rebate',
    'Partial Input Tax Rebate Section 47',
    'Bangladesh VAT Compliance'
  ],
  likes: 194,
  comments: 31,
  isExpertOpinion: true
};
