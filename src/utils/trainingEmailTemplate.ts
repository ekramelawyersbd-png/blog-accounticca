export interface TrainingAdmissionEmailPayload {
  admissionId: string;
  applicantName: string;
  email: string;
  phone: string;
  courseId: string;
  courseName: string;
  qualification: string;
  experience: string;
  motivation?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedAt?: string | null;
}

export function generateTrainingAdmissionEmailHtml(
  data: TrainingAdmissionEmailPayload
): { subject: string; html: string; text: string } {
  const isApproved = data.status === 'approved';
  const isRejected = data.status === 'rejected';

  const statusColor = isApproved ? '#059669' : isRejected ? '#dc2626' : '#d97706';
  const statusBg = isApproved ? '#ecfdf5' : isRejected ? '#fef2f2' : '#fffbeb';
  const statusBorder = isApproved ? '#a7f3d0' : isRejected ? '#fecaca' : '#fde68a';
  const statusTitle = isApproved
    ? 'ADMISSION APPROVED — LMS ACCESS GRANTED'
    : isRejected
      ? 'ADMISSION APPLICATION REVIEWED'
      : 'ADMISSION APPLICATION RECEIVED (PENDING REVIEW)';

  const subject = isApproved
    ? `[APPROVED] Training Admission #${data.admissionId} — ${data.courseName}`
    : `[RECEIVED] Training Admission Application #${data.admissionId} — Accounticca Academy`;

  const dashboardUrl = 'https://ais-dev-mvvfdk62owote4owun5v6m-312729680869.asia-southeast1.run.app/student/dashboard';

  const text = `
ACCOUNTICCA × E-LAWYERS ACADEMY
Training Admission Status Notice

Application Reference: ${data.admissionId}
Applicant Name: ${data.applicantName}
Course Enrolled: ${data.courseName} (${data.courseId})
Current Status: ${data.status.toUpperCase()}
Applied At: ${new Date(data.appliedAt).toLocaleString('en-BD')}

${
  isApproved
    ? `Congratulations! Your training admission application has been approved by the academy admissions committee. You now have view-only access to course lectures and materials in your Student Dashboard: ${dashboardUrl}`
    : 'Your application has been received and logged in our admissions desk. Our academic coordinators will review your professional qualification and notify you upon approval.'
}

Academy Support Hotline: +880 1712-345678 | Email: academy@accounticca.com
Chambers Address: BTI Centara Grand, 144 Green Road, Panthapath, Dhaka 1205
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; max-width: 640px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #091e3a 0%, #102a4c 100%); padding: 32px 36px; text-align: left; border-bottom: 3px solid #10b981; }
    .brand-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #10b981; margin: 0 0 6px 0; }
    .brand-title { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.01em; }
    .brand-subtitle { font-size: 12px; color: #94a3b8; margin: 4px 0 0 0; }
    .content { padding: 36px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; margin-bottom: 20px; }
    .headline { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; line-height: 1.3; }
    .subtext { font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 28px 0; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
    .card-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 14px 0; }
    .table { width: 100%; border-collapse: collapse; }
    .table td { padding: 8px 0; font-size: 14px; vertical-align: top; }
    .table td.label { color: #64748b; width: 38%; font-weight: 500; }
    .table td.value { color: #0f172a; font-weight: 700; }
    .btn-container { text-align: center; margin: 32px 0 20px 0; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 36px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-eyebrow">Accounticca × E-Lawyers Academy</div>
      <div class="brand-title">Professional Training &amp; Live Cohorts</div>
      <div class="brand-subtitle">Official Student Admission &amp; Enrollment Notification</div>
    </div>
    <div class="content">
      <div class="status-badge">${statusTitle}</div>
      <h1 class="headline">Hello, ${data.applicantName}!</h1>
      <p class="subtext">
        ${
          isApproved
            ? 'We are delighted to inform you that your training admission application has been approved by the academy admissions committee. You now have full view-only access to your enrolled course materials in the Student Dashboard.'
            : 'Thank you for applying to Accounticca Academy. We have successfully received your admission application. Our academic team is reviewing your credentials and will notify you shortly upon approval.'
        }
      </p>

      <div class="card">
        <div class="card-title">Admission Application Summary</div>
        <table class="table">
          <tr>
            <td class="label">Application ID:</td>
            <td class="value"><span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">#${data.admissionId}</span></td>
          </tr>
          <tr>
            <td class="label">Selected Course:</td>
            <td class="value">${data.courseName}</td>
          </tr>
          <tr>
            <td class="label">Applicant Name:</td>
            <td class="value">${data.applicantName}</td>
          </tr>
          <tr>
            <td class="label">Email &amp; Phone:</td>
            <td class="value">${data.email} • ${data.phone}</td>
          </tr>
          <tr>
            <td class="label">Qualification:</td>
            <td class="value">${data.qualification} (${data.experience})</td>
          </tr>
          <tr>
            <td class="label">Application Status:</td>
            <td class="value" style="color: ${statusColor}; text-transform: uppercase;">${data.status}</td>
          </tr>
        </table>
      </div>

      ${
        isApproved
          ? `
      <div class="btn-container">
        <a href="${dashboardUrl}" class="btn" target="_blank">Open Student Dashboard (/student/dashboard)</a>
      </div>
      `
          : ''
      }
    </div>
    <div class="footer">
      <strong>Accounticca × E-Lawyers Chambers</strong><br>
      BTI Centara Grand, 144 Green Road, Panthapath, Dhaka 1205<br>
      Hotline: +880 1712-345678 • Email: academy@accounticca.com
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}
