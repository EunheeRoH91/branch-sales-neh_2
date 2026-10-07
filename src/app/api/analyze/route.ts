import { NextRequest, NextResponse } from 'next/server';
import { ReviewRaw, ReviewAnalyzedItem } from '@/types';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `당신은 생활가전 쇼핑몰 '하루살림'의 무선 청소기 '클린핏 미니' 리뷰 전문 분석 AI입니다.
입력으로 주어지는 고객 리뷰 목록을 아래의 엄격한 기준에 100% 맞춰 정확하게 분석하여 JSON 배열로 반환하세요.

[분석 기준표]
1. 감성 (sentiment): "긍정", "부정", "중립", "광고" 중 하나만 선택
   - 절대로 '별점'을 기준으로 판단하지 말고, 오직 '리뷰 본문의 실제 문맥과 뜻'으로 판단하세요.
   - 반어법(예: "배송 정말 빠르네요^^ 주문하고 12일 만에 왔어요")은 반드시 "부정"으로 분류하세요.
   - '체험단', '원고료', '무상 제공', '협찬', '할인 링크' 등이 포함된 리뷰는 반드시 "광고"로 분류하세요.
   - 칭찬과 불만이 섞여 있는 경우 더 강한 쪽으로 분류하고, 비중이 비슷하면 "중립"으로 분류하세요.

2. 유형 (categories): 아래 정의된 카테고리 중에서 해당하는 항목을 찾아 쉼표(,)로 구분하여 모두 기재하세요. (해당 사항이 전혀 없으면 "기타")
   - 카테고리 후보: 배터리, 흡입력, 소음, 무게·사용감, 디자인, 관리·청소, 구성품, 품질·불량, 배송, 포장, 고객센터, 가격, 설명서, 기타
   - 리뷰 내용에 둘 이상의 주제가 언급된 경우 반드시 모두 기재하세요 (예: "배터리, 흡입력").

3. 따로 뽑기:
   - improvement_request (개선 요청): "~면 좋겠어요", "~해 주세요", "~바랍니다", "~개선되면" 등 고객의 구체적인 개선/건의 요구 문구를 그대로 추출하세요. 요구가 없으면 빈 문자열 ""을 반환하세요.
   - is_safety_issue (안전 이슈): "뜨거움", "뜨겁", "발열", "과열", "냄새", "탄내", "연기", "감전", "불꽃", "스파크" 등 화재/발열/감전/위해와 관련된 언급이 조금이라도 있으면 무조건 true, 없으면 false로 반환하세요.

반드시 모든 입력 리뷰에 대해 누락 없이 동일한 번호(review_no) 순서대로 응답하세요.`;

async function callGemini(
  modelName: string,
  apiKey: string,
  reviews: ReviewRaw[]
): Promise<{ success: boolean; status?: number; data?: ReviewAnalyzedItem[]; error?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const promptText = `다음은 '클린핏 미니'의 고객 리뷰 ${reviews.length}건입니다.
각 리뷰를 엄격한 기준표에 맞춰 분석한 결과를 JSON 배열 형식으로 반환하세요.

리뷰 목록:
${JSON.stringify(reviews, null, 2)}
`;

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            review_no: { type: 'INTEGER' },
            written_on: { type: 'STRING' },
            rating: { type: 'INTEGER' },
            review_text: { type: 'STRING' },
            sentiment: {
              type: 'STRING',
              enum: ['긍정', '부정', '중립', '광고'],
            },
            categories: { type: 'STRING' },
            improvement_request: { type: 'STRING' },
            is_safety_issue: { type: 'BOOLEAN' },
          },
          required: [
            'review_no',
            'written_on',
            'rating',
            'review_text',
            'sentiment',
            'categories',
            'improvement_request',
            'is_safety_issue',
          ],
        },
      },
      temperature: 0.1,
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Gemini [${modelName}] 에러 status: ${res.status}`, errText);
      return { success: false, status: res.status, error: errText };
    }

    const json = await res.json();
    const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText || candidateText.trim().length === 0) {
      return { success: false, error: 'Empty response' };
    }

    const parsedArray = JSON.parse(candidateText) as ReviewAnalyzedItem[];
    if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
      return { success: false, error: 'Empty parsed array' };
    }

    return { success: true, data: parsedArray };
  } catch (err: any) {
    console.error(`Gemini [${modelName}] 호출 예외:`, err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: '불러오지 못했습니다' },
      { status: 500 }
    );
  }

  let reviews: ReviewRaw[] = [];
  try {
    const body = await req.json();
    reviews = body?.reviews || [];
  } catch (e) {
    return NextResponse.json(
      { success: false, error: '요청 본문을 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  if (!reviews || reviews.length === 0) {
    return NextResponse.json(
      { success: false, error: '분석할 리뷰 데이터가 없습니다.' },
      { status: 400 }
    );
  }

  // 1. 기본 모델 gemini-3.8-flash 호출
  let modelUsed = 'gemini-3.8-flash';
  let result = await callGemini(modelUsed, apiKey, reviews);

  // 2. PRD 규정: 503(요청 몰림) 에러 발생 시 gemini-3.5-flash-lite 모델로 딱 한 번만 재시도
  if (!result.success && result.status === 503) {
    console.warn('503 발생 -> gemini-3.5-flash-lite 1회 재시도 실행');
    modelUsed = 'gemini-3.5-flash-lite';
    result = await callGemini(modelUsed, apiKey, reviews);
  }

  // 3. 최종 결과 처리: 실패하거나 비어있으면 숫자 지어내지 않고 "불러오지 못했습니다" 반환
  if (!result.success || !result.data || result.data.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: '불러오지 못했습니다',
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    model_used: modelUsed,
    data: result.data,
  });
}
