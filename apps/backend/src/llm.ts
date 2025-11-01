import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile } from "fs/promises";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function recommendCourse(courses: any[], outputPath?: string) {
  // v1 API로 호출하도록 강제 설정 (기본값 v1beta로 인한 404 방지)
  const model = gemini.getGenerativeModel(
    { model: "gemini-2.0-flash" },
    { apiVersion: "v1" }
  );

  // 재시도 로직 구현
  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎯 AI 추천 시도 ${attempt}/${maxRetries}`);
      const result = await attemptRecommendation(model, courses);
      
      // JSON 파일로 저장
      if (outputPath) {
        await writeFile(outputPath, JSON.stringify(result, null, 2), "utf-8");
        console.log(`✅ 추천 결과가 저장되었습니다: ${outputPath}`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ 시도 ${attempt} 실패:`, error instanceof Error ? error.message : error);
      if (attempt === maxRetries) {
        throw error; // 마지막 시도에서도 실패하면 에러 던지기
      }
      console.log(`🔄 ${attempt + 1}번째 시도를 준비합니다...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    }
  }
}

async function attemptRecommendation(model: any, courses: any[]) {

  // 모델 응답에서 첫 번째 JSON 오브젝트만 안전하게 추출하는 유틸
  function extractFirstJsonObject(text: string): string | null {
    // 1) 코드 블록 안의 JSON 우선 추출
    const codeBlockMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    // 2) 중괄호 균형을 이용해 첫 JSON 오브젝트 추출
    const start = text.indexOf("{");
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escape) {
          escape = false;
        } else if (ch === "\\") {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
      } else {
        if (ch === '"') inString = true;
        else if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            return text.slice(start, i + 1);
          }
        }
      }
    }
    return null;
  }

  const prompt = `
당신은 러닝 코스 추천 전문가입니다.
다음은 12개의 러닝 코스 데이터입니다.
각 코스는 시작점(start), 도착점(end), 중간 지점들(midpoints)의 좌표와 고도(elevation) 정보가 포함되어 있습니다.

분석 기준:
1. **고도 변화 패턴**: 시작-도착 고도 차이만이 아니라, midpoints 간의 고도 변화를 분석하세요.
   - 연속된 midpoints 간 고도 차이의 합계 (총 누적 상승/하강)
   - 평균 고도 변화량 (연속 포인트 간 고도 차이의 절댓값 평균)
   - 고도 변화의 빈도 (오르막-내리막 전환 횟수)
2. **경로의 일관성**: 급격한 고도 변화가 적을수록 좋음
3. **러닝 적합성**: 초보자도 완주 가능한 완만한 코스

추천 기준:
- 평균 고도 변화량이 적고 완만한 코스
- 급격한 오르막/내리막 전환이 적은 코스
- midpoints의 elevation 값들이 안정적인 코스

추천 이유 작성 지침:
- 각 코스의 고도 변화 패턴을 구체적으로 언급하세요.
- 반드시 한국어로 작성하세요. (midpoints, elevation 등 영어 키워드 대신 한국어로 작성하세요.)
- 내부적인 정보 (ex: 코스7) 대신에 일반적인 정보(이 코스)로 설명하세요.

**상위 3개 코스만 추천하세요.**

응답은 반드시 다음 JSON 형식으로만 작성하세요 (마크다운 코드 블록 없이 순수 JSON만, 첫 글자는 {, 마지막 글자는 } 이어야 함. 숫자 필드는 반드시 숫자만 입력하고 단위는 붙이지 마세요):
{
  "recommendations": [
    {
      "courseId": 1,
      "rank": 1,
      "summary": "코스 한 줄 요약",
      "reason": "추천 이유 (이 코스는 ~ )",
      "elevationAnalysis": {
        "averageChange": 5.0,
        "totalAscent": 50.0,
        "totalDescent": 45.0
      },
      "scores": {
        "elevation": 9,
        "overall": 8.5
      }
    }
  ]
}

코스 데이터:
${JSON.stringify(courses, null, 2)}
  `;

  // 타임아웃 처리를 위한 Promise.race 사용
  const generateContentPromise = model.generateContent(prompt);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('LLM 호출이 8초를 초과했습니다.'));
    }, 9000); // 8초 타임아웃 (프론트엔드 9초보다 1초 빠르게)
  });

  const result = await Promise.race([generateContentPromise, timeoutPromise]);
  const text = result.response.text();
  
  console.log('🤖 AI 원본 응답 (처음 500자):', text.substring(0, 500));

  const extracted = extractFirstJsonObject(text.trim());
  if (!extracted) {
    console.error('❌ JSON 추출 실패. 원본 텍스트:', text);
    throw new Error("JSON 형식의 응답을 찾지 못했습니다.");
  }
  
  console.log('📋 추출된 JSON:', extracted.substring(0, 200) + '...');

  let recommendation: any;
  try {
    recommendation = JSON.parse(extracted);
  } catch (e) {
    console.error('❌ JSON 파싱 실패. 추출된 텍스트:', extracted);
    throw new Error(`모델 응답 JSON 파싱 실패: ${(e as Error).message}`);
  }

  // 상위 3개만 보장
  if (Array.isArray(recommendation?.recommendations)) {
    recommendation.recommendations = recommendation.recommendations.slice(0, 3);
  }
  
  
  return recommendation;
}
