import { Article } from '../types';

export interface ApprovedCharityInstitution {
  serial: number;
  serialBn: string;
  nameEn: string;
  exactLegalName: string;
  shortCode: string;
  focusCategoryEn: string;
  focusCategory: string;
  descriptionEn: string;
  descriptionBn: string;
  verificationNoteEn?: string;
  verificationNoteBn?: string;
}

export const APPROVED_11_INSTITUTIONS_SRO_213: ApprovedCharityInstitution[] = [
  {
    serial: 1,
    serialBn: '১',
    nameEn: 'ASHIC, Foundation for Childhood Cancer',
    exactLegalName: 'ASHIC, Foundation for Childhood Cancer',
    shortCode: 'ASHIC',
    focusCategoryEn: 'Childhood Cancer Care',
    focusCategory: 'শিশু ক্যান্সার সেবা',
    descriptionEn: 'Supports children affected by cancer and their families through care and welfare initiatives.',
    descriptionBn: 'শিশু ক্যান্সারে আক্রান্ত শিশু ও তাদের পরিবারের সহায়তা, সচেতনতা এবং পরিচর্যামূলক কার্যক্রম পরিচালনা করে।'
  },
  {
    serial: 2,
    serialBn: '২',
    nameEn: 'Bangladesh Cancer Aid Trust (BANCAT)',
    exactLegalName: 'বাংলাদেশ ক্যান্সার এইড ট্রাস্ট (BANCAT)',
    shortCode: 'BANCAT',
    focusCategoryEn: 'Cancer Patient Support',
    focusCategory: 'ক্যান্সার রোগী কল্যাণ',
    descriptionEn: 'Provides cancer-related awareness, patient support and welfare assistance.',
    descriptionBn: 'ক্যান্সার রোগীদের সহায়তা, সচেতনতা বৃদ্ধি এবং রোগীকল্যাণমূলক কার্যক্রমের সঙ্গে যুক্ত।'
  },
  {
    serial: 3,
    serialBn: '৩',
    nameEn: 'Al-Markazul Islami',
    exactLegalName: 'আল-মারকাজুল ইসলামী',
    shortCode: 'Al-Markazul Islami',
    focusCategoryEn: 'Healthcare & Humanitarian Relief',
    focusCategory: 'স্বাস্থ্য ও মানবিক সেবা',
    descriptionEn: 'Undertakes education, healthcare, relief and humanitarian services.',
    descriptionBn: 'স্বাস্থ্যসেবা, শিক্ষা, মানবিক সহায়তা, ত্রাণ ও সামাজিক কল্যাণমূলক কর্মকাণ্ড পরিচালনা করে।'
  },
  {
    serial: 4,
    serialBn: '৪',
    nameEn: 'Disabled Child Foundation (DCF)',
    exactLegalName: 'Disabled Child Foundation (DCF)',
    shortCode: 'DCF',
    focusCategoryEn: 'Disability Rights & Inclusion',
    focusCategory: 'প্রতিবন্ধী শিশু অধিকার',
    descriptionEn: 'Works for the rights, welfare and inclusion of persons with disabilities.',
    descriptionBn: 'প্রতিবন্ধী শিশু ও প্রতিবন্ধী ব্যক্তিদের অধিকার, অংশগ্রহণ এবং সামাজিক অন্তর্ভুক্তি নিয়ে কাজ করে।'
  },
  {
    serial: 5,
    serialBn: '৫',
    nameEn: 'Sherpur Diabetic Samity',
    exactLegalName: 'শেরপুর ডায়াবেটিক সমিতি',
    shortCode: 'Sherpur Diabetic Samity',
    focusCategoryEn: 'Diabetes Healthcare',
    focusCategory: 'ডায়াবেটিস স্বাস্থ্যসেবা',
    descriptionEn: 'Associated with diabetes-related healthcare and patient welfare.',
    descriptionBn: 'ডায়াবেটিস-সম্পর্কিত স্বাস্থ্যসেবা ও রোগীকল্যাণমূলক কার্যক্রমের সঙ্গে সংশ্লিষ্ট।'
  },
  {
    serial: 6,
    serialBn: '৬',
    nameEn: 'Mawna Diabetic Association',
    exactLegalName: 'মাওনা ডায়াবেটিক অ্যাসোসিয়েশন',
    shortCode: 'Mawna Diabetic Association',
    focusCategoryEn: 'Diabetes Care & Health Education',
    focusCategory: 'ডায়াবেটিস ও জনসচেতনতা',
    descriptionEn: 'Provides diabetes care, health education and community-based medical initiatives.',
    descriptionBn: 'ডায়াবেটিস পরীক্ষা, চিকিৎসাসেবা, স্বাস্থ্যশিক্ষা ও জনসচেতনতা কার্যক্রম পরিচালনা করে।'
  },
  {
    serial: 7,
    serialBn: '৭',
    nameEn: 'Bangladesh Thalassemia Samity',
    exactLegalName: 'বাংলাদেশ থ্যালাসেমিয়া সমিতি',
    shortCode: 'Bangladesh Thalassemia Samity',
    focusCategoryEn: 'Thalassemia Treatment & Support',
    focusCategory: 'থ্যালাসেমিয়া চিকিৎসা',
    descriptionEn: 'Supports thalassemia patients through treatment-related services and awareness.',
    descriptionBn: 'থ্যালাসেমিয়া রোগীদের চিকিৎসা, রক্তসঞ্চালন-সংক্রান্ত সেবা ও সচেতনতামূলক কার্যক্রমের সঙ্গে যুক্ত।',
    verificationNoteEn: 'Identity Verification: Bangladesh Thalassemia Samity and Bangladesh Thalassemia Foundation are distinct legal entities. Verify the exact legal name on the donation receipt.',
    verificationNoteBn: 'সতর্কতা: "বাংলাদেশ থ্যালাসেমিয়া সমিতি" এবং "বাংলাদেশ থ্যালাসেমিয়া ফাউন্ডেশন" আলাদা প্রতিষ্ঠান। রসিদে প্রতিষ্ঠানের সঠিক আইনগত নাম যাচাই করুন।'
  },
  {
    serial: 8,
    serialBn: '৮',
    nameEn: 'Autism Welfare Foundation',
    exactLegalName: 'অটিজম ওয়েলফেয়ার ফাউন্ডেশন',
    shortCode: 'Autism Welfare Foundation',
    focusCategoryEn: 'Autism Education & Training',
    focusCategory: 'অটিজম শিক্ষা ও প্রশিক্ষণ',
    descriptionEn: 'Provides education, training and support for autistic children and individuals.',
    descriptionBn: 'অটিজমসম্পন্ন শিশু ও ব্যক্তিদের শিক্ষা, প্রশিক্ষণ, দক্ষতা উন্নয়ন এবং সহায়তামূলক সেবা প্রদান করে।'
  },
  {
    serial: 9,
    serialBn: '৯',
    nameEn: 'BRAC',
    exactLegalName: 'ব্র্যাক (BRAC)',
    shortCode: 'BRAC',
    focusCategoryEn: 'Poverty Alleviation & Social Development',
    focusCategory: 'দারিদ্র্য বিমোচন ও উন্নয়ন',
    descriptionEn: 'Implements programmes addressing poverty, education, healthcare and social development.',
    descriptionBn: 'দারিদ্র্য বিমোচন, শিক্ষা, স্বাস্থ্য, সামাজিক উন্নয়ন ও মানবিক সহায়তাসহ বিভিন্ন উন্নয়নমূলক কার্যক্রম পরিচালনা করে।',
    verificationNoteEn: 'Identity Verification: Approval of BRAC does not automatically extend to other separate legal entities associated with the BRAC brand.',
    verificationNoteBn: 'সতর্কতা: BRAC-এর অনুমোদনকে স্বয়ংক্রিয়ভাবে BRAC-এর অন্যান্য স্বতন্ত্র আইনগত প্রতিষ্ঠানের অনুমোদন হিসেবে বিবেচনা করা যাবে না।'
  },
  {
    serial: 10,
    serialBn: '১০',
    nameEn: 'Ramakrishna Math and Ramakrishna Mission, Dhaka',
    exactLegalName: 'রামকৃষ্ণ মঠ ও রামকৃষ্ণ মিশন, ঢাকা',
    shortCode: 'Ramakrishna Math & Mission, Dhaka',
    focusCategoryEn: 'Education, Healthcare & Relief',
    focusCategory: 'শিক্ষা, চিকিৎসা ও ত্রাণ',
    descriptionEn: 'Undertakes education, healthcare, relief and humanitarian activities.',
    descriptionBn: 'শিক্ষা, স্বাস্থ্যসেবা, ত্রাণ, পুনর্বাসন ও মানবকল্যাণমূলক কার্যক্রমে নিয়োজিত।'
  },
  {
    serial: 11,
    serialBn: '১১',
    nameEn: 'Chattogram Maa-O-Shishu Hospital',
    exactLegalName: 'চট্টগ্রাম মা ও শিশু হাসপাতাল',
    shortCode: 'Chattogram Maa-O-Shishu Hospital',
    focusCategoryEn: 'Maternal & Child Healthcare',
    focusCategory: 'মা ও শিশু স্বাস্থ্যসেবা',
    descriptionEn: 'Provides maternal, child and broader medical services.',
    descriptionBn: 'মা ও শিশুর স্বাস্থ্যসেবাসহ বিভিন্ন চিকিৎসা ও জনকল্যাণমূলক কার্যক্রম পরিচালনা করে।'
  }
];

