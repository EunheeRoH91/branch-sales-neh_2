'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle2 } from 'lucide-react';

export default function ActionItemsInput() {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 기존 작성 내용 복원
    try {
      const saved = localStorage.getItem('cleanfit_action_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLine1(parsed.line1 || '');
        setLine2(parsed.line2 || '');
        setLine3(parsed.line3 || '');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleChange = (
    updater: (val: string) => void,
    field: 'line1' | 'line2' | 'line3',
    val: string
  ) => {
    updater(val);
    setIsSaved(true);
    try {
      const current = {
        line1: field === 'line1' ? val : line1,
        line2: field === 'line2' ? val : line2,
        line3: field === 'line3' ? val : line3,
      };
      localStorage.setItem('cleanfit_action_items', JSON.stringify(current));
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-200">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              우리가 고칠 것 (실행 계획 3줄)
            </h3>
            <p className="text-xs text-slate-500">
              분석 결과와 위해 통계를 바탕으로 마케팅팀/품질팀이 실행할 개선안 3줄을 직접 입력하세요.
            </p>
          </div>
        </div>

        {isSaved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" />
            저장됨
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
            1
          </span>
          <input
            type="text"
            value={line1}
            onChange={(e) => handleChange(setLine1, 'line1', e.target.value)}
            placeholder="첫 번째 개선 실행 항목을 입력하세요 (예: 상세페이지 배터리 실사용 시간 8분 표기 명확화)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
            2
          </span>
          <input
            type="text"
            value={line2}
            onChange={(e) => handleChange(setLine2, 'line2', e.target.value)}
            placeholder="두 번째 개선 실행 항목을 입력하세요 (예: 전용 어댑터 충전 발열 안전성 품질 전수 검수 및 안전 인증 재점검)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
            3
          </span>
          <input
            type="text"
            value={line3}
            onChange={(e) => handleChange(setLine3, 'line3', e.target.value)}
            placeholder="세 번째 개선 실행 항목을 입력하세요 (예: 배송 지연 및 파손 방지를 위한 포장 완충재 보강)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>
    </div>
  );
}
