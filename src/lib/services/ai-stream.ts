export async function createAiStreamResponse(
  result: { textStream: ReadableStream<string> },
  label: string,
): Promise<Response> {
  const reader = result.textStream.getReader();
  let first: ReadableStreamReadResult<string>;
  try {
    first = await reader.read();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error(`[${label}] API 에러:`, msg);
    return new Response(`AI 분석 실패: ${msg}`, { status: 502 });
  }

  if (first.done) {
    return new Response("AI 응답이 비어있습니다. API 키를 확인해주세요.", { status: 502 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(first.value));
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(new TextEncoder().encode(value));
        }
      } catch (error) {
        console.error(`[${label}] 스트리밍 에러:`, error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
