import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { request } from 'undici';
import { RateLimiter } from '../core/rate-limiter.js';
import { logger } from '../core/logger.js';
import type {
  AdCreativeInput,
  AdSetSummary,
  CampaignSummary,
  DateRange,
  PerformanceMetrics,
  UploadedCreative,
} from './types.js';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

export interface MetaClientOptions {
  accessToken: string;
  adAccountId: string;
  limiter?: RateLimiter;
}

export class MetaClient {
  private readonly limiter: RateLimiter;

  constructor(private readonly opts: MetaClientOptions) {
    this.limiter =
      opts.limiter ?? new RateLimiter({ maxConcurrent: 4, minIntervalMs: 100 });
  }

  private async get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${GRAPH_BASE}${path}`);
    url.searchParams.set('access_token', this.opts.accessToken);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    return this.limiter.run(async () => {
      const res = await request(url.toString());
      const body = (await res.body.json()) as { error?: { message: string } } & Record<string, unknown>;
      if (res.statusCode >= 400 || body.error) {
        throw new Error(`Meta API error: ${body.error?.message ?? res.statusCode}`);
      }
      return body as T;
    });
  }

  private async post<T>(path: string, form: Record<string, string | Buffer>): Promise<T> {
    const url = `${GRAPH_BASE}${path}`;
    return this.limiter.run(async () => {
      const body = new URLSearchParams();
      body.set('access_token', this.opts.accessToken);
      for (const [k, v] of Object.entries(form)) {
        body.set(k, typeof v === 'string' ? v : v.toString('base64'));
      }
      const res = await request(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const json = (await res.body.json()) as { error?: { message: string } } & Record<string, unknown>;
      if (res.statusCode >= 400 || json.error) {
        throw new Error(`Meta API error: ${json.error?.message ?? res.statusCode}`);
      }
      return json as T;
    });
  }

  async listCampaigns(): Promise<CampaignSummary[]> {
    const r = await this.get<{ data: Array<Record<string, unknown>> }>(
      `/${this.opts.adAccountId}/campaigns`,
      { fields: 'id,name,status,objective,daily_budget,lifetime_budget' },
    );
    return r.data.map((c) => ({
      id: String(c.id),
      name: String(c.name),
      status: String(c.status),
      objective: c.objective as string | undefined,
      dailyBudget: c.daily_budget ? Number(c.daily_budget) / 100 : undefined,
      lifetimeBudget: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : undefined,
    }));
  }

  async listAdSets(campaignId?: string): Promise<AdSetSummary[]> {
    const path = campaignId
      ? `/${campaignId}/adsets`
      : `/${this.opts.adAccountId}/adsets`;
    const r = await this.get<{ data: Array<Record<string, unknown>> }>(path, {
      fields: 'id,name,campaign_id,status',
    });
    return r.data.map((a) => ({
      id: String(a.id),
      name: String(a.name),
      campaignId: String(a.campaign_id),
      status: String(a.status),
    }));
  }

  async uploadImage(filePath: string): Promise<{ hash: string; url: string }> {
    const bytes = await readFile(filePath);
    const name = basename(filePath);
    logger.debug(`Uploading image ${name} (${bytes.length} bytes)`);
    const res = await this.post<{ images: Record<string, { hash: string; url: string }> }>(
      `/${this.opts.adAccountId}/adimages`,
      { [name]: bytes },
    );
    const first = Object.values(res.images)[0];
    if (!first) throw new Error('Meta returned no image hash');
    return first;
  }

  async createAdCreative(
    input: AdCreativeInput,
    imageHash: string,
    pageId: string,
  ): Promise<UploadedCreative> {
    const objectStorySpec = {
      page_id: pageId,
      link_data: {
        image_hash: imageHash,
        link: input.linkUrl ?? 'https://example.com',
        message: input.primaryText ?? '',
        name: input.headline ?? input.name,
        description: input.description ?? '',
        call_to_action: input.callToAction
          ? { type: input.callToAction }
          : undefined,
      },
    };
    const res = await this.post<{ id: string }>(`/${this.opts.adAccountId}/adcreatives`, {
      name: input.name,
      object_story_spec: JSON.stringify(objectStorySpec),
    });
    return {
      id: res.id,
      name: input.name,
      imageHash,
      adCreativeId: res.id,
    };
  }

  async createAd(
    adSetId: string,
    creativeId: string,
    name: string,
    status: 'PAUSED' | 'ACTIVE' = 'PAUSED',
  ): Promise<{ id: string }> {
    return this.post<{ id: string }>(`/${this.opts.adAccountId}/ads`, {
      name,
      adset_id: adSetId,
      creative: JSON.stringify({ creative_id: creativeId }),
      status,
    });
  }

  async getInsights(
    entityId: string,
    range: DateRange,
    level: 'ad' | 'adset' | 'campaign' = 'ad',
  ): Promise<PerformanceMetrics[]> {
    const r = await this.get<{ data: Array<Record<string, unknown>> }>(
      `/${entityId}/insights`,
      {
        level,
        time_range: JSON.stringify(range),
        fields: 'impressions,clicks,spend,ctr,cpc,cpm,frequency,actions',
      },
    );
    return r.data.map((d) => ({
      impressions: Number(d.impressions ?? 0),
      clicks: Number(d.clicks ?? 0),
      spend: Number(d.spend ?? 0),
      ctr: Number(d.ctr ?? 0),
      cpc: Number(d.cpc ?? 0),
      cpm: Number(d.cpm ?? 0),
      frequency: d.frequency ? Number(d.frequency) : undefined,
    }));
  }

  async getDailyInsights(
    entityId: string,
    range: DateRange,
    level: 'ad' | 'adset' | 'campaign' = 'campaign',
  ): Promise<Array<{ date: string } & PerformanceMetrics>> {
    const r = await this.get<{ data: Array<Record<string, unknown>> }>(
      `/${entityId}/insights`,
      {
        level,
        time_range: JSON.stringify(range),
        time_increment: '1',
        fields: 'impressions,clicks,spend,ctr,cpc,cpm,frequency,date_start',
      },
    );
    return r.data.map((d) => ({
      date: String(d.date_start ?? ''),
      impressions: Number(d.impressions ?? 0),
      clicks: Number(d.clicks ?? 0),
      spend: Number(d.spend ?? 0),
      ctr: Number(d.ctr ?? 0),
      cpc: Number(d.cpc ?? 0),
      cpm: Number(d.cpm ?? 0),
      frequency: d.frequency ? Number(d.frequency) : undefined,
    }));
  }

  async listAds(adSetId?: string): Promise<Array<{ id: string; name: string; status: string; adSetId: string }>> {
    const path = adSetId ? `/${adSetId}/ads` : `/${this.opts.adAccountId}/ads`;
    const r = await this.get<{ data: Array<Record<string, unknown>> }>(path, {
      fields: 'id,name,status,adset_id',
    });
    return r.data.map((a) => ({
      id: String(a.id),
      name: String(a.name),
      status: String(a.status),
      adSetId: String(a.adset_id),
    }));
  }

  async createCustomAudience(
    name: string,
    description: string,
    subtype: 'CUSTOM' | 'LOOKALIKE' = 'CUSTOM',
  ): Promise<{ id: string }> {
    return this.post<{ id: string }>(`/${this.opts.adAccountId}/customaudiences`, {
      name,
      description,
      subtype,
      customer_file_source: 'USER_PROVIDED_ONLY',
    });
  }

  async addUsersToAudience(
    audienceId: string,
    schema: Array<'EMAIL' | 'PHONE' | 'FN' | 'LN'>,
    hashedRows: string[][],
  ): Promise<{ audience_id: string; session_id: number; num_received: number; num_invalid_entries: number }> {
    const payload = {
      schema,
      data: hashedRows,
    };
    return this.post<{ audience_id: string; session_id: number; num_received: number; num_invalid_entries: number }>(
      `/${audienceId}/users`,
      { payload: JSON.stringify(payload) },
    );
  }
}
