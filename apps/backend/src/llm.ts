import { GoogleGenerativeAI } from "@google/generative-ai";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function recommendCourse(courses: any[]) {
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
당신은 러닝 코스 추천 전문가입니다.
다음은 12개의 러닝 코스 데이터입니다.
각 코스는 좌표와 고도, 거리, 직선성 정보가 포함되어 있습니다.
고도 변화가 완만하고, 직선성이 높은 코스를 추천해주세요.
코스별 요약과 추천 이유를 함께 설명하세요.

${JSON.stringify(courses, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
