import { createClient } from '@supabase/supabase-js';
import { ReviewDbRow, AnalysisSummary } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 분석 완료된 리뷰 항목들을 Supabase review_analysis 테이블에 일괄 저장
 */
export async function saveReviewsToDatabase(rows: ReviewDbRow[]) {
  if (!rows || rows.length === 0) return { success: true, count: 0 };

  const { data, error } = await supabase
    .from('review_analysis')
    .insert(rows)
    .select('id');

  if (error) {
    console.error('Supabase 저장 오류:', error);
    throw new Error(error.message);
  }

  return { success: true, count: data?.length || rows.length };
}

/**
 * 분석일(analyzed_on)별 요약 히스토리 조회
 * (PRD: 메인 화면 하단에 기존에 저장된 분석 결과들의 요약(분석일별 전체 건수, 부정 비율) 목록 표시)
 */
export async function fetchAnalysisHistory(): Promise<AnalysisSummary[]> {
  const { data, error } = await supabase
    .from('review_analysis')
    .select('analyzed_on, sentiment, is_safety_issue, model_used')
    .order('analyzed_on', { ascending: false });

  if (error) {
    console.error('Supabase 히스토리 조회 오류:', error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // analyzed_on 별로 그룹화
  const groups: Record<string, typeof data> = {};
  for (const row of data) {
    const key = row.analyzed_on;
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const summaries: AnalysisSummary[] = Object.keys(groups).map((date) => {
    const rows = groups[date];
    const total_count = rows.length;
    let positive_count = 0;
    let negative_count = 0;
    let neutral_count = 0;
    let ad_count = 0;
    let safety_count = 0;
    const modelUsedSet = new Set<string>();

    for (const r of rows) {
      if (r.sentiment === '긍정') positive_count++;
      else if (r.sentiment === '부정') negative_count++;
      else if (r.sentiment === '중립') neutral_count++;
      else if (r.sentiment === '광고') ad_count++;

      if (r.is_safety_issue) safety_count++;
      if (r.model_used) modelUsedSet.add(r.model_used);
    }

    // 광고 제외 유효 리뷰 기준 부정 비율 계산 (PRD: 광고는 집계 제외)
    const valid_count = total_count - ad_count;
    const negative_rate =
      valid_count > 0 ? Math.round((negative_count / valid_count) * 1000) / 10 : 0;

    return {
      analyzed_on: date,
      total_count,
      positive_count,
      negative_count,
      neutral_count,
      ad_count,
      valid_count,
      negative_rate,
      safety_count,
      model_used: Array.from(modelUsedSet).join(', ') || 'gemini-3.8-flash',
    };
  });

  return summaries;
}

/**
 * 특정 일자의 상세 리뷰 데이터 목록 조회
 */
export async function fetchReviewsByDate(analyzed_on: string): Promise<ReviewDbRow[]> {
  const { data, error } = await supabase
    .from('review_analysis')
    .select('*')
    .eq('analyzed_on', analyzed_on)
    .order('review_no', { ascending: true });

  if (error) {
    console.error('Supabase 상세 조회 오류:', error);
    throw new Error(error.message);
  }

  return (data as ReviewDbRow[]) || [];
}
