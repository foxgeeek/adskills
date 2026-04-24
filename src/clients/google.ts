import type { CampaignSummary, DateRange, PerformanceMetrics } from './types.js';

export interface GoogleClientOptions {
  accessToken: string;
  customerId: string;
  loginCustomerId?: string;
  developerToken: string;
}

export class GoogleAdsClient {
  constructor(private readonly opts: GoogleClientOptions) {}

  async listCampaigns(): Promise<CampaignSummary[]> {
    throw new Error('Not implemented — Phase 3');
  }

  async getInsights(_campaignId: string, _range: DateRange): Promise<PerformanceMetrics[]> {
    throw new Error('Not implemented — Phase 3');
  }

  async getSearchTerms(_campaignId: string, _range: DateRange): Promise<unknown[]> {
    throw new Error('Not implemented — Phase 3');
  }

  async addNegativeKeywords(_adGroupId: string, _terms: string[]): Promise<void> {
    throw new Error('Not implemented — Phase 3');
  }
}
