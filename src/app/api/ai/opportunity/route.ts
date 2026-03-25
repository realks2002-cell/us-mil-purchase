import { auth } from "@/lib/auth";
import { getOpportunityContext, streamOpportunityAnalysis } from "@/lib/services/ai-analysis";
import { createAiStreamResponse } from "@/lib/services/ai-stream";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { opportunityId?: string | number };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const id = parseInt(String(body.opportunityId), 10);
  if (Number.isNaN(id) || id <= 0) {
    return new Response("유효한 공고 ID를 입력해주세요.", { status: 400 });
  }

  const context = await getOpportunityContext(id);
  if (!context) {
    return new Response("공고를 찾을 수 없습니다.", { status: 404 });
  }

  const result = streamOpportunityAnalysis(context);
  return createAiStreamResponse(result, "AI Opportunity");
}
