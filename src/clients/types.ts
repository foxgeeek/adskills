export interface AdCreativeInput {
  name: string;
  filePath: string;
  mimeType: 'image/jpeg' | 'image/png' | 'video/mp4';
  primaryText?: string;
  headline?: string;
  description?: string;
  linkUrl?: string;
  callToAction?: string;
}

export interface UploadedCreative {
  id: string;
  name: string;
  imageHash?: string;
  videoId?: string;
  thumbnailUrl?: string;
  adCreativeId?: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  objective?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
}

export interface AdSetSummary {
  id: string;
  name: string;
  campaignId: string;
  status: string;
}

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  roas?: number;
  frequency?: number;
}

export interface DateRange {
  since: string;
  until: string;
}
