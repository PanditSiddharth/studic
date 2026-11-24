import nodemailer from "nodemailer";
import type { Options as SmtpOptions } from "nodemailer/lib/smtp-transport";

type MailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Send a transactional email through Brevo's SMTP relay.
 *
 * This module is intentionally framework-agnostic (no "use server") so it can
 * be reused by server actions without exposing a generic "send any email"
 * endpoint. Nodemailer works on Vercel's Node.js runtime; no filesystem or
 * long-lived connections are required.
 */
export async function sendTransactionalMail({ to, subject, html }: MailInput) {
  const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  const user = process.env.BREVO_SMTP_USER || process.env.USER_MAIL;
  const pass = process.env.BREVO_SMTP_PASS || process.env.MAIL_PASSWORD;
  const from = process.env.NO_REPLY_EMAIL || process.env.USER_MAIL || user;

  if (!host || !user || !pass || !from) {
    throw new Error("Email service is not configured.");
  }

  const transportOptions: SmtpOptions = {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };
  const transporter = nodemailer.createTransport(transportOptions);

  return transporter.sendMail({
    from: `"Studic" <${from}>`,
    to,
    subject,
    html,
  });
}
