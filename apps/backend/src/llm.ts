import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile } from "fs/promises";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function recommendCourse(courses: any[], outputPath?: string) {
  // v1 API로 호출하도록 강제 설정 (기본값 v1beta로 인한 404 방지)
  const model = gemini.getGenerativeModel(
    { model: "gemini-2.0-flash" },
    { apiVersion: "v1" }
  );

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

**상위 3개 코스만 추천하세요.**

응답은 반드시 다음 JSON 형식으로만 작성하세요 (마크다운 코드 블록 없이 순수 JSON만, 첫 글자는 {, 마지막 글자는 } 이어야 함. 숫자 필드는 숫자 타입으로, 단위를 m 단위로 붙여주세요):
{
  "recommendations": [
    {
      "courseId": 1,
      "rank": 1,
      "summary": "코스 한 줄 요약",
      "reason": "추천 이유 (midpoints 고도 변화 패턴 구체적으로)",
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

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const extracted = extractFirstJsonObject(text.trim());
  if (!extracted) {
    throw new Error("JSON 형식의 응답을 찾지 못했습니다.");
  }

  let recommendation: any;
  try {
    recommendation = JSON.parse(extracted);
  } catch (e) {
    throw new Error(`모델 응답 JSON 파싱 실패: ${(e as Error).message}`);
  }

  // 상위 3개만 보장
  if (Array.isArray(recommendation?.recommendations)) {
    recommendation.recommendations = recommendation.recommendations.slice(0, 3);
  }
  
  // JSON 파일로 저장
  if (outputPath) {
    await writeFile(outputPath, JSON.stringify(recommendation, null, 2), "utf-8");
    console.log(`✅ 추천 결과가 저장되었습니다: ${outputPath}`);
  }
  
  return recommendation;
}
