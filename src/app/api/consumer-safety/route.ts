import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CacheData {
  timestamp: number;
  data: {
    success: boolean;
    totalVacuumCases: number;
    topInjuryReasons: { reason: string; count: number; rank: number }[];
    cachedAt: string;
  };
}

let memoryCache: CacheData | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24시간 (1일)

export async function GET() {
  const now = Date.now();

  // 1. 24시간 캐시 유효성 검사
  if (memoryCache && now - memoryCache.timestamp < CACHE_DURATION_MS) {
    return NextResponse.json(memoryCache.data);
  }

  const rawKey = process.env.CONSUMER_SAFETY_API_KEY;
  if (!rawKey) {
    return NextResponse.json(
      { success: false, error: '불러오지 못했습니다' },
      { status: 500 }
    );
  }

  // serviceKey 인코딩 처리 (이미 인코딩된 키 중복 인코딩 방지)
  const serviceKey = encodeURIComponent(decodeURIComponent(rawKey));

  try {
    const allItems: any[] = [];

    // PRD 규정: 1,000건씩 3페이지 (총 3,000건) 수신
    // 요청 파라미터는 serviceKey, pageNo, numOfRows, apiFormat=json 4개만 사용
    for (let page = 1; page <= 3; page++) {
      const url = `https://apis.data.go.kr/B551919/open-api/harm/reception?serviceKey=${serviceKey}&pageNo=${page}&numOfRows=1000&apiFormat=json`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`API 응답 오류: ${res.status}`);
      }

      const json = await res.json();
      const items = json?.response?.body?.items?.item;

      if (Array.isArray(items)) {
        allItems.push(...items);
      } else if (items) {
        // 단건인 경우
        allItems.push(items);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json(
        { success: false, error: '불러오지 못했습니다' },
        { status: 502 }
      );
    }

    // PRD 규정: itemMinor가 "가정용 진공청소기"인 데이터만 자체 필터링
    const vacuumCases = allItems.filter(
      (item) => item.itemMinor === '가정용 진공청소기'
    );

    // 위해원인(injuryReason)별 건수 집계
    const reasonCounts: Record<string, number> = {};
    for (const c of vacuumCases) {
      const reason = c.injuryReason?.trim() || '기타';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }

    // 건수 기준 내림차순 정렬 후 1~3위 추출
    const sorted = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count], idx) => ({
        rank: idx + 1,
        reason,
        count,
      }));

    const responsePayload = {
      success: true,
      totalVacuumCases: vacuumCases.length,
      topInjuryReasons: sorted,
      cachedAt: new Date().toISOString(),
    };

    // 24시간 캐시에 저장
    memoryCache = {
      timestamp: now,
      data: responsePayload,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('소비자원 위해정보 조회 실패:', error);
    // PRD 규정: 숫자 지어내지 않고 "불러오지 못했습니다" 표시
    return NextResponse.json(
      { success: false, error: '불러오지 못했습니다' },
      { status: 500 }
    );
  }
}
