import { sendEmail } from './email.service';
import { logger } from '../utils/logger';

interface EmailJob {
  id: string;
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  scheduledAt?: Date;
}

// In-memory queue — upgrade to Bull + Redis in production
class EmailQueue {
  private queue: EmailJob[] = [];
  private processing = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  add(job: Omit<EmailJob, 'id' | 'attempts' | 'maxAttempts'>) {
    const emailJob: EmailJob = {
      ...job,
      id: `email-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      attempts: 0,
      maxAttempts: 3,
    };
    this.queue.push(emailJob);
    logger.info(`Email queued: ${job.template} → ${job.to}`);
    return emailJob.id;
  }

  addBulk(jobs: Array<Omit<EmailJob, 'id' | 'attempts' | 'maxAttempts'>>, delayMs = 200) {
    jobs.forEach((job, i) => {
      const scheduledAt = new Date(Date.now() + i * delayMs);
      this.add({ ...job, scheduledAt });
    });
  }

  private startProcessing() {
    this.intervalId = setInterval(() => this.processNext(), 500);
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;

    const now = new Date();
    const job = this.queue.find(j =>
      !j.scheduledAt || j.scheduledAt <= now
    );
    if (!job) return;

    this.processing = true;
    this.queue = this.queue.filter(j => j.id !== job.id);

    try {
      await sendEmail({
        to: job.to,
        subject: job.subject,
        template: job.template,
        data: job.data,
      });
      logger.info(`Email sent: ${job.template} → ${job.to}`);
    } catch (err) {
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        job.scheduledAt = new Date(Date.now() + Math.pow(2, job.attempts) * 1000);
        this.queue.push(job);
        logger.warn(`Email failed (attempt ${job.attempts}/${job.maxAttempts}): ${job.to}`);
      } else {
        logger.error(`Email permanently failed after ${job.maxAttempts} attempts: ${job.to}`);
      }
    } finally {
      this.processing = false;
    }
  }

  get size() { return this.queue.length; }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Singleton
export const emailQueue = new EmailQueue();

// ─── CONVENIENCE METHODS ─────────────────────────────
export function queueRegistrationConfirmation(data: {
  to: string;
  firstName: string;
  eventName: string;
  eventDate: Date;
  venue?: string;
  ticketName: string;
  qrCode: string;
}) {
  return emailQueue.add({
    to: data.to,
    subject: `You're registered for ${data.eventName}! 🎉`,
    template: 'registration-confirmation',
    data,
  });
}

export function queueBookingConfirmation(data: {
  to: string;
  firstName: string;
  vendorName: string;
  eventDate: Date;
  reference: string;
}) {
  return emailQueue.add({
    to: data.to,
    subject: `Booking confirmed — ${data.vendorName}`,
    template: 'booking-confirmed',
    data,
  });
}

export function queueBulkCampaign(recipients: Array<{ email: string; firstName: string }>, campaign: {
  subject: string;
  body: string;
}) {
  emailQueue.addBulk(
    recipients.map(r => ({
      to: r.email,
      subject: campaign.subject,
      template: 'custom-campaign',
      data: { firstName: r.firstName, body: campaign.body },
    })),
    300 // 300ms between each email to respect SendGrid limits
  );
  logger.info(`Bulk campaign queued: ${recipients.length} emails`);
}