export const sro213ApprovedCharitiesTaxRebateArticle: Article = {
  id: 'sro-213-2026-approved-11-institutions-donation-tax-rebate',
  title: 'Tax Rebate on Donations to 11 Organisations (SRO No. 213-Ain/Aykor-4/2026) | ১১ প্রতিষ্ঠানে দানে আয়কর রেয়াত',
  metaTitle: 'Tax Rebate on Donations to 11 Organisations | SRO No. 213-Ain/Aykor-4/2026 | Accounticca × E-Lawyers',
  metaDescription: 'Complete guide to Income Tax Rebate on Donations to 11 Approved Public-Welfare Organisations in Bangladesh under SRO No. 213-Ain/Aykor-4/2026 (Effective: 1 July 2026–30 June 2030) and Section 78 of the Income Tax Act, 2023.',
  excerpt: 'The Government of Bangladesh has approved eleven public-welfare organisations for income tax rebate purposes under SRO No. 213-Ain/Aykor-4/2026 (Effective: 1 July 2026–30 June 2030). Explore the legal basis, the 11 approved institutions, Section 78 three-limit rebate calculations, worked examples, and documentation requirements in English and বাংলা.',
  category: 'Income Tax',
  categoryId: 'tax',
  author: {
    id: 'accounticca-tax-practice',
    name: 'Accounticca × E-Lawyers Direct Tax Practice',
    role: 'Individual & Statutory Tax Advisory Bench',
    avatarUrl: 'https://i.ibb.co/tTskLmG0/17-removebg-preview.png',
    bio: 'The joint direct taxation and statutory advisory bench of Accounticca and E-Lawyers Chambers, advising individual and corporate taxpayers on Section 76 & Section 78 rebates under the Income Tax Act, 2023, Finance Act 2026 amendments, and NBR SRO compliance.'
  },
  publishedAt: '2026-11-06T09:00:00Z',
  readTime: 10,
  imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200',
  isExpertOpinion: true,
  tags: [
    'Tax Rebate on Donations to 11 Organisations',
    'SRO No. 213-Ain/Aykor-4/2026',
    '১১ প্রতিষ্ঠানে দানে আয়কর রেয়াত',
    'এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬',
    'Income Tax Act 2023 Section 78',
    'Sixth Schedule Part 3 Paragraph 2(13)',
    'Donation Tax Rebate Bangladesh 2026-2030',
    'BRAC Donation Tax Rebate',
    'ASHIC BANCAT Tax Rebate',
    'Finance Act 2026 Rebate Calculation'
  ],
  content: `# Tax Rebate on Donations to 11 Organisations

**SRO No. 213-Ain/Aykor-4/2026 | Effective: 1 July 2026–30 June 2030**

The Government of Bangladesh has approved eleven public-welfare organisations for income tax rebate purposes under **SRO No. 213-Ain/Aykor-4/2026**, issued by the Internal Resources Division of the Ministry of Finance on **8 June 2026**.

The notification allows qualifying individual taxpayers to claim an income tax rebate on eligible donations or contributions made to these organisations, subject to the **Income Tax Act, 2023**.

This measure is intended to encourage financial support for public welfare, healthcare, disability inclusion, education and humanitarian activities.

However, the notification does not mean that the full amount donated can be deducted directly from the donor's income tax liability. The actual rebate is subject to statutory calculations and limitations.

---

## Legal Basis

* The notification was issued under **Section 76(1) of the Income Tax Act, 2023**, read with **Paragraph 2(13) of Part 3 of the Sixth Schedule**.
* It recognises eleven specified organisations as approved public-welfare institutions for the purpose of qualifying donations made by individual taxpayers.
* The notification became effective on **1 July 2026** and will remain in force until **30 June 2030**, unless subsequently amended or extended.
* Importantly, it establishes tax-rebate eligibility for qualifying donors. It does not grant a blanket income tax exemption on all income earned by the recipient organisations.

| Statutory Parameter | Details |
| :--- | :--- |
| **Notification Reference** | SRO No. 213-Ain/Aykor-4/2026 |
| **Issuing Authority & Date** | Internal Resources Division, Ministry of Finance — 8 June 2026 |
| **Effective Period** | 1 July 2026 – 30 June 2030 |
| **Enabling Provisions** | Section 76(1), Section 78 & Sixth Schedule (Part 3, Para 2(13)), Income Tax Act, 2023 |
| **Eligible Donors** | Qualifying Individual Taxpayers (Resident & Non-Resident Bangladeshi Individuals) |

---

## Approved Organisations

The eleven organisations covered by the notification are:

1. **ASHIC, Foundation for Childhood Cancer** — supports children affected by cancer and their families through care and welfare initiatives.
2. **Bangladesh Cancer Aid Trust (BANCAT)** — provides cancer-related awareness, patient support and welfare assistance.
3. **Al-Markazul Islami** — undertakes education, healthcare, relief and humanitarian services.
4. **Disabled Child Foundation (DCF)** — works for the rights, welfare and inclusion of persons with disabilities.
5. **Sherpur Diabetic Samity** — is associated with diabetes-related healthcare and patient welfare.
6. **Mawna Diabetic Association** — provides diabetes care, health education and community-based medical initiatives.
7. **Bangladesh Thalassemia Samity** — supports thalassemia patients through treatment-related services and awareness.
8. **Autism Welfare Foundation** — provides education, training and support for autistic children and individuals.
9. **BRAC** — implements programmes addressing poverty, education, healthcare and social development.
10. **Ramakrishna Math and Ramakrishna Mission, Dhaka** — undertakes education, healthcare, relief and humanitarian activities.
11. **Chattogram Maa-O-Shishu Hospital** — provides maternal, child and broader medical services.

> **Important Verification Note:** Taxpayers should verify the exact legal identity of the recipient before making a donation. Organisations with similar names are not necessarily the same legal entity (for example, *Bangladesh Thalassemia Samity* vs. *Bangladesh Thalassemia Foundation*, or *BRAC* vs. separate legal entities associated with the BRAC brand).

---

## Who Can Claim?

* **Individual Taxpayers:** The notification specifically covers donations or contributions made by individual taxpayers.
* **Resident & Non-Resident Bangladeshi Individuals:** Under **Section 78 of the Income Tax Act, 2023**, eligible resident individuals and non-resident Bangladeshi individual taxpayers may claim the general tax rebate, subject to the applicable legal conditions.
* **Companies, Firms & Other Legal Entities:** Companies, partnership firms and other legal entities are not automatically entitled to claim this specific individual tax rebate. Their tax treatment must be considered under the provisions applicable to them.
* **Genuine Donation vs. Service Payments:** The payment must represent a genuine donation or contribution. Ordinary hospital bills, tuition fees, purchases or payments for services are not automatically qualifying donations.

---

## Rebate Calculation

Following the amendments introduced by the **Finance Act, 2026**, the general tax rebate under **Section 78** is calculated as the **lowest of the following three amounts**:

1. **3% of the total income relevant to the rebate calculation;**
2. **10% of total eligible investments and expenditure;**
3. **BDT 750,000.**

The income figure used for this calculation may exclude certain categories of income under the law.

Qualifying donations may be combined with other eligible investments and expenditure under **Part 3 of the Sixth Schedule**, subject to all applicable conditions.

---

## Example 1: Donation of BDT 100,000

Assume an individual taxpayer has qualifying annual income of **BDT 1,200,000** and donates **BDT 100,000** to **BRAC** during the applicable income year. There are no other qualifying investments or expenses.

The calculation would be:

| Basis | Amount |
| :--- | :--- |
| **3% of qualifying income** | BDT 36,000 |
| **10% of eligible donation** | BDT 10,000 |
| **Statutory maximum** | BDT 750,000 |
| **Calculated rebate** | **BDT 10,000** |

The calculated rebate is **BDT 10,000**, not BDT 100,000.

The amount actually usable against the taxpayer's liability remains subject to the applicable tax and minimum-tax provisions.

---

## Example 2: Donation of BDT 500,000

Assume the same taxpayer (qualifying annual income of **BDT 1,200,000**) donates **BDT 500,000** instead.

| Basis | Amount |
| :--- | :--- |
| **3% of qualifying income** | BDT 36,000 |
| **10% of eligible donation** | BDT 50,000 |
| **Statutory maximum** | BDT 750,000 |
| **Calculated rebate** | **BDT 36,000** |

Three percent of qualifying income remains **BDT 36,000**, while 10% of the donation is **BDT 50,000**.

Since **BDT 36,000** is the lower amount, the calculated rebate would be **BDT 36,000**, subject to the other legal conditions.

This demonstrates why making a larger donation does not necessarily produce a proportionately larger tax rebate.

---

## Example 3: Donation and Other Investments

Suppose a taxpayer has qualifying annual income of **BDT 1,500,000**, eligible investments of **BDT 200,000** and an eligible donation of **BDT 100,000**.

Total qualifying investments and expenditure amount to **BDT 300,000**.

| Basis | Amount |
| :--- | :--- |
| **3% of qualifying income (3% of BDT 1,500,000)** | BDT 45,000 |
| **10% of qualifying investments & expenditure (10% of BDT 300,000)** | BDT 30,000 |
| **Statutory maximum** | BDT 750,000 |
| **Calculated total rebate** | **BDT 30,000** |

Three percent of qualifying income is **BDT 45,000**, while 10% of qualifying investments and expenditure is **BDT 30,000**.

The calculated total rebate is therefore **BDT 30,000**, assuming all investments and donations satisfy the applicable conditions.

The amount is the combined investment and expenditure rebate, not an additional rebate exclusively attributable to the donation.

---

## Documentation

1. **Official Donation Receipt & Payment Records:** Taxpayers intending to claim the rebate should maintain clear supporting records. These should include an official donation receipt, payment confirmation, date of payment, recipient organisation's name and the amount contributed.
2. **Verifiable Banking or Digital Channels:** Bank transfer records or verifiable digital payment confirmations can help establish that the donation was actually made.
3. **Entity Name & Validity Window Verification:** The organisation's identity should match the entity approved under the SRO. The donor should also ensure that the payment falls within the notification's effective period (**1 July 2026–30 June 2030**).
4. **Return Aggregation under Section 78:** When preparing an income tax return, eligible donations should be considered along with other qualifying investments and expenditure, and the applicable rebate limits should be applied.
5. **Record Retention for Audit:** Supporting documents should be retained for possible verification by the tax authorities.

---

## Common Questions

### Is the entire donation deducted from income tax?
**No.** The eligible donation enters the statutory rebate calculation. The full amount is not automatically deducted from the tax liability.

### Can a company claim the same benefit?
**Not automatically under this specific notification.** The SRO addresses donations by individual taxpayers. A company's treatment depends on separately applicable tax provisions.

### Are donations made after 30 June 2030 eligible?
The notification states that its validity ends on **30 June 2030**. Eligibility after that date would depend on any extension, new notification or another applicable legal provision.

### Do all payments to approved organisations qualify?
**No.** The payment must be a genuine qualifying donation or contribution. Ordinary payments for goods or services are not automatically eligible.

---

## Conclusion

**SRO No. 213-Ain/Aykor-4/2026** is an important measure supporting charitable giving and public-welfare activities in Bangladesh.

By recognising eleven organisations for individual income tax rebate purposes, the government has provided an additional incentive for eligible taxpayers to support healthcare, education, disability inclusion and humanitarian initiatives.

Nevertheless, taxpayers should distinguish between the amount donated and the income tax rebate actually available. Proper calculation, documentary evidence and compliance with the **Income Tax Act, 2023** are essential when claiming the benefit.

> **Disclaimer:** The examples are illustrative and assume that the donations and investments qualify under the applicable law. Actual tax treatment depends on the taxpayer's circumstances, current legislation, minimum-tax provisions and any subsequent amendments.

---

## References | তথ্যসূত্র

1. **National Board of Revenue (NBR)**, *SRO No. 213-Ain/Aykor-4/2026* — Official Gazette (8 June 2026).
2. **Laws of Bangladesh**, *Income Tax Act, 2023* — Section 78.
3. **NBR**, *Income Tax Act, 2023* — Sixth Schedule, Part 3 (Paragraph 2(13)).
4. **Ministry of Law**, *Finance Act, 2026* — Income Tax Amendments.
5. **NBR**, *Income Tax FAQs and Guidance*.
6. **Institutional Information**: ASHIC, BANCAT, Al-Markazul Islami, Disabled Child Foundation (DCF), Sherpur Diabetic Samity, Mawna Diabetic Association, Bangladesh Thalassemia Samity, Autism Welfare Foundation, BRAC, Ramakrishna Mission Dhaka and Chattogram Maa-O-Shishu Hospital.

---
# বাংলা

# ১১ প্রতিষ্ঠানে দানে আয়কর রেয়াত

**এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬ | কার্যকর: ১ জুলাই ২০২৬–৩০ জুন ২০৩০**

বাংলাদেশ সরকার জনকল্যাণমূলক কর্মকাণ্ডে ব্যক্তি পর্যায়ে অনুদান প্রদানকে উৎসাহিত করতে **১১টি প্রতিষ্ঠানকে আয়কর রেয়াতের জন্য অনুমোদন দিয়েছে**। অর্থ মন্ত্রণালয়ের অভ্যন্তরীণ সম্পদ বিভাগ **৮ জুন ২০২৬** তারিখে **এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬** জারি করে প্রতিষ্ঠানগুলোকে অনুমোদিত জনকল্যাণমূলক প্রতিষ্ঠান হিসেবে স্বীকৃতি দিয়েছে।

ফলে নির্ধারিত সময়ে এসব প্রতিষ্ঠানে কোনো যোগ্য ব্যক্তি করদাতা দান বা অনুদান প্রদান করলে **আয়কর আইন, ২০২৩**-এর বিধান অনুসারে কর রেয়াত দাবি করতে পারবেন। তবে দান করা সম্পূর্ণ অর্থ সরাসরি আয়কর থেকে বাদ দেওয়া যাবে না। রেয়াতের পরিমাণ নির্ধারিত হবে করদাতার আয়, মোট অনুমোদনযোগ্য বিনিয়োগ ও ব্যয় এবং আইনে নির্ধারিত সীমা অনুযায়ী।

---

## প্রজ্ঞাপনের মূল বিষয়

* **আইনগত ভিত্তি:** আয়কর আইন, ২০২৩-এর **ধারা ৭৬(১)**-এ প্রদত্ত ক্ষমতাবলে এবং **ষষ্ঠ তফসিলের অংশ ৩-এর অনুচ্ছেদ ২-এর দফা (১৩)** অনুসারে সরকার সংশ্লিষ্ট ১১টি প্রতিষ্ঠানকে অনুমোদন দিয়েছে।
* **প্রধান উদ্দেশ্য:** প্রজ্ঞাপনটির প্রধান উদ্দেশ্য হলো জনকল্যাণমূলক প্রতিষ্ঠানগুলোতে অনুদান প্রদানের ক্ষেত্রে **ব্যক্তি করদাতাকে আইনসম্মত কর রেয়াতের সুযোগ** দেওয়া।
* **কর সুবিধার পরিধি:** এটি মূলত **অনুদানদাতার জন্য একটি কর সুবিধা**। এর মাধ্যমে সংশ্লিষ্ট প্রতিষ্ঠানগুলোর নিজস্ব সব আয়কে আয়করমুক্ত ঘোষণা করা হয়নি।
* **কার্যকর মেয়াদ:** প্রজ্ঞাপনটি **১ জুলাই ২০২৬** থেকে কার্যকর হয়েছে এবং **৩০ জুন ২০৩০** পর্যন্ত বলবৎ থাকবে। পরবর্তী কোনো সংশোধন বা নতুন প্রজ্ঞাপন জারি হলে তার বিধান বিবেচনা করতে হবে।

| প্রজ্ঞাপনের তথ্য | বিবরণ |
| :--- | :--- |
| **প্রজ্ঞাপন নম্বর** | এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬ |
| **জারির তারিখ** | ৮ জুন ২০২৬ (অভ্যন্তরীণ সম্পদ বিভাগ, অর্থ মন্ত্রণালয়) |
| **কার্যকর মেয়াদ** | ১ জুলাই ২০২৬ হতে ৩০ জুন ২০৩০ পর্যন্ত |
| **সংশ্লিষ্ট ধারা ও তফসিল** | ধারা ৭৬(১), ধারা ৭৮ এবং ষষ্ঠ তফসিল (অংশ ৩, অনুচ্ছেদ ২, দফা ১৩), আয়কর আইন, ২০২৩ |
| **প্রযোজ্য করদাতা** | যোগ্য স্বাভাবিক ব্যক্তি করদাতা (Individual Taxpayer) |

---

## অনুমোদিত ১১টি প্রতিষ্ঠান

প্রজ্ঞাপন অনুযায়ী অনুমোদিত প্রতিষ্ঠানগুলো হলো:

১. **ASHIC, Foundation for Childhood Cancer:** শিশু ক্যান্সারে আক্রান্ত শিশু ও তাদের পরিবারের সহায়তা, সচেতনতা এবং পরিচর্যামূলক কার্যক্রম পরিচালনা করে।

২. **বাংলাদেশ ক্যান্সার এইড ট্রাস্ট (BANCAT):** ক্যান্সার রোগীদের সহায়তা, সচেতনতা বৃদ্ধি এবং রোগীকল্যাণমূলক কার্যক্রমের সঙ্গে যুক্ত।

৩. **আল-মারকাজুল ইসলামী:** স্বাস্থ্যসেবা, শিক্ষা, মানবিক সহায়তা, ত্রাণ ও সামাজিক কল্যাণমূলক কর্মকাণ্ড পরিচালনা করে।

৪. **Disabled Child Foundation (DCF):** প্রতিবন্ধী শিশু ও প্রতিবন্ধী ব্যক্তিদের অধিকার, অংশগ্রহণ এবং সামাজিক অন্তর্ভুক্তি নিয়ে কাজ করে।

৫. **শেরপুর ডায়াবেটিক সমিতি:** ডায়াবেটিস-সম্পর্কিত স্বাস্থ্যসেবা ও রোগীকল্যাণমূলক কার্যক্রমের সঙ্গে সংশ্লিষ্ট।

৬. **মাওনা ডায়াবেটিক অ্যাসোসিয়েশন:** ডায়াবেটিস পরীক্ষা, চিকিৎসাসেবা, স্বাস্থ্যশিক্ষা ও জনসচেতনতা কার্যক্রম পরিচালনা করে।

৭. **বাংলাদেশ থ্যালাসেমিয়া সমিতি:** থ্যালাসেমিয়া রোগীদের চিকিৎসা, রক্তসঞ্চালন-সংক্রান্ত সেবা ও সচেতনতামূলক কার্যক্রমের সঙ্গে যুক্ত।

৮. **অটিজম ওয়েলফেয়ার ফাউন্ডেশন:** অটিজমসম্পন্ন শিশু ও ব্যক্তিদের শিক্ষা, প্রশিক্ষণ, দক্ষতা উন্নয়ন এবং সহায়তামূলক সেবা প্রদান করে।

৯. **ব্র্যাক (BRAC):** দারিদ্র্য বিমোচন, শিক্ষা, স্বাস্থ্য, সামাজিক উন্নয়ন ও মানবিক সহায়তাসহ বিভিন্ন উন্নয়নমূলক কার্যক্রম পরিচালনা করে।

১০. **রামকৃষ্ণ মঠ ও রামকৃষ্ণ মিশন, ঢাকা:** শিক্ষা, স্বাস্থ্যসেবা, ত্রাণ, পুনর্বাসন ও মানবকল্যাণমূলক কার্যক্রমে নিয়োজিত।

১১. **চট্টগ্রাম মা ও শিশু হাসপাতাল:** মা ও শিশুর স্বাস্থ্যসেবাসহ বিভিন্ন চিকিৎসা ও জনকল্যাণমূলক কার্যক্রম পরিচালনা করে।

> **বিশেষ সতর্কতা (প্রতিষ্ঠানের আইনগত নাম যাচাই):** প্রতিষ্ঠানের নাম যাচাই করা অত্যন্ত গুরুত্বপূর্ণ। উদাহরণস্বরূপ, **বাংলাদেশ থ্যালাসেমিয়া সমিতি** এবং **বাংলাদেশ থ্যালাসেমিয়া ফাউন্ডেশন** আলাদা প্রতিষ্ঠান। একইভাবে **BRAC**-এর অনুমোদনকে স্বয়ংক্রিয়ভাবে BRAC-এর অন্যান্য স্বতন্ত্র আইনগত প্রতিষ্ঠানের অনুমোদন হিসেবে বিবেচনা করা যাবে না।

---

## কারা রেয়াত পাবেন?

* **স্বাভাবিক ব্যক্তি করদাতা (Individual Taxpayer):** প্রজ্ঞাপনে বিশেষভাবে স্বাভাবিক ব্যক্তি করদাতা কর্তৃক প্রদত্ত দান বা অনুদানের কথা উল্লেখ করা হয়েছে।
* **নিবাসী ও অনিবাসী বাংলাদেশি করদাতা:** আয়কর আইন, ২০২৩-এর **ধারা ৭৮** অনুসারে যোগ্য ব্যক্তি করদাতা নির্ধারিত শর্ত পূরণ করে সাধারণ কর রেয়াত দাবি করতে পারেন। এ ক্ষেত্রে নিবাসী স্বাভাবিক ব্যক্তি এবং অনিবাসী বাংলাদেশি স্বাভাবিক ব্যক্তি করদাতার প্রযোজ্য বিধান বিবেচনায় নিতে হবে।
* **কোম্পানি বা ফার্মের ক্ষেত্রে বিধান:** কোনো কোম্পানি, অংশীদারি ফার্ম বা অন্য আইনগত সত্তা এই নির্দিষ্ট ব্যক্তি-করদাতার রেয়াত সুবিধা স্বয়ংক্রিয়ভাবে দাবি করতে পারবে না। তাদের ক্ষেত্রে পৃথক প্রযোজ্য কর বিধান পরীক্ষা করতে হবে।
* **প্রকৃত অনুদান বনাম সেবার মূল্য:** অনুদানটি অবশ্যই বাস্তবে প্রদান করতে হবে। হাসপাতালের চিকিৎসা বিল, পণ্য কেনা, শিক্ষার ফি বা কোনো সেবার মূল্য পরিশোধ করলেই তা দান হিসেবে গণ্য হবে না।

---

## কর রেয়াতের হিসাব

আয়কর আইন, ২০২৩-এর **ধারা ৭৮** অনুযায়ী, **অর্থ আইন ২০২৬**-এর সংশোধন-পরবর্তী সাধারণ কর রেয়াত নির্ণয়ে নিচের তিনটি পরিমাণের মধ্যে **সর্বনিম্ন পরিমাণ** বিবেচিত হয়:

### কর রেয়াত = নিম্নোক্ত তিনটির মধ্যে সর্বনিম্ন পরিমাণ

1. **রেয়াত গণনার জন্য প্রাসঙ্গিক মোট আয়ের ৩%;**
2. **মোট অনুমোদনযোগ্য বিনিয়োগ ও ব্যয়ের ১০%;**
3. **৭,৫০,০০০ টাকা।**

এখানে মোট অনুমোদনযোগ্য বিনিয়োগ ও ব্যয়ের মধ্যে সংশ্লিষ্ট প্রতিষ্ঠানে যোগ্য অনুদানের পাশাপাশি আইনের **ষষ্ঠ তফসিলের অংশ ৩** অনুযায়ী অন্যান্য অনুমোদিত বিনিয়োগ ও ব্যয়ও অন্তর্ভুক্ত হতে পারে।

তবে রেয়াত গণনার জন্য প্রাসঙ্গিক আয় সব ক্ষেত্রে করদাতার মোট প্রদর্শিত আয়ের সমান নাও হতে পারে। কিছু বিশেষ ধরনের আয় বাদ দেওয়ার বিধান রয়েছে।

---

## উদাহরণ ১: এক লাখ টাকা অনুদান

ধরা যাক, একজন ব্যক্তির রেয়াত গণনার জন্য প্রাসঙ্গিক বার্ষিক আয় **১২,০০,০০০ টাকা**। তিনি ২০২৬-২৭ আয়বর্ষে **BRAC**-এ **১,০০,০০০ টাকা** অনুদান দিয়েছেন। তাঁর অন্য কোনো অনুমোদিত বিনিয়োগ বা ব্যয় নেই।

এ ক্ষেত্রে হিসাব হবে:

| বিবরণ | পরিমাণ |
| :--- | :--- |
| **প্রাসঙ্গিক আয়ের ৩%** | ৩৬,০০০ টাকা |
| **অনুমোদিত অনুদানের ১০%** | ১০,০০০ টাকা |
| **সর্বোচ্চ আইনগত সীমা** | ৭,৫০,০০০ টাকা |
| **গণনাকৃত কর রেয়াত (সর্বনিম্ন পরিমাণ)** | **১০,০০০ টাকা** |

অর্থাৎ ১,০০,০০০ টাকা অনুদান দেওয়ার ফলে শর্ত পূরণসাপেক্ষে **১০,০০০ টাকা** কর রেয়াতের হিসাব তৈরি হতে পারে। এখানে সম্পূর্ণ ১,০০,০০০ টাকা কর থেকে বাদ যাবে না।

প্রকৃতপক্ষে ব্যবহারযোগ্য রেয়াত নির্ভর করবে করদাতার করদায় ও প্রযোজ্য ন্যূনতম করসহ অন্যান্য বিধানের ওপর।

---

## উদাহরণ ২: পাঁচ লাখ টাকা অনুদান

ধরা যাক, একজন করদাতার প্রাসঙ্গিক বার্ষিক আয় **১২,০০,০০০ টাকা**। তিনি অনুমোদিত প্রতিষ্ঠানে **৫,০০,০০০ টাকা** অনুদান দিয়েছেন এবং অন্য কোনো যোগ্য বিনিয়োগ নেই।

তাঁর রেয়াত গণনা হবে:

| বিবরণ | পরিমাণ |
| :--- | :--- |
| **আয়ের ৩%** | ৩৬,০০০ টাকা |
| **অনুদানের ১০%** | ৫০,০০০ টাকা |
| **সর্বোচ্চ সীমা** | ৭,৫০,০০০ টাকা |
| **গণনাকৃত কর রেয়াত (সর্বনিম্ন পরিমাণ)** | **৩৬,০০০ টাকা** |

এখানে সর্বনিম্ন পরিমাণ **৩৬,০০০ টাকা**। তাই গণনাকৃত রেয়াত **৩৬,০০০ টাকা**, ৫০,০০০ টাকা নয়।

এ থেকে বোঝা যায়, বেশি অনুদান দিলেই একই অনুপাতে বেশি কর রেয়াত পাওয়া নিশ্চিত নয়।

---

## উদাহরণ ৩: অন্যান্য বিনিয়োগসহ অনুদান

ধরা যাক, একজন ব্যক্তির রেয়াত গণনার জন্য প্রাসঙ্গিক আয় **১৫,০০,০০০ টাকা**। তিনি **২,০০,০০০ টাকা** অনুমোদিত সঞ্চয় বা বিনিয়োগ করেছেন এবং অনুমোদিত জনকল্যাণমূলক প্রতিষ্ঠানে **১,০০,০০০ টাকা** দান করেছেন।

তাহলে **মোট যোগ্য বিনিয়োগ ও ব্যয় = ৩,০০,০০০ টাকা**।

| বিবরণ | পরিমাণ |
| :--- | :--- |
| **প্রাসঙ্গিক আয়ের ৩% (১৫,০০,০০০ টাকার ৩%)** | ৪৫,০০০ টাকা |
| **মোট বিনিয়োগ ও ব্যয়ের ১০% (৩,০০,০০০ টাকার ১০%)** | ৩০,০০০ টাকা |
| **সর্বোচ্চ আইনগত সীমা** | ৭,৫০,০০০ টাকা |
| **গণনাকৃত মোট কর রেয়াত (সর্বনিম্ন পরিমাণ)** | **৩০,০০০ টাকা** |

ফলে গণনাকৃত মোট কর রেয়াত হবে **৩০,০০০ টাকা**, যদি সব বিনিয়োগ ও অনুদান আইন অনুযায়ী যোগ্য হয়।

এটি সব যোগ্য বিনিয়োগ ও ব্যয়ের **সম্মিলিত রেয়াত**; শুধু অনুদানের জন্য পৃথক অতিরিক্ত ৩০,০০০ টাকা নয়।

---

## রেয়াত দাবির পদ্ধতি

কর রেয়াত দাবি করার জন্য অনুদানের যথাযথ প্রমাণ সংরক্ষণ করা গুরুত্বপূর্ণ:

1. **প্রতিষ্ঠানের নাম ও মেয়াদ যাচাই:** প্রথমেই যাচাই করতে হবে যে প্রতিষ্ঠানটির আইনগত নাম সংশ্লিষ্ট প্রজ্ঞাপনের সঙ্গে মেলে এবং অনুদানটি প্রজ্ঞাপনের কার্যকর সময়ের মধ্যে (**১ জুলাই ২০২৬ হতে ৩০ জুন ২০৩০**) প্রদান করা হয়েছে।
2. **ব্যাংকিং বা অনুমোদিত ডিজিটাল চ্যানেলে পরিশোধ:** ব্যাংক ট্রান্সফার বা প্রতিষ্ঠানের অনুমোদিত ডিজিটাল পেমেন্ট পদ্ধতিতে অর্থ প্রদান করলে লেনদেনের প্রমাণ সংরক্ষণ করা সহজ হয়।
3. **আনুষ্ঠানিক মানি রিসিট সংগ্রহ:** প্রতিষ্ঠানের কাছ থেকে আনুষ্ঠানিক মানি রিসিট বা অনুদানের স্বীকৃতিপত্র সংগ্রহ করা উচিত। সেখানে অনুদানদাতার নাম, প্রতিষ্ঠানের নাম, অনুদানের পরিমাণ এবং প্রদানের তারিখ থাকা ভালো।
4. **আয়কর রিটার্নে অন্তর্ভুক্তিকরণ:** আয়কর রিটার্ন প্রস্তুতের সময় অন্য অনুমোদনযোগ্য বিনিয়োগ ও ব্যয়ের সঙ্গে অনুদানটি সংশ্লিষ্ট খাতে বিবেচনা করতে হবে। এরপর ধারা ৭৮-এর সীমা প্রয়োগ করে রেয়াত গণনা করতে হবে।
5. **প্রমাণপত্র সংরক্ষণ:** রিটার্ন জমা দেওয়ার পরও মূল রসিদ, ব্যাংক লেনদেনের বিবরণ এবং অন্যান্য সহায়ক নথি সংরক্ষণ করা উচিত, যাতে কর কর্তৃপক্ষ প্রয়োজনে তথ্য যাচাই করতে পারে।

---

## সাধারণ প্রশ্ন

### প্রশ্ন: ১ লাখ টাকা দান করলে কি ১ লাখ টাকা আয়কর কমবে?
**উত্তর:** না। দানটি অনুমোদনযোগ্য ব্যয় হিসেবে কর রেয়াত গণনায় অন্তর্ভুক্ত হতে পারে। রেয়াতের পরিমাণ নির্ভর করবে আইনে নির্ধারিত গণনা ও সীমার ওপর (যেমন আয়ের ৩%, অনুদানের ১০% এবং সর্বোচ্চ ৭,৫০,০০০ টাকার মধ্যে সর্বনিম্ন পরিমাণ)।

### প্রশ্ন: এই ১১টি প্রতিষ্ঠান ছাড়া অন্য প্রতিষ্ঠানে দান করলে কি কর রেয়াত পাওয়া যাবে না?
**উত্তর:** এমন নয়। আয়কর আইনের অন্যান্য বিধান বা পৃথক সরকারি অনুমোদন অনুযায়ী অন্য কিছু প্রতিষ্ঠানে প্রদত্ত অনুদানও রেয়াতযোগ্য হতে পারে। এই প্রজ্ঞাপন শুধু নির্দিষ্ট ১১টি প্রতিষ্ঠানের অনুমোদন নিশ্চিত করে।

### প্রশ্ন: ৩০ জুন ২০৩০-এর পরে অনুদান দিলে রেয়াত পাওয়া যাবে?
**উত্তর:** এই প্রজ্ঞাপনের ঘোষিত মেয়াদ অনুযায়ী **৩০ জুন ২০৩০** পর্যন্ত সুবিধাটি কার্যকর। মেয়াদ শেষ হওয়ার পর নতুন প্রজ্ঞাপন, নবায়ন বা অন্য প্রযোজ্য আইনি ভিত্তি আছে কি না দেখতে হবে।

### প্রশ্ন: অনুদান গ্রহণকারী প্রতিষ্ঠানের সব আয় কি করমুক্ত?
**উত্তর:** না। প্রজ্ঞাপনটি মূলত ব্যক্তি অনুদানদাতার কর রেয়াতের সুবিধা নিয়ে। প্রতিষ্ঠানের নিজস্ব আয়ের কর-ব্যবস্থা আলাদা বিধানের ওপর নির্ভর করবে।

---

## উপসংহার

**এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬** বাংলাদেশের জনকল্যাণমূলক প্রতিষ্ঠানে ব্যক্তি পর্যায়ের অনুদানকে উৎসাহিত করার একটি গুরুত্বপূর্ণ কর-সংক্রান্ত উদ্যোগ। এর মাধ্যমে ক্যান্সার চিকিৎসা, ডায়াবেটিস সেবা, থ্যালাসেমিয়া, প্রতিবন্ধী ব্যক্তিদের কল্যাণ, অটিজম সহায়তা, শিক্ষা, সামাজিক উন্নয়ন এবং মানবিক সেবায় নিয়োজিত **১১টি অনুমোদিত প্রতিষ্ঠানে** অনুদান প্রদানের ক্ষেত্রে কর রেয়াতের সুযোগ সৃষ্টি হয়েছে।

তবে করদাতার মনে রাখা উচিত, অনুদানের পরিমাণ এবং প্রকৃত কর রেয়াত এক বিষয় নয়। রেয়াতের সঠিক হিসাব, প্রযোজ্য সীমা, অনুদানের বৈধতা এবং প্রয়োজনীয় প্রমাণপত্র যাচাই করে আয়কর রিটার্নে দাবি করতে হবে।

> **দাবিত্যাগ (Disclaimer):** প্রবন্ধে উল্লিখিত উদাহরণগুলো কেবল ধারণা প্রদানের উদ্দেশ্যে তৈরি এবং ধরে নেওয়া হয়েছে যে সংশ্লিষ্ট অনুদান ও বিনিয়োগ প্রযোজ্য আইন অনুযায়ী যোগ্য। প্রকৃত কর-ব্যবস্থা করদাতার ব্যক্তিগত পরিস্থিতি, প্রচলিত আইন, ন্যূনতম করের বিধান এবং পরবর্তী যেকোনো সংশোধনীর ওপর নির্ভর করবে।

---

## References | তথ্যসূত্র

1. **National Board of Revenue (NBR)**, *SRO No. 213-Ain/Aykor-4/2026* — Official Gazette (8 June 2026).
2. **Laws of Bangladesh**, *Income Tax Act, 2023* — Section 78.
3. **NBR**, *Income Tax Act, 2023* — Sixth Schedule, Part 3 (Paragraph 2(13)).
4. **Ministry of Law**, *Finance Act, 2026* — Income Tax Amendments.
5. **NBR**, *Income Tax FAQs and Guidance*.
6. **Institutional Information**: ASHIC, BANCAT, Al-Markazul Islami, Disabled Child Foundation (DCF), Sherpur Diabetic Samity, Mawna Diabetic Association, Bangladesh Thalassemia Samity, Autism Welfare Foundation, BRAC, Ramakrishna Mission Dhaka and Chattogram Maa-O-Shishu Hospital.`
};
