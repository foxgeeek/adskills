import { request } from 'undici';
import { RateLimiter } from '../core/rate-limiter.js';
import type { CampaignSummary, DateRange, PerformanceMetrics } from './types.js';

const API_BASE = 'https://api.linkedin.com/rest';
const API_VERSION = '202410';

export interface LinkedInClientOptions {
  accessToken: string;
  accountId: string;
  limiter?: RateLimiter;
}

export interface LinkedInCampaign extends CampaignSummary {
  format?: string;
  costType?: string;
  dailyBudgetAmount?: number;
  bidAmount?: number;
}

export interface LinkedInCreativePerf {
  creativeId: string;
  format: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  leadFormOpens: number;
  leadFormCompletions: number;
}

export interface DmpSegmentInput {
  name: string;
  description: string;
  sourceType: 'USER' | 'COMPANY';
}

export class LinkedInClient {
  private readonly limiter: RateLimiter;

  constructor(private readonly opts: LinkedInClientOptions) {
    this.limiter = opts.limiter ?? new RateLimiter({ maxConcurrent: 4, minIntervalMs: 150 });
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      authorization: `Bearer ${this.opts.accessToken}`,
      'LinkedIn-Version': API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
      accept: 'application/json',
      ...extra,
    };
  }

  private accountUrn(): string {
    return this.opts.accountId.startsWith('urn:li:sponsoredAccount:')
      ? this.opts.accountId
      : `urn:li:sponsoredAccount:${this.opts.accountId}`;
  }

  private async get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${API_BASE}${path}`);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    return this.limiter.run(async () => {
      const res = await request(url.toString(), { headers: this.headers() });
      const body = await res.body.json();
      if (res.statusCode >= 400) {
        throw new Error(`LinkedIn API error ${res.statusCode}: ${JSON.stringify(body)}`);
      }
      return body as T;
    });
  }

  private async post<T>(path: string, payload: unknown): Promise<T> {
    return this.limiter.run(async () => {
      const res = await request(`${API_BASE}${path}`, {
        method: 'POST',
        headers: this.headers({ 'content-type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      const body = await res.body.json().catch(() => ({}));
      if (res.statusCode >= 400) {
        throw new Error(`LinkedIn API error ${res.statusCode}: ${JSON.stringify(body)}`);
      }
      return body as T;
    });
  }

  async listCampaigns(): Promise<LinkedInCampaign[]> {
    const encodedUrn = encodeURIComponent(this.accountUrn());
    const r = await this.get<{ elements: Array<Record<string, unknown>> }>(`/adAccounts/${encodedUrn}/adCampaigns`, {
      q: 'search',
      count: '50',
    });
    return (r.elements ?? []).map((c) => ({
      id: String(c.id ?? ''),
      name: String(c.name ?? ''),
      status: String(c.status ?? ''),
      objective: c.objectiveType as string | undefined,
      format: c.format as string | undefined,
      costType: c.costType as string | undefined,
      dailyBudget:
        c.dailyBudget && typeof c.dailyBudget === 'object'
          ? Number((c.dailyBudget as Record<string, unknown>).amount ?? 0)
          : undefined,
      bidAmount:
        c.unitCost && typeof c.unitCost === 'object'
          ? Number((c.unitCost as Record<string, unknown>).amount ?? 0)
          : undefined,
    }));
  }

  async getInsights(
    range: DateRange,
    campaignId?: string,
  ): Promise<PerformanceMetrics[]> {
    const start = range.since.split('-').map(Number);
    const end = range.until.split('-').map(Number);
    const q: Record<string, string> = {
      q: 'analytics',
      pivot: campaignId ? 'CAMPAIGN' : 'ACCOUNT',
      timeGranularity: 'ALL',
      'dateRange.start.year': String(start[0]),
      'dateRange.start.month': String(start[1]),
      'dateRange.start.day': String(start[2]),
      'dateRange.end.year': String(end[0]),
      'dateRange.end.month': String(end[1]),
      'dateRange.end.day': String(end[2]),
      fields: 'impressions,clicks,costInLocalCurrency,externalWebsiteConversions',
    };
    if (campaignId) {
      q['campaigns[0]'] = `urn:li:sponsoredCampaign:${campaignId}`;
    } else {
      q['accounts[0]'] = this.accountUrn();
    }

    const r = await this.get<{ elements: Array<Record<string, unknown>> }>('/adAnalytics', q);
    return (r.elements ?? []).map((d) => {
      const impressions = Number(d.impressions ?? 0);
      const clicks = Number(d.clicks ?? 0);
      const spend = Number(d.costInLocalCurrency ?? 0);
      return {
        impressions,
        clicks,
        spend,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        conversions: Number(d.externalWebsiteConversions ?? 0),
      };
    });
  }

  async getCreativeInsights(range: DateRange, campaignId: string): Promise<LinkedInCreativePerf[]> {
    const start = range.since.split('-').map(Number);
    const end = range.until.split('-').map(Number);
    const r = await this.get<{ elements: Array<Record<string, unknown>> }>('/adAnalytics', {
      q: 'analytics',
      pivot: 'CREATIVE',
      timeGranularity: 'ALL',
      'campaigns[0]': `urn:li:sponsoredCampaign:${campaignId}`,
      'dateRange.start.year': String(start[0]),
      'dateRange.start.month': String(start[1]),
      'dateRange.start.day': String(start[2]),
      'dateRange.end.year': String(end[0]),
      'dateRange.end.month': String(end[1]),
      'dateRange.end.day': String(end[2]),
      fields:
        'pivotValue,impressions,clicks,costInLocalCurrency,landingPageClicks,oneClickLeadFormOpens,oneClickLeads',
    });
    return (r.elements ?? []).map((d) => {
      const impressions = Number(d.impressions ?? 0);
      const clicks = Number(d.clicks ?? 0);
      const pivot = String(d.pivotValue ?? '');
      return {
        creativeId: pivot,
        format: pivot.split(':').pop() ?? 'UNKNOWN',
        impressions,
        clicks,
        spend: Number(d.costInLocalCurrency ?? 0),
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        leadFormOpens: Number(d.oneClickLeadFormOpens ?? 0),
        leadFormCompletions: Number(d.oneClickLeads ?? 0),
      };
    });
  }

  async updateCampaign(
    campaignId: string,
    patch: {
      status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
      dailyBudget?: number;
      unitCost?: number;
    },
  ): Promise<void> {
    const partial: Record<string, unknown> = {};
    if (patch.status) partial.status = patch.status;
    if (patch.dailyBudget !== undefined) {
      partial.dailyBudget = { amount: patch.dailyBudget.toString(), currencyCode: 'USD' };
    }
    if (patch.unitCost !== undefined) {
      partial.unitCost = { amount: patch.unitCost.toString(), currencyCode: 'USD' };
    }
    const encodedUrn = encodeURIComponent(this.accountUrn());
    return this.limiter.run(async () => {
      const res = await request(`${API_BASE}/adAccounts/${encodedUrn}/adCampaigns/${campaignId}`, {
        method: 'POST',
        headers: this.headers({ 'content-type': 'application/json', 'X-RestLi-Method': 'PARTIAL_UPDATE' }),
        body: JSON.stringify({ patch: { $set: partial } }),
      });
      if (res.statusCode >= 400) {
        const body = await res.body.text();
        throw new Error(`LinkedIn update failed ${res.statusCode}: ${body}`);
      }
    });
  }

  async createDmpSegment(input: DmpSegmentInput): Promise<{ id: string }> {
    const payload = {
      name: input.name,
      description: input.description,
      sourceType: 'USER_UPLOADED',
      sourcePlatform: 'API',
      segmentType: input.sourceType === 'COMPANY' ? 'USER_COMPANY_LIST' : 'USER_EMAIL_LIST',
      account: this.accountUrn(),
    };
    return this.post<{ id: string }>('/dmpSegments', payload);
  }

  async uploadSegmentUsers(
    segmentId: string,
    users: Array<{ email?: string; firstName?: string; lastName?: string; company?: string }>,
  ): Promise<{ submitted: number }> {
    const batch = users.map((u) => ({
      action: 'ADD',
      userIds: u.email ? [{ idType: 'SHA256_EMAIL', idValue: u.email }] : [],
      firstName: u.firstName,
      lastName: u.lastName,
      companyName: u.company,
    }));
    await this.post(`/dmpSegments/${segmentId}/users`, { elements: batch });
    return { submitted: batch.length };
  }
}
