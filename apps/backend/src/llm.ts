import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile } from "fs/promises";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function recommendCourse(courses: any[], outputPath?: string) {
  // v1 API로 호출하도록 강제 설정 (기본값 v1beta로 인한 404 방지)
  const model = gemini.getGenerativeModel(
    { model: "gemini-2.5-flash" },
  );

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

응답은 반드시 다음 JSON 형식으로만 작성하세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "recommendations": [
    {
      "courseId": 코스_ID(숫자),
      "rank": 순위(1-3),
      "summary": "코스 한 줄 요약",
      "reason": "추천 이유 (midpoints 고도 변화 패턴 구체적으로)",
      "elevationAnalysis": {
        "averageChange": 평균_고도_변화량_숫자(m),
        "totalAscent": 총_상승량_숫자(m),
        "totalDescent": 총_하강량_숫자(m),
        "changeFrequency": "고도_변화_빈도_설명"
      },
      "scores": {
        "elevation": 고도_점수(1-10),
        "overall": 종합_점수(1-10)
      }
    }
  ]
}

코스 데이터:
${JSON.stringify(courses, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // JSON 추출 (마크다운 코드 블록 제거)
  let jsonText = text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  }
  
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("JSON 형식의 응답을 받지 못했습니다.");
  }
  
  const recommendation = JSON.parse(jsonMatch[0]);
  
  // JSON 파일로 저장
  if (outputPath) {
    await writeFile(outputPath, JSON.stringify(recommendation, null, 2), "utf-8");
    console.log(`✅ 추천 결과가 저장되었습니다: ${outputPath}`);
  }
  
  return recommendation;
}
