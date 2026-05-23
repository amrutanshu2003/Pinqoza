const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
};

const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  const transporter = createTransporter();

  const from =
    process.env.MAIL_FROM ||
    process.env.SMTP_FROM ||
    `"Pinqoza Support" <${process.env.SMTP_USER}>`;

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html
  };

  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
