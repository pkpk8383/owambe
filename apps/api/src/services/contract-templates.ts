import { format } from 'date-fns';

export interface ContractData {
  reference: string;
  plannerName: string;
  plannerEmail: string;
  vendorName: string;
  vendorEmail: string;
  vendorCategory: string;
  eventDate?: Date;
  eventVenue?: string;
  guestCount?: number;
  totalAmount?: number;
  depositAmount?: number;
  currency?: string;
  eventDescription?: string;
  customClauses?: string;
}

function fmt(amount: number, currency = 'NGN'): string {
  return `${currency === 'NGN' ? '₦' : currency}${amount.toLocaleString('en-NG')}`;
}

function fmtDate(date?: Date): string {
  return date ? format(date, 'EEEE, MMMM d, yyyy') : 'To be confirmed';
}

// ─── SHARED HEADER ───────────────────────────────────
function header(d: ContractData, title: string): string {
  return `
    <div style="text-align:center; margin-bottom:32px; padding-bottom:24px; border-bottom:2px solid #1A1612;">
      <div style="font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">
        owambe.com · Event Services Agreement
      </div>
      <div style="font-size:24px; font-weight:800; color:#1A1612; margin-bottom:4px;">${title}</div>
      <div style="font-size:13px; color:#9A9080;">Reference: <strong style="color:#1A1612; font-family:monospace;">${d.reference}</strong></div>
      <div style="font-size:12px; color:#9A9080; margin-top:4px;">
        Generated: ${format(new Date(), 'MMMM d, yyyy')}
      </div>
    </div>`;
}

// ─── SHARED PARTIES SECTION ──────────────────────────
function parties(d: ContractData): string {
  return `
    <div style="margin-bottom:24px;">
      <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:12px;">Parties</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div style="background:#EEF7F2; border-radius:8px; padding:16px;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#2D6A4F; margin-bottom:8px;">Client (Planner)</div>
          <div style="font-weight:700; font-size:15px; color:#1A1612;">${d.plannerName}</div>
          <div style="font-size:13px; color:#9A9080; margin-top:2px;">${d.plannerEmail}</div>
          <div style="font-size:12px; color:#9A9080; margin-top:4px;">Hereinafter referred to as "the Client"</div>
        </div>
        <div style="background:#FEF3C7; border-radius:8px; padding:16px;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#E76F2A; margin-bottom:8px;">Service Provider (Vendor)</div>
          <div style="font-weight:700; font-size:15px; color:#1A1612;">${d.vendorName}</div>
          <div style="font-size:13px; color:#9A9080; margin-top:2px;">${d.vendorEmail}</div>
          <div style="font-size:12px; color:#9A9080; margin-top:4px;">Hereinafter referred to as "the Service Provider"</div>
        </div>
      </div>
    </div>`;
}

// ─── EVENT DETAILS SECTION ────────────────────────────
function eventDetails(d: ContractData): string {
  return `
    <div style="margin-bottom:24px; background:#F5F2EB; border-radius:8px; padding:16px;">
      <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:12px;">Event Details</div>
      <table style="width:100%; border-collapse:collapse;">
        ${d.eventDate ? `<tr><td style="padding:5px 0; color:#9A9080; font-size:13px; width:40%;">Event Date</td><td style="padding:5px 0; font-weight:600; font-size:13px; color:#1A1612;">${fmtDate(d.eventDate)}</td></tr>` : ''}
        ${d.eventVenue ? `<tr><td style="padding:5px 0; color:#9A9080; font-size:13px;">Venue</td><td style="padding:5px 0; font-weight:600; font-size:13px; color:#1A1612;">${d.eventVenue}</td></tr>` : ''}
        ${d.guestCount ? `<tr><td style="padding:5px 0; color:#9A9080; font-size:13px;">Expected Guests</td><td style="padding:5px 0; font-weight:600; font-size:13px; color:#1A1612;">${d.guestCount} guests</td></tr>` : ''}
        ${d.eventDescription ? `<tr><td style="padding:5px 0; color:#9A9080; font-size:13px;">Description</td><td style="padding:5px 0; font-weight:600; font-size:13px; color:#1A1612;">${d.eventDescription}</td></tr>` : ''}
      </table>
    </div>`;
}

