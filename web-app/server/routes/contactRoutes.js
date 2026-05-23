const express = require('express');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!name || name.length < 2) return res.status(400).json({ message: 'Name is required' });
    if (!email || !email.includes('@')) return res.status(400).json({ message: 'Valid email is required' });
    if (!message || message.length < 10) return res.status(400).json({ message: 'Message is required' });

    const to = process.env.CONTACT_TO || process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    if (!to) {
      return res.status(500).json({ message: 'Email is not configured on the server. Set CONTACT_TO and SMTP settings.' });
    }

    const subject = `Pinqoza Support Request | ${name}`;
    const text = `New support request\nFrom: ${name} <${email}>\n\n${message}`;
    const html = `
      <div style="margin:0;padding:24px;background:#f3f7ff;font-family:Arial,'Segoe UI',sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe6ff;box-shadow:0 14px 36px rgba(37,99,235,0.12);">
          <tr>
            <td style="padding:22px 24px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#ffffff;">
              <div style="font-size:12px;letter-spacing:1.3px;opacity:.9;text-transform:uppercase;">Pinqoza Support</div>
              <div style="margin-top:8px;font-size:22px;font-weight:700;">New Customer Request</div>
              <div style="margin-top:6px;font-size:13px;opacity:.95;">You have received a new message from the contact form.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                <tr>
                  <td style="width:110px;font-size:13px;color:#64748b;">Name</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(name)}</td>
                </tr>
                <tr>
                  <td style="width:110px;font-size:13px;color:#64748b;">Email</td>
                  <td style="font-size:14px;font-weight:600;">
                    <a href="mailto:${escapeHtml(email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(email)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px;">
              <div style="font-size:13px;color:#64748b;margin-bottom:8px;">Message</div>
              <div style="background:#f8fbff;border:1px solid #dbeafe;border-radius:12px;padding:14px 14px;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${escapeHtml(
                message
              )}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <div style="font-size:12px;color:#64748b;">Tip: just hit reply to answer this customer directly.</div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const supportInfo = await sendEmail({
      to,
      subject,
      text,
      html,
      replyTo: `${name} <${email}>`
    });
    console.log('Support mail accepted:', supportInfo?.accepted, 'rejected:', supportInfo?.rejected);

    const ackSubject = 'Thanks for contacting Pinqoza Support';
    const ackText = `Hi ${name},\n\nThank you for contacting Pinqoza support. We received your request and our team will contact you shortly.\n\nRegards,\nPinqoza Support Team`;
    const ackHtml = `
      <div style="margin:0;padding:24px;background:#f4f8ff;font-family:Arial,'Segoe UI',sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:18px 20px;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;">
              <div style="font-size:20px;font-weight:700;">Thanks for contacting us</div>
              <div style="font-size:13px;opacity:.95;margin-top:6px;">We have received your message successfully.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 10px;font-size:14px;">Hi ${escapeHtml(name)},</p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.6;">
                Thank you for contacting Pinqoza support. Our team will review your request and get back to you soon.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;">
                If you need urgent help, simply reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
              Pinqoza Support Team
            </td>
          </tr>
        </table>
      </div>
    `;

    let ackSent = false;
    let ackErrorMessage = '';
    try {
      const ackInfo = await sendEmail({
        to: email,
        subject: ackSubject,
        text: ackText,
        html: ackHtml
      });
      ackSent = Array.isArray(ackInfo?.accepted) && ackInfo.accepted.length > 0;
      console.log('Ack mail accepted:', ackInfo?.accepted, 'rejected:', ackInfo?.rejected);
      console.log(`Contact ack mail sent to ${email}`);
    } catch (ackError) {
      // Do not fail contact submission if ack mail fails
      ackErrorMessage = String(ackError?.message || ackError || 'Unknown SMTP error');
      console.error(`Contact ack mail failed for ${email}:`, ackErrorMessage);
    }

    res.json({ ok: true, ackSent, ackError: ackErrorMessage || undefined });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

module.exports = router;
