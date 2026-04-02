import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// ─── EMAIL TEMPLATES ─────────────────────────────────
const templates: Record<string, (data: any) => string> = {
  'verify-email': (d) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#2D6A4F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">owambe.com</h1>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
        <h2 style="color:#1A1612">Hi ${d.firstName}! 👋</h2>
        <p style="color:#374151;line-height:1.6">Welcome to Owambe — Nigeria's smartest event planning platform. Please verify your email to get started.</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${d.verifyUrl}" style="background:#E76F2A;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Verify My Email →</a>
        </div>
        <p style="color:#9CA3AF;font-size:14px">This link expires in 24 hours. If you didn't create an Owambe account, ignore this email.</p>
      </div>
    </div>`,

  'registration-confirmation': (d) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#2D6A4F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0">owambe.com</h1>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
        <h2 style="color:#1A1612">You're registered, ${d.firstName}! 🎉</h2>
        <div style="background:#EEF7F2;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:4px 0;font-weight:bold;color:#1A1612">📅 ${new Date(d.eventDate).toLocaleDateString('en-NG', { weekday:'long',year:'numeric',month:'long',day:'numeric' })}</p>
          <p style="margin:4px 0;color:#374151">🎟 ${d.ticketName}</p>
          <p style="margin:4px 0;color:#374151">📍 ${d.venue || 'Venue TBC'}</p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${d.viewUrl}" style="background:#2D6A4F;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View My Ticket →</a>
        </div>
        <p style="color:#9CA3AF;font-size:13px">Your QR code: <strong>${d.qrCode}</strong> — present at the door for entry.</p>
      </div>
    </div>`,

  'booking-confirmed': (d) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#2D6A4F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0">owambe.com</h1>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
        <h2 style="color:#1A1612">Booking Confirmed ✅</h2>
        <p>Hi ${d.firstName}, your booking with <strong>${d.vendorName}</strong> is confirmed!</p>
        <p>📅 Event Date: <strong>${new Date(d.eventDate).toLocaleDateString('en-NG')}</strong></p>
        <p>📋 Reference: <strong>${d.reference}</strong></p>
        <p style="color:#9CA3AF;font-size:13px">Your deposit is held securely in escrow and will be released to the vendor after your event.</p>
      </div>
    </div>`,

  'vendor-booking-confirmed': (d) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#E76F2A;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0">owambe.com — Vendor Portal</h1>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
        <h2>New Booking Confirmed 🎉</h2>
        <p>Hi ${d.vendorFirstName}, you have a new confirmed booking for <strong>${d.vendorName}</strong>!</p>
        <div style="background:#EEF7F2;border-radius:8px;padding:16px;margin:20px 0">
          <p>📅 Event Date: <strong>${new Date(d.eventDate).toLocaleDateString('en-NG')}</strong></p>
          <p>💰 Deposit received: <strong>${d.depositAmount}</strong></p>
          <p>💰 Balance on completion: <strong>${d.balanceAmount}</strong></p>
          <p>📋 Reference: <strong>${d.reference}</strong></p>
        </div>
        <p style="color:#6B7280;font-size:13px">The balance amount will be released to your bank account within 24 hours of the event completion.</p>
      </div>
    </div>`,

  'rfq-received': (d) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#E76F2A;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0">owambe.com — New RFQ</h1>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
        <h2>New Quote Request for ${d.vendorName}</h2>
        <div style="background:#FEF3C7;border-radius:8px;padding:16px;margin:16px 0">
          <p>📅 Event Date: <strong>${d.eventDate}</strong></p>
          <p>👥 Guest Count: <strong>${d.guestCount}</strong></p>
          <p>💰 Estimated Budget: <strong>${d.estimatedBudget}</strong></p>
          <p>📝 ${d.eventDescription}</p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${d.respondUrl}" style="background:#E76F2A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Submit Your Quote →</a>
        </div>
      </div>
    </div>`,

  'reset-password': (d) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#2D6A4F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0">owambe.com</h1>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
        <h2>Reset Your Password</h2>
        <p>Hi ${d.firstName}, click below to reset your password. This link expires in 1 hour.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${d.resetUrl}" style="background:#E76F2A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password →</a>
        </div>
        <p style="color:#9CA3AF;font-size:13px">If you didn't request this, ignore this email. Your password won't change.</p>
      </div>
    </div>`,

  'custom-campaign': (d) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#2D6A4F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0">owambe.com</h1>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
        <p>Hi ${d.firstName},</p>
        <div style="line-height:1.8;color:#374151">${d.body.replace(/\n/g, '<br>')}</div>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
        <p style="color:#9CA3AF;font-size:12px">You're receiving this because you registered for an event on Owambe.</p>
      </div>
    </div>`,
};

// ─── SEND EMAIL ──────────────────────────────────────
export async function sendEmail(options: EmailOptions) {
  const { to, subject, template, data } = options;
  const htmlTemplate = templates[template];

  if (!htmlTemplate) {
    logger.warn(`Unknown email template: ${template}`);
    return;
  }

  const html = htmlTemplate(data);

  try {
    await sgMail.send({
      to,
      from: { email: process.env.EMAIL_FROM!, name: process.env.EMAIL_FROM_NAME || 'Owambe' },
      subject,
      html,
    });
    logger.info(`Email sent: ${template} → ${to}`);
  } catch (err: any) {
    logger.error(`Email failed: ${template} → ${to}`, err?.response?.body || err.message);
    // Don't throw — email failures should not break the main flow
  }
}