// ─── PAYMENT SECTION ─────────────────────────────────
function paymentSection(d: ContractData): string {
  if (!d.totalAmount) return '';
  const deposit = d.depositAmount || Math.round(d.totalAmount * 0.3);
  const balance = d.totalAmount - deposit;
  return `
    <div style="margin-bottom:24px;">
      <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:12px;">Payment Schedule</div>
      <table style="width:100%; border-collapse:collapse; border:1px solid #E2DDD5; border-radius:8px; overflow:hidden;">
        <thead>
          <tr style="background:#1A1612; color:#fff;">
            <th style="padding:10px 14px; text-align:left; font-size:12px; font-weight:600;">Payment</th>
            <th style="padding:10px 14px; text-align:left; font-size:12px; font-weight:600;">Amount</th>
            <th style="padding:10px 14px; text-align:left; font-size:12px; font-weight:600;">Due</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #E2DDD5;">
            <td style="padding:10px 14px; font-size:13px;">Deposit (30%)</td>
            <td style="padding:10px 14px; font-weight:700; color:#2D6A4F; font-size:13px;">${fmt(deposit, d.currency)}</td>
            <td style="padding:10px 14px; font-size:13px; color:#9A9080;">At signing via Paystack escrow</td>
          </tr>
          <tr>
            <td style="padding:10px 14px; font-size:13px;">Balance (70%)</td>
            <td style="padding:10px 14px; font-weight:700; color:#1A1612; font-size:13px;">${fmt(balance, d.currency)}</td>
            <td style="padding:10px 14px; font-size:13px; color:#9A9080;">24h after event completion</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background:#EEF7F2;">
            <td style="padding:10px 14px; font-weight:800; font-size:14px;">Total</td>
            <td style="padding:10px 14px; font-weight:800; font-size:14px; color:#2D6A4F;">${fmt(d.totalAmount, d.currency)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div style="font-size:12px; color:#9A9080; margin-top:8px;">
        All payments processed securely via Paystack. Funds held in escrow until event completion.
      </div>
    </div>`;
}

// ─── SIGNATURE BLOCK ──────────────────────────────────
function signatureBlock(): string {
  return `
    <div style="margin-top:40px; padding-top:24px; border-top:2px solid #E2DDD5;">
      <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:16px;">Signatures</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:32px;">
        <div>
          <div style="height:60px; border-bottom:1.5px solid #1A1612; margin-bottom:8px;"></div>
          <div style="font-size:12px; color:#9A9080;">Client Signature &amp; Date</div>
          <div style="font-size:11px; color:#9A9080; margin-top:2px; font-style:italic;">IP address and timestamp recorded on signing</div>
        </div>
        <div>
          <div style="height:60px; border-bottom:1.5px solid #1A1612; margin-bottom:8px;"></div>
          <div style="font-size:12px; color:#9A9080;">Service Provider Signature &amp; Date</div>
          <div style="font-size:11px; color:#9A9080; margin-top:2px; font-style:italic;">IP address and timestamp recorded on signing</div>
        </div>
      </div>
      <div style="margin-top:20px; font-size:11px; color:#9A9080; text-align:center; line-height:1.6;">
        This contract was generated and executed digitally via owambe.com. Electronic signatures are legally binding
        under the Nigerian Communications Act and NITDA guidelines. Both parties have agreed to conduct this transaction electronically.
      </div>
    </div>`;
}

