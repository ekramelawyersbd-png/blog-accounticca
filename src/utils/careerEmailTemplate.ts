export interface CareerApplicationData {
  applicationRefId: string;
  position?: string;
  department?: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  location: string;
  linkedin?: string;
  highestQualification: string;
  degreeProgram: string;
  major: string;
  institution: string;
  graduationYear: string;
  academicResult: string;
  currentlyStudying: string;
  accountingPrinciplesRating?: string;
  accountingActivities?: string[];
  accountingSoftware?: string[];
  excelSkill?: string;
  taxVat?: string;
  skillsDetails?: string;
  customerServiceSkills?: string[];
  computerSkills?: string[];
  mtoTracks?: string[];
  salesMarketingSkills?: string[];
  leadGenChannels?: string[];
  analyticalRating?: string;
  rotationalPreference?: string;
  englishFluency?: string;
  bengaliFluency?: string;
  typingSpeed?: string;
  voiceClarity?: string;
  workExperience: string;
  experienceLength?: string;
  organization?: string;
  jobTitle?: string;
  responsibilities?: string;
  training?: string;
  trainingDetails?: string;
  fullTime: string;
  joinTime: string;
  officeLocation: string;
  salary: string;
  noticePeriod?: string;
  cvFileName?: string;
  cvFileSize?: number;
  academicDocsSummary?: string;
  portfolio?: string;
  motivation: string;
  submissionDate?: string;
}

