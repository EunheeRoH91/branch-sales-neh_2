'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { ReviewAnalyzedItem } from '@/types';

interface ReviewTableProps {
  reviews: ReviewAnalyzedItem[];
}

export default function ReviewTable({ reviews }: ReviewTableProps) {
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterSafetyOnly, setFilterSafetyOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 감성 필터
      if (filterSentiment !== 'all' && r.sentiment !== filterSentiment) {
        return false;
      }
      // 안전 이슈 필터
      if (filterSafetyOnly && !r.is_safety_issue) {
        return false;
      }
      // 검색어 필터
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const inText = r.review_text.toLowerCase().includes(term);
        const inCats = r.categories.toLowerCase().includes(term);
        const inReq = (r.improvement_request || '').toLowerCase().includes(term);
        return inText || inCats || inReq;
      }
      return true;
    });
  }, [reviews, filterSentiment, filterSafetyOnly, searchTerm]);

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  const handleFilterChange = (val: string) => {
    setFilterSentiment(val);
    setCurrentPage(1);
  };

  const handleSafetyToggle = () => {
    setFilterSafetyOnly((prev) => !prev);
    setCurrentPage(1);
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case '긍정':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            긍정
          </span>
        );
      case '부정':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            부정
          </span>
        );
      case '중립':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            중립
          </span>
        );
      case '광고':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            광고
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {sentiment}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 헤더 및 필터 바 */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              리뷰별 분석 상세 목록
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              총 {reviews.length}건 중 {filteredReviews.length}건 표시됨
            </p>
          </div>

          {/* 검색창 */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="리뷰 내용, 유형, 개선요청 검색..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> 필터:
          </span>

          {[
            { id: 'all', label: '전체' },
            { id: '부정', label: '부정만' },
            { id: '긍정', label: '긍정만' },
            { id: '중립', label: '중립만' },
            { id: '광고', label: '광고(체험단)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterSentiment === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={handleSafetyToggle}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              filterSafetyOnly
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            안전 이슈만 보기
          </button>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
            <tr>
              <th className="py-3 px-3 text-center w-12">번호</th>
              <th className="py-3 px-3 text-center w-24">작성일</th>
              <th className="py-3 px-3 text-center w-16">별점</th>
              <th className="py-3 px-3 text-center w-20">감성</th>
              <th className="py-3 px-3 w-32">분류 유형</th>
              <th className="py-3 px-4 min-w-[280px]">리뷰 내용</th>
              <th className="py-3 px-3 min-w-[180px]">개선 요청</th>
              <th className="py-3 px-3 text-center w-24">안전 이슈</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedReviews.length > 0 ? (
              paginatedReviews.map((r) => (
                <tr
                  key={r.review_no}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    r.is_safety_issue ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-center font-medium text-slate-500">
                    {r.review_no}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500 whitespace-nowrap">
                    {r.written_on}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                      {r.rating}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {getSentimentBadge(r.sentiment)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {r.categories
                        ? r.categories.split(',').map((cat, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]"
                            >
                              {cat.trim()}
                            </span>
                          ))
                        : '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium leading-relaxed">
                    {r.review_text}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {r.improvement_request ? (
                      <span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded block text-[11px] leading-relaxed">
                        {r.improvement_request}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {r.is_safety_issue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                        <AlertTriangle className="w-3 h-3" />
                        위험
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  조건에 해당하는 리뷰가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <div>
            페이지 <span className="font-semibold text-slate-700">{currentPage}</span> / {totalPages} (총 {filteredReviews.length}건)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
