import type { AgentContext, AgentRequest, AgentResponse } from "@agentuity/sdk";
import { WebClient } from "@slack/web-api";

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const payload = (await req.data.json()) as any;

  // Initialize Slack client
  const slack = new WebClient(process.env.SLACKBOT_USER_OAUTH_TOKEN);

  (async () => {
    ctx.logger.info(payload);
    if (payload?.event?.type === "app_mention") {
      let userQuery = (payload?.event?.text as string)
        .replace(/<@[^>]+>/g, "")
        .trim();
      let userId = payload?.event?.user;
      let channel = payload?.event?.channel;
      let messageTs = payload?.event?.ts;

      let queryAgent = await ctx.getAgent({ name: "query-agent" });
      let result = await queryAgent.run({ data: { userId, userQuery } });

      // Create a thread on the message and reply with the result
      try {
        await slack.chat.postMessage({
          channel: channel,
          thread_ts: messageTs,
          text: await result.data.text(),
        });
      } catch (error) {
        ctx.logger.error("Error posting to Slack thread:", error);
      }
    }
  })();

  // For verification purposes, if Slack sends a challenge we need to respond with it.
  if (payload.challenge) {
    return resp.text(payload.challenge);
  } else {
    return resp.text("Success.");
  }
}