export function generateCareerNotificationEmailHtml(data: CareerApplicationData): {
  subject: string;
  html: string;
  text: string;
} {
  const positionTitle = data.position || 'Accountant (Accounts Division)';
  const deptTitle = data.department || 'Accounts Division';
  const subject = `[New Job Application] ${positionTitle} - ${data.fullName} [${data.applicationRefId}]`;

  const text = `
E-LAWYERS LEGAL & BUSINESS CONSULTANCY FIRM
${deptTitle} Recruitment Desk
==================================================

NEW APPLICANT SUBMISSION
Position: ${positionTitle}
Department: ${deptTitle}
Reference ID: ${data.applicationRefId}
Submitted: ${data.submissionDate || new Date().toLocaleString()}

CANDIDATE CONTACT DETAILS:
- Full Name: ${data.fullName}
- Email: ${data.email}
- Mobile: ${data.phone}
- WhatsApp: ${data.whatsapp || 'N/A'}
- Present Location: ${data.location}
- Address: ${data.address}
- LinkedIn: ${data.linkedin || 'N/A'}

ACADEMIC BACKGROUND:
- Qualification: ${data.highestQualification}
- Degree: ${data.degreeProgram}
- Major: ${data.major}
- Institution: ${data.institution}
- Graduation Year: ${data.graduationYear}
- Result: ${data.academicResult}
- Currently Studying: ${data.currentlyStudying}

${data.salesMarketingSkills && data.salesMarketingSkills.length > 0 ? `SALES & MARKETING COMPETENCIES:
- Key Sales Skills: ${data.salesMarketingSkills.join(', ')}
${data.leadGenChannels && data.leadGenChannels.length > 0 ? `- Lead Gen Channels: ${data.leadGenChannels.join(', ')}\n` : ''}` : ''}${data.mtoTracks && data.mtoTracks.length > 0 ? `MANAGEMENT TRAINEE ROTATIONAL TRACKS:
- Preferred Tracks: ${data.mtoTracks.join(', ')}
- Analytical/Problem-Solving Self-Rating: ${data.analyticalRating || '4'} / 5
- Rotational Preferences: ${data.rotationalPreference || 'Open to all departments'}
` : ''}${data.accountingActivities && data.accountingActivities.length > 0 ? `ACCOUNTING & TECHNICAL COMPETENCIES:
- Accounting Principles: ${data.accountingPrinciplesRating || 'N/A'} / 5
- Core Activities: ${(data.accountingActivities || []).join(', ')}
- Software & Tools: ${(data.accountingSoftware || []).join(', ')}
- Microsoft Excel: ${data.excelSkill || 'N/A'}
- Tax & VAT Knowledge: ${data.taxVat || 'N/A'}
` : ''}${data.skillsDetails ? `- Additional Skills: ${data.skillsDetails}\n` : ''}
EXPERIENCE & AVAILABILITY:
- Work Experience: ${data.workExperience} (${data.experienceLength || 'N/A'})
${data.organization ? `- Organization: ${data.organization} | Role: ${data.jobTitle || 'N/A'}\n` : ''}
- Accounting Training/Internship: ${data.training}
${data.trainingDetails ? `- Training Details: ${data.trainingDetails}\n` : ''}
- Full-Time Availability: ${data.fullTime}
- Joining Timeframe: ${data.joinTime}
- Panthapath Dhaka Office: ${data.officeLocation}
- Expected Salary: BDT ${Number(data.salary || 0).toLocaleString()} / month
- Notice Period: ${data.noticePeriod || 'N/A'}

ATTACHMENTS & LINKS:
- CV / Resume: ${data.cvFileName || 'Uploaded'}
${data.academicDocsSummary ? `- Academic Docs: ${data.academicDocsSummary}\n` : ''}
${data.portfolio ? `- Portfolio / Work Link: ${data.portfolio}\n` : ''}

CANDIDATE MOTIVATION:
${data.motivation}

==================================================
Firm: E-Lawyers Legal & Business Consultancy Firm
Office: G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205
Recruitment Desk: career@elawyersbd.com | Phone: +880 1712-345678
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f5f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #243446;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f2f5f8; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 680px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(16,36,58,0.08); border: 1px solid #dfe6ec;">
          <!-- Top Navy Header Banner -->
          <tr>
            <td style="background: linear-gradient(120deg, #10243a 0%, #193650 70%, #167d83 120%); padding: 32px 30px; border-bottom: 4px solid #c7a76b;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.12); border-radius: 999px; color: #ddc38f; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;">
                      Accounts Division Recruitment Desk
                    </div>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.02em;">
                      New Candidate Application Received
                    </h1>
                    <p style="color: #d6e2eb; font-size: 13px; margin: 6px 0 0;">
                      Position: <strong style="color: #ffffff;">Accountant</strong> · Vacancies: 2 · Location: Panthapath, Dhaka
                    </p>
                  </td>
                  <td align="right" valign="top" style="width: 140px;">
                    <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 10px; text-align: center;">
                      <span style="display: block; font-size: 10px; color: #c5d5df; text-transform: uppercase; letter-spacing: 0.05em;">Ref ID</span>
                      <strong style="color: #ddc38f; font-size: 13px; font-family: monospace;">${data.applicationRefId}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Highlights Grid -->
          <tr>
            <td style="padding: 24px 30px 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f9fb; border: 1px solid #dfe6ec; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px; border-right: 1px solid #dfe6ec;" width="50%" valign="top">
                    <span style="font-size: 11px; color: #68788a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Candidate Name</span>
                    <strong style="font-size: 16px; color: #10243a;">${data.fullName}</strong>
                    <div style="font-size: 13px; color: #167d83; margin-top: 4px;">
                      <a href="mailto:${data.email}" style="color: #167d83; text-decoration: none;">${data.email}</a>
                    </div>
                    <div style="font-size: 13px; color: #243446; margin-top: 2px;">
                      Phone: <strong>${data.phone}</strong> ${data.whatsapp ? `· WA: ${data.whatsapp}` : ''}
                    </div>
                  </td>
                  <td style="padding: 16px;" width="50%" valign="top">
                    <span style="font-size: 11px; color: #68788a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Key Quick Specs</span>
                    <div style="font-size: 13px; color: #243446; line-height: 1.6;">
                      <strong>Expected Salary:</strong> BDT ${Number(data.salary || 0).toLocaleString()} /mo<br/>
                      <strong>Experience:</strong> ${data.workExperience} (${data.experienceLength || 'N/A'})<br/>
                      <strong>Full-Time:</strong> ${data.fullTime} · <strong>Join:</strong> ${data.joinTime}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Detailed Data Sections -->
              <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #10243a; margin: 18px 0 10px; border-left: 3px solid #167d83; padding-left: 8px;">
                1. Academic Background
              </h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td width="35%" style="color: #68788a; font-weight: 600;">Highest Qualification</td>
                  <td style="color: #10243a; font-weight: 700;">${data.highestQualification}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td style="color: #68788a; font-weight: 600;">Program &amp; Major</td>
                  <td style="color: #10243a;">${data.degreeProgram} — Major: <strong>${data.major}</strong></td>
                </tr>
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td style="color: #68788a; font-weight: 600;">University / Institution</td>
                  <td style="color: #10243a;">${data.institution}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td style="color: #68788a; font-weight: 600;">Passing Year &amp; Result</td>
                  <td style="color: #10243a;">${data.graduationYear} (Result: <strong>${data.academicResult}</strong>) · Currently Studying: ${data.currentlyStudying}</td>
                </tr>
              </table>

              <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #10243a; margin: 18px 0 10px; border-left: 3px solid #167d83; padding-left: 8px;">
                2. Accounting &amp; Technical Competencies
              </h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
${data.salesMarketingSkills && data.salesMarketingSkills.length > 0 ? `
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td width="35%" style="color: #68788a; font-weight: 600;">Sales &amp; Marketing Skills</td>
                  <td style="color: #10243a; font-weight: 700;">${data.salesMarketingSkills.join(' · ')}</td>
                </tr>
                ${data.leadGenChannels && data.leadGenChannels.length > 0 ? `
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td style="color: #68788a; font-weight: 600;">Lead Generation Channels</td>
                  <td style="color: #10243a;">${data.leadGenChannels.join(' · ')}</td>
                </tr>` : ''}
` : ''}
${data.mtoTracks && data.mtoTracks.length > 0 ? `
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td width="35%" style="color: #68788a; font-weight: 600;">Preferred Rotational Tracks</td>
                  <td style="color: #10243a; font-weight: 700;">${data.mtoTracks.join(' · ')}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td style="color: #68788a; font-weight: 600;">Analytical / Problem-Solving</td>
                  <td style="color: #10243a; font-weight: 700;">${data.analyticalRating || '4'} / 5</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td style="color: #68788a; font-weight: 600;">Rotational Preference</td>
                  <td style="color: #10243a;">${data.rotationalPreference || 'Open to all departments'}</td>
                </tr>
` : ''}
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td width="35%" style="color: #68788a; font-weight: 600;">Excel / Software Proficiency</td>
                  <td style="color: #10243a; font-weight: 700;">${data.excelSkill || 'Proficient'}</td>
                </tr>
                ${data.accountingActivities && data.accountingActivities.length > 0 ? `
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td style="color: #68788a; font-weight: 600;">Accounting Activities</td>
                  <td style="color: #10243a;">${(data.accountingActivities || []).join(' · ')}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edf1f4;">
                  <td style="color: #68788a; font-weight: 600;">Software Handled</td>
                  <td style="color: #10243a;">${(data.accountingSoftware || []).join(' · ')}</td>
                </tr>
                ` : ''}
                ${
                  data.skillsDetails
                    ? `<tr style="border-bottom: 1px solid #edf1f4;">
                        <td style="color: #68788a; font-weight: 600;">Additional Skills &amp; Qualifications</td>
                        <td style="color: #10243a;">${data.skillsDetails}</td>
                      </tr>`
                    : ''
                }
              </table>

              <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #10243a; margin: 18px 0 10px; border-left: 3px solid #167d83; padding-left: 8px;">
                3. Career Motivation &amp; Pitch
              </h2>
              <div style="background-color: #fffaf0; border: 1px solid #ead9b4; border-left: 4px solid #c7a76b; border-radius: 8px; padding: 14px 16px; font-size: 13.5px; line-height: 1.6; color: #3a2e1d; margin-bottom: 20px;">
                ${data.motivation.replace(/\n/g, '<br/>')}
              </div>

              <!-- Attachments Card -->
              <div style="background-color: #f7f9fb; border: 1px dashed #cbd6df; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                <strong style="font-size: 12px; color: #10243a; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">
                  Attached Candidate Files &amp; Links:
                </strong>
                <div style="font-size: 13px; color: #243446;">
                  📎 <strong>CV / Resume:</strong> ${data.cvFileName || 'Uploaded in portal'} ${data.cvFileSize ? `(${Math.round(data.cvFileSize / 1024)} KB)` : ''}<br/>
                  ${data.academicDocsSummary ? `📂 <strong>Certificates:</strong> ${data.academicDocsSummary}<br/>` : ''}
                  ${data.portfolio ? `🌐 <strong>Portfolio / Work:</strong> <a href="${data.portfolio}" style="color: #167d83;">${data.portfolio}</a><br/>` : ''}
                  ${data.linkedin ? `💼 <strong>LinkedIn:</strong> <a href="${data.linkedin}" style="color: #167d83;">${data.linkedin}</a>` : ''}
                </div>
              </div>

              <!-- Direct Action Buttons for HR -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${data.email}?subject=Interview%20Invitation%20-%20Accountant%20Role%20at%20E-Lawyers&body=Dear%20${encodeURIComponent(data.fullName)},%0D%0A%0D%0AThank%20you%20for%20applying%20for%20the%20Accountant%20position%20at%20E-Lawyers%20Legal%20%26%20Business%20Consultancy%20Firm%20(Ref:%20${data.applicationRefId})." style="display: inline-block; background-color: #167d83; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 6px; margin: 4px;">
                      Reply to Candidate (${data.email})
                    </a>
                    <a href="tel:${data.phone.replace(/[^0-9+]/g, '')}" style="display: inline-block; background-color: #10243a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 6px; margin: 4px;">
                      Call Candidate (${data.phone})
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7f9fb; border-top: 1px solid #dfe6ec; padding: 20px 30px; font-size: 12px; color: #68788a; line-height: 1.5; text-align: center;">
              <strong>E-Lawyers Legal &amp; Business Consultancy Firm</strong><br/>
              G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205, Bangladesh<br/>
              Recruitment Inbox: <a href="mailto:career@elawyersbd.com" style="color: #167d83; text-decoration: none;">career@elawyersbd.com</a> | Copy to: <a href="mailto:ekram.elawyersbd@gmail.com" style="color: #167d83; text-decoration: none;">ekram.elawyersbd@gmail.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export function generateCandidateAcknowledgementEmailHtml(data: CareerApplicationData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Application Received: Accountant (Accounts Division) [Ref: ${data.applicationRefId}] - E-Lawyers`;

  const text = `
Dear ${data.fullName},

Thank you for applying for the position of Accountant (Accounts Division) at E-Lawyers Legal & Business Consultancy Firm.

Your application has been received and logged into our recruitment registry under Reference ID: ${data.applicationRefId}.

APPLICATION SUMMARY:
- Position: Accountant (Accounts Division)
- Department: Accounts Division (B2B Accounting & Corporate Tax Compliance)
- Location: Panthapath, Dhaka, Bangladesh
- Date Received: ${data.submissionDate || new Date().toLocaleString()}

NEXT RECRUITMENT STEPS:
1. Application Screening & Document Verification (2-4 business days)
2. Practical Accounting Assessment & Technical Interview for shortlisted applicants
3. Partner Interview & Offer of Employment

If you have any questions or wish to provide updated documents, please reply directly to this email or contact us at career@elawyersbd.com citing your Reference ID (${data.applicationRefId}).

Best regards,
Recruitment Committee
E-Lawyers Legal & Business Consultancy Firm
G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205
Phone: +880 1712-345678 | Email: career@elawyersbd.com
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f5f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #243446;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f2f5f8; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(16,36,58,0.08); border: 1px solid #dfe6ec;">
          <tr>
            <td style="background: linear-gradient(120deg, #10243a 0%, #173750 70%, #167d83 120%); padding: 30px; border-bottom: 4px solid #c7a76b; color: #ffffff;">
              <div style="color: #ddc38f; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px;">
                E-Lawyers Legal &amp; Business Consultancy Firm
              </div>
              <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">
                Application Received Successfully
              </h1>
              <p style="color: #d6e2eb; font-size: 13px; margin: 6px 0 0;">
                Reference ID: <strong style="color: #ddc38f; font-family: monospace;">${data.applicationRefId}</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 30px;">
              <p style="font-size: 14px; line-height: 1.6; color: #243446; margin: 0 0 16px;">
                Dear <strong>${data.fullName}</strong>,
              </p>
              <p style="font-size: 13.5px; line-height: 1.6; color: #435569; margin: 0 0 18px;">
                Thank you for applying for the position of <strong>Accountant (Accounts Division)</strong> at E-Lawyers. We have successfully captured your profile and notified our HR &amp; Accounts Division Recruitment Team.
              </p>

              <div style="background-color: #f7f9fb; border: 1px solid #dfe6ec; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
                <div style="color: #10243a; font-weight: 700; margin-bottom: 6px; font-size: 13px;">Summary of Received Application:</div>
                <div style="color: #556677;">
                  • <strong>Position:</strong> Accountant (Full-Time)<br/>
                  • <strong>Department:</strong> Accounts Division<br/>
                  • <strong>Office:</strong> Panthapath, Dhaka-1205<br/>
                  • <strong>Expected Salary:</strong> BDT ${Number(data.salary || 0).toLocaleString()} / month<br/>
                  • <strong>Attached CV:</strong> ${data.cvFileName || 'Submitted'}
                </div>
              </div>

              <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #10243a; margin: 0 0 10px;">
                What Happens Next?
              </h3>
              <ol style="font-size: 13px; color: #435569; line-height: 1.6; padding-left: 20px; margin: 0 0 20px;">
                <li style="margin-bottom: 6px;">Our HR &amp; Accounts recruitment committee will review your academic qualifications, technical skills, and background.</li>
                <li style="margin-bottom: 6px;">Shortlisted candidates will be invited for a skill assessment and interview session at our Panthapath office.</li>
                <li>You can reach out to us at <a href="mailto:career@elawyersbd.com" style="color: #167d83; text-decoration: none; font-weight: 600;">career@elawyersbd.com</a> anytime with your reference ID.</li>
              </ol>

              <p style="font-size: 13px; color: #68788a; margin: 0;">
                We appreciate your interest in building your accounting career with E-Lawyers!
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f7f9fb; border-top: 1px solid #dfe6ec; padding: 18px 30px; font-size: 11.5px; color: #68788a; text-align: center; line-height: 1.5;">
              <strong>E-Lawyers Legal &amp; Business Consultancy Firm</strong><br/>
              G-5, BTI Centara Grand, 144-144/1 Green Road, Panthapath, Dhaka-1205, Bangladesh<br/>
              Hotline: +880 1712-345678 · Email: <a href="mailto:career@elawyersbd.com" style="color: #167d83; text-decoration: none;">career@elawyersbd.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html, text };
}
