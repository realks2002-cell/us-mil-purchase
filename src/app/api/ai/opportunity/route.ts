import { auth } from "@/lib/auth";
import { getOpportunityContext, streamOpportunityAnalysis } from "@/lib/services/ai-analysis";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { opportunityId } = await request.json();
  if (!opportunityId) {
    return new Response("opportunityId required", { status: 400 });
  }

  const context = await getOpportunityContext(parseInt(opportunityId, 10));
  if (!context) {
    return new Response("공고를 찾을 수 없습니다.", { status: 404 });
  }

  const result = streamOpportunityAnalysis(context);
  return result.toTextStreamResponse();
}
