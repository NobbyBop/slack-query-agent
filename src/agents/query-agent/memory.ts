import type { AgentContext } from "@agentuity/sdk";
import { ZepClient } from "@getzep/zep-cloud";

const zep = new ZepClient({
  apiKey: process.env.ZEP_API_KEY || "",
});

export async function getMemoryContext(
  userId: string,
  userQuery: string,
  ctx: AgentContext
): Promise<string> {
  try {
    // Get current thread ID
    const currentThreadRes = await ctx.kv.get("slackq-current-thread", userId);
    if (!currentThreadRes.exists) {
      ctx.logger.info(
        "No current thread found for user. Create one with /thread -c."
      );
      return "";
    }
    const threadId = await currentThreadRes.data.text();

    // Get relevant memory from Zep
    const memory = await zep.thread.getUserContext(threadId);
    return memory.context || "No context found.";
  } catch (error) {
    ctx.logger.error("Error retrieving memory context:", error);
    return "";
  }
}

export async function getThreadHistory(userId: string, ctx: AgentContext) {
  try {
    // Get current thread ID
    const currentThreadRes = await ctx.kv.get("slackq-current-thread", userId);
    if (!currentThreadRes.exists) {
      ctx.logger.info(
        "No current thread found for user. Create one with /thread -c."
      );
      return "";
    }
    const threadId = await currentThreadRes.data.text();

    // Get relevant memory from Zep
    const memory = await zep.thread.get(threadId);
    return memory.messages || "No history found.";
  } catch (error) {
    ctx.logger.error("Error retrieving memory context:", error);
    return "";
  }
}
export async function storeMemory(
  userId: string,
  userQuery: string,
  response: string,
  ctx: AgentContext
): Promise<void> {
  try {
    // Get current thread ID
    const currentThreadRes = await ctx.kv.get("slackq-current-thread", userId);
    if (!currentThreadRes.exists) {
      ctx.logger.warn("No current thread found for storing memory");
      return;
    }

    const threadId = await currentThreadRes.data.text();

    // Store the interaction in Zep memory
    await zep.thread.addMessages(threadId, {
      messages: [
        {
          role: "user",
          content: userQuery,
        },
        {
          role: "assistant",
          content: response,
        },
      ],
    });

    ctx.logger.info("Stored interaction in memory", { threadId });
  } catch (error) {
    ctx.logger.error("Error storing memory:", error);
  }
}
