'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Database,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import ReviewUploader from '@/components/ReviewUploader';
import ExecutiveSummary from '@/components/ExecutiveSummary';
import ConsumerSafetyCard from '@/components/ConsumerSafetyCard';
import ActionItemsInput from '@/components/ActionItemsInput';
import ReviewTable from '@/components/ReviewTable';
import HistorySection from '@/components/HistorySection';
import {
  ReviewRaw,
  ReviewAnalyzedItem,
  ReviewDbRow,
  AnalysisSummary,
  ConsumerSafetyResponse,
} from '@/types';
import {
  saveReviewsToDatabase,
  fetchAnalysisHistory,
  fetchReviewsByDate,
} from '@/lib/supabase';

export default function Home() {
  // 상태 관리
  const [analyzedReviews, setAnalyzedReviews] = useState<ReviewAnalyzedItem[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.8-flash');
  const [activeDate, setActiveDate] = useState<string | null>(null);

  // 로딩 및 단계
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  // 공공데이터 소비자원 통계
  const [consumerSafety, setConsumerSafety] = useState<ConsumerSafetyResponse | null>(null);
  const [isSafetyLoading, setIsSafetyLoading] = useState<boolean>(false);

  // 히스토리 목록
  const [historyList, setHistoryList] = useState<AnalysisSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // 초기 마운트 시 공공데이터 및 히스토리 조회
  useEffect(() => {
    loadConsumerSafety();
    loadHistory();
  }, []);

  const loadConsumerSafety = async () => {
    setIsSafetyLoading(true);
    try {
      const res = await fetch('/api/consumer-safety');
      const data = await res.json();
      setConsumerSafety(data);
    } catch (e) {
      setConsumerSafety({
        success: false,
        error: '불러오지 못했습니다',
      });
    } finally {
      setIsSafetyLoading(false);
    }
  };

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const history = await fetchAnalysisHistory();
      setHistoryList(history);
    } catch (e) {
      console.error('히스토리 조회 오류:', e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // 분석 실행 핸들러
  const handleAnalyze = async (rawReviews: ReviewRaw[], filename: string) => {
    setIsAnalyzing(true);
    setGeneralError(null);
    setLoadingStep('Gemini AI 통합 분석 요청 중...');

    try {
      // 1. Gemini 통합 분석 API 호출
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: rawReviews }),
      });

      const analyzeJson = await analyzeRes.json();

      if (!analyzeRes.ok || !analyzeJson.success) {
        // PRD 규정: 데이터 누락 또는 통신 실패 시 화면에 "불러오지 못했습니다" 표시
        throw new Error(analyzeJson.error || '불러오지 못했습니다');
      }

      const returnedModel = analyzeJson.model_used || 'gemini-3.8-flash';
      const items: ReviewAnalyzedItem[] = analyzeJson.data;

      setModelUsed(returnedModel);
      setAnalyzedReviews(items);

      // 2. 오늘 날짜 구하기 (YYYY-MM-DD)
      const todayStr = new Date().toISOString().split('T')[0];
      setActiveDate(todayStr);

      // 3. Supabase 데이터베이스에 1건당 1줄씩 저장
      setLoadingStep('Supabase 데이터베이스에 저장 중...');
      const dbRows: ReviewDbRow[] = items.map((item) => ({
        analyzed_on: todayStr,
        review_no: item.review_no,
        written_on: item.written_on,
        rating: item.rating,
        review_text: item.review_text,
        sentiment: item.sentiment,
        categories: item.categories,
        improvement_request: item.improvement_request || '',
        is_safety_issue: Boolean(item.is_safety_issue),
        model_used: returnedModel,
      }));

      await saveReviewsToDatabase(dbRows);

      // 4. 히스토리 목록 재갱신
      await loadHistory();
    } catch (err: any) {
      console.error('분석 처리 중 에러:', err);
      // PRD 규정 준수: 임의 추론 없이 명확한 텍스트로 표출
      setGeneralError(
        err?.message?.includes('불러오지 못했습니다')
          ? '불러오지 못했습니다'
          : `분석 실패: ${err?.message || '불러오지 못했습니다'}`
      );
    } finally {
      setIsAnalyzing(false);
      setLoadingStep('');
    }
  };

  // 특정 일자의 히스토리 데이터 조회
  const handleSelectHistoryDate = async (date: string) => {
    try {
      setActiveDate(date);
      setGeneralError(null);
      const rows = await fetchReviewsByDate(date);
      if (rows && rows.length > 0) {
        const items: ReviewAnalyzedItem[] = rows.map((r) => ({
          review_no: r.review_no,
          written_on: r.written_on,
          rating: r.rating,
          review_text: r.review_text,
          sentiment: r.sentiment as any,
          categories: r.categories,
          improvement_request: r.improvement_request,
          is_safety_issue: r.is_safety_issue,
        }));
        setAnalyzedReviews(items);
        if (rows[0].model_used) {
          setModelUsed(rows[0].model_used);
        }
      }
    } catch (e: any) {
      setGeneralError('해당 일자의 분석 데이터를 불러오지 못했습니다.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/80 pb-16">
      {/* 글로벌 상단 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  하루살림 리뷰 분석기
                </h1>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  클린핏 미니
                </span>
              </div>
              <p className="text-xs text-slate-500">
                마케팅팀 원인 분석 자동화 및 소비자 안전 통계 모니터링
              </p>
            </div>
          </div>

          {/* 상태 배지 */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Supabase 연결됨</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>소비자원 위해정보 연동</span>
            </div>
          </div>
        </div>
      </header>

      {/* 본문 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* 전체 에러 메시지 알림 */}
        {generalError && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 text-rose-800 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{generalError}</span>
            </div>
            <button
              onClick={() => setGeneralError(null)}
              className="text-xs text-rose-600 hover:underline font-medium shrink-0"
            >
              닫기
            </button>
          </div>
        )}

        {/* 상단 2열 그리드: 파일 업로더 & 소비자원 위해정보 통계 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReviewUploader
              onAnalyze={handleAnalyze}
              isLoading={isAnalyzing}
              loadingStep={loadingStep}
            />
          </div>
          <div>
            <ConsumerSafetyCard
              data={consumerSafety}
              isLoading={isSafetyLoading}
              onRefresh={loadConsumerSafety}
            />
          </div>
        </div>

        {/* 분석 결과 영역 */}
        {analyzedReviews.length > 0 && (
          <div className="space-y-6 pt-2">
            {/* 1. 핵심 지표 요약 대시보드 */}
            <ExecutiveSummary
              reviews={analyzedReviews}
              modelUsed={modelUsed}
            />

            {/* 2. 수동 입력 영역 ("우리가 고칠 것" 3줄) */}
            <ActionItemsInput />

            {/* 3. 리뷰별 분석 상세 테이블 */}
            <ReviewTable reviews={analyzedReviews} />
          </div>
        )}

        {/* 하단: 누적 히스토리 영역 */}
        <HistorySection
          historyList={historyList}
          isLoading={isHistoryLoading}
          onRefresh={loadHistory}
          onSelectDate={handleSelectHistoryDate}
          selectedDate={activeDate}
        />
      </div>
    </main>
  );
}
