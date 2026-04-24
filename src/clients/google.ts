import { GoogleAdsApi, enums } from 'google-ads-api';
import type { CampaignSummary, DateRange, PerformanceMetrics } from './types.js';

export interface GoogleClientOptions {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
}

export interface SearchTermRow {
  searchTerm: string;
  campaignName: string;
  adGroupName: string;
  clicks: number;
  impressions: number;
  ctr: number;
  cost: number;
  conversions: number;
  matchType: string;
}

export interface KeywordRow {
  keyword: string;
  matchType: string;
  qualityScore: number | null;
  impressionShare: number | null;
  avgCpc: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

export class GoogleAdsClient {
  private readonly customer;

  constructor(private readonly opts: GoogleClientOptions) {
    const api = new GoogleAdsApi({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      developer_token: opts.developerToken,
    });
    this.customer = api.Customer({
      customer_id: opts.customerId.replace(/-/g, ''),
      login_customer_id: opts.loginCustomerId?.replace(/-/g, ''),
      refresh_token: opts.refreshToken,
    });
  }

  async listCampaigns(): Promise<CampaignSummary[]> {
    const rows = await this.customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
    `);
    return rows.map((r) => ({
      id: String(r.campaign?.id ?? ''),
      name: String(r.campaign?.name ?? ''),
      status: String(r.campaign?.status ?? ''),
      objective: String(r.campaign?.advertising_channel_type ?? ''),
      dailyBudget: r.campaign_budget?.amount_micros
        ? Number(r.campaign_budget.amount_micros) / 1_000_000
        : undefined,
    }));
  }

  async getInsights(range: DateRange, campaignId?: string): Promise<PerformanceMetrics[]> {
    const where = campaignId ? `AND campaign.id = ${campaignId}` : '';
    const rows = await this.customer.query(`
      SELECT
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${range.since}' AND '${range.until}' ${where}
    `);
    return rows.map((r) => ({
      impressions: Number(r.metrics?.impressions ?? 0),
      clicks: Number(r.metrics?.clicks ?? 0),
      spend: Number(r.metrics?.cost_micros ?? 0) / 1_000_000,
      ctr: Number(r.metrics?.ctr ?? 0) * 100,
      cpc: Number(r.metrics?.average_cpc ?? 0) / 1_000_000,
      cpm: Number(r.metrics?.average_cpm ?? 0) / 1_000_000,
      conversions: Number(r.metrics?.conversions ?? 0),
      roas:
        r.metrics?.cost_micros && Number(r.metrics.cost_micros) > 0
          ? Number(r.metrics.conversions_value ?? 0) / (Number(r.metrics.cost_micros) / 1_000_000)
          : undefined,
    }));
  }

  async getSearchTerms(range: DateRange, campaignId?: string): Promise<SearchTermRow[]> {
    const where = campaignId ? `AND campaign.id = ${campaignId}` : '';
    const rows = await this.customer.query(`
      SELECT
        search_term_view.search_term,
        campaign.name,
        ad_group.name,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.cost_micros,
        metrics.conversions,
        segments.keyword.info.match_type
      FROM search_term_view
      WHERE segments.date BETWEEN '${range.since}' AND '${range.until}' ${where}
    `);
    return rows.map((r) => ({
      searchTerm: String(r.search_term_view?.search_term ?? ''),
      campaignName: String(r.campaign?.name ?? ''),
      adGroupName: String(r.ad_group?.name ?? ''),
      clicks: Number(r.metrics?.clicks ?? 0),
      impressions: Number(r.metrics?.impressions ?? 0),
      ctr: Number(r.metrics?.ctr ?? 0) * 100,
      cost: Number(r.metrics?.cost_micros ?? 0) / 1_000_000,
      conversions: Number(r.metrics?.conversions ?? 0),
      matchType: String(r.segments?.keyword?.info?.match_type ?? ''),
    }));
  }

  async getKeywords(range: DateRange, campaignId?: string): Promise<KeywordRow[]> {
    const where = campaignId ? `AND campaign.id = ${campaignId}` : '';
    const rows = await this.customer.query(`
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        metrics.search_impression_share,
        metrics.average_cpc,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions
      FROM keyword_view
      WHERE segments.date BETWEEN '${range.since}' AND '${range.until}'
        AND ad_group_criterion.status = 'ENABLED' ${where}
    `);
    return rows.map((r) => ({
      keyword: String(r.ad_group_criterion?.keyword?.text ?? ''),
      matchType: String(r.ad_group_criterion?.keyword?.match_type ?? ''),
      qualityScore: r.ad_group_criterion?.quality_info?.quality_score ?? null,
      impressionShare: r.metrics?.search_impression_share
        ? Number(r.metrics.search_impression_share) * 100
        : null,
      avgCpc: Number(r.metrics?.average_cpc ?? 0) / 1_000_000,
      clicks: Number(r.metrics?.clicks ?? 0),
      impressions: Number(r.metrics?.impressions ?? 0),
      conversions: Number(r.metrics?.conversions ?? 0),
    }));
  }

  async createUserList(
    name: string,
    description: string,
  ): Promise<{ resourceName: string }> {
    const result = await this.customer.userLists.create([
      {
        name,
        description,
        crm_based_user_list: {
          upload_key_type: 'CONTACT_INFO',
          data_source_type: 'FIRST_PARTY',
        },
        membership_life_span: 10000,
        membership_status: 'OPEN',
      },
    ]);
    const resourceName = result.results?.[0]?.resource_name;
    if (!resourceName) throw new Error('Google user list creation returned no resource name');
    return { resourceName };
  }

  async addUsersToUserList(
    userListResourceName: string,
    hashedUsers: Array<{ email?: string; phone?: string }>,
  ): Promise<{ jobResourceName: string; submitted: number }> {
    const customerId = this.opts.customerId.replace(/-/g, '');
    const jobsApi = this.customer.offlineUserDataJobs as unknown as {
      createOfflineUserDataJob: (req: unknown) => Promise<{ resource_name?: string }>;
      addOfflineUserDataJobOperations: (req: unknown) => Promise<unknown>;
      runOfflineUserDataJob: (req: unknown) => Promise<unknown>;
    };

    const job = await jobsApi.createOfflineUserDataJob({
      customer_id: customerId,
      job: {
        type: 'CUSTOMER_MATCH_USER_LIST',
        customer_match_user_list_metadata: { user_list: userListResourceName },
      },
    });
    const jobResourceName = job.resource_name;
    if (!jobResourceName) throw new Error('Google offline job creation returned no resource name');

    const operations = hashedUsers
      .map((u) => {
        const identifiers: Array<{ hashed_email?: string; hashed_phone_number?: string }> = [];
        if (u.email) identifiers.push({ hashed_email: u.email });
        if (u.phone) identifiers.push({ hashed_phone_number: u.phone });
        return identifiers.length ? { create: { user_identifiers: identifiers } } : null;
      })
      .filter((op): op is { create: { user_identifiers: Array<Record<string, string>> } } => op !== null);

    await jobsApi.addOfflineUserDataJobOperations({
      resource_name: jobResourceName,
      operations,
      enable_partial_failure: true,
    });
    await jobsApi.runOfflineUserDataJob({ resource_name: jobResourceName });
    return { jobResourceName, submitted: operations.length };
  }

  async addNegativeKeywords(
    adGroupResourceName: string,
    terms: Array<{ text: string; matchType: 'EXACT' | 'PHRASE' | 'BROAD' }>,
  ): Promise<{ created: number }> {
    const matchTypeMap = {
      EXACT: enums.KeywordMatchType.EXACT,
      PHRASE: enums.KeywordMatchType.PHRASE,
      BROAD: enums.KeywordMatchType.BROAD,
    };
    const operations = terms.map((t) => ({
      ad_group: adGroupResourceName,
      negative: true,
      keyword: { text: t.text, match_type: matchTypeMap[t.matchType] },
    }));
    const result = await this.customer.adGroupCriteria.create(operations);
    return { created: result.results?.length ?? 0 };
  }
}
