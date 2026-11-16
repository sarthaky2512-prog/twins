import nodemailer from 'nodemailer';
import type { BookingInquiry } from '../src/types/studio.js';

export interface EmailDispatchResult {
  dispatched: boolean;
  provider: 'smtp' | 'stored_only';
  message?: string;
}

function createSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  return {
    user,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    }),
  };
}

export async function dispatchInquiryNotification(
  inquiry: Omit<BookingInquiry, 'id' | 'status' | 'createdAt' | 'emailDispatched' | 'internalNotes'>,
  recipientEmail: string
): Promise<EmailDispatchResult> {
  const smtp = createSmtpTransport();
  const targetRecipient =
    process.env.INQUIRY_RECIPIENT_EMAIL || recipientEmail || 'twinssupport@gmail.com';

  if (!smtp) {
    return {
      dispatched: false,
      provider: 'stored_only',
      message: 'Inquiry stored in studio database; configure SMTP environment variables for email delivery.',
    };
  }

  try {
    const subject =
      inquiry.source === 'booking'
        ? `New Wedding Booking Inquiry — ${inquiry.fullName} (${inquiry.weddingDate || 'Date TBD'})`
        : `New Studio Contact Message — ${inquiry.fullName}`;

    const textBody = [
      `New inquiry received for Twins Twins Video Pro`,
      `--------------------------------------------------`,
      `Name: ${inquiry.fullName}`,
      `Email: ${inquiry.email}`,
      `Phone: ${inquiry.phone}`,
      `Wedding Date: ${inquiry.weddingDate || 'Not specified'}`,
      `Wedding Venue: ${inquiry.weddingVenue || 'Not specified'}`,
      `Wedding Location: ${inquiry.weddingLocation || 'Not specified'}`,
      `Service Required: ${inquiry.serviceRequired || 'Not specified'}`,
      `Preferred Package: ${inquiry.preferredPackage || 'Not specified'}`,
      `Estimated Budget: ${inquiry.estimatedBudget || 'Not specified'}`,
      ``,
      `Additional Requirements:`,
      inquiry.additionalRequirements || 'None provided.',
    ].join('\n');

    await smtp.transporter.sendMail({
      from: process.env.SMTP_FROM || `Twins Twins Video Pro <${smtp.user}>`,
      to: targetRecipient,
      replyTo: inquiry.email,
      subject,
      text: textBody,
    });

    return { dispatched: true, provider: 'smtp' };
  } catch (error) {
    console.error('SMTP dispatch failed (inquiry safely retained in database):', error);
    return {
      dispatched: false,
      provider: 'stored_only',
      message: 'Saved in studio database; email relay encountered a temporary error.',
    };
  }
}

export async function dispatchPasswordResetEmail(
  recipientEmail: string,
  resetUrl: string
): Promise<boolean> {
  const smtp = createSmtpTransport();
  if (!smtp) return false;
  try {
    await smtp.transporter.sendMail({
      from: process.env.SMTP_FROM || `Twins Twins Video Pro <${smtp.user}>`,
      to: recipientEmail,
      subject: 'Twins Twins Video Pro — Studio Admin Password Reset',
      text: `A password reset was requested for your Twins Twins Video Pro administrator account.\n\nOpen this secure link within 30 minutes to set a new password:\n${resetUrl}\n\nIf you did not request this, you can safely ignore this message.`,
    });
    return true;
  } catch (err) {
    console.error('Password reset email failed:', err);
    return false;
  }
}
