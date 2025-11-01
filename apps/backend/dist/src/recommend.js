import "dotenv/config";
import { readFile } from "fs/promises";
import { join } from "path";
import { recommendCourse } from "./llm.js";
async function main() {
    try {
        // output-with-elevation.json 읽기
        const dataPath = join(process.cwd(), "output-complete.json");
        const data = await readFile(dataPath, "utf-8");
        const parsed = JSON.parse(data);
        console.log("📍 코스 데이터 로드 완료");
        console.log(`   - 총 코스 개수: ${parsed.courses.length}개`);
        console.log(`   - 기준 위치: (${parsed.base.lat}, ${parsed.base.lon})`);
        console.log(`   - 반경: ${parsed.radiusKm}km\n`);
        // LLM으로 추천받기
        console.log("🤖 AI 분석 중...\n");
        const outputPath = join(process.cwd(), "course-recommendations.json");
        const recommendations = await recommendCourse(parsed.courses, outputPath);
        console.log("\n✨ 추천 결과:\n");
        recommendations.recommendations.forEach((rec) => {
            console.log(`${rec.rank}위. 코스 #${rec.courseId}`);
            console.log(`   ${rec.summary}`);
            console.log(`   이유: ${rec.reason}`);
            console.log(`   고도 분석:`);
            console.log(`     - 평균 변화량: ${rec.elevationAnalysis.averageChange}m`);
            console.log(`     - 총 상승: ${rec.elevationAnalysis.totalAscent}m`);
            console.log(`     - 총 하강: ${rec.elevationAnalysis.totalDescent}m`);
            console.log(`   점수: ${rec.scores.overall}/10\n`);
        });
    }
    catch (error) {
        console.error("❌ 오류 발생:", error);
        process.exit(1);
    }
}
main();
