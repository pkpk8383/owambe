import axios from 'axios';
import { logger } from '../utils/logger';

// ─── TYPE DEFINITIONS ─────────────────────────────────
export interface CrmContact {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  source?: string;
  owambeAttendeeId?: string;
  owambeEventName?: string;
  owambeTicketType?: string;
  owambeRegisteredAt?: string;
  owambeAmountPaid?: number;
}

export interface CrmDeal {
  name: string;
  amount: number;
  currency: string;
  closeDate: string;
  stage: string;
  owambeBookingRef?: string;
  owambeVendorName?: string;
  owambeEventDate?: string;
  contactEmail?: string;
}

export interface SyncResult {
  success: boolean;
  crmId?: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  error?: string;
  durationMs: number;
}

// ─── FIELD MAPPING HELPERS ────────────────────────────
export const DEFAULT_ATTENDEE_FIELD_MAP_SF: Record<string, string> = {
  firstName: 'FirstName',
  lastName: 'LastName',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  owambeAttendeeId: 'Owambe_Attendee_ID__c',
  owambeEventName: 'Owambe_Event_Name__c',
  owambeTicketType: 'Owambe_Ticket_Type__c',
  owambeAmountPaid: 'Owambe_Amount_Paid__c',
};

export const DEFAULT_ATTENDEE_FIELD_MAP_HS: Record<string, string> = {
  firstName: 'firstname',
  lastName: 'lastname',
  email: 'email',
  phone: 'phone',
  company: 'company',
  owambeAttendeeId: 'owambe_attendee_id',
  owambeEventName: 'owambe_event_name',
  owambeTicketType: 'owambe_ticket_type',
  owambeAmountPaid: 'owambe_amount_paid',
};

// ─── SALESFORCE ADAPTER ────────────────────────────────
export class SalesforceAdapter {
  private instanceUrl: string;
  private accessToken: string;

  constructor(instanceUrl: string, accessToken: string) {
    this.instanceUrl = instanceUrl.replace(/\/$/, '');
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private get baseUrl() {
    return `${this.instanceUrl}/services/data/v59.0`;
  }

  /** Refresh OAuth token using refresh_token grant */
  static async refreshToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{
    accessToken: string;
    instanceUrl: string;
    expiresAt: Date;
  }> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await axios.post('https://login.salesforce.com/services/oauth2/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: res.data.access_token,
      instanceUrl: res.data.instance_url,
      expiresAt: new Date(Date.now() + 3600 * 1000), // SF tokens last 1 hour
    };
  }

