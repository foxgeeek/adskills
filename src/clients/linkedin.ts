import type { CampaignSummary, DateRange, PerformanceMetrics } from './types.js';

export interface LinkedInClientOptions {
  accessToken: string;
  accountId: string;
}

export class LinkedInClient {
  constructor(private readonly opts: LinkedInClientOptions) {}

  async listCampaigns(): Promise<CampaignSummary[]> {
    throw new Error('Not implemented — Phase 4');
  }

  async getInsights(_campaignId: string, _range: DateRange): Promise<PerformanceMetrics[]> {
    throw new Error('Not implemented — Phase 4');
  }

  async uploadCompanyList(_filePath: string, _audienceName: string): Promise<{ id: string }> {
    throw new Error('Not implemented — Phase 4');
  }

  async uploadContactList(_filePath: string, _audienceName: string): Promise<{ id: string }> {
    throw new Error('Not implemented — Phase 4');
  }
}