// ─── SERVICE AGREEMENT TEMPLATE ───────────────────────
export function generateServiceAgreement(d: ContractData): string {
  return `
    <div style="font-family:'Georgia', serif; max-width:800px; margin:0 auto; color:#1A1612; line-height:1.7; padding:40px;">
      ${header(d, 'Event Services Agreement')}
      ${parties(d)}
      ${eventDetails(d)}

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">1. Scope of Services</div>
        <p style="font-size:14px; color:#3D3730; margin-bottom:8px;">
          The Service Provider agrees to provide <strong>${d.vendorCategory}</strong> services for the event described above.
          Services include all work typically associated with the scope agreed during the booking process on the Owambe platform.
        </p>
        <p style="font-size:14px; color:#3D3730;">
          The Service Provider shall perform all services in a professional manner consistent with industry standards
          and shall provide their own equipment, materials, and personnel as required.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">2. Delivery &amp; Performance</div>
        <p style="font-size:14px; color:#3D3730;">
          The Service Provider shall arrive at the venue no later than the agreed setup time. Any delays exceeding
          30 minutes must be communicated immediately to the Client. Force majeure events (illness, natural disaster,
          government directive) must be notified within 2 hours of becoming known.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">3. Cancellation Policy</div>
        <p style="font-size:14px; color:#3D3730;">
          <strong>By Client:</strong> Cancellation 30+ days before the event: full deposit refund.
          Cancellation 15–29 days: 50% deposit refund. Cancellation fewer than 14 days: no refund of deposit.
        </p>
        <p style="font-size:14px; color:#3D3730; margin-top:8px;">
          <strong>By Service Provider:</strong> Cancellation less than 7 days before the event entitles the Client
          to a full refund plus compensation of 10% of the total contract value.
        </p>
      </div>

      ${paymentSection(d)}

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">4. Limitation of Liability</div>
        <p style="font-size:14px; color:#3D3730;">
          The total liability of either party under this agreement shall not exceed the total contract value.
          Neither party shall be liable for indirect, consequential, or punitive damages.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">5. Governing Law</div>
        <p style="font-size:14px; color:#3D3730;">
          This agreement is governed by the laws of the Federal Republic of Nigeria. Any disputes shall first be
          referred to mediation through the Owambe dispute resolution process before any legal proceedings.
        </p>
      </div>

      ${d.customClauses ? `
      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">6. Additional Terms</div>
        <p style="font-size:14px; color:#3D3730; white-space:pre-line;">${d.customClauses}</p>
      </div>` : ''}

      ${signatureBlock()}
    </div>`;
}

// ─── VENUE HIRE AGREEMENT ─────────────────────────────
export function generateVenueHireAgreement(d: ContractData): string {
  return `
    <div style="font-family:'Georgia', serif; max-width:800px; margin:0 auto; color:#1A1612; line-height:1.7; padding:40px;">
      ${header(d, 'Venue Hire Agreement')}
      ${parties(d)}
      ${eventDetails(d)}

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">1. Venue Hire</div>
        <p style="font-size:14px; color:#3D3730; margin-bottom:8px;">
          The Service Provider agrees to make available the venue at <strong>${d.eventVenue || 'the agreed location'}</strong>
          for the exclusive use of the Client on ${fmtDate(d.eventDate)}.
        </p>
        <p style="font-size:14px; color:#3D3730;">
          The venue will be available for setup from the agreed time. The Client must vacate the premises by the
          agreed end time. Additional hours may be available at the standard hourly rate.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">2. Capacity &amp; Compliance</div>
        <p style="font-size:14px; color:#3D3730;">
          Maximum capacity: <strong>${d.guestCount || 'As agreed'} persons</strong>. The Client is responsible for
          ensuring that the number of attendees does not exceed this limit. The Client must comply with all
          venue rules, local authority requirements, and fire safety regulations.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">3. Damage &amp; Security Deposit</div>
        <p style="font-size:14px; color:#3D3730;">
          A security/damage deposit (if applicable) is held separately and will be returned within 5 business days
          after the event, less any deductions for damage, excessive cleaning, or overtime.
          The Client accepts responsibility for any damage caused by their guests.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">4. Noise &amp; Conduct</div>
        <p style="font-size:14px; color:#3D3730;">
          The Client agrees to comply with noise ordinances and local authority regulations. Any amplified music
          must cease at the agreed time. The Service Provider reserves the right to terminate the event without
          refund if the Client or their guests engage in illegal activity or cause a nuisance.
        </p>
      </div>

      ${paymentSection(d)}

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">5. Cancellation</div>
        <p style="font-size:14px; color:#3D3730;">
          Cancellation 60+ days prior: full deposit refund less 10% administration fee.
          Cancellation 30–59 days: 50% deposit refund. Cancellation fewer than 30 days: deposit forfeited.
          The Client may reschedule once at no charge if done 30+ days in advance.
        </p>
      </div>

      ${d.customClauses ? `
      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">6. Special Conditions</div>
        <p style="font-size:14px; color:#3D3730; white-space:pre-line;">${d.customClauses}</p>
      </div>` : ''}

      ${signatureBlock()}
    </div>`;
}

