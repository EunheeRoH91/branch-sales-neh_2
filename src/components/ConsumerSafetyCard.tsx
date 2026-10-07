'use client';

import React from 'react';
import { ShieldAlert, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ConsumerSafetyResponse } from '@/types';

interface ConsumerSafetyCardProps {
  data: ConsumerSafetyResponse | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export default function ConsumerSafetyCard({
  data,
  isLoading,
  onRefresh,
}: ConsumerSafetyCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                한국소비자원 위해정보 통계
              </h3>
              <p className="text-[11px] text-slate-500">
                품목: 가정용 진공청소기 (최근 3,000건 중 필터링)
              </p>
            </div>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="새로고침"
              className="text-slate-400 hover:text-indigo-600 p-1 rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
            <span>공공데이터포털 위해정보 수신 중 (1,000건 × 3페이지)...</span>
          </div>
        )}

        {/* 에러 상태: PRD 규정 - "불러오지 못했습니다" 명확히 표출 */}
        {!isLoading && (!data || !data.success) && (
          <div className="py-6 px-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-rose-700">불러오지 못했습니다</p>
            <p className="text-xs text-rose-500 mt-1">
              {data?.error || '공공데이터포털 API 연동 응답을 수신하지 못했습니다.'}
            </p>
          </div>
        )}

        {/* 정상 데이터 표출 */}
        {!isLoading && data && data.success && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs">
              <span className="text-slate-600">청소기 관련 접수 사고</span>
              <span className="font-bold text-slate-900">
                총 {data.totalVacuumCases ?? 0}건
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">
                주요 위해 원인 순위 (TOP 1~3위)
              </p>
              <div className="space-y-2">
                {data.topInjuryReasons && data.topInjuryReasons.length > 0 ? (
                  data.topInjuryReasons.map((item) => (
                    <div
                      key={item.rank}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            item.rank === 1
                              ? 'bg-rose-100 text-rose-700'
                              : item.rank === 2
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.rank}
                        </span>
                        <span className="font-medium text-slate-800">
                          {item.reason}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {item.count}건
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-2">
                    추출된 위해 원인 정보가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          24시간 캐싱 적용됨
        </span>
        {data?.cachedAt && (
          <span>
            {new Date(data.cachedAt).toLocaleDateString('ko-KR', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })} 기준
          </span>
        )}
      </div>
    </div>
  );
}
