'use client';

import React from 'react';
import {
  Smile,
  Frown,
  MinusCircle,
  Megaphone,
  AlertTriangle,
  Cpu,
  BarChart3,
  Flame,
} from 'lucide-react';
import { ReviewAnalyzedItem } from '@/types';

interface ExecutiveSummaryProps {
  reviews: ReviewAnalyzedItem[];
  modelUsed: string;
}

export default function ExecutiveSummary({
  reviews,
  modelUsed,
}: ExecutiveSummaryProps) {
  const totalReviews = reviews.length;

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let adCount = 0;
  let safetyIssues: ReviewAnalyzedItem[] = [];

  // 카테고리별 부정 건수 집계
  const complaintCategoryMap: Record<string, number> = {};

  for (const item of reviews) {
    if (item.sentiment === '긍정') positiveCount++;
    else if (item.sentiment === '부정') negativeCount++;
    else if (item.sentiment === '중립') neutralCount++;
    else if (item.sentiment === '광고') adCount++;

    if (item.is_safety_issue) {
      safetyIssues.push(item);
    }

    // 부정 리뷰인 경우 카테고리 집계 (쉼표 분리)
    if (item.sentiment === '부정' && item.categories) {
      const cats = item.categories.split(',').map((c) => c.trim()).filter(Boolean);
      for (const c of cats) {
        complaintCategoryMap[c] = (complaintCategoryMap[c] || 0) + 1;
      }
    }
  }

  // 광고는 집계 제외한 유효 리뷰 수
  const validTotal = totalReviews - adCount;
  const negativeRate =
    validTotal > 0 ? ((negativeCount / validTotal) * 100).toFixed(1) : '0.0';
  const positiveRate =
    validTotal > 0 ? ((positiveCount / validTotal) * 100).toFixed(1) : '0.0';
  const neutralRate =
    validTotal > 0 ? ((neutralCount / validTotal) * 100).toFixed(1) : '0.0';

  // 주요 불만 유형 상위 5개
  const topComplaints = Object.entries(complaintCategoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 상단 메타 정보 및 모델 배지 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-slate-800 text-sm">
            AI 통합 분석 결과 요약
          </span>
          <span className="text-xs text-slate-500">
            (전체 {totalReviews}건 중 유효 분석 {validTotal}건, 광고 {adCount}건 제외)
          </span>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>분석 모델:</span>
          <span className="font-bold underline">{modelUsed}</span>
        </div>
      </div>

      {/* 안전 이슈 긴급 알림 배너 (존재할 경우) */}
      {safetyIssues.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border-2 border-rose-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  소비자 안전 이슈 감지: 총 {safetyIssues.length}건
                </h4>
                <span className="text-xs font-semibold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                  즉시 대응 필요
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-1">
                충전기/본체 발열, 과열, 냄새, 탄내 등 제품 안전과 직결된 리뷰가 발견되었습니다.
              </p>
              <div className="mt-2.5 space-y-1">
                {safetyIssues.slice(0, 3).map((item) => (
                  <div
                    key={item.review_no}
                    className="bg-white/90 border border-rose-200 rounded px-2.5 py-1 text-xs text-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-rose-700 shrink-0">
                      #{item.review_no} ({item.written_on})
                    </span>
                    <span className="truncate flex-1 text-slate-700">
                      "{item.review_text}"
                    </span>
                    {item.improvement_request && (
                      <span className="text-indigo-600 shrink-0 text-[11px] bg-indigo-50 px-1.5 py-0.5 rounded">
                        요청: {item.improvement_request}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4대 감성 지표 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 부정 */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">부정 리뷰</span>
            <Frown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{negativeCount}건</span>
            <span className="text-xs font-semibold text-rose-500">({negativeRate}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">유효 리뷰 기준</p>
        </div>

        {/* 긍정 */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">긍정 리뷰</span>
            <Smile className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{positiveCount}건</span>
            <span className="text-xs font-semibold text-emerald-500">({positiveRate}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">유효 리뷰 기준</p>
        </div>

        {/* 중립 */}
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">중립 리뷰</span>
            <MinusCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{neutralCount}건</span>
            <span className="text-xs font-semibold text-amber-500">({neutralRate}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">유효 리뷰 기준</p>
        </div>

        {/* 광고 */}
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">체험단·광고</span>
            <Megaphone className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600">{adCount}건</span>
            <span className="text-xs font-medium text-purple-400">제외됨</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">통계 집계 제외</p>
        </div>
      </div>

      {/* 주요 불만 유형 순위 */}
      {topComplaints.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>고객 불만 유형 순위 (TOP {topComplaints.length})</span>
            <span className="text-xs font-normal text-slate-500">부정 리뷰 언급 빈도</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {topComplaints.map(([category, count], idx) => {
              const percentage =
                negativeCount > 0 ? Math.round((count / negativeCount) * 100) : 0;
              return (
                <div
                  key={category}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold text-indigo-600">#{idx + 1}</span>
                    <span className="font-semibold text-slate-700">{count}건 ({percentage}%)</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate">{category}</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-rose-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
