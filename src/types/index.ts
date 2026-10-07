export interface ReviewRaw {
  review_no: number;
  written_on: string;
  rating: number;
  review_text: string;
}

export interface ReviewAnalyzedItem {
  review_no: number;
  written_on: string;
  rating: number;
  review_text: string;
  sentiment: '긍정' | '부정' | '중립' | '광고';
  categories: string; // e.g. "배터리, 흡입력"
  improvement_request: string;
  is_safety_issue: boolean;
}

export interface ReviewDbRow {
  id?: number;
  created_at?: string;
  analyzed_on: string; // YYYY-MM-DD
  review_no: number;
  written_on: string;
  rating: number;
  review_text: string;
  sentiment: string;
  categories: string;
  improvement_request: string;
  is_safety_issue: boolean;
  model_used: string;
}

export interface AnalysisSummary {
  analyzed_on: string;
  total_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  ad_count: number;
  valid_count: number;
  negative_rate: number;
  safety_count: number;
  model_used: string;
}

export interface ConsumerSafetyInjuryReason {
  reason: string;
  count: number;
  rank: number;
}

export interface ConsumerSafetyResponse {
  success: boolean;
  totalVacuumCases?: number;
  topInjuryReasons?: ConsumerSafetyInjuryReason[];
  error?: string;
  cachedAt?: string;
}
