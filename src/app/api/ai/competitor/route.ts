import { auth } from "@/lib/auth";
import { getCompetitorData, streamCompetitorAnalysis } from "@/lib/services/ai-analysis";
import { createAiStreamResponse } from "@/lib/services/ai-stream";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { naicsCode?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { naicsCode } = body;
  if (!naicsCode || !/^\d{2,6}$/.test(naicsCode)) {
    return new Response("유효한 NAICS 코드를 입력해주세요 (2~6자리 숫자)", { status: 400 });
  }

  const data = await getCompetitorData(naicsCode);
  if (data.topAwardees.length === 0) {
    return new Response("해당 NAICS 코드의 낙찰 데이터가 없습니다.", { status: 404 });
  }

  const result = streamCompetitorAnalysis(naicsCode, data);
  return createAiStreamResponse(result, "AI Competitor");
}