// ─── PHOTOGRAPHY/VIDEO AGREEMENT ──────────────────────
export function generatePhotographyAgreement(d: ContractData): string {
  return `
    <div style="font-family:'Georgia', serif; max-width:800px; margin:0 auto; color:#1A1612; line-height:1.7; padding:40px;">
      ${header(d, 'Photography & Videography Agreement')}
      ${parties(d)}
      ${eventDetails(d)}

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">1. Services</div>
        <p style="font-size:14px; color:#3D3730;">
          The Service Provider agrees to provide professional photography and/or videography services for the event.
          Services include attendance for the agreed hours, editing, and delivery of final files within the agreed timeframe.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">2. Deliverables &amp; Timeline</div>
        <p style="font-size:14px; color:#3D3730;">
          Edited photos/video will be delivered via private online gallery within the agreed timeframe
          (typically 2–4 weeks for photos, 4–8 weeks for video). The Client will receive a high-resolution
          digital download link. Prints and albums are separate unless agreed in the package.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">3. Copyright &amp; Usage</div>
        <p style="font-size:14px; color:#3D3730;">
          The Service Provider retains copyright of all images and video. The Client receives a non-exclusive
          licence for personal use. The Service Provider may use images/video for portfolio and marketing
          purposes unless the Client specifically requests confidentiality in writing.
        </p>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">4. Equipment Failure</div>
        <p style="font-size:14px; color:#3D3730;">
          The Service Provider carries professional backup equipment. In the unlikely event of total equipment
          failure, the Client's sole remedy shall be a proportional refund. The Service Provider shall not be
          liable for losses arising from equipment failure.
        </p>
      </div>

      ${paymentSection(d)}

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">5. Cancellation &amp; Rescheduling</div>
        <p style="font-size:14px; color:#3D3730;">
          Cancellation 30+ days: deposit refund less 15% booking fee.
          Cancellation 14–29 days: no deposit refund. Cancellation fewer than 14 days: full amount due.
          One free reschedule permitted with 21+ days notice, subject to availability.
        </p>
      </div>

      ${d.customClauses ? `
      <div style="margin-bottom:20px;">
        <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#9A9080; margin-bottom:8px;">6. Additional Terms</div>
        <p style="font-size:14px; color:#3D3730; white-space:pre-line;">${d.customClauses}</p>
      </div>` : ''}

      ${signatureBlock()}
    </div>`;
}

// ─── FACTORY ─────────────────────────────────────────
export function generateContractHtml(templateType: string, data: ContractData): string {
  switch (templateType) {
    case 'VENUE_HIRE': return generateVenueHireAgreement(data);
    case 'PHOTOGRAPHY': return generatePhotographyAgreement(data);
    case 'SERVICE_AGREEMENT':
    default:
      return generateServiceAgreement(data);
  }
}

// Map vendor category to best template
export function inferTemplate(vendorCategory: string): string {
  if (vendorCategory?.includes('VENUE')) return 'VENUE_HIRE';
  if (vendorCategory?.includes('PHOTO') || vendorCategory?.includes('VIDEO')) return 'PHOTOGRAPHY';
  return 'SERVICE_AGREEMENT';
}
