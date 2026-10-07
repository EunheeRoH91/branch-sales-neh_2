'use client';

import React from 'react';
import { History, Calendar, Flame, Eye, RefreshCw } from 'lucide-react';
import { AnalysisSummary } from '@/types';

interface HistorySectionProps {
  historyList: AnalysisSummary[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string | null;
}

export default function HistorySection({
  historyList,
  isLoading,
  onRefresh,
  onSelectDate,
  selectedDate,
}: HistorySectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              분석 히스토리 누적 보관함
            </h3>
            <p className="text-xs text-slate-500">
              Supabase에 일자별로 자동 저장된 과거 분석 결과 요약 (수정/삭제 불가)
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>새로고침</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>과거 분석 이력을 불러오는 중...</span>
        </div>
      ) : historyList.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          아직 저장된 과거 분석 데이터가 없습니다. 상단에서 첫 번째 리뷰 분석을 진행해 보세요!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3">분석 일자</th>
                <th className="py-2.5 px-3 text-center">전체 건수</th>
                <th className="py-2.5 px-3 text-center">유효 분석</th>
                <th className="py-2.5 px-3 text-center">광고 제외</th>
                <th className="py-2.5 px-3 text-center">부정 리뷰 비율</th>
                <th className="py-2.5 px-3 text-center">안전 이슈</th>
                <th className="py-2.5 px-3">사용 모델</th>
                <th className="py-2.5 px-3 text-center">상세 보기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyList.map((item) => {
                const isSelected = selectedDate === item.analyzed_on;
                return (
                  <tr
                    key={item.analyzed_on}
                    className={`hover:bg-indigo-50/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/70 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.analyzed_on}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {item.total_count}건
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {item.valid_count}건
                    </td>
                    <td className="py-3 px-3 text-center text-purple-600 font-medium">
                      {item.ad_count}건
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.negative_rate >= 40
                            ? 'bg-rose-100 text-rose-700'
                            : item.negative_rate >= 20
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.negative_rate}% ({item.negative_count}건)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.safety_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                          <Flame className="w-3 h-3" />
                          {item.safety_count}건
                        </span>
                      ) : (
                        <span className="text-slate-300">0건</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700">
                        {item.model_used}
                      </code>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectDate(item.analyzed_on)}
                        className={`px-2.5 py-1 rounded text-xs inline-flex items-center gap-1 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        {isSelected ? '선택됨' : '조회'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
