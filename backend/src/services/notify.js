import nodemailer from 'nodemailer';

// Per spec, match-lock / result notifications go out by email (not SMS/Telegram).
// If SMTP_HOST/SMTP_USER/SMTP_PASS are configured, this sends a real email.
// Otherwise it falls back to logging so every call site in the h2h flow stays
// wired up correctly even before real credentials are available.
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmailNotification(toEmail, subject, body) {
  const client = getTransporter();
  if (!client) {
    console.log(`[email-stub] To: ${toEmail} | Subject: ${subject}\n${body}`);
    return;
  }

  try {
    const info = await client.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject,
      text: body,
    });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[email] preview: ${preview}`);
  } catch (err) {
    console.error(`[email] failed to send to ${toEmail}:`, err.message);
  }
}
