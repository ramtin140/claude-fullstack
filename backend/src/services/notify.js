// Per spec, match-lock / result notifications go out by email (not SMS/Telegram).
// No SMTP provider or credentials exist yet, so this is a stub: it logs the
// notification so every call site in the h2h flow is already wired up
// correctly. Swap the body of this function for a real client (nodemailer +
// SMTP, or a transactional email API) when credentials are available — no
// caller needs to change.
export function sendEmailNotification(toEmail, subject, body) {
  console.log(`[email-stub] To: ${toEmail} | Subject: ${subject}\n${body}`);
}