  /** Exchange authorization code for tokens (OAuth callback) */
  static async exchangeCode(code: string, redirectUri: string, clientId: string, clientSecret: string) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await axios.post('https://login.salesforce.com/services/oauth2/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      instanceUrl: res.data.instance_url,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  /** Test connection — returns org details */
  async testConnection(): Promise<{ orgId: string; orgName: string; userId: string }> {
    const res = await axios.get(`${this.baseUrl}/chatter/users/me`, { headers: this.headers });
    const info = await axios.get(`${this.instanceUrl}/services/oauth2/userinfo`, { headers: this.headers });
    return {
      orgId: info.data.organization_id,
      orgName: info.data.organization_name,
      userId: info.data.user_id,
    };
  }

  /** Upsert a Contact record (match on Email) */
  async upsertContact(contact: CrmContact, fieldMap: Record<string, string>): Promise<SyncResult> {
    const start = Date.now();
    try {
      // Build SF record from field map
      const record: Record<string, any> = {};
      for (const [owambeField, sfField] of Object.entries(fieldMap)) {
        const val = (contact as any)[owambeField];
        if (val !== undefined && val !== null) {
          record[sfField] = val;
        }
      }

      // Upsert by Email (external ID)
      const email = encodeURIComponent(contact.email);
      const res = await axios.patch(
        `${this.baseUrl}/sobjects/Contact/Email/${email}`,
        record,
        { headers: this.headers }
      );

      const action = res.status === 201 ? 'created' : 'updated';
      const crmId = res.data?.id || res.headers?.location?.split('/').pop();

      logger.info(`SF Contact upsert: ${contact.email} → ${action} (${crmId})`);
      return { success: true, crmId, action, durationMs: Date.now() - start };
    } catch (err: any) {
      const msg = err.response?.data?.[0]?.message || err.message;
      logger.error(`SF Contact upsert failed for ${contact.email}: ${msg}`);
      return { success: false, action: 'error', error: msg, durationMs: Date.now() - start };
    }
  }

  /** Create or update an Opportunity (deal) */
  async upsertOpportunity(deal: CrmDeal, contactId?: string): Promise<SyncResult> {
    const start = Date.now();
    try {
      // Check if opp with this booking ref exists
      const query = `SELECT Id FROM Opportunity WHERE Owambe_Booking_Ref__c = '${deal.owambeBookingRef}' LIMIT 1`;
      const searchRes = await axios.get(`${this.baseUrl}/query?q=${encodeURIComponent(query)}`, { headers: this.headers });
      const existing = searchRes.data.records?.[0];

      const record: Record<string, any> = {
        Name: deal.name,
        Amount: deal.amount,
        CloseDate: deal.closeDate,
        StageName: deal.stage,
        CurrencyIsoCode: deal.currency === 'NGN' ? 'NGN' : deal.currency,
        Owambe_Booking_Ref__c: deal.owambeBookingRef,
        Owambe_Vendor_Name__c: deal.owambeVendorName,
        Owambe_Event_Date__c: deal.owambeEventDate,
        ...(contactId && { ContactId: contactId }),
      };

      if (existing) {
        await axios.patch(`${this.baseUrl}/sobjects/Opportunity/${existing.Id}`, record, { headers: this.headers });
        return { success: true, crmId: existing.Id, action: 'updated', durationMs: Date.now() - start };
      } else {
        const res = await axios.post(`${this.baseUrl}/sobjects/Opportunity`, record, { headers: this.headers });
        return { success: true, crmId: res.data.id, action: 'created', durationMs: Date.now() - start };
      }
    } catch (err: any) {
      const msg = err.response?.data?.[0]?.message || err.message;
      return { success: false, action: 'error', error: msg, durationMs: Date.now() - start };
    }
  }

  /** Fetch contacts updated after a given date */
  async getUpdatedContacts(since: Date): Promise<any[]> {
    const isoDate = since.toISOString();
    const query = `SELECT Id, Email, FirstName, LastName, Phone, Company, Owambe_Attendee_ID__c FROM Contact WHERE LastModifiedDate > ${isoDate} LIMIT 200`;
    const res = await axios.get(`${this.baseUrl}/query?q=${encodeURIComponent(query)}`, { headers: this.headers });
    return res.data.records || [];
  }

  /** Get pipeline stage values */
  async getOpportunityStages(): Promise<string[]> {
    const query = `SELECT MasterLabel FROM OpportunityStage WHERE IsActive = true ORDER BY SortOrder`;
    const res = await axios.get(`${this.baseUrl}/query?q=${encodeURIComponent(query)}`, { headers: this.headers });
    return (res.data.records || []).map((r: any) => r.MasterLabel);
  }
}

// ─── HUBSPOT ADAPTER ──────────────────────────────────
export class HubSpotAdapter {
  private accessToken: string;
  private readonly BASE = 'https://api.hubapi.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  static getAuthUrl(clientId: string, redirectUri: string, portalId?: string): string {
    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'oauth',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      ...(portalId && { portal_id: portalId }),
    });

    return `https://app.hubspot.com/oauth/authorize?${params}`;
  }

  static async exchangeCode(code: string, redirectUri: string, clientId: string, clientSecret: string) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const res = await axios.post('https://api.hubapi.com/oauth/v1/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // Get portal info
    const info = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/' + res.data.access_token);
    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      expiresAt: new Date(Date.now() + res.data.expires_in * 1000),
      portalId: String(info.data.hub_id),
    };
  }

  static async refreshToken(refreshToken: string, clientId: string, clientSecret: string) {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    const res = await axios.post('https://api.hubapi.com/oauth/v1/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      expiresAt: new Date(Date.now() + res.data.expires_in * 1000),
    };
  }

  async testConnection(): Promise<{ portalId: string; userId: string; email: string }> {
    const res = await axios.get(`${this.BASE}/oauth/v1/access-tokens/${this.accessToken}`);
    return {
      portalId: String(res.data.hub_id),
      userId: String(res.data.user_id),
      email: res.data.user,
    };
  }

  /** Upsert a Contact (match on email) */
  async upsertContact(contact: CrmContact, fieldMap: Record<string, string>): Promise<SyncResult> {
    const start = Date.now();
    try {
      // Build HS properties from field map
      const properties: Record<string, any> = {};
      for (const [owambeField, hsField] of Object.entries(fieldMap)) {
        const val = (contact as any)[owambeField];
        if (val !== undefined && val !== null) {
          properties[hsField] = String(val);
        }
      }

      // Always set source
      properties['hs_lead_status'] = 'NEW';
      properties['lifecyclestage'] = 'lead';

      // Check if contact exists
      const searchRes = await axios.post(`${this.BASE}/crm/v3/objects/contacts/search`, {
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: contact.email }] }],
        properties: ['email', 'hs_object_id'],
        limit: 1,
      }, { headers: this.headers });

      const existing = searchRes.data.results?.[0];

      if (existing) {
        await axios.patch(`${this.BASE}/crm/v3/objects/contacts/${existing.id}`, { properties }, { headers: this.headers });
        return { success: true, crmId: existing.id, action: 'updated', durationMs: Date.now() - start };
      } else {
        const res = await axios.post(`${this.BASE}/crm/v3/objects/contacts`, { properties }, { headers: this.headers });
        return { success: true, crmId: res.data.id, action: 'created', durationMs: Date.now() - start };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      logger.error(`HS Contact upsert failed for ${contact.email}: ${msg}`);
      return { success: false, action: 'error', error: msg, durationMs: Date.now() - start };
    }
  }

  /** Upsert a Deal */
  async upsertDeal(deal: CrmDeal, contactId?: string, pipelineId?: string): Promise<SyncResult> {
    const start = Date.now();
    try {
      const properties: Record<string, any> = {
        dealname: deal.name,
        amount: String(deal.amount),
        closedate: new Date(deal.closeDate).getTime(),
        dealstage: deal.stage || 'appointmentscheduled',
        owambe_booking_ref: deal.owambeBookingRef,
        owambe_vendor_name: deal.owambeVendorName,
        owambe_event_date: deal.owambeEventDate,
        ...(pipelineId && { pipeline: pipelineId }),
      };

      // Check for existing deal by booking ref
      const searchRes = await axios.post(`${this.BASE}/crm/v3/objects/deals/search`, {
        filterGroups: [{ filters: [{ propertyName: 'owambe_booking_ref', operator: 'EQ', value: deal.owambeBookingRef }] }],
        properties: ['hs_object_id'],
        limit: 1,
      }, { headers: this.headers });

      const existing = searchRes.data.results?.[0];
      let dealId: string;

      if (existing) {
        await axios.patch(`${this.BASE}/crm/v3/objects/deals/${existing.id}`, { properties }, { headers: this.headers });
        dealId = existing.id;
        if (contactId) {
          await this.associateDealContact(dealId, contactId);
        }
        return { success: true, crmId: dealId, action: 'updated', durationMs: Date.now() - start };
      } else {
        const res = await axios.post(`${this.BASE}/crm/v3/objects/deals`, { properties }, { headers: this.headers });
        dealId = res.data.id;
        if (contactId) {
          await this.associateDealContact(dealId, contactId);
        }
        return { success: true, crmId: dealId, action: 'created', durationMs: Date.now() - start };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      return { success: false, action: 'error', error: msg, durationMs: Date.now() - start };
    }
  }

  private async associateDealContact(dealId: string, contactId: string) {
    await axios.put(
      `${this.BASE}/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`,
      [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
      { headers: this.headers }
    );
  }

  /** Get recently updated contacts */
  async getUpdatedContacts(since: Date): Promise<any[]> {
    const res = await axios.post(`${this.BASE}/crm/v3/objects/contacts/search`, {
      filterGroups: [{
        filters: [{
          propertyName: 'lastmodifieddate',
          operator: 'GT',
          value: String(since.getTime()),
        }]
      }],
      properties: ['email', 'firstname', 'lastname', 'phone', 'company', 'owambe_attendee_id'],
      limit: 100,
    }, { headers: this.headers });
    return res.data.results || [];
  }

  /** Get pipelines */
  async getPipelines(): Promise<Array<{ id: string; label: string; stages: Array<{ id: string; label: string }> }>> {
    const res = await axios.get(`${this.BASE}/crm/v3/pipelines/deals`, { headers: this.headers });
    return (res.data.results || []).map((p: any) => ({
      id: p.id,
      label: p.label,
      stages: (p.stages || []).map((s: any) => ({ id: s.id, label: s.label })),
    }));
  }
}

// ─── BOOKING → DEAL MAPPING ───────────────────────────
export function bookingToDeal(booking: any, plannerName: string): CrmDeal {
  const stage = booking.status === 'COMPLETED' ? 'closedwon'
    : booking.status === 'CONFIRMED' ? 'decisionmakerboughtin'
    : booking.status === 'CANCELLED' ? 'closedlost'
    : 'appointmentscheduled';

  return {
    name: `${plannerName} × ${booking.vendor?.businessName || 'Vendor'} — ${booking.reference}`,
    amount: Number(booking.totalAmount),
    currency: booking.currency || 'NGN',
    closeDate: booking.eventDate
      ? new Date(booking.eventDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stage,
    owambeBookingRef: booking.reference,
    owambeVendorName: booking.vendor?.businessName,
    owambeEventDate: booking.eventDate
      ? new Date(booking.eventDate).toISOString().split('T')[0]
      : undefined,
    contactEmail: booking.planner?.user?.email || booking.bookerEmail,
  };
}

// ─── ATTENDEE → CONTACT MAPPING ──────────────────────
export function attendeeToContact(attendee: any, eventName: string): CrmContact {
  return {
    email: attendee.email,
    firstName: attendee.firstName,
    lastName: attendee.lastName,
    phone: attendee.phone,
    company: attendee.company,
    source: 'Owambe',
    owambeAttendeeId: attendee.id,
    owambeEventName: eventName,
    owambeTicketType: attendee.ticketType?.name,
    owambeRegisteredAt: attendee.registeredAt
      ? new Date(attendee.registeredAt).toISOString()
      : undefined,
    owambeAmountPaid: Number(attendee.amountPaid),
  };
}
