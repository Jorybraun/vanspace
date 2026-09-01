import { onRequest } from "../functions/api/talk-proposals.js";

const TALK_PROPOSAL_PATH = "/api/talk-proposals";

export default {
  async fetch(request, env, executionContext) {
    if (new URL(request.url).pathname !== TALK_PROPOSAL_PATH) {
      return new Response("Not found", {
        status: 404,
        headers: { "X-Content-Type-Options": "nosniff" },
      });
    }

    try {
      return await onRequest({
        request,
        env,
        waitUntil: executionContext.waitUntil.bind(executionContext),
      });
    } catch (error) {
      console.error(JSON.stringify({
        event: "talk_proposal_worker_unhandled",
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "The proposal service encountered an unexpected error.",
          },
        }),
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }
  },
};
