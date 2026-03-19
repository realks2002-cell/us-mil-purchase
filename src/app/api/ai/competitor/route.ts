import { auth } from "@/lib/auth";
import { getCompetitorData, streamCompetitorAnalysis } from "@/lib/services/ai-analysis";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { naicsCode } = await request.json();
  if (!naicsCode) {
    return new Response("naicsCode required", { status: 400 });
  }

  const data = await getCompetitorData(naicsCode);
  if (data.topAwardees.length === 0) {
    return new Response("해당 NAICS 코드의 낙찰 데이터가 없습니다.", { status: 404 });
  }

  const result = streamCompetitorAnalysis(naicsCode, data);
  return result.toTextStreamResponse();
}
