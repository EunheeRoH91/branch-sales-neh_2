'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ReviewRaw } from '@/types';

interface ReviewUploaderProps {
  onAnalyze: (reviews: ReviewRaw[], filename: string) => Promise<void>;
  isLoading: boolean;
  loadingStep: string;
}

export default function ReviewUploader({
  onAnalyze,
  isLoading,
  loadingStep,
}: ReviewUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedReviews, setParsedReviews] = useState<ReviewRaw[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setParseError('CSV 형식(.csv)의 리뷰 파일만 업로드할 수 있습니다.');
      setSelectedFile(null);
      setParsedReviews([]);
      return;
    }

    setParseError(null);
    setSelectedFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(),
      complete: (results) => {
        try {
          const rows = results.data as Record<string, any>[];
          if (!rows || rows.length === 0) {
            setParseError('파일 내에 유효한 리뷰 데이터가 없습니다.');
            setParsedReviews([]);
            return;
          }

          const formatted: ReviewRaw[] = rows.map((row, index) => {
            const noVal = row['번호'] ?? row['review_no'] ?? row['No'] ?? index + 1;
            const writtenVal = row['작성일'] ?? row['written_on'] ?? row['date'] ?? '';
            const ratingVal = row['별점'] ?? row['rating'] ?? row['점수'] ?? 0;
            const textVal = row['리뷰'] ?? row['review_text'] ?? row['내용'] ?? '';

            return {
              review_no: parseInt(String(noVal), 10) || index + 1,
              written_on: String(writtenVal).trim(),
              rating: parseInt(String(ratingVal), 10) || 0,
              review_text: String(textVal).trim(),
            };
          }).filter((r) => r.review_text.length > 0);

          if (formatted.length === 0) {
            setParseError('리뷰 내용(텍스트)이 포함된 행을 찾을 수 없습니다.');
            setParsedReviews([]);
            return;
          }

          setParsedReviews(formatted);
        } catch (err: any) {
          setParseError(`CSV 파싱 실패: ${err?.message || '알 수 없는 오류'}`);
          setParsedReviews([]);
        }
      },
      error: (err) => {
        setParseError(`파일 읽기 오류: ${err.message}`);
        setParsedReviews([]);
      },
    });
  };

  const handleSubmit = async () => {
    if (!selectedFile || parsedReviews.length === 0 || isLoading) return;
    await onAnalyze(parsedReviews, selectedFile.name);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            리뷰 파일 업로드
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            CSV 파일을 드래그하거나 선택하여 업로드하세요. (헤더: 번호, 작성일, 별점, 리뷰)
          </p>
        </div>
      </div>

      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          selectedFile
            ? 'border-indigo-400 bg-indigo-50/30'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          {selectedFile ? (
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-indigo-200 shadow-sm">
              <FileText className="w-6 h-6 text-indigo-600" />
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  총 {parsedReviews.length}건 감지됨 ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-2" />
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-semibold text-indigo-600 hover:underline">
                  파일 선택
                </span>
                <span className="text-sm text-slate-500"> 또는 여기에 CSV 파일을 끌어다 놓으세요</span>
              </div>
              <p className="text-xs text-slate-400">
                지원 형식: .csv (UTF-8 인코딩)
              </p>
            </>
          )}
        </div>
      </div>

      {parseError && (
        <div className="mt-4 flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* 분석 실행 버튼 */}
      {selectedFile && parsedReviews.length > 0 && (
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-600">
            준비 완료: <span className="font-bold text-indigo-600">{parsedReviews.length}건</span>의 리뷰를 Gemini API로 분석합니다.
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all ${
              isLoading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingStep || '분석 진행 중...'}</span>
              </>
            ) : (
              <>
                <span>AI 통합 분석 시작</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
